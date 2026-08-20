const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const src=n=>fs.readFileSync(path.join(root,n),'utf8');
test('v5 integration uses BattlefieldCore for occupancy pathfinding and footprint adjacency',()=>{const s=src('combat-v5.js');assert.match(s,/BattlefieldCore\.unitAtHex/);assert.match(s,/BattlefieldCore\.findPath/);assert.match(s,/BattlefieldCore\.footprintsAdjacent/);assert.match(s,/v5LegalAttackStates/);});
test('v5 defines obstacles and two large opposing stacks',()=>{const s=src('combat-v5.js');assert.match(s,/V5_ARENAS/);assert.match(s,/Kościany Behemot/);assert.match(s,/Bagienny Kolos/);assert.match(s,/u\.size=2/);});
test('v5 integrates morale luck and full-footprint UI',()=>{const s=src('combat-v5.js');assert.match(s,/rollMorale/);assert.match(s,/rollLuck/);assert.match(s,/Rozmiar/);assert.match(s,/v5RenderObstacles/);});
