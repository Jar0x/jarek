const test = require('node:test');
const assert = require('node:assert/strict');
const CombatCore = require('../combat-core.js');

test('initiative order sorts living units by speed then id', () => {
  const units = [
    {id:'b', speed:4, dead:false, totalHp:10},
    {id:'c', speed:6, dead:false, totalHp:10},
    {id:'a', speed:6, dead:false, totalHp:10},
    {id:'z', speed:9, dead:true, totalHp:0}
  ];
  assert.deepEqual(CombatCore.buildInitiativeOrder(units).map(u => u.id), ['a','c','b']);
});

test('retaliation is available once per round for a living adjacent defender', () => {
  const defender = {dead:false,totalHp:20,retaliatedRound:0};
  assert.equal(CombatCore.canRetaliate(defender, 2, true), true);
  defender.retaliatedRound = 2;
  assert.equal(CombatCore.canRetaliate(defender, 2, true), false);
  assert.equal(CombatCore.canRetaliate(defender, 3, false), false);
});

test('damage modifier rewards attack advantage and defense reduces damage', () => {
  assert.equal(CombatCore.damageMultiplier(10, 10), 1);
  assert.ok(CombatCore.damageMultiplier(14, 10) > 1);
  assert.ok(CombatCore.damageMultiplier(8, 12) < 1);
});

test('AI target score prioritizes killable and dangerous stacks', () => {
  const weak = {totalHp:18,count:2,minDmg:2,maxDmg:4,attack:4,speed:4};
  const dangerous = {totalHp:36,count:8,minDmg:4,maxDmg:6,attack:7,speed:6};
  const lethalScore = CombatCore.aiTargetScore(weak, 25, 2);
  const dangerousScore = CombatCore.aiTargetScore(dangerous, 15, 2);
  assert.ok(lethalScore > CombatCore.aiTargetScore(weak, 8, 2));
  assert.ok(dangerousScore > 0);
});
