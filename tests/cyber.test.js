import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('27 cyber choice combinations produce only their own feedback without persistence or network',()=>{
 const source=fs.readFileSync(new URL('../public/cyber/app.js',import.meta.url),'utf8');
 const nodes=new Map(),events={};
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',hidden:true,setAttribute(){},focus(){},showModal(){},close(){},querySelector:s=>node(s),querySelectorAll:()=>[]});return nodes.get(key);};
 const deny=()=>{throw new Error('Private activity must not use storage or network');};
 const ctx=vm.createContext({document:{querySelector:node},window:{scrollTo(){},addEventListener:(event,fn)=>events[event]=fn},fetch:deny,XMLHttpRequest:deny,localStorage:new Proxy({},{get:deny}),sessionStorage:new Proxy({},{get:deny}),navigator:{sendBeacon:deny}});
 vm.runInContext(source,ctx);
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const picks=[a,b,c];vm.runInContext(`choices=${JSON.stringify(picks)};result();`,ctx);
  const html=node('#app').innerHTML;
  const expected=vm.runInContext('steps.map((s,i)=>s.options[choices[i]][3])',ctx);
  expected.forEach(text=>assert.ok(html.includes(text)));
  assert.equal((html.match(/class="result-card"/g)||[]).length,3);
 }
 events.pagehide();assert.ok(node('#app').innerHTML.includes('내 선택으로 시작하기'));
 assert.equal(vm.runInContext('choices.length',ctx),0);
});
