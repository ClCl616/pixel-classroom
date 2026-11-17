import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {bindTeacherEntry} from '../src/teacher-entry.js';

test('teacher icon requires five consecutive activations and supports keyboard',()=>{
 const handlers={};let time=1000,entries=0;
 bindTeacherEntry({setAttribute(){},addEventListener:(name,fn)=>handlers[name]=fn},()=>entries++,()=>time);
 const event={preventDefault(){},stopPropagation(){}};
 for(let i=0;i<4;i++){handlers.click(event);time+=150;}assert.equal(entries,0);
 time+=1000;handlers.click(event);assert.equal(entries,0);
 for(let i=0;i<4;i++){time+=150;handlers.keydown({...event,key:'Enter',repeat:false});}assert.equal(entries,1);
 handlers.keydown({...event,key:'Enter',repeat:true});assert.equal(entries,1);
});

test('live classroom scopes named answers to owner, prevents duplicate seats, and closes stale sessions',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 await db.exec(await readFile(new URL('../database/setup.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../database/live-classroom.sql',import.meta.url),'utf8'));
 const teacher='00000000-0000-4000-8000-000000000001',student='00000000-0000-4000-8000-000000000002',otherTeacher='00000000-0000-4000-8000-000000000003',student2='00000000-0000-4000-8000-000000000004';
 for(const id of [teacher,student,otherTeacher,student2])await db.query('insert into auth.users values($1)',[id]);
 await db.query('insert into pixel_private.teachers values($1),($2)',[teacher,otherTeacher]);
 async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
 async function rpc(action,payload={}){return(await db.query('select public.pixel_live($1,$2::jsonb) as data',[action,JSON.stringify(payload)])).rows[0].data;}
 await as(student);assert.equal(await rpc('active'),null);for(const action of ['teacher_session','start','teacher_get','state','finish'])await assert.rejects(()=>rpc(action),/교사/);
 await assert.rejects(()=>db.query('select * from pixel_private.live_answers'),/permission denied/);
 await as(teacher);const room=await rpc('start',{expected:15});assert.equal((await rpc('start')).code,room.code);assert.equal((await rpc('teacher_session')).active.code,room.code);
 const p={code:room.code};
 await as(otherTeacher);for(const action of ['teacher_get','state','finish'])await assert.rejects(()=>rpc(action,p),/권한/);await assert.rejects(()=>rpc('start'),/다른 교사/);
 await as(student);assert.equal((await rpc('active')).code,room.code);
 const answer={...p,name:'민서',choice:'switch',reason:'피해를 줄이고 싶어요.'};
 for(const name of ['', ' ', '가'.repeat(21),'민\n서'])await assert.rejects(()=>rpc('submit',{...answer,name}),/이름/);
 await assert.rejects(()=>rpc('submit',{...answer,reason:'두\n줄'}),/의견/);
 const submitted=await rpc('submit',answer);assert.ok(submitted.own.seat>=1&&submitted.own.seat<=15);assert.equal(submitted.answers,null);
 assert.equal((await rpc('submit',answer)).count,1);assert.equal((await rpc('get',p)).own.seat,submitted.own.seat);
 await assert.rejects(()=>rpc('submit',{...answer,choice:'hold'}),/이미 제출/);
 await as(student2);const another=await rpc('get',p);assert.equal(another.own,null);assert.equal(another.answers,null);assert.ok(!JSON.stringify(another).includes('민서'));
 await rpc('submit',{...answer,name:'민서',choice:'hold'}); // Same names are allowed; identity is the session.
 await as(teacher);const all=await rpc('teacher_get',p);assert.equal(all.answers.length,2);assert.equal(new Set(all.answers.map(a=>a.seat)).size,2);assert.ok(all.answers.every(a=>a.seat>=1&&a.seat<=15));assert.equal(all.answers[0].name,'민서');assert.ok(!JSON.stringify(all.answers).includes('user_id'));
 await rpc('state',{...p,status:'closed'});
 await as(student);await assert.rejects(()=>rpc('submit',answer),/마감/);assert.equal((await rpc('get',p)).own.name,'민서');
 await as(teacher);await rpc('state',{...p,status:'open'});assert.equal((await rpc('teacher_get',p)).count,2);
 await rpc('finish',p);assert.equal((await rpc('teacher_session')).active,null);
 await as(student);assert.equal(await rpc('active'),null);await assert.rejects(()=>rpc('submit',answer),/마감/);
 await as(teacher);const next=await rpc('start');assert.notEqual(next.code,room.code);assert.equal(next.count,0);assert.equal((await rpc('teacher_get',p)).count,2);await assert.rejects(()=>rpc('state',{...p,status:'open'}),/종료/);
 // Fill every seat and overflow once: no duplicate seats or missing assignments.
 for(let i=10;i<26;i++){
  const id=`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
  await db.exec('reset role');await db.query('insert into auth.users values($1)',[id]);await as(id);
  await rpc('submit',{code:next.code,name:'학생',choice:'hold',reason:'고민 중이에요.'});
 }
 await as(teacher);const filled=await rpc('teacher_get',{code:next.code});
 assert.deepEqual(filled.answers.map(a=>a.seat).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i+1));
 await as('');await assert.rejects(()=>rpc('active'),/로그인/);
 await db.close();
});
