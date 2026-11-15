import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {validateResponse,tally,escapeHtml} from '../src/domain.js';

test('response validation, counts, and HTML escaping',()=>{
 assert.equal(validateResponse('hold','  판단이 어렵습니다.  '),'판단이 어렵습니다.');
 for(const [c,r] of [['other','이유'],['stay',' '],['switch','x'.repeat(121)],['hold','한 줄\n두 줄']])assert.throws(()=>validateResponse(c,r));
 assert.deepEqual(tally([{choice:'stay'},{choice:'switch'},{choice:'stay'}]).map(c=>c.count),[1,2,0]);
 assert.equal(escapeHtml('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});
test('database authorization, hidden results, duplicate prevention and class lifecycle',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 await db.exec(await readFile(new URL('../database/setup.sql',import.meta.url),'utf8'));
 const teacher='00000000-0000-4000-8000-000000000001',student='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003';
 await db.query('insert into auth.users values($1),($2),($3)',[teacher,student,other]);
 await db.query('insert into pixel_private.teachers values($1),($2)',[teacher,other]);
 async function as(user){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated');}
 async function rpc(action,payload={}){return (await db.query('select public.pixel_classroom($1,$2::jsonb) as result',[action,JSON.stringify(payload)])).rows[0].result;}
 await as(student);await assert.rejects(()=>rpc('create',{title:'class',expected:15}),/교사/);
 await assert.rejects(()=>db.query('select * from pixel_private.responses'),/permission denied/);
 await as(teacher);const room=await rpc('create',{title:'수업',expected:15});const p={code:room.code};
 await as(student);await assert.rejects(()=>rpc('submit',{...p,choice:'stay',reason:'이유입니다.'}),/아직 시작/);
 await as(other);await assert.rejects(()=>rpc('state',{...p,status:'open'}),/권한/);
 await as(teacher);await rpc('state',{...p,status:'open'});
 await as(student);await assert.rejects(()=>rpc('submit',{...p,choice:'stay',reason:'\n'}),/한 문장/);
 await assert.rejects(()=>rpc('submit',{...p,choice:'invalid',reason:'이유'}),/선택지/);
 await rpc('submit',{...p,choice:'stay',reason:'한 사람을 위험하게 하면 안 됩니다.'});
 await assert.rejects(()=>rpc('submit',{...p,choice:'switch',reason:'또 제출'}),/이미 제출/);
 const own=await rpc('get',p);assert.equal(own.count,1);assert.equal(own.responses,null);assert.equal(own.own.choice,'stay');
 await as(teacher);assert.equal((await rpc('teacher_get',p)).responses,null);
 await assert.rejects(()=>rpc('state',{...p,status:'revealed'}),/현재 수업/);
 await rpc('state',{...p,status:'closed'});
 await as(other);await assert.rejects(()=>rpc('submit',{...p,choice:'hold',reason:'늦었습니다.'}),/마감/);
 await as(teacher);assert.equal((await rpc('teacher_get',p)).responses,null);await rpc('state',{...p,status:'revealed'});
 await as(student);const results=await rpc('get',p);assert.equal(results.responses.length,1);assert.deepEqual(Object.keys(results.responses[0]).sort(),['choice','reason']);
 await as(teacher);await rpc('state',{...p,status:'open'});assert.equal((await rpc('teacher_get',p)).responses,null);
 await as('');await assert.rejects(()=>rpc('get',p),/먼저 수업/);
 await db.close();
});
