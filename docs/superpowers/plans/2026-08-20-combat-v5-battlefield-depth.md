# Combat v5 Battlefield Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full 2-hex units with orientation, obstacle-aware pathfinding, morale and luck to the existing Combat v4 prototype without regressing movement, attacks, ranged combat, spells or AI.

**Architecture:** Introduce a DOM-free `battlefield-core.js` responsible for footprint geometry, occupancy validation and pathfinding over `(c,r,facing)` states. Keep turn flow and rendering in `game.js`, hero/magic behavior in `combat-v4.js`, and add a thin `combat-v5.js`/`combat-v5.css` integration layer for obstacles, large-unit rendering, morale and luck. Random morale/luck checks are implemented in `combat-core.js` with injectable RNG for deterministic tests.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js built-in test runner (`node:test`), GitHub branches/PRs.

**Spec:** `docs/superpowers/specs/2026-08-20-combat-v5-battlefield-depth-design.md`

## Global Constraints

- Large units use `size: 2`, `facing: 'left' | 'right'`, and store only the head hex; the rear hex is derived.
- Player large units default to facing right; AI large units default to facing left.
- 2-hex pathfinding state is `(c,r,facing)` and validates the complete footprint.
- Rotation has no separate movement cost in v5.
- Obstacles are static, impassable and do not block line of sight in v5.
- Morale range is -3..+3 with 5% chance per point, capped at 15%; positive morale triggers at most once per unit per round.
- Luck range is 0..3 with 5% chance per point, capped at 15%; lucky physical attacks deal x2 final damage; direct spell damage is unaffected.
- Existing Combat v3/v4 mechanics and tests must continue to pass.

---

### Task 1: Battlefield geometry and footprints

**Files:**
- Create: `battlefield-core.js`
- Create: `tests/battlefield-core.test.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `BattlefieldCore.footprint(unit, state?)`, `BattlefieldCore.occupiedKeys(unit, state?)`, `BattlefieldCore.footprintsAdjacent(a,b)`, `BattlefieldCore.stateKey(state)`.
- Inputs: units shaped like `{c,r,size,facing}`.

- [ ] **Step 1: Write failing tests** for 1-hex footprint and 2-hex footprints in both facings on even/odd rows.
- [ ] **Step 2: Run** `node --test tests/battlefield-core.test.js` and verify failures are caused by the missing module/functions.
- [ ] **Step 3: Implement minimal geometry** with odd-r neighbor math and derived rear hex.
- [ ] **Step 4: Re-run** `node --test tests/battlefield-core.test.js` and verify all geometry tests pass.
- [ ] **Step 5: Add `<script src="battlefield-core.js"></script>` before `game.js` in `index.html` and run `node --check battlefield-core.js`.
- [ ] **Step 6: Commit** geometry and tests.

### Task 2: Occupancy, obstacles and legal placement

**Files:**
- Modify: `battlefield-core.js`
- Modify: `tests/battlefield-core.test.js`

**Interfaces:**
- Produces: `BattlefieldCore.canPlace(unit,state,context)` where context is `{cols,rows,units,obstacles,ignoreUnit}`.
- Produces: `BattlefieldCore.unitAtHex(units,c,r,ignoreUnit)` and `BattlefieldCore.isObstacleAt(obstacles,c,r)`.

- [ ] **Step 1: Add failing tests** for out-of-board rear hex, rear-hex obstacle collision and rear-hex unit collision.
- [ ] **Step 2: Run** `node --test tests/battlefield-core.test.js` and verify the new tests fail.
- [ ] **Step 3: Implement placement/occupancy validation** using complete footprints and self-ignore semantics.
- [ ] **Step 4: Run tests** and verify all pass.
- [ ] **Step 5: Commit** placement validation.

### Task 3: 2-hex pathfinding with orientation

**Files:**
- Modify: `battlefield-core.js`
- Modify: `tests/battlefield-core.test.js`

**Interfaces:**
- Produces: `BattlefieldCore.findPath(unit,start,goal,context,maxSteps)` returning states `{c,r,facing}`.
- Produces: `BattlefieldCore.reachableStates(unit,start,context,maxSteps)` as a `Map` keyed by state key.
- Movement transitions may select left/right facing when legal; cost is 1 per head movement step.

- [ ] **Step 1: Add failing tests** for a large unit passing a wide corridor and failing through a one-hex choke.
- [ ] **Step 2: Run tests** and verify failures.
- [ ] **Step 3: Implement BFS over `(c,r,facing)`** using `canPlace` for every successor.
- [ ] **Step 4: Run tests** and verify pathfinding tests pass with existing geometry tests.
- [ ] **Step 5: Commit** orientation-aware pathfinding.

### Task 4: Integrate footprints and obstacles into the live battle

**Files:**
- Modify: `game.js`
- Create: `combat-v5.js`
- Create: `combat-v5.css`
- Modify: `index.html`
- Create: `tests/combat-v5-integration.test.js`

**Interfaces:**
- `game.obstacles` contains `{id,c,r,kind}`.
- Units default `size:1`; large units use `size:2` and `facing`.
- `unitAt`, `isAdjacent`, movement and AI use `BattlefieldCore` instead of single-cell assumptions.
- `combat-v5.js` defines three arena presets and rendering helpers.

- [ ] **Step 1: Write failing integration/source tests** that require `game.js` to delegate occupancy/adjacency/pathfinding to `BattlefieldCore`, and require `index.html` to load v5 assets.
- [ ] **Step 2: Run tests** and verify failure.
- [ ] **Step 3: Replace single-cell occupancy/pathfinding hooks** in `game.js` with `BattlefieldCore` calls while preserving existing function names used by v4.
- [ ] **Step 4: Add three obstacle presets** and ensure reset selects a preset that does not overlap starting footprints.
- [ ] **Step 5: Render obstacles below units** and mark blocked cells as non-reachable.
- [ ] **Step 6: Run `node --check game.js combat-v5.js` and all Node tests.**
- [ ] **Step 7: Commit** battle integration.

### Task 5: Large units, attack contact and AI

**Files:**
- Modify: `game.js`
- Modify: `combat-v5.js`
- Modify: `combat-v5.css`
- Modify: `tests/combat-v5-integration.test.js`

**Interfaces:**
- Add one player and one AI large unit with `size:2` and opposing default facings.
- Melee contact uses `BattlefieldCore.footprintsAdjacent`.
- AI candidate attack states are legal `(c,r,facing)` states whose footprints contact the target.

- [ ] **Step 1: Add failing tests** for footprint-based melee adjacency and source-level use of legal large-unit states by AI.
- [ ] **Step 2: Run tests** and verify failure.
- [ ] **Step 3: Add two large test stacks** and update render/hitboxes/active ring to visually cover both occupied hexes.
- [ ] **Step 4: Update melee attack-side selection** to choose legal head/facing states around the target footprint.
- [ ] **Step 5: Update AI approach/attack candidate generation** to use the same legal-state helpers as the player.
- [ ] **Step 6: Run all tests and syntax checks.**
- [ ] **Step 7: Commit** large-unit combat integration.

### Task 6: Morale and luck core mechanics

**Files:**
- Modify: `combat-core.js`
- Create: `tests/combat-v5-random.test.js`

**Interfaces:**
- Produces: `CombatCore.rollMorale(unit,round,rng=Math.random)` returning `'positive' | 'negative' | 'none'`.
- Produces: `CombatCore.consumePositiveMorale(unit,round)`.
- Produces: `CombatCore.rollLuck(unit,rng=Math.random)` returning boolean.
- Produces: `CombatCore.applyLuckDamage(damage,lucky,isSpell=false)`.

- [ ] **Step 1: Write failing deterministic tests** using fixed RNG values for positive morale, negative morale, once-per-round positive morale and lucky x2 physical damage/no spell modification.
- [ ] **Step 2: Run** `node --test tests/combat-v5-random.test.js` and verify failures.
- [ ] **Step 3: Implement minimal morale/luck functions** with exact probability caps from the spec.
- [ ] **Step 4: Run random-mechanics tests** and verify all pass.
- [ ] **Step 5: Run existing Combat v3/v4 tests** to verify no regression.
- [ ] **Step 6: Commit** morale/luck core.

### Task 7: Morale/luck turn-flow and UI integration

**Files:**
- Modify: `combat-v5.js`
- Modify: `combat-v5.css`
- Modify: `game.js`
- Modify: `tests/combat-v5-integration.test.js`

**Interfaces:**
- Units gain `morale`, `luck`, `positiveMoraleRound` and `moraleCheckedActivation` state.
- Beginning an activation can skip a turn for negative morale.
- A completed player/AI action may requeue the same unit once when positive morale triggered.
- Physical `strike` applies luck after normal damage calculation; magic damage remains unchanged.

- [ ] **Step 1: Add failing integration tests** for morale/luck fields and hooks in turn/strike flow.
- [ ] **Step 2: Run tests** and verify failure.
- [ ] **Step 3: Integrate morale checks at activation** with skip behavior and log/visual feedback.
- [ ] **Step 4: Integrate positive morale requeue once per round** after a completed action.
- [ ] **Step 5: Integrate luck into physical attacks only** and add visual/log feedback.
- [ ] **Step 6: Extend unit card** with size, facing, morale and luck.
- [ ] **Step 7: Run all tests and syntax checks.**
- [ ] **Step 8: Commit** morale/luck battle flow.

### Task 8: Final verification, documentation and PR

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documentation lists Combat v5 capabilities and test command.

- [ ] **Step 1: Update README** with 2-hex units, obstacles, morale/luck and module layout.
- [ ] **Step 2: Run fresh full verification:** `node --test tests/*.test.js`, `node --check combat-core.js`, `node --check battlefield-core.js`, `node --check game.js`, `node --check combat-v4.js`, `node --check combat-v5.js`.
- [ ] **Step 3: Compare `combat-v5-battlefield-depth` against `main`** and verify no unrelated files changed.
- [ ] **Step 4: Open one PR** to `main` with exact test evidence.
- [ ] **Step 5: Verify PR mergeability/head SHA and repository CI status.**
- [ ] **Step 6: Merge the PR** using the verified head SHA.
- [ ] **Step 7: Fetch PR metadata** and confirm `merged: true` before reporting completion.
