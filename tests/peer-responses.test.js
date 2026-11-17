import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {choices,escapeHtml as esc} from '../src/domain.js';
import {pupil,pixelIcon} from '../src/pixel-art.js';

test('peer classroom refreshes automatically, preserves page and stops after returning',async()=>{
 const source=fs.readFileSync(new URL('../src/peer-responses.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function');
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',hidden:false});return nodes.get(s);};
 const app={innerHTML:'',querySelector:node,querySelectorAll:()=>[]};
 let poll,cleared=false,back=false,calls=0;
 let answers=[{seat:1,name:'민서',choice:'stay',reason:'한 사람도 소중해요.'}];
 const context=vm.createContext({app,choices,esc,pupil,pixelIcon,document:{hidden:false},window:{addEventListener(){},removeEventListener(){}},setInterval:fn=>(poll=fn,1),clearInterval:()=>cleared=true,loadPeers:async()=>{calls++;return {expected:8,answers};},onBack:()=>back=true});
 vm.runInContext(''+source+';showPeerResponses({app,loadPeers,ownSeat:1,onBack});',context);
 await new Promise(setImmediate);
 assert.ok(node('#peer-grid').innerHTML.includes('민서'));assert.ok(node('#peer-grid').innerHTML.includes('desk-top'));
 node('#peer-next').onclick();assert.equal(node('#peer-page').textContent,'2 / 2');
 answers=[...answers,{seat:5,name:'<지우>',choice:'switch',reason:'다수를 보호해요.'}];await poll();
 assert.equal(node('#peer-page').textContent,'2 / 2');assert.ok(node('#peer-grid').innerHTML.includes('&lt;지우&gt;'));
 node('#peer-back').onclick();assert.ok(cleared&&back);const before=calls;await poll();assert.equal(calls,before);
});
