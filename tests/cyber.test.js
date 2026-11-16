import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('27 cyber choice combinations produce only their own feedback without persistence or network',()=>{
 const source=fs.readFileSync(new URL('../public/cyber/app.js',import.meta.url),'utf8');
 const nodes=new Map(),events={};
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',hidden:true,setAttribute(){},focus(){},showModal(){},close(){},querySelector:s=>node(s),querySelectorAll:()=>[]});return nodes.get(key);};
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
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',hidden:true,setAttribute(){},focus(){},scrollTo(){},insertAdjacentHTML(_,html){this.innerHTML+=html;},querySelector:s=>node(s),querySelectorAll:()=>[]});return nodes.get(key);};
 const ctx=vm.createContext({document:{querySelector:node,body:{classList:{add(){},remove(){},toggle(){}}}},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}},setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source,ctx);vm.runInContext('play()',ctx);assert.equal(timers.size,1);
 node('#skip').onclick();assert.equal(timers.size,0);
 assert.equal((node('#conversation').innerHTML.match(/class="msg/g)||[]).length,3);
 assert.equal(vm.runInContext('chatItems.length',ctx),3);
 assert.ok(node('#composer').innerHTML.includes('내 행동 선택'));
 const initialChat=node('#conversation').innerHTML;
 vm.runInContext('choose(0)',ctx);
 const runNext=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
 runNext(); // group reply
 runNext(); // incoming notification, before clearing the old room
 assert.equal(node('#incoming-message').hidden,false);
 assert.ok(node('#conversation').innerHTML.includes('오늘 민서 사진 봤어?'));
 runNext(); // notification finishes, now switch rooms
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
 vm.runInContext('choose(0)',ctx);node('#skip').onclick();
 assert.ok(node('#composer').innerHTML.includes('내 선택 돌아보기'));
 assert.equal(vm.runInContext('choices.length',ctx),3);

 vm.runInContext('play()',ctx);assert.equal(timers.size,1);
 vm.runInContext('home()',ctx);assert.equal(timers.size,0);
 assert.ok(node('#app').innerHTML.includes('대화에 들어가기'));
});
