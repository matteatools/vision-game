'use strict';
const $=id=>document.getElementById(id),M=MathBattle;
const enemies=GameModel.enemies;
// Preview-only switch: never persists all-open access or test victories.
let testMode=false;
let previewProgress=null;
let lastAttackEffectId=null;
function usingTestProgress(){return state?state.testMode:testMode;}
function heroProgress(){
 if(!usingTestProgress())return progress;
 if(!previewProgress){
  // All skills belong only to this in-memory test copy, never the saved progress.
  previewProgress=GameModel.cleanProgress(progress);
  previewProgress.collection.bonusEffectIds=GameModel.effects.map(effect=>effect.id);
  previewProgress=GameModel.cleanProgress(previewProgress);
 }
 return GameModel.mergeProgress(previewProgress,progress);
}
function heroCourse(){return state?state.course:course;}
function heroCourseProgress(){return GameModel.courseProgress(heroProgress(),heroCourse());}
function heroCollectionProgress(){return GameModel.collectionProgress(heroProgress());}
function newHeroEventId(kind){return Date.now().toString().padStart(13,'0')+'-'+kind+'-'+(window.crypto?.randomUUID?window.crypto.randomUUID():Math.random().toString(36).slice(2));}
function drawHeroPower(){
 if(!usingTestProgress()){try{progress=GameModel.mergeProgress(progress,JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{}}
 const outcome=GameModel.pullEffect(heroProgress(),heroCourse(),newHeroEventId('draw'),Math.random,state?state.enemy:selected,{allowLocked:usingTestProgress()});
 if(outcome.reward){if(usingTestProgress())previewProgress=outcome.progress;else{progress=outcome.progress;saveProgress();}renderEffectCollection();}
 return outcome;
}
function selectableCount(current=GameModel.courseProgress(progress,course)){return enemies.filter((_,i)=>canSelectEnemy(i,current)).length;}
function canSelectEnemy(i,current=GameModel.courseProgress(progress,course)){return Number.isInteger(i)&&i>=0&&i<enemies.length&&(testMode||i<current.unlocked||current.defeated.includes(i));}
function setTestMode(enabled){testMode=!!enabled;if(!canSelectEnemy(selected))selected=0;window.GameUI?.resetGacha();renderChoices();}
const SAVE_KEY='monster-math-progress-v1';let storageOK=true;let progress;
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');progress=GameModel.cleanProgress(saved);if(saved&&saved.version!==GameModel.SAVE_VERSION)localStorage.setItem(SAVE_KEY,JSON.stringify(progress));}catch{progress=GameModel.cleanProgress(null);storageOK=false;}
function saveProgress(){try{let stored=null;try{stored=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{}progress=GameModel.mergeProgress(progress,stored);localStorage.setItem(SAVE_KEY,JSON.stringify(progress));storageOK=true;}catch{storageOK=false;}$('saveStatus').textContent=storageOK?'このブラウザに かいほうを ほぞんするよ':'このブラウザでは ほぞんできません（あそぶことは できます）';}
let course=progress.activeCourse;
const COURSES=M.courses;
const COURSE_HEROES={'add-basic':'red-action','add-carry':'yellow-boost','sub-basic':'blue-scout','sub-borrow':'green-guard',multiply:'pink-star'};
function courseAnswerValues(id){return M.answerValues(id);}
let selected=0,state=null,transition=null,lastTick=performance.now();
const PLAYER_HIT=20;
function stageLabel(rules){return `${rules.awakened?'うらステージ':'ステージ'} ${rules.number}`;}
function attackDeadline(){return (state?state.rules:M.stageRules(course,selected,progress.mode)).seconds*1000;}
function enemyStage(i,hp){return enemies[i].powered?Math.min(4,Math.floor((120-Math.max(0,hp))/24)):M.stage(hp);}
function rageLevel(i,hp){return enemies[i].powered&&hp>0?Math.max(0,enemyStage(i,hp)-2):0;}
function awakenPhase(stage){return stage>=4?3:stage>=3?2:1;}
function enemyAsset(i,stage=0,defeated=false,attack=false){const e=enemies[i];return e.powered?`${e.file}-awaken-${defeated?'defeat':attack&&stage>=4?'attack':awakenPhase(stage)}.webp`:`${e.file}-${defeated?4:attack?'attack':stage}.webp`;}
function art(i,s=0,defeated=false,attack=false){const e=enemies[i],rage=e.powered&&!defeated?Math.max(0,s-2):0;return `<div class="monster-figure stage-${s} ${e.powered?'powered illustrated-awaken':''} rage-${rage} ${defeated?'defeated':''} ${defeated&&e.powered?'dedicated-defeat':''} ${attack?'attack-pose':''}" role="img" aria-label="${e.name}・${defeated?'まいった！':attack?'こうげき！':rage===2?'ちょうほんき':rage===1?'ほんき！':e.powered?'パワーアップ':['げんき','すこし びっくり','あせってきた','あとすこし','まいった！'][s]}"><img src="${enemyAsset(i,s,defeated,attack)}" alt="" draggable="false" width="400" height="400"></div>`;}
const preloaded=new Set();function preloadEnemy(i){if(preloaded.has(i))return;preloaded.add(i);const e=enemies[i],files=e.powered?[1,2,3,'attack','defeat'].map(n=>`${e.file}-awaken-${n}.webp`):[0,1,2,3,4,'attack'].map(n=>`${e.file}-${n}.webp`);for(const file of files){const img=document.createElement('img');img.src=file;}}
function selectEnemy(i){if(!canSelectEnemy(i))return;selected=i;preloadEnemy(i);renderChoices();}
function renderChoices(){
 renderEffectCollection();window.GameUI?.renderSetup();
 window.RangerUI?.renderRoster();
 $('courses').innerHTML=COURSES.map(c=>{const isAdd=c.id.startsWith('add'),isMultiply=c.id==='multiply';return `<button class="level course-button" data-course="${c.id}" data-ranger="${COURSE_HEROES[c.id]}" aria-label="${c.name}" aria-pressed="${course===c.id}"><span class="course-picture" aria-hidden="true"><img src="assets/command/ranger-${COURSE_HEROES[c.id]}.webp" alt="" width="130" height="130"><b class="course-symbol">${c.symbol}</b></span><span class="course-copy"><strong>${isMultiply?'かけざん':isAdd?'たしざん':'ひきざん'}</strong>${isMultiply?'<small>1〜9の だん</small>':`<small><span>${isAdd?'くりあがり':'くりさがり'}</span><b>${c.id.endsWith('basic')?'なし':'あり'}</b></small>`}</span><i class="choice-check" aria-hidden="true">✓</i></button>`;}).join('');
 const current=heroCourseProgress(),count=selectableCount(current);
 $('cards').innerHTML=enemies.map((e,i)=>{const locked=!canSelectEnemy(i,current),rules=M.stageRules(course,i,progress.mode);return `<button class="card ${locked?'locked':''}" data-enemy="${i}" aria-pressed="${selected===i}" ${locked?'disabled aria-label="まだ かいほうされていない モンスター"':''}><span class="enemy-stage-label">${stageLabel(rules)} · ${rules.seconds}びょう</span>${art(i)}<strong>${locked?'？？？':e.name}</strong>${rules.tableLabel?`<small class="enemy-tables">${rules.tableLabel}</small>`:''}<small>${locked?'まえの モンスターを たおそう':current.defeated.includes(i)?'★ クリア！':e.type}</small>${locked?'':`<small class="enemy-reward">はじめてのクリア：${GameModel.SLOT_LABELS[GameModel.firstClearEffect(i,course).slot]} · ${GameModel.effectLabel(GameModel.firstClearEffect(i,course))}</small>`}</button>`;}).join('');
 $('unlockStatus').textContent=testMode?'テスト：20たい すべて えらべます':`${count} / ${enemies.length} たい かいほう`;
 $('testMode').setAttribute('aria-pressed',testMode);
 $('testMode').textContent=testMode?'テスト：あいて20たい・わざぜんぶ':'テスト：オフ';
 $('testNote').textContent=testMode?'いつも・5コンボ・10コンボの わざを えらべるよ。ひっさつは 13しゅるい！ テストの きろくは ほぞんされないよ。':'あいてを たおすと、つぎの あいてが あらわれるよ。きろくも ほぞんするよ。';
 $('normalMode').setAttribute('aria-pressed',progress.mode==='normal');$('visionMode').setAttribute('aria-pressed',progress.mode==='vision');
 $('saveStatus').textContent=storageOK?'このブラウザに かいほうを ほぞんするよ':'ほぞんが つかえません。この がめんでは あそべます。';
}
function availableEffects(){return GameModel.ownedEffects(heroProgress());}
function equippedEffectIds(){return heroCollectionProgress().equippedEffectIds;}
function activeEffects(){return GameModel.equippedEffects(availableEffects(),equippedEffectIds());}
function storeEquippedEffects(ids){
 if(usingTestProgress())previewProgress=GameModel.setEquipment(heroProgress(),ids);
 else{progress=GameModel.setEquipment(progress,ids);saveProgress();}
 lastAttackEffectId=null;renderEffectCollection();
}
function equipEffectForSlot(id,slot){
 const effect=availableEffects().find(e=>e.id===id);
 if(!GameModel.slotAccepts(effect,slot))return false;
 const ids=activeEffects().map(e=>e.id);ids[slot]=id;storeEquippedEffects(ids);
 $('effectSelectionStatus').textContent=GameModel.SLOT_LABELS[slot]+'の わざに えらびました。';
 return true;
}
function renderEffectCollection(){window.GameUI?.renderEquipment();}
function showAttackEffect(effect){try{if(window.AttackEffects&&typeof window.AttackEffects.play==='function')window.AttackEffects.play(effect);}catch{/* Cosmetic failures must never interrupt judgement. */}}
function playCorrectEffect(){const slot=state.practice?0:GameModel.comboSlot(state.combo),effect=activeEffects()[slot];lastAttackEffectId=effect.id;state.lastEffectSlot=slot;showAttackEffect(effect);GameSound.playEffect(effect);}
function renderCombo(){const n=state?.combo||0;$('comboCount').textContent=n>=2?n+'コンボ！':'';$('comboCount').classList.toggle('combo-special',n===GameModel.COMBO_TRIGGER||n===10);}
function chooseMode(mode){progress.mode=mode;saveProgress();renderChoices();}
function layoutVision(width,height,values,rng=Math.random,wide=width>=800&&width/(height+54)>=1.2,reserved={}){
 const count=values.length,w=Math.max(280,width),top=reserved.top??(wide?(height+54<=600?160:195):155),bottom=reserved.bottom??(wide?62:205);
 const x0=wide?(width<800?w*.52+10:w/2+12):10,x1=w-10,areaW=x1-x0;
 let size=wide?Math.min(96,Math.max(56,height*.14)):Math.max(56,Math.min(72,width*.17)),columns,rows,needed;
 const grid=s=>{const cols=Math.max(1,Math.floor((areaW+6)/(s+6)));const rs=Math.ceil(count/cols);return {cols,rs,height:top+bottom+rs*(s+6)+8};};
 while(size>44&&grid(size).height>height)size=Math.max(44,size-2);
 ({cols:columns,rs:rows,height:needed}=grid(size));const fieldHeight=Math.max(height,needed),usableH=fieldHeight-top-bottom;
 const cellW=areaW/columns,cellH=usableH/rows,cells=[];
 const jitter=Math.max(0,Math.min(5,(Math.min(cellW,cellH)-size-4)/2));
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)cells.push({x:x0+(col+.5)*cellW+(rng()-.5)*2*jitter,y:top+(row+.5)*cellH+(rng()-.5)*2*jitter});
 for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
 return {height:fieldHeight,points:cells.slice(0,count).map((p,i)=>({...p,size,value:values[i]}))};
}
function renderVision(){
 if(!state||state.mode!=='vision')return;
 const rect=$('battleScene').getBoundingClientRect();
 if(!state.visionValues)state.visionValues=M.visionChoices(state.course,state.question.answer);
 const viewportHeight=window.innerHeight||rect.height+54,compact=rect.width>viewportHeight&&viewportHeight<=420,wide=compact||(rect.width>=800&&rect.width/viewportHeight>=1.2);
 const baseHeight=Math.max(1,viewportHeight-(compact?35:wide?54:38));
 const panelHeight=$('play').querySelector('.panel').getBoundingClientRect().height;
 const layout=window.GameBattleUI?.isLandscape()
  ?window.GameBattleUI.visionLayout(state.visionValues)
  :layoutVision(rect.width,baseHeight,state.visionValues,Math.random,wide,compact?{top:118,bottom:16}:wide?{}:{top:118,bottom:panelHeight+12});
 $('battleScene').style.setProperty('--vision-min-height',`${layout.height}px`);
 $('visionField').innerHTML=layout.points.map(p=>`<button class="vision-choice" data-key="${p.value}" aria-label="こたえ ${p.value}" style="left:${p.x}px;top:${p.y}px;width:${p.size}px;height:${p.size}px;font-size:${Math.max(20,Math.floor(p.size*.46))}px">${p.value}</button>`).join('');setKeys(state.locked);
}
function screen(id){['title','home','play','result','defeat','practiceDone'].forEach(x=>$(x)?.classList.toggle('hidden',x!==id));document.body.dataset.screen=id;window.scrollTo(0,0);if(id==='play')$('play').scrollTop=0;window.GameMusic?.sync();}
function clearAttackEffect(){try{window.AttackEffects?.clear();GameSound.stopEffects();}catch{}}
function start(options={}){
 window.RangerUI?.closeBattleGuide();
 GameSound.unlock();clearAttackEffect();if(!canSelectEnemy(selected))selected=0;preloadEnemy(selected);clearTimeout(transition);
 const rules=M.stageRules(course,selected,progress.mode);
 // "difficulty" is the four-tier reward value; each correct answer deals 12.
 // The attack clock and question deck come from the stage, with no speed selector.
 state={practice:options.practice===true,paused:false,combo:0,maxCombo:0,questionMissed:false,finishing:false,lastEffectSlot:0,hp:120,total:0,done:0,attempts:0,times:[],course,rules,deck:M.shuffle(M.stagePool(course,selected)),answer:'',locked:false,started:performance.now(),enemy:selected,difficulty:rules.rewardTier,questionMs:0,approachMs:0,approachStep:0,playerHp:100,playerHits:0,impactMs:0,defeatMs:0,transitionMs:0,transitionKind:null,attackMs:0,mode:progress.mode,finished:false,testMode,brokenFrom:0,brokenTo:0};
 if(state.practice)state.deck=M.practicePool(course).slice().reverse();
 $('play').classList.toggle('practice-mode',state.practice);$('play').classList.remove('manual-paused');$('play').classList.toggle('vision-mode',state.mode==='vision');renderAnswerControls();window.GameBattleUI?.sync();lastTick=performance.now();$('playerNotice').textContent='';$('shieldBreakFx').innerHTML='';$('play').classList.remove('player-impact','enemy-attacking');$('questionCard').classList.remove('wrong-answer');$('sprite').classList.remove('hit');document.querySelectorAll('.popup').forEach(p=>p.remove());renderApproach();renderPlayer();$('enemyName').textContent=enemies[selected].name;$('sprite').classList.add('float');screen('play');newQuestion();renderMonster();
 window.RangerUI?.battleGuide();
}
function newQuestion(){state.questionMissed=false;state.finishing=false;renderCombo();state.approachMs=0;state.timeoutHit=false;state.attackMs=0;$('play').classList.remove('enemy-attacking');renderApproach();state.visionValues=null;state.question=state.deck.pop();state.answer='';state.locked=false;state.started=performance.now();state.questionMs=0;$('equation').textContent=`${state.question.a} ${state.question.symbol} ${state.question.b}`;$('answer').textContent='?';$('time').textContent='0.0 びょう';$('round').textContent=`${state.done+1} / ${state.practice?3:M.BATTLE_QUESTIONS} もんめ`;$('feedback').textContent=state.mode==='vision'?'○の こたえを タップ！':state.course!=='multiply'?'こたえを タップ！':'すうじを 2かい おそう！';$('hint').classList.add('hidden');setKeys(false);const question=$('questionCard');question.classList.remove('question-enter');void question.offsetWidth;question.classList.add('question-enter');window.RangerUI?.practiceGuide();renderVision();lastTick=performance.now();}
function setKeys(disabled){document.querySelectorAll('.key,.vision-choice').forEach(b=>b.disabled=disabled);}
function renderMonster(){const s=enemyStage(state.enemy,state.hp),rage=rageLevel(state.enemy,state.hp);$('sprite').innerHTML=art(state.enemy,s,state.hp===0,state.attackMs>0&&state.hp>0);$('hp').style.width=`${state.hp/120*100}%`;$('hpText').textContent=`のこり ${state.hp} / 120`;$('hpBar').setAttribute('aria-valuenow',state.hp);$('status').textContent=state.hp>0&&enemies[state.enemy].powered?['うらの ちからを みせよう！','まだまだ これからだ！','ほんきに なってきたぞ！','ほんき！ たてを 2つ こわすぞ！','ちょうほんき！ たてを 3つ こわすぞ！'][s]:['まだまだ まけないぞ！','おっ、やるじゃないか！','むむっ、つよいな！','あと すこしで たおせる！','まいった〜！'][s];}
function selectAnswer(value){
 if(!state||state.paused||state.locked||$('play').classList.contains('hidden'))return;
 if(!courseAnswerValues(state.course).includes(Number(value)))return;
 state.answer=String(value);$('answer').textContent=state.answer;submit();
}
function renderAnswerControls(){
 const choices=state.course!=='multiply';
 $('keypad').classList.toggle('answer-choices',choices);
 $('keypad').setAttribute('aria-label',choices?'こたえを えらぼう':'すうじを いれよう');
 $('keypad').innerHTML=choices
  ?courseAnswerValues(state.course).map(value=>`<button class="key answer-choice" type="button" data-answer="${value}" aria-label="こたえ ${value}">${value}</button>`).join('')
  :[1,2,3,4,5,6,7,8,9,'del',0].map(k=>`<button class="key ${k==='del'?'del':k===0?'zero-key':''}" type="button" data-key="${k}" aria-label="${k==='del'?'ひとけた けす':k===0?'すうじ 0。1けたの こたえは さいしょに おす':'すうじ '+k}">${k==='del'?'けす':k===0?'<span>0</span><small>（1けた）</small>':k}</button>`).join('');
 $('inputHelp').textContent=state.mode==='vision'?'○の こたえを さがして タップ':choices?'こたえを 1かい タップ':'すうじを 2かい。1けたは 0から';
}
function input(v){
 if(!state||state.paused||state.locked||$('play').classList.contains('hidden'))return;
 v=String(v);
 if(state.mode==='vision'){selectAnswer(v);return;}
 const choices=state.course!=='multiply',values=choices?courseAnswerValues(state.course):[];
 if(v==='submit'){if(choices&&values.includes(Number(state.answer)))submit();return;}
 if(v==='del')state.answer=state.answer.slice(0,-1);
 else if(/^\d$/.test(v)&&state.answer.length<2){
  const next=choices&&state.answer==='0'?v:state.answer+v;
  if(choices&&!values.some(value=>String(value).startsWith(next)))return;
  state.answer=next;
 }else return;
 $('answer').textContent=(!choices&&state.answer.length===2)?String(Number(state.answer)):state.answer||'?';
 if(choices&&state.answer&&values.includes(Number(state.answer)))selectAnswer(state.answer);
 // Always wait for two presses, even when the correct answer is one digit.
 // The zero key is also the one-digit prefix: 0 -> 4 means 4; 4 -> 0 means 40.
 else if(!choices&&state.answer.length===2)submit();
}
function submit(){
 if(!state||state.paused||state.locked||!state.answer)return;
 state.attempts++;
 const q=state.question;
 if(Number(state.answer)!==q.answer){
  state.questionMissed=true;state.combo=0;renderCombo();state.locked=true;setKeys(true);
  $('feedback').textContent='まちがいの はんげき！ もういちど！';$('questionCard').classList.add('wrong-answer');
  if(state.practice){GameSound.play('shield');window.RangerUI?.practiceError();$('feedback').textContent='もういちど やってみよう！';}
  else takePlayerHit('wrong');
  if(state.playerHp===0)return;state.transitionMs=700;state.transitionKind='wrong';return;
 }
 state.locked=true;setKeys(true);state.attackMs=0;state.approachMs=0;
 $('play').classList.remove('enemy-attacking');renderApproach();
 const elapsed=state.questionMs/1000,dmg=M.damage();
 state.times.push(elapsed);state.done++;state.combo=state.questionMissed?0:state.combo+1;
 state.maxCombo=Math.max(state.maxCombo,state.combo);state.finishing=!state.practice&&state.combo===M.BATTLE_QUESTIONS;
 state.total+=dmg;state.hp=Math.max(0,state.hp-dmg);
 if(state.practice&&state.done>=3)state.hp=0;
 $('feedback').textContent=state.combo>=2?state.combo+'コンボ！':'せいかい！';
 renderCombo();renderMonster();playCorrectEffect();
 $('sprite').classList.remove('float');$('sprite').classList.add('hit');
 const pop=document.createElement('div');pop.className='popup';pop.textContent='−'+dmg;document.querySelector('.arena').appendChild(pop);
 state.transitionMs=state.finishing?window.FinisherEffects.durationMs:1000;state.transitionKind='correct';renderApproach();
}

function finish(){
 if(!state||state.finished||state.playerHp===0)return;
 if(state.practice){window.RangerUI?.practiceComplete();return;}
 GameSound.play('victory');state.finished=true;state.locked=true;
 if(!state.testMode){try{progress=GameModel.mergeProgress(progress,JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{}}
 const before=heroCourseProgress().unlocked;
 const outcome=GameModel.awardVictory(heroProgress(),state.course,{id:newHeroEventId('win'),enemy:state.enemy,shields:Math.ceil(state.playerHp/PLAYER_HIT),difficulty:state.difficulty,mode:state.mode},{allowLocked:state.testMode});
 if(state.testMode)previewProgress=outcome.progress;else{progress=outcome.progress;saveProgress();}
 const reward=outcome.reward;
 window.RangerUI?.showJoinedHero(reward?.hero,state.testMode);
 window.GameUI?.renderFinisherReward(reward?.finishers||[]);
 $('effectReward').innerHTML=reward?`<b>＋${reward.power}</b> ヒーローパワー<small>シールド ${reward.shields} × ${reward.multiplier}${state.testMode?' · テスト':''}</small>`:'';
 $('firstClearReward').classList.toggle('hidden',!reward?.firstClear);
 $('firstClearReward').innerHTML=reward?.firstClear?`<div class="first-clear-art">${AttackEffects.icon(reward.effect)}</div><div><small>はじめての クリアごほうび · ${GameModel.SLOT_LABELS[reward.effect.slot]}</small><strong>${GameModel.effectLabel(reward.effect)}</strong><span>${reward.duplicate?'もっている わざだよ':reward.autoEquipped?'つかう わざに くわえたよ！':'あたらしい わざを ゲット！'}</span></div>`:'';
 clearAttackEffect();screen('result');window.GameUI?.renderStats('result',state);
 $('power').textContent=state.total;$('damageResult').textContent=`うけた こうげき：${state.playerHits} かい`;
 $('resultMonster').innerHTML=art(state.enemy,4,true);
 const current=heroCourseProgress();
 $('unlockMessage').textContent=state.testMode?'':current.unlocked>before?`${current.unlocked===11?'うらステージ かいほう！ ':''}${enemies[current.unlocked-1].name} が あらわれた！`:current.defeated.length===enemies.length?'ぜんぶ たおしたね！':'';
 $('nextEnemy').classList.toggle('hidden',!canSelectEnemy(state.enemy+1,current));renderChoices();
}
function lose(){if(!state||state.finished)return;state.finished=true;state.locked=true;state.attackMs=state.impactMs=state.transitionMs=0;state.transitionKind=null;$('play').classList.remove('player-impact','enemy-attacking');$('shieldBreakFx').innerHTML='';$('defeatMonster').innerHTML=art(state.enemy,enemyStage(state.enemy,state.hp));$('defeatCount').textContent=`${state.done}もん せいかい！`;$('defeatHint').textContent='かいほうきろくは そのまま。もういちど ちょうせんしよう！';clearAttackEffect();screen('defeat');window.GameUI?.renderStats('defeat',state);}
function home(){window.RangerUI?.closeBattleGuide();clearAttackEffect();clearTimeout(transition);state=null;$('shieldBreakFx').innerHTML='';document.querySelectorAll('.popup').forEach(p=>p.remove());$('sprite').classList.remove('hit');$('questionCard').classList.remove('wrong-answer');$('play').classList.remove('player-impact','enemy-attacking');screen('home');renderChoices();}
$('courses').addEventListener('click',e=>{const b=e.target.closest('[data-course]');if(b&&COURSES.some(c=>c.id===b.dataset.course)){course=b.dataset.course;progress.activeCourse=course;saveProgress();if(!canSelectEnemy(selected))selected=0;lastAttackEffectId=null;window.GameUI?.resetGacha();renderChoices();}});
$('cards').addEventListener('click',e=>{const b=e.target.closest('[data-enemy]');if(b)selectEnemy(+b.dataset.enemy);});$('testMode').onclick=()=>setTestMode(!testMode);$('start').onclick=start;$('again').onclick=start;$('retryDefeat').onclick=start;$('chooseDefeat').onclick=home;$('choose').onclick=home;$('quit').onclick=home;$('normalMode').onclick=()=>chooseMode('normal');$('visionMode').onclick=()=>chooseMode('vision');$('nextEnemy').onclick=()=>{selected=state.enemy+1;start();};$('visionField').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(b)input(b.dataset.key);});window.addEventListener('resize',()=>{if(state&&state.mode==='vision')renderVision();});
$('hintButton').onclick=()=>{if(!state||state.paused||state.locked)return;const q=state.question;let hint;if(state.course==='sub-borrow')hint=`${q.a} を 10 と ${q.a-10} に わけよう。10 − ${q.b} = ${10-q.b}。のこった ${q.a-10} を たすと？`;else if(state.course==='multiply')hint=`${q.a} が ${q.b}こ。${q.a}ずつ ふやして かぞえよう。`;else if(state.course==='add-carry')hint=`${q.a} に ${10-q.a} を たすと 10。${q.b} から ${10-q.a} を つかうと、あと いくつ？`;else hint=state.course==='add-basic'?`${q.a} から ${q.b}つ すすんで かぞえよう。`:`${q.a} から ${q.b}つ もどって かぞえよう。`;$('hint').textContent=hint;$('hint').classList.toggle('hidden');};
$('keypad').addEventListener('click',e=>{
 const choice=e.target.closest('[data-answer]');
 if(choice){selectAnswer(choice.dataset.answer);return;}
 const key=e.target.closest('[data-key]');if(key)input(key.dataset.key);
});
document.addEventListener('keydown',e=>{
 if(e.repeat||!state||state.mode==='vision'||$('play').classList.contains('hidden')||e.target.closest('#quit,#hintButton,#fullscreen,#pauseBattle,#pauseDialog,#multiplyGuide,summary'))return;
 if(e.key==='Enter'&&e.target.closest('[data-answer]')&&!state.answer)return;
 const key=/^[0-9]$/.test(e.key)?e.key:e.key==='Enter'?'submit':['Backspace','Delete'].includes(e.key)?'del':null;
 if(key!==null){e.preventDefault();input(key);}
});
function renderApproach(){if(!state)return;if(state.practice){$('approachText').textContent='ゆっくり れんしゅう';$('approachBar').style.width='0%';$('sprite').style.setProperty('--approach-scale','.75');return;}const step=Math.min(4,Math.floor(state.approachMs/(attackDeadline()/5)));state.approachStep=step;const remaining=Math.max(0,Math.ceil((attackDeadline()-state.approachMs)/1000));$('sprite').style.setProperty('--approach-scale',String(.65+step*.15));$('sprite').style.setProperty('--approach-y',`${(4-step)*-14}px`);const protectedNow=state.transitionKind==='correct'||state.hp===0;$('approachText').textContent=protectedNow?'おしもどした！':state.timeoutHit?'ゆっくり こたえよう':`こうげきまで あと ${remaining} びょう`;$('approachText').classList.toggle('urgent',!protectedNow&&!state.timeoutHit&&remaining<=3);$('approachBar').style.width=`${state.timeoutHit||protectedNow?0:state.approachMs/attackDeadline()*100}%`;}
function renderPlayer(){if(!state)return;$('playerHp').textContent=`じぶんの シールド ${state.playerHp/20} / 5`;$('playerShields').innerHTML=Array.from({length:5},(_,i)=>`<span class="shield ${i<state.playerHp/20?'filled':'lost'} ${state.impactMs>0&&i>=state.brokenTo&&i<state.brokenFrom?'breaking':''}" aria-hidden="true">🛡</span>`).join('');$('playerHits').textContent=`うけた こうげき ${state.playerHits} かい`;}
function takePlayerHit(reason='approach'){if(!state||state.practice||state.paused||state.finished||state.playerHp===0||state.transitionKind==='correct'||state.hp===0)return;if(reason==='approach'&&state.timeoutHit)return;state.questionMissed=true;state.combo=0;renderCombo();GameSound.play('shield');const shields=1+rageLevel(state.enemy,state.hp),hit=PLAYER_HIT*shields;const before=state.playerHp;state.playerHits++;state.playerHp=Math.max(0,state.playerHp-hit);const lost=(before-state.playerHp)/20;state.brokenFrom=before/20;state.brokenTo=state.playerHp/20;$('shieldBreakFx').innerHTML=Array.from({length:lost},()=>'<span class="broken-shield"><i class="shield-half left">🛡</i><i class="shield-half right">🛡</i></span>').join('');state.approachMs=0;if(reason==='approach')state.timeoutHit=true;state.impactMs=1200;state.attackMs=650;$('play').classList.remove('player-impact','enemy-attacking');void $('play').offsetWidth;$('play').classList.add('enemy-attacking');renderMonster();if(state.playerHp===0){state.defeatMs=1200;state.locked=true;state.transitionMs=0;state.transitionKind=null;setKeys(true);}$('playerNotice').textContent=(reason==='wrong'?'まちがいの はんげき！':'じかんぎれの こうげき！')+(state.playerHp===0?' シールドが なくなった！':'');if(reason==='approach')$('feedback').textContent='じかんぎれの こうげき！ つづけて こたえよう';if(reason==='approach'&&state.playerHp>0){state.locked=true;setKeys(true);state.transitionKind='timeout';state.transitionMs=700;}$('play').classList.add('player-impact');renderPlayer();renderApproach();}
function advanceBattle(ms){if(!state||state.paused||state.finished||$('play').classList.contains('hidden')||document.hidden)return;
 if(state.defeatMs>0){state.defeatMs=Math.max(0,state.defeatMs-ms);if(!state.defeatMs)lose();return;}
 if(state.transitionKind!=='correct'&&state.hp>0)state.questionMs+=ms;
 if(state.attackMs>0){state.attackMs=Math.max(0,state.attackMs-ms);if(!state.attackMs){$('play').classList.remove('enemy-attacking');renderMonster();}}
 if(state.impactMs>0){state.impactMs=Math.max(0,state.impactMs-ms);if(!state.impactMs){$('play').classList.remove('player-impact');$('playerNotice').textContent='';$('shieldBreakFx').innerHTML='';state.brokenFrom=state.brokenTo=0;renderPlayer();}}

 if(!state.practice&&state.hp>0&&!state.locked&&!state.timeoutHit){state.approachMs+=ms;if(state.approachMs>=attackDeadline()){takePlayerHit();return;}renderApproach();}
 if(state.transitionMs>0){state.transitionMs=Math.max(0,state.transitionMs-ms);if(!state.transitionMs){const kind=state.transitionKind;state.transitionKind=null;document.querySelectorAll('.popup').forEach(p=>p.remove());$('sprite').classList.remove('hit');$('questionCard').classList.remove('wrong-answer');if(kind==='correct'){if(state.hp===0)finish();else{$('sprite').classList.add('float');newQuestion();}}else{state.answer='';$('answer').textContent='?';state.locked=false;setKeys(false);}}}
 if(state&&!state.locked)$('time').textContent=state.practice?'ゆっくりで OK':(state.questionMs/1000).toFixed(1)+' びょう';
}
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();$('play').classList.toggle('visibility-paused',document.hidden);});
setInterval(()=>{const now=performance.now();const dt=Math.max(0,Math.min(1000,now-lastTick));lastTick=now;advanceBattle(dt);},100);
renderChoices();preloadEnemy(selected);

$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='F11で おおきい がめん';}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'おおきい がめんを やめる':'おおきい がめん';if(state&&state.mode==='vision')renderVision();});
