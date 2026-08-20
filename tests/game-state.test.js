const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('../game-state.js');
test('default state contains seven resources and campaign hero',()=>{const s=G.createDefaultState();assert.deepEqual(Object.keys(s.resources).sort(),['gems','gold','mercury','soulMushrooms','stone','sulfur','wood'].sort());assert.equal(s.hero.name,'Aldren');});
test('owned structures generate daily income exactly from definitions',()=>{const s=G.createDefaultState();s.map.ownedStructureIds=['lumber','soul'];G.dailyIncome(s,[{id:'lumber',produces:{resource:'wood',amount:2}},{id:'soul',produces:{resource:'soulMushrooms',amount:1}}]);assert.equal(s.resources.wood,12);assert.equal(s.resources.soulMushrooms,1);});
test('end day advances calendar and refreshes movement',()=>{const s=G.createDefaultState();s.hero.movement=50;s.calendar={day:7,week:1,month:1};const info=G.endDay(s,[]);assert.deepEqual(s.calendar,{day:1,week:2,month:1});assert.equal(s.hero.movement,s.hero.maxMovement);assert.equal(info.newWeek,true);});
test('save and load preserve partial stack hp',()=>{const mem={v:null,setItem(k,v){this.v=v},getItem(){return this.v},removeItem(){this.v=null}};const s=G.createDefaultState();s.hero.army=[{unitId:'skeleton',count:3,hpPer:10,totalHp:24}];G.save(s,mem);assert.equal(G.load(mem).hero.army[0].totalHp,24);});
test('reset restores default scenario',()=>{const mem={v:'bad',setItem(k,v){this.v=v},getItem(){return this.v},removeItem(){this.v=null}};assert.equal(G.reset(mem).resources.gold,2500);});
