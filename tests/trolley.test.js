import {pupil,pixelIcon} from '../src/pixel-art.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {choices, escapeHtml, validateResponse} from '../src/domain.js';

test('standalone trolley supports all choices, validation, editing and a fresh restart without network or storage',()=>{
 const source=fs.readFileSync(new URL('../src/trolley.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function startTrolley','function startTrolley');
 for(const pick of choices){
  const nodes=new Map();
  const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',focus(){}});return nodes.get(s);};
  const buttons=choices.map(c=>({dataset:{choice:c.id}}));
  const app={innerHTML:'',style:{setProperty(){}},querySelector:node,querySelectorAll:()=>buttons};
  const deny=()=>{throw new Error('Personal response must stay in page memory');};
  const context=vm.createContext({pupil,pixelIcon,choices,esc:escapeHtml,validateResponse,app,document:{body:{classList:{add(){}}}},window:{innerHeight:568,addEventListener(){}},fetch:deny,localStorage:new Proxy({},{get:deny}),sessionStorage:new Proxy({},{get:deny})});
  vm.runInContext(source,context);
  vm.runInContext("startTrolley({app,homeUrl:'/'});",context);
  assert.ok(app.innerHTML.includes('기차가 멈추지 않아요.'));
  assert.ok(!app.innerHTML.includes('<header'));
  node('#rail-next').onclick();
  buttons.find(b=>b.dataset.choice===pick.id).onclick();
  assert.ok(app.innerHTML.includes(`rail-scene ${pick.id}`));
  node('#rail-next').onclick();
  const input=node('#trolley-reason');
  for(const invalid of [' ','첫 줄\n둘째 줄','가'.repeat(121)]){
   input.value=invalid;node('#trolley-response').onsubmit({preventDefault(){}});
   assert.ok(node('#trolley-error').textContent.includes('1~120자'));
   assert.ok(app.innerHTML.includes('trolley-response'));
  }
  input.value='<img src=x>도 중요한 기준이에요.';input.oninput();
  node('#trolley-response').onsubmit({preventDefault(){}});
  assert.ok(app.innerHTML.includes('&lt;img src=x&gt;'));
  assert.ok(app.innerHTML.includes(pick.label));
  node('#rail-edit').onclick();assert.ok(app.innerHTML.includes('&lt;img src=x&gt;'));
  input.value='다시 생각한 이유예요.';input.oninput();node('#trolley-response').onsubmit({preventDefault(){}});
  assert.ok(app.innerHTML.includes('다시 생각한 이유예요.'));
  node('#rail-next').onclick();assert.ok(app.innerHTML.includes('활동 마치기'));
  node('#rail-restart').onclick();node('#rail-next').onclick();buttons[0].onclick();node('#rail-next').onclick();
  assert.ok(app.innerHTML.includes('>0 / 120</span>'));
  assert.ok(!app.innerHTML.includes('다시 생각한 이유예요.'));
 }
});

test('live trolley requires a name, preserves a failed submission and confirms the assigned seat only after success',async()=>{
 const source=fs.readFileSync(new URL('../src/trolley.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function startTrolley','function startTrolley');
 const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',disabled:false,focus(){}});return nodes.get(s);};
 const buttons=choices.map(c=>({dataset:{choice:c.id}}));
 const app={innerHTML:'',style:{setProperty(){}},querySelector:node,querySelectorAll:()=>buttons};
 let attempts=0,sent;
 const submitResponse=async payload=>{attempts++;sent=payload;if(attempts===1)throw new Error('연결이 끊겼어요. 다시 보내 주세요.');return {own:{...payload,seat:3}};};
 const context=vm.createContext({pupil,pixelIcon,choices,esc:escapeHtml,validateResponse,app,submitResponse,document:{body:{classList:{add(){}}}},window:{innerHeight:568,addEventListener(){}}});
 vm.runInContext(source,context);vm.runInContext("startTrolley({app,homeUrl:'/',liveSession:{code:'ROOM'},submitResponse});",context);
 assert.ok(app.innerHTML.includes('student-identify'));
 node('#student-name').value=' ';node('#student-identify').onsubmit({preventDefault(){}});assert.ok(node('#name-error').textContent);
 node('#student-name').value='민서';node('#student-identify').onsubmit({preventDefault(){}});
 node('#rail-next').onclick();buttons[0].onclick();node('#rail-next').onclick();
 node('#trolley-reason').value='생명을 보호하고 싶어요.';node('#trolley-reason').oninput();
 await node('#trolley-response').onsubmit({preventDefault(){}});
 assert.equal(attempts,1);assert.ok(app.innerHTML.includes('trolley-response'));assert.ok(node('#trolley-error').textContent.includes('연결'));assert.equal(node('#trolley-response button[type="submit"]').disabled,false);
 await node('#trolley-response').onsubmit({preventDefault(){}});
 assert.equal(attempts,2);assert.equal(sent.name,'민서');assert.equal(sent.choice,'switch');assert.equal(sent.reason,'생명을 보호하고 싶어요.');assert.ok(app.innerHTML.includes('3번 자리에 앉았어요'));assert.ok(!app.innerHTML.includes('id="rail-edit"'));assert.ok(app.innerHTML.includes(pupil(3)));assert.ok(app.innerHTML.includes('민서 학생의 생각'));assert.ok(app.innerHTML.includes(sent.reason));
 node('#rail-next').onclick();assert.ok(!app.innerHTML.includes('id="rail-restart"'));
});
