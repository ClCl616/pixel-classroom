import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('27 cyber choice combinations produce only their own feedback without persistence or network',()=>{
 const source=fs.readFileSync(new URL('../public/cyber/app.js',import.meta.url),'utf8');
 const nodes=new Map(),events={};
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',hidden:true,setAttribute(){},focus(){},showModal(){},close(){},querySelector:s=>node(s),querySelectorAll:s=>s==='[data-person]'?[0,1,2].map(i=>{const n=node('person'+i);n.dataset={person:String(i)};return n;}):[]});return nodes.get(key);};
 const deny=()=>{throw new Error('Private activity must not use storage or network');};
 const ctx=vm.createContext({document:{querySelector:node,body:{classList:{remove(){},toggle(){},add(){}}}},clearTimeout(){},window:{matchMedia:()=>({matches:true,addEventListener(){}}),scrollTo(){},addEventListener:(event,fn)=>events[event]=fn},fetch:deny,XMLHttpRequest:deny,localStorage:new Proxy({},{get:deny}),sessionStorage:new Proxy({},{get:deny}),navigator:{sendBeacon:deny}});
 vm.runInContext(source,ctx);
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const picks=[a,b,c];vm.runInContext(`choices=${JSON.stringify(picks)};result();`,ctx);
  for(let page=0;page<3;page++){
   vm.runInContext(`resultPage=${page};result();`,ctx);
   const html=node('#app').innerHTML;
   const expected=vm.runInContext(`steps[${page}].options[choices[${page}]][3]`,ctx);
   assert.ok(html.includes(expected));
   assert.equal((html.match(/class="result-card"/g)||[]).length,1);
  }
 }
 events.pagehide();assert.ok(node('#app').innerHTML.includes('대화에 들어가기'));
 assert.equal(vm.runInContext('choices.length',ctx),0);
});

test('room switch clears group chat while private conversation continues',()=>{
 const source=fs.readFileSync(new URL('../public/cyber/app.js',import.meta.url),'utf8');
 const nodes=new Map(),timers=new Map();let serial=0;
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',hidden:true,setAttribute(){},focus(){},scrollTo(){},remove(){},insertAdjacentHTML(_,html){this.innerHTML+=html;},querySelector:s=>node(s),querySelectorAll:s=>s==='[data-person]'?[0,1,2].map(i=>{const n=node('person'+i);n.dataset={person:String(i)};return n;}):[]});return nodes.get(key);};
 const ctx=vm.createContext({document:{querySelector:node,body:{classList:{add(){},remove(){},toggle(){}}}},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}},setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source,ctx);vm.runInContext('play()',ctx);assert.equal(timers.size,1);
 node('#skip').onclick();assert.equal(timers.size,0);
 assert.equal((node('#conversation').innerHTML.match(/class="msg/g)||[]).length,3);
 assert.equal(vm.runInContext('chatItems.length',ctx),3);
 assert.ok(node('#composer').innerHTML.includes('(웃는 이모티콘을 누른다.)'));
 assert.equal(vm.runInContext('choiceText(steps[0].options[1][0])',ctx),'“허락 없이 올린 사진이잖아. 공유하지 말자.”');
 const initialChat=node('#conversation').innerHTML;
 vm.runInContext('choose(0)',ctx);
 assert.ok(node('#photo-reactions').innerHTML.includes('😂'));
 assert.ok(!node('#conversation').innerHTML.includes('(웃는 이모티콘을 누른다.)'));
 assert.equal((node('#conversation').innerHTML.match(/class="msg/g)||[]).length,3);
 const runNext=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
 runNext(); // group reply
 runNext(); // incoming notification, before clearing the old room
 assert.equal(node('#incoming-message').hidden,false);
 assert.ok(node('#conversation').innerHTML.includes('오늘 민서 사진 봤어?'));
 assert.equal(timers.size,0); // no automatic transition
 vm.runInContext('finishSequence()',ctx); // skipping cannot enter the room
 assert.equal(node('#incoming-message').hidden,false);
 node('#incoming-message').onclick(); // explicit tap enters the private room
 assert.equal(node('#incoming-message').hidden,true);
 assert.equal(node('.conversation-head h2').textContent,'민서');
 node('#skip').onclick();
 assert.equal(timers.size,0);
 assert.equal(vm.runInContext('current',ctx),1);
 assert.ok(!node('#conversation').innerHTML.includes('오늘 민서 사진 봤어?'));
 assert.equal(node('.conversation-head h2').textContent,'민서');
 assert.equal(vm.runInContext('chatItems.length',ctx),2);
 assert.ok(node('#conversation').innerHTML.includes('내 사진 단톡방에 올라온 거 봤어.'));
 assert.ok(!node('#composer').innerHTML.includes('다음 대화'));
 vm.runInContext('choose(1)',ctx);node('#skip').onclick();
 assert.equal(vm.runInContext('current',ctx),2);
 assert.ok(node('#conversation').innerHTML.includes('다른 반 단톡방에도 올라왔대.'));
 const beforeAction=node('#conversation').innerHTML;
 vm.runInContext('choose(0)',ctx);
 assert.ok(node('#phone-action').innerHTML.includes('캡처하기'));
 assert.ok(node('#phone-action').innerHTML.includes('다들 웃네. 다른 방에도 보내야겠다.'));
 assert.ok(node('#phone-action').innerHTML.includes('😂 1'));
 assert.ok(!node('#phone-action').innerHTML.includes('다른 반 단톡방에도 올라왔대.'));
 assert.equal(node('#conversation').innerHTML,beforeAction);
 node('#operation-next').onclick();assert.ok(node('#phone-action').innerHTML.includes('캡처 미리보기'));
 node('#operation-next').onclick();assert.ok(node('#phone-action').innerHTML.includes('담임 선생님'));
 node('#operation-next').onclick();assert.ok(node('#phone-action').innerHTML.includes('도와주세요.'));
 node('#operation-next').onclick();runNext();
 assert.ok(node('#conversation').innerHTML.includes('대화랑 사진은 저장했어.'));
 node('#skip').onclick();
 assert.ok(node('#composer').innerHTML.includes('내 선택 돌아보기'));
 assert.equal(vm.runInContext('choices.length',ctx),3);
 vm.runInContext('runPhoneAction(1,()=>{})',ctx);
 assert.equal(node('#operation-next').disabled,true);
 node('person0').onclick();assert.equal(node('#operation-next').disabled,false);
 node('#operation-next').onclick();assert.ok(node('#phone-action').innerHTML.includes('1명에게 사진 보내기'));
 node('#operation-next').onclick();runNext();
 assert.ok(node('#conversation').innerHTML.includes('상황 알리려고 서연한테 사진 보냈어.'));
 vm.runInContext('runPhoneAction(2,()=>{})',ctx);
 node('#operation-next').onclick();assert.ok(node('#phone-action').innerHTML.includes('도윤을 차단할까요?'));
 node('#operation-next').onclick();runNext();
 assert.ok(node('#conversation').innerHTML.includes('도윤은 차단했어.'));
 for(const kind of [1,2])for(const stage of [0,1]){
  const transcript=node('#conversation').innerHTML;
  vm.runInContext(`revealed=false;choose(${kind})`,ctx);
  if(stage===1){if(kind===1)node('person1').onclick();node('#operation-next').onclick();}
  node('#operation-cancel').onclick();
  assert.equal(node('#conversation').innerHTML,transcript);
  assert.equal(vm.runInContext('choices[2]',ctx),undefined);
  assert.equal(vm.runInContext('revealed',ctx),false);
  assert.equal(timers.size,0);
  assert.ok(node('#composer').innerHTML.includes('내 행동 선택'));
 }
 vm.runInContext('runPhoneAction(1,()=>{})',ctx);
 node('person1').onclick();node('person2').onclick();node('#operation-next').onclick();
 assert.ok(node('#phone-action').innerHTML.includes('하준, 유나 · 2명'));
 node('#operation-next').onclick();runNext();
 assert.ok(node('#conversation').innerHTML.includes('하준, 유나한테 사진 보냈어.'));


 assert.ok(!vm.runInContext(`message('나','“네 잘못이 아니야.”')`,ctx).includes('“'));
 assert.ok(!vm.runInContext(`message('나','“네 잘못이 아니야.”')`,ctx).includes('”'));

 vm.runInContext('play()',ctx);assert.equal(timers.size,1);
 vm.runInContext('home()',ctx);assert.equal(timers.size,0);
 assert.ok(node('#app').innerHTML.includes('대화에 들어가기'));
});

test('capture keeps the actual group reply, own speech and reaction for each branch',()=>{
 const source=fs.readFileSync(new URL('../public/cyber/app.js',import.meta.url),'utf8');
 const nodes=new Map();const node=k=>{if(!nodes.has(k))nodes.set(k,{innerHTML:'',hidden:true,setAttribute(){},focus(){},scrollTo(){},insertAdjacentHTML(_,v){this.innerHTML+=v;},querySelector:node,querySelectorAll:()=>[]});return nodes.get(k);};
 const ctx=vm.createContext({document:{querySelector:node,body:{classList:{add(){},remove(){},toggle(){}}}},window:{matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},scrollTo(){}},clearTimeout(){}});
 vm.runInContext(source,ctx);
 for(let pick=0;pick<3;pick++){
  vm.runInContext(`current=0;choices=[];revealed=false;play();choose(${pick});`,ctx);
  node('#incoming-message').onclick();
  const capture=vm.runInContext('captureConversation()',ctx);
  const reply=vm.runInContext(`steps[0].options[${pick}][2]`,ctx);
  assert.ok(capture.includes(reply));
  assert.equal(capture.includes('😂 1'),pick===0);
  assert.equal(capture.includes('허락 없이 올린 사진이잖아. 공유하지 말자.'),pick===1);
  assert.equal(capture.includes('읽음 ✓✓'),pick===2);
 }
 vm.runInContext('home()',ctx);assert.equal(vm.runInContext('groupHistory.length',ctx),0);
});
