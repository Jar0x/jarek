const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../combat-core.js');

test('defend grants temporary defense bonus', () => {
  const u = { defense: 6, defending: false };
  C.applyDefend(u);
  assert.equal(u.defending, true);
  assert.equal(C.effectiveDefense(u), 8);
  C.clearTurnStance(u);
  assert.equal(C.effectiveDefense(u), 6);
});

test('haste and slow modify effective speed while effects last', () => {
  const u = { speed: 5, effects: [{id:'haste',amount:2,rounds:2}] };
  assert.equal(C.effectiveSpeed(u), 7);
  u.effects = [{id:'slow',amount:-2,rounds:2}];
  assert.equal(C.effectiveSpeed(u), 3);
});

test('bless forces maximum creature damage', () => {
  const u = { minDmg: 2, maxDmg: 5, effects: [{id:'bless',rounds:2}] };
  assert.equal(C.creatureDamageRoll(u, () => 0), 5);
});

test('magic arrow damage scales with hero power', () => {
  assert.equal(C.magicArrowDamage({power:3}), 55);
});

test('spell casting spends mana only when affordable', () => {
  const h = {mana:12};
  assert.equal(C.spendMana(h, 8), true);
  assert.equal(h.mana, 4);
  assert.equal(C.spendMana(h, 6), false);
  assert.equal(h.mana, 4);
});

test('effect durations tick down and expire', () => {
  const u = {effects:[{id:'slow',rounds:1},{id:'bless',rounds:2}]};
  C.tickEffects(u);
  assert.deepEqual(u.effects.map(e=>[e.id,e.rounds]), [['bless',1]]);
});
