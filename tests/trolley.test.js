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
  const context=vm.createContext({choices,esc:escapeHtml,validateResponse,app,document:{body:{classList:{add(){}}}},window:{innerHeight:568,addEventListener(){}},fetch:deny,localStorage:new Proxy({},{get:deny}),sessionStorage:new Proxy({},{get:deny})});
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
