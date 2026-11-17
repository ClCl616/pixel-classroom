import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindTeacherMenuKey} from '../src/teacher-menu-key.js';

test('teacher menu supports P in Korean layout and ignores typing and other dialogs',()=>{
 let handler,removed=false,other=false;
 const dialog={open:false,showModal(){this.open=true;},close(){this.open=false;}};
 const unbind=bindTeacherMenuKey({addEventListener:(_,fn)=>handler=fn,removeEventListener:()=>removed=true},()=>dialog,()=>other);
 const key={code:'KeyP',key:'ㅔ',preventDefault(){}};
 handler(key);assert.equal(dialog.open,true);
 handler({...key,repeat:true});assert.equal(dialog.open,true);
 handler(key);assert.equal(dialog.open,false);
 for(const extra of [{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true},{target:{closest:()=>true}}]){handler({...key,...extra});assert.equal(dialog.open,false);}
 other=true;handler(key);assert.equal(dialog.open,false);
 unbind();assert.equal(removed,true);
});
