import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {pupil} from '../src/pixel-art.js';

test('arrival walks to its assigned desk before revealing the seated pupil and bubble',async()=>{
 const source=fs.readFileSync(new URL('../src/classroom-arrival.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function');
 let done,frames,removed=false,cancelled=false,reduced=false;
 const classes=new Set();
 const walker={style:{},setAttribute(){},remove(){removed=true;},animate(keyframes){frames=keyframes;return {finished:new Promise(resolve=>done=resolve),cancel(){cancelled=true;}};}};
 const slot={isConnected:true,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},querySelector:()=>({getBoundingClientRect:()=>({left:320,top:180,width:32,height:40})})};
 const grid={getBoundingClientRect:()=>({left:20,top:80,height:400}),append(){}};
 const context=vm.createContext({pupil,window:{matchMedia:()=>({matches:reduced})},document:{createElement:()=>walker},slot,grid});
 vm.runInContext(source,context);
 vm.runInContext('enterClassroom(grid,slot,7)',context);
 assert.ok(classes.has('entering'));assert.ok(!classes.has('seated'));
 assert.equal(frames.at(-1).transform,'translate(300px,100px)');
 assert.equal(walker.innerHTML,pupil(7));
 done();await Promise.resolve();await Promise.resolve();
 assert.ok(!classes.has('entering'));assert.ok(classes.has('seated'));assert.ok(removed);
 classes.clear();removed=false;
 const cancel=vm.runInContext('enterClassroom(grid,slot,8)',context);cancel();done();await Promise.resolve();
 assert.ok(cancelled&&removed);assert.ok(!classes.has('seated'));assert.ok(!classes.has('entering'));
 reduced=true;classes.clear();vm.runInContext('enterClassroom(grid,slot,9)',context);assert.equal(classes.size,0);
});
