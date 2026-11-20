import test from 'node:test';
import assert from 'node:assert/strict';
import {newCase,messages} from '../public/detective/data.js';
import {supportCases,supportSteps,supportSelection,chooseSupport,supportReady} from '../public/detective/support.js';

test('each added clue has separate words and action choices with feedback',()=>{
  assert.deepEqual(supportCases.map(c=>c.clue),['a4','a6','b6']);
  assert.equal(supportSteps.length,6);
  for(const item of supportCases){
    assert.ok(messages.find(m=>m.id===item.clue)?.clue);
    for(const kind of ['words','actions']){
      assert.equal(item[kind].length,3);
      assert.ok(item[kind].some(c=>c.safe));assert.ok(item[kind].some(c=>!c.safe));
      assert.ok(item[kind].every(c=>c.text&&c.feedback));
    }
  }
});
test('all 729 type-specific plans require a helpful word and action for every type',()=>{
  for(let combination=0;combination<3**supportSteps.length;combination++){
    const state=newCase();let code=combination,expected=true;
    for(let page=0;page<supportSteps.length;page++){
      state.supportPage=page;const choice=code%3;code=Math.floor(code/3);
      assert.equal(chooseSupport(state,choice),true);assert.equal(state.supportFeedback,true);
      expected&&=supportSelection(state).safe;
    }
    assert.equal(supportReady(state),expected);
  }
});
test('revising a choice updates readiness without losing other selections; restart isolates choices',()=>{
  const state=newCase();assert.equal(supportReady(state),false);
  for(let page=0;page<supportSteps.length;page++){
    state.supportPage=page;const step=supportSteps[page];
    chooseSupport(state,supportCases[step.caseIndex][step.kind].findIndex(c=>c.safe));
  }
  assert.equal(supportReady(state),true);const saved=[...state.supportChoices];
  state.supportPage=0;chooseSupport(state,0);assert.equal(supportReady(state),false);
  assert.deepEqual(state.supportChoices.slice(1),saved.slice(1));
  chooseSupport(state,saved[0]);assert.equal(supportReady(state),true);
  for(const invalid of [-1,3,NaN,0.5])assert.equal(chooseSupport(state,invalid),false);
  assert.deepEqual(state.supportChoices,saved);
  assert.deepEqual(newCase().supportChoices,Array(6).fill(null));assert.equal(supportSelection(newCase()),undefined);
});
