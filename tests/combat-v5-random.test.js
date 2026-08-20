const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../combat-core.js');
test('positive morale can trigger once per round',()=>{const u={morale:2,positiveMoraleRound:0};assert.equal(C.rollMorale(u,3,()=>0.05),'positive');C.consumePositiveMorale(u,3);assert.equal(C.rollMorale(u,3,()=>0),'none');});
test('negative morale can skip activation',()=>{assert.equal(C.rollMorale({morale:-3},2,()=>0.1),'negative');assert.equal(C.rollMorale({morale:-1},2,()=>0.2),'none');});
test('luck uses capped chance and doubles only physical damage',()=>{assert.equal(C.rollLuck({luck:3},()=>0.14),true);assert.equal(C.rollLuck({luck:3},()=>0.2),false);assert.equal(C.applyLuckDamage(41,true,false),82);assert.equal(C.applyLuckDamage(41,true,true),41);});
