import test from 'node:test';
import assert from 'node:assert/strict';
import {newCase,inspect,evidenceReady,writingReady,planReady,escapeHtml,messages,actions,clueCount,clueMessages,reasonChoices,clueTypes} from '../public/detective/data.js';
import {createTypewriter,caseBoard,dialoguePages,evidenceFeed,createTimedCue,stepDialogue,boardPageCount,boardPageFor} from '../public/detective/scenes.js';

test('short dialogue pages preserve all words, punctuation and speakers',()=>{
  const lines=['반 단톡방에서 메시지가 멈췄어. 무슨 일이 있었는지 함께 살펴볼까?',{speaker:'지안',text:'내 얘기를 다른 방에서도 하는 것 같아. 그만하라고 말하면 더 놀릴까 봐 무서워.'}];
  const pages=dialoguePages(lines,22);
  assert.ok(pages.length>lines.length);
  assert.ok(pages.every(p=>p.text.length<=22));
  assert.equal(pages.filter(p=>p.speaker==='회로 탐정').map(p=>p.text).join(' '),lines[0]);
  assert.equal(pages.filter(p=>p.speaker==='지안').map(p=>p.text).join(' '),lines[1].text);
  assert.deepEqual(dialoguePages([]),[]);
});

test('continuous evidence feeds retain every message in order and mark only collected clues',()=>{
  for(const room of ['sns','chat']){
    const html=evidenceFeed(room,['a1']);
    const ids=[...html.matchAll(/data-clue="([^"]+)"/g)].map(match=>match[1]);
    assert.deepEqual(ids,messages.filter(m=>m.room===room).map(m=>m.id));
    assert.equal((html.match(/ · 보드에 연결됨/g)||[]).length,room==='sns'?1:0);
    assert.ok(!html.includes('data-action="evidence-next"'));
  }
  assert.ok(evidenceFeed('chat').includes('from-jian'));
  const a=newCase(),b=newCase();a.evidenceScroll.chat=120;assert.equal(b.evidenceScroll.chat,0);
});

test('first dialogue cue is visible for 3000ms and cancels pending work on scene exit',()=>{
  let pending=null,delay=0,removed=0,cancelled=0;
  const cue=createTimedCue({schedule:(fn,ms)=>{pending=fn;delay=ms;return 1;},cancel:()=>{pending=null;cancelled++;}});
  const element={hidden:true,remove:()=>removed++};
  cue.show(element);assert.equal(element.hidden,false);assert.equal(delay,3000);assert.equal(removed,0);
  pending();assert.equal(removed,1);
  cue.show(element);cue.stop();assert.equal(pending,null);assert.equal(cancelled,1);
});

test('evidence requires both files and all seven correctly classified clues, never supportive messages',()=>{
  const state=newCase();
  assert.equal(inspect(state,'a1',1),false);
  assert.deepEqual(state.clues,[]);
  assert.equal(inspect(state,'a3',2),true);
  assert.deepEqual(state.clues,[]);
  for(const m of messages.filter(m=>m.clue)){
    assert.equal(inspect(state,m.id,m.reason),true);
    inspect(state,m.id,m.reason);
  }
  assert.equal(state.clues.length,7);
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
  html=Array.from({length:boardPageCount},(_,page)=>caseBoard(['a1','b4'],'b4',page)).join('');
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

test('speech activation reveals first, then advances once, including instant dialogue',()=>{
  const timers=new Map();let id=0,text='',advances=0;
  const typer=createTypewriter({schedule:fn=>{timers.set(++id,fn);return id;},cancel:key=>timers.delete(key)});
  const next=()=>{advances++;typer.start('다음 대사',value=>text=value);};
  typer.start('아직 쓰는 중인 대사',value=>text=value);
  typer.advance(next);
  assert.equal(text,'아직 쓰는 중인 대사');assert.equal(advances,0);assert.equal(timers.size,0);
  typer.advance(next);
  assert.equal(advances,1);assert.equal(text,'');assert.equal(timers.size,1);
  typer.advance(next);
  assert.equal(text,'다음 대사');assert.equal(advances,1);
  typer.start('즉시 표시',value=>text=value,()=>{},true);
  typer.advance(next);assert.equal(advances,2);
  typer.stop();assert.equal(timers.size,0);
});


test('dialogue navigation clamps the start, revisits read lines and ends only after the last page',()=>{
  const story={lines:dialoguePages(['첫 대사. 두 번째 대사. 마지막 대사.']),index:0,read:new Set([0])};
  assert.equal(stepDialogue(story,-1),true);assert.equal(story.index,0);
  assert.equal(stepDialogue(story,1),true);assert.equal(story.index,1);
  assert.equal(stepDialogue(story,-1),true);assert.equal(story.index,0);assert.equal(story.read.has(story.index),true);
  stepDialogue(story,1);stepDialogue(story,1);
  assert.equal(story.index,2);assert.equal(stepDialogue(story,1),false);assert.equal(story.index,2);
  assert.equal(stepDialogue(story,-1),true);assert.equal(story.index,1);
});


test('expanded clues cover five types with four valid reasons and paginated private board pins',()=>{
  assert.equal(clueCount,7);assert.equal(boardPageCount,2);
  assert.deepEqual([...new Set(clueMessages.map(m=>m.reason))].sort(),[0,1,4,5,6]);
  for(const m of messages){
    const options=reasonChoices(m);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.ok(options.includes(m.reason));
    if(!m.clue)continue;
    assert.ok(clueTypes[m.reason]);
    const page=boardPageFor(m.id),html=caseBoard([m.id],m.id,page);
    assert.ok(html.includes(`data-board-note="${m.id}"`));assert.equal((html.match(/new-thread/g)||[]).length,1);
    assert.ok(!caseBoard([],null,page).includes(m.boardText||m.text));
    assert.ok(!caseBoard([m.id],m.id,1-page).includes(`data-board-note="${m.id}"`));
    const state=newCase();state.visited=['sns','chat'];state.clues=clueMessages.filter(c=>c.id!==m.id).map(c=>c.id);
    assert.equal(evidenceReady(state),false);inspect(state,m.id,m.reason);assert.equal(evidenceReady(state),true);
  }
});
