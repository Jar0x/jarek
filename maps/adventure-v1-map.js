(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AdventureV1Map=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const prod=(id,name,x,y,resource,amount,icon)=>({id,type:'resourceStructure',name,x,y,icon,blocksMovement:false,produces:{resource,amount},owner:'neutral'});
const pile=(id,name,x,y,resource,amount,icon)=>({id,type:'resource',name,x,y,icon,resource,amount,blocksMovement:false});
function createMap(){const width=32,height=32,tiles=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++){let terrain='grass';if(x>18&&y<14)terrain='rock';if(x<13&&y<10)terrain='swamp';if(x>23&&y>20)terrain='sand';if(y<4)terrain='snow';const road=(Math.abs(x-10)<=1&&y>=8&&y<=26)||(Math.abs(y-16)<=1&&x>=5&&x<=25)?'dirt':null;tiles.push({x,y,terrain,road,blocked:false});}
const objects=[
 {id:'castle-haven',type:'town',name:'Forteca Świtu',faction:'castle',x:5,y:25,icon:'🏰',owner:'player',blocksMovement:false},
 {id:'necropolis-morrow',type:'town',name:'Nekropolia Morrow',faction:'necropolis',x:9,y:6,icon:'🏚️',owner:'player',blocksMovement:false},
 prod('quarry-east','Kamieniołom',15,18,'stone',2,'🪨'),prod('sawmill-west','Tartak',8,20,'wood',2,'🪵'),prod('mercury-vat','Alchemiczna Cysterna',12,9,'mercury',1,'⚗️'),prod('sulfur-pit','Kopalnia Siarki',19,13,'sulfur',1,'🟡'),prod('gem-mine','Kopalnia Klejnotów',27,17,'gems',1,'💎'),Object.assign(prod('gold-mine-main','Opuszczona Kopalnia Złota',24,8,'gold',1000,'⛏️'),{guardedBy:'guard-gold-mine'}),prod('soul-grove','Gaj Grzybów Dusz',6,8,'soulMushrooms',1,'🍄'),
 pile('stone-pile','Kamienie',7,23,'stone',5,'🪨'),pile('wood-pile','Drewno',10,22,'wood',5,'🪵'),pile('mercury-pile','Rtęć',13,12,'mercury',3,'⚗️'),pile('sulfur-pile','Siarka',18,16,'sulfur',3,'🟡'),pile('gems-pile','Klejnoty',21,17,'gems',3,'💎'),pile('gold-pile','Złoto',11,19,'gold',1000,'🪙'),pile('soul-pile','Grzyby Dusz',7,10,'soulMushrooms',3,'🍄'),
 {id:'chest-swamp',type:'chest',name:'Stara Skrzynia',x:4,y:7,icon:'📦',blocksMovement:false},
 {id:'chest-road',type:'chest',name:'Kupiecka Skrzynia',x:16,y:15,icon:'📦',blocksMovement:false},
 {id:'guard-shortcut',type:'neutralArmy',name:'Strażnicy Traktu',x:13,y:16,icon:'⚔️',xpReward:550,blocksMovement:true,army:[{unitId:'skeleton',name:'Szkielet',type:'skeleton',count:12,hpPer:10,totalHp:120,minDmg:2,maxDmg:4,speed:5,attack:5,defense:4,size:1}]},
 {id:'guard-swamp',type:'neutralArmy',name:'Bagienne Widma',x:8,y:11,icon:'👻',xpReward:700,blocksMovement:true,army:[{unitId:'tombGuard',name:'Strażnik Grobowca',type:'skeleton',variant:'guard',count:8,hpPer:24,totalHp:192,minDmg:4,maxDmg:6,speed:4,attack:7,defense:9,size:1}]},
 {id:'guard-gold-mine',type:'neutralArmy',name:'Strażnicy Kopalni',x:23,y:9,icon:'💀',xpReward:1200,guards:'gold-mine-main',blocksMovement:true,army:[{unitId:'phantomRider',name:'Widmowy Jeździec',type:'skeleton',count:6,hpPer:38,totalHp:228,minDmg:6,maxDmg:9,speed:8,attack:10,defense:8,size:2,facing:'left',mounted:true},{unitId:'boneArcher',name:'Kościany Łucznik',type:'skeleton',variant:'archer',count:10,hpPer:8,totalHp:80,minDmg:2,maxDmg:3,speed:6,attack:6,defense:3,size:1,ranged:true,shots:8,maxShots:8}]},
 {id:'sealed-gate',type:'landmark',name:'Zamknięta Brama',x:29,y:5,icon:'🚪',blocksMovement:true}
];return{width,height,tiles,objects};}
return{createMap};
});
