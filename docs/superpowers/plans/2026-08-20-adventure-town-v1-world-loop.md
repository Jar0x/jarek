# Adventure + Town v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować grywalną pętlę mapa przygody → ekonomia → dwa miasta → rekrutacja → Combat v5 → powrót na mapę z trwałym stanem.

**Architecture:** Czyste moduły `adventure-core.js`, `game-state.js` i `town-core.js` odpowiadają za logikę i są testowalne w Node. `adventure.js` i `town.js` są cienkimi kontrolerami DOM. `battle-bridge.js` łączy trwały stan Adventure z istniejącym Combat v5 bez usuwania samodzielnego trybu demonstracyjnego walki.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, CommonJS/UMD dla modułów logiki, Node.js `node:test`, `localStorage` w przeglądarce.

**Spec:** `docs/superpowers/specs/2026-08-20-adventure-v1-world-loop-design.md`, `docs/superpowers/specs/2026-08-20-adventure-v1-economy-addendum.md`, `docs/superpowers/specs/2026-08-20-town-v1-castle-necropolis-design.md`

## Global Constraints
- Adventure Map ma 32 × 32 kwadratowe kafelki i ruch bohatera w 8 kierunkach.
- Wszystkie 7 zasobów istnieje od początku: Kamień, Drewno, Rtęć, Siarka, Klejnoty, Złoto, Grzyby Dusz.
- Przejęte struktury produkują zasoby codziennie.
- Town v1 zawiera dokładnie dwie frakcje: Zamek i Nekropolię.
- Pierwsza grywalna wersja rekrutuje poziomy 1–4; poziomy 5–7 są zapisane w danych.
- Paladyn Zamku jest poziomem 7, `size: 2`, `mounted: true`.
- Arcymag Nekromancji jest poziomem 7 Nekropolii.
- Combat v3/v4/v5 musi nadal działać bez aktywnej kampanii.
- Nie kopiujemy grafik ani UI Heroes III 1:1.

---

### Task 1: Adventure movement core

**Files:**
- Create: `adventure-core.js`
- Test: `tests/adventure-core.test.js`

**Interfaces:**
- Produces: `AdventureCore.stepCost(from,to,tile)`, `neighbors(x,y,width,height)`, `findPath(map,start,goal,blockers)`, `splitPathByMovement(path,map,movement)`, `advanceCalendar(calendar)`, `visibleTiles(x,y,width,height,radius)`.

- [ ] **Step 1: Write failing movement/pathfinding tests** for straight=100, diagonal=141, terrain multipliers, road overrides, blocker avoidance, no diagonal corner cutting, cheaper-road route, calendar rollover and visibility radius.
- [ ] **Step 2: Run** `node --test tests/adventure-core.test.js` and confirm RED because module/functions do not exist.
- [ ] **Step 3: Implement minimal UMD/CommonJS module** with weighted A* and deterministic helpers.
- [ ] **Step 4: Run** `node --test tests/adventure-core.test.js`; expected all PASS.
- [ ] **Step 5: Commit** `feat: add adventure movement core`.

### Task 2: Persistent game state and seven-resource economy

**Files:**
- Create: `game-state.js`
- Test: `tests/game-state.test.js`

**Interfaces:**
- Produces: `GameState.createDefaultState()`, `normalizeState(state)`, `dailyIncome(state, mapObjects)`, `endDay(state,mapObjects)`, `save(state,storage)`, `load(storage)`, `reset(storage)`.

- [ ] **Step 1: Write failing tests** asserting seven resource keys, starting resources, owned resource structure income, calendar/day income exactly once, army partial HP persistence and reset behavior.
- [ ] **Step 2: Run** `node --test tests/game-state.test.js`; expected RED.
- [ ] **Step 3: Implement state schema** with `resources`, `hero`, `map`, `towns`, `pendingBattle`, `lastBattleResult`, versioned normalization and storage injection for Node tests.
- [ ] **Step 4: Run** `node --test tests/game-state.test.js`; expected PASS.
- [ ] **Step 5: Commit** `feat: add persistent seven-resource game state`.

### Task 3: Town data and rules

**Files:**
- Create: `town-core.js`
- Test: `tests/town-core.test.js`

**Interfaces:**
- Produces: `TownCore.FACTIONS`, `TownCore.UNITS`, `TownCore.canBuild`, `TownCore.build`, `TownCore.applyWeeklyGrowth`, `TownCore.canRecruit`, `TownCore.recruit`, `TownCore.transferStack`, `TownCore.applyNecromancy`.

- [ ] **Step 1: Write failing tests** for Castle/Necropolis unit trees, Paladin `size:2 mounted:true`, Necromancer Archmage tier 7, one build/day, prerequisite/resource validation, weekly accumulation, recruitment payment, stack merging and necromancy Soul Mushroom cap.
- [ ] **Step 2: Run** `node --test tests/town-core.test.js`; expected RED.
- [ ] **Step 3: Implement faction/building/unit data** plus pure mutation helpers returning `{ok, reason}` where an action can fail.
- [ ] **Step 4: Run** `node --test tests/town-core.test.js`; expected PASS.
- [ ] **Step 5: Commit** `feat: add Castle and Necropolis town rules`.

### Task 4: Deterministic Adventure scenario map

**Files:**
- Create: `maps/adventure-v1-map.js`
- Test: `tests/adventure-map.test.js`

**Interfaces:**
- Produces: `AdventureV1Map.createMap()` returning `{width:32,height:32,tiles,objects}`.

- [ ] **Step 1: Write failing tests** for 32×32 map, hero-safe spawn, seven resource pickup types, seven capturable resource structures, 3 neutral armies, `castle-haven`, `necropolis-morrow`, protected `gold-mine-main` and traversable route to scenario objective.
- [ ] **Step 2: Run** `node --test tests/adventure-map.test.js`; expected RED.
- [ ] **Step 3: Implement authored map data** with roads, swamp/rock zones, pickups, towns, mines and blockers.
- [ ] **Step 4: Run** map tests; expected PASS.
- [ ] **Step 5: Commit** `feat: add Adventure v1 scenario map`.

### Task 5: Adventure UI

**Files:**
- Create: `adventure.html`
- Create: `adventure.css`
- Create: `adventure.js`

**Interfaces:**
- Consumes: `AdventureCore`, `GameState`, `AdventureV1Map`.
- Produces: interactive map entry point.

- [ ] **Step 1: Add static DOM smoke assertions** in `tests/adventure-ui.test.js` checking resource HUD ids for all seven resources, map viewport, hero panel, army slots, minimap and end-day control.
- [ ] **Step 2: Run UI smoke test; expected RED.**
- [ ] **Step 3: Implement HUD and map rendering** with 48px tiles, viewport camera, fog states, route preview, double-click/same-target confirmation movement, resource pickup, mine capture, town opening, chest choice and end-day income.
- [ ] **Step 4: Run UI smoke test and all core tests; expected PASS.**
- [ ] **Step 5: Commit** `feat: add Adventure map interface`.

### Task 6: Town UI

**Files:**
- Create: `town.html`
- Create: `town.css`
- Create: `town.js`
- Test: `tests/town-ui.test.js`

**Interfaces:**
- Consumes: `GameState`, `TownCore`.
- Produces: `town.html?town=<id>`.

- [ ] **Step 1: Write static smoke tests** for seven-resource bar, buildings view, recruitment panel, 7 hero slots, 7 garrison slots and back button.
- [ ] **Step 2: Run; expected RED.**
- [ ] **Step 3: Implement town renderer** with faction-specific theme, build buttons, prerequisite/cost display, recruit controls and whole-stack hero↔garrison transfer.
- [ ] **Step 4: Run tests; expected PASS.**
- [ ] **Step 5: Commit** `feat: add Castle and Necropolis town screens`.

### Task 7: Battle bridge and campaign combat integration

**Files:**
- Create: `battle-bridge.js`
- Modify: `index.html`
- Modify: `game.js`
- Modify: `combat-v4.js`
- Modify: `combat-v5.js`
- Test: `tests/battle-bridge.test.js`

**Interfaces:**
- Produces: `BattleBridge.getBattleSetup(state)`, `startBattle(state,battleSpec)`, `recordResult(state,result)`, `consumeAdventureResult(state)`.

- [ ] **Step 1: Write failing bridge tests** for campaign army injection, surviving stack persistence including partial HP, victory XP exactly once, neutral army defeat removal, loss state, and demo combat fallback.
- [ ] **Step 2: Run; expected RED.**
- [ ] **Step 3: Implement bridge** and make Combat initialization read bridge setup when `pendingBattle` exists while preserving existing defaults otherwise.
- [ ] **Step 4: Hook battle finish** to persist outcome and navigate back to `adventure.html` for campaign battles.
- [ ] **Step 5: Run bridge + all Combat tests; expected PASS.**
- [ ] **Step 6: Commit** `feat: connect Adventure campaign to Combat v5`.

### Task 8: Weekly growth, town income and Necropolis post-battle loop

**Files:**
- Modify: `game-state.js`
- Modify: `town-core.js`
- Modify: `adventure.js`
- Modify: `battle-bridge.js`
- Test: `tests/campaign-loop.test.js`

**Interfaces:**
- Consumes previous modules.

- [ ] **Step 1: Write failing integration tests** for new-week growth in built dwellings, town hall daily gold income, Soul Mycelium daily Soul Mushroom income, and Necropolis victory creating Skeletons subject to Soul Mushroom cap.
- [ ] **Step 2: Run; expected RED.**
- [ ] **Step 3: Implement calendar hooks** exactly once per day/week.
- [ ] **Step 4: Run all tests; expected PASS.**
- [ ] **Step 5: Commit** `feat: complete Adventure Town campaign loop`.

### Task 9: Documentation and final regression verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document entry points** `adventure.html`, `town.html`, `index.html`, seven resources, two factions and test command.
- [ ] **Step 2: Run** `node --test tests/*.test.js`; expected 0 failures.
- [ ] **Step 3: Run** `node --check adventure-core.js game-state.js town-core.js adventure.js town.js battle-bridge.js game.js combat-v4.js combat-v5.js`; expected no syntax errors.
- [ ] **Step 4: Compare branch with `main`** and confirm no unrelated changes.
- [ ] **Step 5: Commit** `docs: document Adventure and Town v1`.
