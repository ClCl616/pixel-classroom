import test from 'node:test';
import assert from 'node:assert/strict';
import {newCase,inspect,evidenceReady,writingReady,planReady,escapeHtml,messages,actions} from '../public/detective/data.js';
import {createTypewriter,caseBoard} from '../public/detective/scenes.js';

test('evidence requires both files and four correctly classified clues, never supportive messages',()=>{
  const state=newCase();
  assert.equal(inspect(state,'a1',1),false);
  assert.deepEqual(state.clues,[]);
  assert.equal(inspect(state,'a3',2),true);
  assert.deepEqual(state.clues,[]);
  for(const m of messages.filter(m=>m.clue)){
    assert.equal(inspect(state,m.id,m.reason),true);
    inspect(state,m.id,m.reason);
  }
  assert.equal(state.clues.length,4);
  assert.equal(evidenceReady(state),false);
  state.visited=['sns','chat'];
  assert.equal(evidenceReady(state),true);
  assert.equal(inspect(state,'unknown',0),false);
});

test('writing requires meaningful input and both self-review checks independently for each mission',()=>{
  const state=newCase();
  state.reviews[0]=[true,true];
  state.drafts[0]='  \n ';
  assert.equal(writingReady(state,0),false);
  state.drafts[0]='발표하느라 고생했어.';
  assert.equal(writingReady(state,0),true);
  assert.equal(writingReady(state,1),false);
  state.reviews[0][1]=false;
  assert.equal(writingReady(state,0),false);
  state.reviews[0][1]=true;
  state.drafts[0]='가'.repeat(201);
  assert.equal(writingReady(state,0),false);
});

test('all 128 action plans require two distinct safe actions and exclude retaliation and redistribution',()=>{
  for(let mask=0;mask<2**actions.length;mask++){
    const state=newCase();state.plan=actions.filter((_,i)=>mask&(1<<i)).map(a=>a.id);
    const expected=state.plan.length>=2&&!state.plan.includes('revenge')&&!state.plan.includes('share');
    assert.equal(planReady(state),expected,JSON.stringify(state.plan));
  }
  assert.equal(planReady({...newCase(),plan:['listen','listen']}),false);
  assert.equal(planReady({...newCase(),plan:['listen','invalid']}),false);
});

test('new cases isolate all private state and writing is escaped for HTML display',()=>{
  const old=newCase();old.clues.push('a1');old.drafts[0]='내 문장';old.plan.push('adult');old.answers.push(false);old.pledge='함께 돕기';old.reviews[0][0]=true;
  const fresh=newCase();
  assert.deepEqual(fresh.clues,[]);assert.deepEqual(fresh.drafts,['','']);assert.deepEqual(fresh.plan,[]);assert.deepEqual(fresh.answers,[]);assert.equal(fresh.pledge,'');assert.equal(fresh.reviews[0][0],false);
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">&'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;');
});

test('the board connects only discovered clues and animates only the newest pin',()=>{
  let html=caseBoard([]);
  assert.equal((html.match(/class="thread /g)||[]).length,0);
  assert.ok(!html.includes('표정 왜 저래'));
  html=caseBoard(['a1','b4'],'b4');
  assert.equal((html.match(/class="thread /g)||[]).length,2);
  assert.equal((html.match(/new-thread/g)||[]).length,1);
  assert.equal((html.match(/new-pin/g)||[]).length,1);
  assert.ok(html.includes('표정 왜 저래'));
  assert.ok(!html.includes('그 얼굴로 발표한 거야'));
  assert.ok(!caseBoard(['a1','b4']).includes('new-thread'));
});

test('dialogue reveal, reduced motion and scene exit cancel every pending character callback',()=>{
  let next=0;const timers=new Map();const outputs=[];let completed=0;
  const typer=createTypewriter({schedule:fn=>{timers.set(++next,fn);return next;},cancel:id=>timers.delete(id)});
  const tick=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
  typer.start('회로 탐정의 첫 번째 대사',value=>outputs.push(value),()=>completed++);
  assert.equal(typer.isTyping(),true);tick();assert.equal(outputs.at(-1),'회로');
  const stale=timers.values().next().value;
  typer.start('새 장면',value=>outputs.push(value),()=>completed++);
  stale();assert.equal(outputs.at(-1),'');
  typer.finish();assert.equal(outputs.at(-1),'새 장면');assert.equal(timers.size,0);assert.equal(completed,1);
  typer.finish();assert.equal(completed,1);
  typer.start('동작 감소',value=>outputs.push(value),()=>completed++,true);
  assert.equal(outputs.at(-1),'동작 감소');assert.equal(timers.size,0);assert.equal(completed,2);
  typer.start('종료 뒤 남으면 안 되는 말',value=>outputs.push(value));
  typer.stop();assert.equal(timers.size,0);assert.equal(typer.isTyping(),false);
});
