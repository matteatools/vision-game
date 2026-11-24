(function(root){
'use strict';
const COUNT=20, GACHA_COST=10, DUPLICATE_REFUND=3;
const SAVE_VERSION=9;
const COMBO_TRIGGER=5,ULTIMATE_GACHA_CHANCE=.02;
const SLOT_LABELS=Object.freeze(['いつも','5コンボ','10コンボ']);
const GACHA_SLOT_CHANCES=Object.freeze([.49,.49,ULTIMATE_GACHA_CHANCE]);
const normalEnemies=[
 {name:'プルキング',type:'ぷるぷる おうさま',file:'slime'},
 {name:'グルミイラ',type:'ほうたい ぐるぐる',file:'mummy'},
 {name:'タコせんちょう',type:'うみの かいぞく',file:'octopus'},
 {name:'フランケン',type:'つぎはぎ パワー',file:'franken'},
 {name:'ガチャロボ',type:'わんぱく ロボ',file:'robot'},
 {name:'ドスゴン',type:'どっしり かいじゅう',file:'kaiju'},
 {name:'コオリゴン',type:'こおりの ゴーレム',file:'ice'},
 {name:'ヤツマタ',type:'やまたの だいじゃ',file:'orochi'},
 {name:'ライデンバード',type:'いなずまの とり',file:'thunder'},
 {name:'メラレオン',type:'ほのおの ライオン',file:'lion'}
];
const enemies=Object.freeze([
 ...normalEnemies.map(e=>Object.freeze({...e,id:e.file})),
 ...normalEnemies.map(e=>Object.freeze({...e,id:e.file+'-awaken',name:'かくせい '+e.name,type:'うらステージ・パワーアップ',powered:true}))
]);
const COURSE_IDS=Object.freeze(['add-basic','add-carry','sub-basic','sub-borrow','multiply']);
const DEFAULT_COURSE='sub-borrow', SHIELD_POWER=Object.freeze([2,3,4,5]);
const HERO_CLEAR_COUNT=10;
const heroes=Object.freeze([
 ['red','レッド','assets/command/ranger-red-action.webp',null],
 ['blue','ブルー','assets/command/ranger-blue-scout.webp',null],
 ['yellow','イエロー','assets/command/ranger-yellow-boost.webp',null],
 ['green','グリーン','assets/command/ranger-green-guard.webp',null],
 ['pink','ピンク','assets/command/ranger-pink-star.webp',null],
 ['orange','オレンジ','assets/roster/ranger-orange.webp','add-basic'],
 ['violet','バイオレット','assets/roster/ranger-violet.webp','add-carry'],
 ['cyan','シアン','assets/roster/ranger-cyan.webp','sub-basic'],
 ['black','ブラック','assets/roster/ranger-black.webp','sub-borrow'],
 ['silver','シルバー','assets/roster/ranger-silver.webp','multiply']
].map(([id,name,image,course])=>Object.freeze({id,name,image,course})));
const rarities=Object.freeze([
 Object.freeze({id:'normal',name:'ノーマル',weight:65,color:'#59c9bc'}),
 Object.freeze({id:'rare',name:'レア',weight:28,color:'#b29cff'}),
 Object.freeze({id:'legend',name:'レジェンド',weight:7,color:'#ffce69'})
]);
// One family per visual technique. Color variants share its name, sound and animation.
const palettes=Object.freeze([
 ['red','レッド','#f05261','#ffe8cb','add-basic',false],
 ['yellow','イエロー','#edbc39','#fff7cb','add-carry',false],
 ['blue','ブルー','#409ef0','#dff7ff','sub-basic',false],
 ['green','グリーン','#43c98e','#edffda','sub-borrow',false],
 ['pink','ピンク','#f280b6','#fff0fa','multiply',false],
 ['orange','オレンジ','#ff923f','#fff0b0','add-basic',true],
 ['violet','バイオレット','#a38bea','#f4e7ff','add-carry',true],
 ['cyan','シアン','#55dbe9','#edffff','sub-basic',true],
 ['black','ブラック','#47546e','#e5d6ff','sub-borrow',true],
 ['silver','シルバー','#b7cce0','#fff6dc','multiply',true]
].map(([id,name,color,accent,course,back])=>Object.freeze({id,name,color,accent,course,back})));
const familySeeds=[
 ['hero-punch','ヒーローパンチ','punch','normal','cool','まっすぐ、ドン！ ヒーローのだいいっぽ。','hero-punch',null],
 ['slime','ぷるぷるスライム','slime','normal','fun','ぷるんと はねて、スライムアタック！','slime','slime'],
 ['bandage','ぐるぐるほうたい','bandage','normal','cool','ほうたいが まわって、ぐるぐる つかまえる！','mummy','mummy'],
 ['ink','スミスプラッシュ','ink','normal','fun','タコの スミを、いっきに びしゃーっ！','octopus','octopus'],
 ['volt','ビリビリパンチ','volt','rare','cool','でんげきを こぶしに あつめて、ドカン！','franken','franken'],
 ['beam','てんせんレーザー','beam','rare','cool','ロボの ひかりが、そらまで つらぬく！','robot','robot'],
 ['dragon','ぐれんドラゴン','dragon','rare','cool','かいじゅうの ちからで、りゅうを はなつ！','kaiju','kaiju'],
 ['ice','クリスタルランス','ice','rare','cool','こおりの かけらが、するどい やりになる。','ice','ice'],
 ['hydra','ヤツマタファング','hydra','legend','cool','やっつの へびが、いっせいに とびかかる！','orochi','orochi'],
 ['thunder','ライデンウイング','thunder','legend','cool','とりの つばさから、いなずまが はしる！','franken-awaken','thunder'],
 ['flame','メラメラファング','flame','legend','cool','ライオンの ほのおの キバが、もえあがる！','kaiju-awaken','lion'],
 ['void','こくうブラックホール','void','rare','cool','ちいさな やみが、ひかりまで のみこむ。','orochi',null],
 ['pudding','ぷるぷるプリンおとし','pudding','normal','fun','おいしそう。でも、よけられない！','slime',null],
 ['fan','ハリセンひゃくれつ','fan','normal','fun','あんざんヒーロー、ぜんりょくの ツッコミ。','mummy',null],
 ['slash','クロススラッシュ','slash','normal','cool','ふたつの きりわざが、そらで まじわる。','lion',null],
 ['cat','ねこねこりゅうせいぐん','cat','normal','fun','そらから ねこが、にゃん・にゃん・にゃん！','octopus',null],
 ['rice','おにぎりメテオ','rice','normal','fun','おなかも、あいても、びっくりする ながれぼし。','thunder',null],
 ['meteor','ほしふるメテオ','meteor','normal','cool','ながれぼしが、まっすぐ とびこむ！','kaiju',null],
 ['sword','せいけんエクスカリバー','sword','rare','cool','ひかりの つるぎが、そらを きりひらく。','lion',null],
 ['shuriken','かげぬいシュリケン','shuriken','normal','cool','にんじゃの ひかりが、かぜを きる。','lion',null],
 ['spear','しおかぜトライデント','spear','rare','cool','うみの ちからで、いっきに つらぬく。','ice',null],
 ['chain','ふういんチェーン','chain','normal','cool','ひかりの くさりで、つかまえる！','franken',null],
 ['tornado','しっぷうサイクロン','tornado','normal','cool','かぜを あつめて、たつまきアタック！','orochi',null],
 ['phoenix','あかつきフェニックス','phoenix','rare','cool','ほのおの とりが、つばさを ひろげる。','kaiju',null],
 ['rose','ローズガーデン','rose','normal','cool','バラの はなびらが、するどく まう。','lion',null],
 ['hammer','ピコピコハンマー','hammer','normal','fun','ピコッ！と たたいて、びっくりさせる。','mummy',null],
 ['rocket','えんぴつロケット','rocket','normal','fun','えんぴつ、はっしゃ！ そらまで かこう。','robot',null],
 ['banana','バナナスリップ','banana','normal','fun','つるん！と すべる、ひみつの バナナ。','slime',null],
 ['donut','ドーナツワープ','donut','legend','fun','あなの むこうは、おやつの うちゅう！','orochi-awaken',null],
 ['fish','おさかなスプラッシュ','fish','normal','fun','ピチピチ はねて、みずしぶき！','octopus',null],
 ['dice','ころころラッキーダイス','dice','rare','fun','さいころ コロコロ、なにが でるかな？','mummy',null],
 ['clock','ときのクロノバースト','clock','legend','cool','とけいの はりが、ひかりに かわる。','ice-awaken',null],
 ['hero-rush','ヒーローラッシュ','rush','normal','cool','れんぞくパンチで、いっきに たたみかける！','hero-punch',null]
];
// Broad blasts, summoned creatures and multi-hit showers belong to the fifth hit.
// Enemy gifts split 5 / 5; both roles retain cool and funny gacha techniques.
const comboFamilyIds=new Set(['hero-rush','beam','dragon','hydra','thunder','flame','void','cat','rice','meteor','sword','spear','tornado','phoenix','dice','clock']);
const regularFamilies=Object.freeze(familySeeds.map(([id,name,kind,rarity,style,description,sound,enemy])=>Object.freeze({id,name,kind,rarity,style,description,sound,enemy,slot:comboFamilyIds.has(id)?1:0,starter:id==='hero-punch'||id==='hero-rush',ultimate:false})));
const ultimateSeeds=[
 ['hero-finale','ヒーロー・ビッグバン','hero','starter',null,false,'#ffd369','#fff5d7','robot-awaken','ヒーローの ちからを あつめて、さいごの いちげき！'],
 ['omega-cannon','オメガ・ゼロバスター','cannon','gacha',null,false,'#94dfff','#f5fdff','robot-awaken','ひかりの ほうげきが、そらを つらぬく。'],
 ['galaxy-requiem','ギャラクシー・レクイエム','galaxy','gacha',null,false,'#b487ff','#fff0c9','orochi-awaken','ほしが めぐり、ぎんがの ちからが はじける。'],
 ['solar-phoenix','ソーラー・フェニックス','phoenix','vision','add-basic',false,'#ff7a45','#fff1ab','kaiju-awaken','たいようの つばさで、そらいっぱいに はばたく！'],
 ['eclipse-nova','エクリプス・ノヴァ','eclipse','vision','add-basic',true,'#ffb64f','#fff1cf','orochi-awaken','たいようと つきが かさなり、ひかりが あふれる。'],
 ['sacred-sword','セイクリッド・エクスカリバー','sword','vision','add-carry',false,'#f3cb51','#fffbdc','lion-awaken','せいなる つるぎが、おおきく そらを きりひらく。'],
 ['infinite-blades','インフィニティ・ブレイド','blades','vision','add-carry',true,'#ad88ff','#f7e9ff','lion-awaken','むげんの つるぎが、ひとつの ひかりに あつまる。'],
 ['absolute-freeze','アブソリュート・フリーズ','freeze','vision','sub-basic',false,'#71c5ff','#f0feff','ice-awaken','こおりの けっしょうが、せかいを つつみこむ。'],
 ['tempest-leviathan','テンペスト・リヴァイアサン','sea','vision','sub-basic',true,'#4de2e8','#deffff','ice-awaken','うみの りゅうが、おおなみと ともに あらわれる。'],
 ['rising-dragoon','ライジング・ドラグーン','dragon','vision','sub-borrow',false,'#69df94','#ffffca','kaiju-awaken','ひかりの りゅうが、そらたかく かけのぼる！'],
 ['chaos-judgment','カオス・ジャッジメント','judgment','vision','sub-borrow',true,'#9d8ac9','#fff2bd','franken-awaken','かみなりの おうかんが、そらから ふりそそぐ。'],
 ['starlight-arrow','スターライト・アロー','archer','vision','multiply',false,'#ff89bd','#fff2fc','thunder-awaken','ほしの ゆみから、ひかりの やが そらを かける！'],
 ['metal-breaker','メタル・ブレイカー','titan','vision','multiply',true,'#c9e1fa','#ffffff','robot-awaken','きょだいな ヒーローロボの、さいきょうパンチ！']
];
const finisherFamilies=Object.freeze(ultimateSeeds.map(([id,name,ultimateKind,source,course,back,color,accent,sound,description])=>Object.freeze({id,name,kind:'ultimate',ultimateKind,source,course,back,color,accent,sound,description,slot:2,rarity:'ultimate',style:'cool',enemy:null,starter:source==='starter',ultimate:true})));
const slotCatalogs=Object.freeze([Object.freeze(regularFamilies.filter(f=>f.slot===0)),Object.freeze(regularFamilies.filter(f=>f.slot===1)),finisherFamilies]);
function familiesForSlot(slot){return slotCatalogs[slot]||[];}
const families=Object.freeze([...regularFamilies,...finisherFamilies]);
const baseEffect=Object.freeze({...regularFamilies[0],familyId:'hero-punch',paletteId:'base',colorName:'ノーマル',color:'#ffb45d',accent:'#fff5d5',awakened:false});
const comboEffect=Object.freeze({...regularFamilies.find(f=>f.id==='hero-rush'),familyId:'hero-rush',paletteId:'base',colorName:'ヒーロー',color:'#ffc256',accent:'#fff5d6',awakened:false});
const regularEffects=Object.freeze([baseEffect,comboEffect,...regularFamilies.filter(f=>!f.starter).flatMap(f=>palettes.map(p=>Object.freeze({...f,id:f.id+'@'+p.id,familyId:f.id,paletteId:p.id,colorName:p.name,color:p.color,accent:p.accent,awakened:false})))]);
const finisherEffects=Object.freeze(finisherFamilies.flatMap(f=>{
 if(f.source==='gacha')return palettes.map(p=>Object.freeze({...f,id:f.id+'@'+p.id,familyId:f.id,paletteId:p.id,colorName:p.name,color:p.color,accent:p.accent,awakened:false}));
 const palette=palettes.find(p=>p.course===f.course&&p.back===f.back);
 return [Object.freeze({...f,familyId:f.id,paletteId:palette?.id||'base',colorName:palette?.name||'ヒーロー',awakened:false})];
}));
const effects=Object.freeze([...regularEffects,...finisherEffects]);
const effectById=new Map(effects.map(e=>[e.id,e]));
const familyById=new Map(families.map(f=>[f.id,f]));
const gachaFamilies=Object.freeze(regularFamilies.filter(f=>!f.starter));
const gachaFinishers=Object.freeze(finisherFamilies.filter(f=>f.source==='gacha'));
const gachaEffects=Object.freeze(effects.filter(e=>!e.starter&&(!e.ultimate||e.source==='gacha')));
const DEFAULT_EQUIPMENT=Object.freeze(['hero-punch','hero-rush','hero-finale']);
const STARTER_EFFECTS=DEFAULT_EQUIPMENT;
function comboSlot(combo){return combo>=10?2:combo===COMBO_TRIGGER?1:0;}
function slotAccepts(effect,slot){return !!effect&&Number.isInteger(slot)&&slot>=0&&slot<3&&effect.slot===slot;}
const validCourse=id=>COURSE_IDS.includes(id)?id:DEFAULT_COURSE;
const validEnemy=n=>Number.isInteger(n)&&n>=0&&n<COUNT;
function paletteForCourse(course,back=false){return palettes.find(p=>p.course===validCourse(course)&&p.back===!!back);}
function familyVariants(id){return effects.filter(e=>e.familyId===id);}
function firstClearEffect(index,course=DEFAULT_COURSE){
 if(!validEnemy(index))return null;
 const family=regularFamilies.find(f=>f.enemy===enemies[index].file);
 return effectById.get(family.id+'@'+paletteForCourse(course,index>=10).id);
}
function effectLabel(effect){return effect.starter?effect.name:effect.name+'・'+effect.colorName;}
function validIds(raw){return Array.isArray(raw)?[...new Set(raw.filter(id=>effectById.has(id)))]:[];}
function validEventId(id){return typeof id==='string'&&id.length>0&&id.length<=120;}
function uniqueEvents(raw,valid){
 const map=new Map();
 if(Array.isArray(raw))for(const event of raw)if(event&&validEventId(event.id)&&valid(event)&&!map.has(event.id))map.set(event.id,event);
 return [...map.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function equippedEffects(owned,ids){
 const available=new Map(owned.map(e=>[e.id,e]));
 return DEFAULT_EQUIPMENT.map((fallback,slot)=>{
  const chosen=Array.isArray(ids)?available.get(ids[slot]):null;
  return slotAccepts(chosen,slot)?chosen:effectById.get(fallback);
 });
}
function effectForCombo(raw,combo){return equippedEffects(ownedEffects(raw),collectionProgress(raw).equippedEffectIds)[comboSlot(combo)];}
function visionCount(raw,course,back=false){return courseProgress(raw,course).visionDefeated.filter(n=>back?n>=10:n<10).length;}
function visionFinisherUnlocked(courses,family){return family.source==='vision'&&courses[family.course].visionDefeated.filter(n=>family.back?n>=10:n<10).length===10;}

function winPower(shields,difficulty){return Number.isInteger(shields)&&shields>=1&&shields<=5&&Number.isInteger(difficulty)&&difficulty>=0&&difficulty<4?shields*SHIELD_POWER[difficulty]:0;}
function cleanCourse(raw){
 raw=raw&&typeof raw==='object'?raw:{};
 const wins=uniqueEvents(raw.wins,w=>validEnemy(w.enemy)&&winPower(w.shields,w.difficulty)>0).map(w=>({id:w.id,enemy:w.enemy,shields:w.shields,difficulty:w.difficulty,mode:w.mode==='vision'?'vision':'normal'}));
 const defeated=[...new Set([...(Array.isArray(raw.defeated)?raw.defeated.filter(validEnemy):[]),...wins.map(w=>w.enemy)])].sort((a,b)=>a-b);
 let clearedPrefix=0;while(defeated.includes(clearedPrefix))clearedPrefix++;
 const visionDefeated=[...new Set([...(Array.isArray(raw.visionDefeated)?raw.visionDefeated.filter(validEnemy):[]),...wins.filter(w=>w.mode==='vision').map(w=>w.enemy)])].filter(n=>defeated.includes(n)).sort((a,b)=>a-b);
 return {unlocked:Math.min(COUNT,Math.max(Number.isInteger(raw.unlocked)?raw.unlocked:1,clearedPrefix+1)),defeated,visionDefeated,wins};
}
function cleanProgress(raw){
 // Keep all shared collections. Version 5 wins have no input-mode
 // evidence, so they count as normal clears, never as vision-only achievements.
 raw=raw&&[5,6,7,8,SAVE_VERSION].includes(raw.version)?raw:{};
 const courses=Object.fromEntries(COURSE_IDS.map(id=>[id,cleanCourse(raw.courses?.[id])]));
 const collection=raw.collection&&typeof raw.collection==='object'?raw.collection:{};
 // Keep the former starter in old collections; only its default slot changes.
 const upgradingStarter=raw.version===5||raw.version===6;
 const bonusEffectIds=validIds([...(Array.isArray(collection.bonusEffectIds)?collection.bonusEffectIds:[]),...(upgradingStarter?['slash@blue']:[])]);
 const owned=new Set([...STARTER_EFFECTS,...bonusEffectIds]);
 const coopWins=uniqueEvents(collection.coopWins,()=>true).map(w=>({id:w.id}));
 let heroPower=coopWins.length*10;
 for(const course of COURSE_IDS){
  for(const enemy of courses[course].defeated)owned.add(firstClearEffect(enemy,course).id);
  heroPower+=courses[course].wins.reduce((sum,w)=>sum+winPower(w.shields,w.difficulty),0);
 }
 for(const family of finisherFamilies)if(visionFinisherUnlocked(courses,family))owned.add(family.id);
 const draws=[];
 for(const d of uniqueEvents(collection.draws,d=>gachaEffects.some(e=>e.id===d.effectId))){
  if(heroPower<GACHA_COST)continue;
  const duplicate=d.duplicate===true;
  heroPower-=GACHA_COST-(duplicate?DUPLICATE_REFUND:0);
  owned.add(d.effectId);draws.push({id:d.id,effectId:d.effectId,duplicate});
 }
 const equipped=Array.isArray(collection.equippedEffectIds)?collection.equippedEffectIds.slice():DEFAULT_EQUIPMENT;
 if(upgradingStarter&&equipped[1]==='slash@blue')equipped[1]='hero-rush';
 if([5,6,7].includes(raw.version)){
  // Keep valid choices in place. If the old first two choices fit the opposite
  // roles, move them there once; all collected colors remain owned either way.
  const previous=equipped.slice();
  for(const slot of [0,1]){
   if(slotAccepts(effectById.get(previous[slot]),slot))continue;
   const other=effectById.get(previous[1-slot]);
   equipped[slot]=other&&owned.has(other.id)&&slotAccepts(other,slot)?other.id:DEFAULT_EQUIPMENT[slot];
  }
 }
 return {version:SAVE_VERSION,mode:raw.mode==='vision'?'vision':'normal',activeCourse:validCourse(raw.activeCourse),courses,
  collection:{bonusEffectIds,draws,coopWins,heroPower,effectIds:[...owned],equippedEffectIds:equippedEffects(effects.filter(e=>owned.has(e.id)),equipped).map(e=>e.id)}};
}
function courseProgress(raw,course){return cleanProgress(raw).courses[validCourse(course)];}
function collectionProgress(raw){return cleanProgress(raw).collection;}
function heroRoster(raw){
 const p=cleanProgress(raw);
 return heroes.map(hero=>{const cleared=hero.course?p.courses[hero.course].defeated.filter(n=>n<HERO_CLEAR_COUNT).length:HERO_CLEAR_COUNT;return {...hero,cleared,joined:cleared===HERO_CLEAR_COUNT};});
}
function mergeProgress(current,stored){
 const a=cleanProgress(current),b=cleanProgress(stored);
 for(const id of COURSE_IDS){const x=a.courses[id],y=b.courses[id];a.courses[id]={unlocked:Math.max(x.unlocked,y.unlocked),defeated:[...x.defeated,...y.defeated],visionDefeated:[...x.visionDefeated,...y.visionDefeated],wins:[...x.wins,...y.wins]};}
 a.collection.bonusEffectIds=[...a.collection.bonusEffectIds,...b.collection.bonusEffectIds];
 a.collection.draws=[...a.collection.draws,...b.collection.draws];
 a.collection.coopWins=[...a.collection.coopWins,...b.collection.coopWins];
 return cleanProgress(a);
}
function setEquipment(raw,ids){
 const p=cleanProgress(raw);p.collection.equippedEffectIds=Array.isArray(ids)?ids.slice(0,3):DEFAULT_EQUIPMENT;return cleanProgress(p);
}
function awardVictory(raw,course,battle,{allowLocked=false}={}){
 const p=cleanProgress(raw),id=validCourse(course),c=p.courses[id],collection=p.collection;
 if(!battle||!validEventId(battle.id)||!validEnemy(battle.enemy)||!winPower(battle.shields,battle.difficulty)||(!allowLocked&&battle.enemy>=c.unlocked)||COURSE_IDS.some(key=>p.courses[key].wins.some(w=>w.id===battle.id)))return {progress:p,reward:null};
 const firstClear=!c.defeated.includes(battle.enemy),effect=firstClear?firstClearEffect(battle.enemy,id):null;
 const joinedBefore=new Set(heroRoster(p).filter(h=>h.joined).map(h=>h.id));
 const duplicate=!!effect&&collection.effectIds.includes(effect.id);
 const autoEquipped=false;
 c.wins.push({id:battle.id,enemy:battle.enemy,shields:battle.shields,difficulty:battle.difficulty,mode:battle.mode==='vision'?'vision':'normal'});
 if(autoEquipped)collection.equippedEffectIds.push(effect.id);
 const next=cleanProgress(p),hero=heroRoster(next).find(h=>h.joined&&!joinedBefore.has(h.id))||null;
 const finishers=finisherEffects.filter(e=>e.source==='vision'&&!collection.effectIds.includes(e.id)&&next.collection.effectIds.includes(e.id));
 return {progress:next,reward:{power:winPower(battle.shields,battle.difficulty),shields:battle.shields,multiplier:SHIELD_POWER[battle.difficulty],firstClear,effect,duplicate,autoEquipped,hero,finishers}};
}
function ownedEffects(raw){const owned=new Set(collectionProgress(raw).effectIds);return effects.filter(e=>owned.has(e.id));}
function remainingGachaEffects(raw){const owned=new Set(collectionProgress(raw).effectIds);return gachaEffects.filter(e=>!owned.has(e.id));}
function randomUnit(rng){const value=Number(rng());return Number.isFinite(value)?Math.max(0,Math.min(1-Number.EPSILON,value)):0;}
function weightedChoice(items,weight,rng){
 let roll=randomUnit(rng)*items.reduce((sum,item)=>sum+weight(item),0);
 for(const item of items){if(roll<weight(item))return item;roll-=weight(item);}
 return items[items.length-1];
}
function randomChoice(items,rng){return items[Math.floor(randomUnit(rng)*items.length)];}
function pullEffect(raw,course,id,rng=Math.random,enemy=0,{allowLocked=false}={}){
 const p=cleanProgress(raw),c=p.collection;
 if(!validEventId(id)||c.draws.some(d=>d.id===id))return {progress:p,reward:null,reason:'duplicate-event'};
 if(!validEnemy(enemy)||(!allowLocked&&enemy>=p.courses[validCourse(course)].unlocked))return {progress:p,reward:null,reason:'locked-stage'};
 const owned=new Set(c.effectIds),remaining=gachaEffects.filter(e=>!owned.has(e.id));
 if(!remaining.length)return {progress:p,reward:null,reason:'complete'};
 if(c.heroPower<GACHA_COST)return {progress:p,reward:null,reason:'insufficient'};
 // Remove owned type+color pairs first. Empty roles/rarities automatically drop
 // out of the weighting; no retries, duplicates, or charges after completion.
 const slots=[2,0,1].filter(slot=>remaining.some(e=>e.slot===slot));
 const slot=weightedChoice(slots,s=>GACHA_SLOT_CHANCES[s],rng);
 let pool=remaining.filter(e=>e.slot===slot);
 if(slot!==2){
  const rarity=weightedChoice(rarities.filter(r=>pool.some(e=>e.rarity===r.id)),r=>r.weight,rng);
  pool=pool.filter(e=>e.rarity===rarity.id);
 }
 const family=randomChoice([...new Set(pool.map(e=>e.familyId))],rng);
 const effect=randomChoice(pool.filter(e=>e.familyId===family),rng);
 c.draws.push({id,effectId:effect.id,duplicate:false});
 return {progress:cleanProgress(p),reward:{effect,duplicate:false,refund:0,autoEquipped:false},reason:null};
}
function awardCoopVictory(raw,id){const p=cleanProgress(raw);if(!validEventId(id)||p.collection.coopWins.some(w=>w.id===id))return {progress:p,reward:false};p.collection.coopWins.push({id});return {progress:cleanProgress(p),reward:true};}
function battleStats(battle){const correct=battle.done,attempts=battle.attempts;return {correct,attempts,accuracy:attempts?Math.round(correct/attempts*100):null,average:battle.times.length?battle.times.reduce((sum,n)=>sum+n,0)/battle.times.length:null};}
const api={COUNT,SAVE_VERSION,COMBO_TRIGGER,ULTIMATE_GACHA_CHANCE,GACHA_SLOT_CHANCES,SLOT_LABELS,DEFAULT_EQUIPMENT,STARTER_EFFECTS,comboSlot,slotAccepts,familiesForSlot,effectForCombo,visionCount,regularFamilies,regularEffects,finisherFamilies,finisherEffects,gachaFinishers,enemies,COURSE_IDS,DEFAULT_COURSE,SHIELD_POWER,GACHA_COST,DUPLICATE_REFUND,HERO_CLEAR_COUNT,heroes,heroRoster,rarities,families,palettes,familyById,familyVariants,paletteForCourse,effectLabel,effects,gachaEffects,gachaFamilies,baseEffect,firstClearEffect,ownedEffects,remainingGachaEffects,equippedEffects,cleanProgress,courseProgress,collectionProgress,mergeProgress,setEquipment,winPower,awardVictory,awardCoopVictory,pullEffect,battleStats};
if(typeof module!=='undefined')module.exports=api;root.GameModel=api;
})(typeof window==='undefined'?globalThis:window);
