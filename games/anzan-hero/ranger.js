(function(){
 'use strict';
 const el=id=>document.getElementById(id),asset='assets/rangers/';
 const desktopTitleQuery='(min-width: 1024px) and (orientation: landscape) and (hover: hover) and (pointer: fine)';
 const desktopTitle=window.matchMedia(desktopTitleQuery);
 const hero=`<img src="${asset}red-guide.webp" alt="レッド" class="ranger-guide" width="360" height="420">`;
 let multiplyGuideSeen=false,guideBattle=null;
 document.querySelector('main').insertAdjacentHTML('afterbegin',`
 <section id="title" class="title-screen hidden" aria-label="あんざんヒーロー タイトル">
  <picture class="title-backdrop"><source media="${desktopTitleQuery}" srcset="assets/command/city-arena.webp"><source media="(orientation: portrait)" srcset="${asset}title-portrait-mobile.webp"><img id="titleSceneImage" src="${asset}title-wide.webp" alt="5にんの レンジャーヒーローたち" width="1536" height="1024"></picture>
  <h1 class="title-logo"><img src="${asset}logo-a.webp" alt="あんざんヒーロー" width="1100" height="375"><span>あんざんヒーロー</span></h1>
  <div id="titleTeam" class="title-team" role="group" aria-label="あつまった ヒーロー"></div>
  <nav class="title-menu" aria-label="メニュー"><div class="title-main-actions"><button id="titlePractice" class="title-practice" type="button">れんしゅう</button><button id="titleStart" class="title-start" type="button">スタート</button></div><div class="title-sub-actions"><button id="titleSkills" type="button">わざ</button><button id="titleGacha" type="button">ガチャ</button><button id="titleOptions" type="button">せってい</button></div><a class="park-link" href="https://matteatools.github.io/vision-game/">ゲームパークへ もどる</a></nav>
 </section>
 <dialog id="rosterDialog" class="collection-dialog roster-dialog" aria-labelledby="rosterTitle"><div class="dialog-header"><h2 id="rosterTitle">ヒーロー しゅうごう！</h2><button id="closeRoster" class="outline-button" type="button">とじる</button></div><p class="roster-intro">コースの 10たいを たおすと、なかまが ふえる！</p><p id="rosterTestNote" class="roster-test-note hidden">テストで ふえた なかまは、ほぞんされないよ。</p><div id="starterTeam" class="starter-team" aria-label="はじめの なかま"></div><div id="rosterCards" class="roster-cards"></div></dialog>
 <section id="practiceDone" class="practice-done hidden"><div>${hero}</div><h2>コンプリート！</h2><p>こたえを えらんで、わざを はなてたね。<br>つぎは ほんばんに いこう！</p><button id="practiceStart" class="primary" type="button">スタート</button><button id="practiceTitle" class="textbtn" type="button">タイトルへ</button></section>
 <dialog id="optionsDialog" class="collection-dialog options-dialog" aria-labelledby="optionsTitle"><div class="dialog-header"><h2 id="optionsTitle">せってい</h2><button class="outline-button" id="closeOptions" type="button">とじる</button></div><div id="optionsContent"></div></dialog>
 <dialog id="pauseDialog" class="collection-dialog pause-dialog" aria-labelledby="pauseTitle"><h2 id="pauseTitle">ひとやすみ</h2><p>じかんは とまっているよ。</p><button id="resumeBattle" class="primary" type="button">つづける</button><button id="pauseToTitle" class="textbtn" type="button">タイトルへ</button></dialog>`);
 const intro=document.querySelector('#home .home-intro');
 document.body.insertAdjacentHTML('beforeend',`
 <dialog id="multiplyGuide" class="collection-dialog multiply-guide" aria-labelledby="multiplyGuideTitle" aria-describedby="multiplyGuideText">
  <div class="multiply-guide-heading">${hero}<h2 id="multiplyGuideTitle">すうじを 2かい</h2></div>
  <p id="multiplyGuideText">1けたの こたえは「0」から おそう！</p>
  <div class="multiply-guide-examples">
   <div class="multiply-guide-example" aria-label="こたえが4なら、0、4のじゅんにおす"><span>こたえ <b>4</b></span><div aria-hidden="true"><kbd class="guide-zero">0<small>（1けた）</small></kbd><i>→</i><kbd>4</kbd></div></div>
   <div class="multiply-guide-example" aria-label="こたえが40なら、4、0のじゅんにおす"><span>こたえ <b>40</b></span><div aria-hidden="true"><kbd>4</kbd><i>→</i><kbd>0</kbd></div></div>
  </div>
  <p class="multiply-guide-clock">じかんは とまっているよ。</p>
  <button id="multiplyGuideStart" class="primary" type="button" autofocus>やってみよう！</button>
 </dialog>`);
 intro.innerHTML=`<div class="setup-nav"><button id="setupToTitle" class="textbtn" type="button">← タイトル</button><img class="command-logo" src="${asset}logo-a.webp" alt="あんざんヒーロー" width="240" height="82"><button id="setupOptions" class="textbtn" type="button">せってい</button></div>`;
 const settings=document.querySelector('.home-settings');el('optionsContent').append(settings,el('saveStatus'));
 document.querySelectorAll('main>details').forEach(details=>el('optionsContent').append(details));
 el('start').innerHTML='<img class="start-punch" src="assets/command/hero-punch-mark.svg" alt="" width="120" height="120"><span>スタート</span><b aria-hidden="true">❯</b>';
 el('start').insertAdjacentHTML('afterend','<button id="setupFlash" class="outline-button" type="button" aria-haspopup="dialog"><img src="assets/command/ranger-blue-scout.webp" alt="" width="40" height="40">フラッシュトレーニング</button>');
 document.body.insertAdjacentHTML('beforeend','<dialog id="flashTrainingDialog" aria-label="フラッシュトレーニング"><iframe id="flashTrainingFrame" title="フラッシュトレーニング" allowfullscreen></iframe></dialog>');
 const flashDialog=el('flashTrainingDialog'),flashFrame=el('flashTrainingFrame');
 el('setupFlash').onclick=()=>{
  flashFrame.src='flash-training/index.html';flashDialog.showModal();document.body.classList.add('flash-open');window.GameMusic?.sync();
 };
 flashDialog.addEventListener('close',()=>{
  flashFrame.removeAttribute('src');document.body.classList.remove('flash-open');window.GameMusic?.sync();el('setupFlash').focus({preventScroll:true});
 });
 window.addEventListener('message',e=>{
  const sameOrigin=e.origin===location.origin||(location.protocol==='file:'&&e.origin==='null');
  if(e.source===flashFrame.contentWindow&&sameOrigin&&e.data?.type==='hero-flash-close'&&flashDialog.open)flashDialog.close();
 });
 document.querySelector('.hero-wallet').insertAdjacentHTML('afterbegin','<img class="wallet-ranger" src="assets/command/ranger-yellow-boost.webp" alt="" width="65" height="65">');
 document.querySelector('#play .panel').insertAdjacentHTML('afterbegin',`<div id="practiceCoach" class="practice-coach hidden">${hero}<div><b>レッドと れんしゅう <span id="practiceStep"></span></b><p id="practiceMessage"></p></div></div>`);
 document.querySelector('.player-hud').insertAdjacentHTML('afterbegin',`<img class="hud-ranger" src="${asset}red-guide.webp" alt="レッド" width="48" height="58">`);
 document.querySelector('#play>.toolbar').insertAdjacentHTML('afterbegin','<button id="pauseBattle" class="textbtn" type="button" aria-label="ひとやすみ">Ⅱ ひとやすみ</button>');
 function showTitle(){if(el('pauseDialog').open)el('pauseDialog').close();home();screen('title');}
 function renderRoster(){
  const roster=GameModel.heroRoster(heroProgress()),joined=roster.filter(h=>h.joined),recruits=roster.filter(h=>h.course),joinedRecruits=recruits.filter(h=>h.joined);
  el('titleTeam').classList.toggle('has-recruits',joined.length>5);
  el('titleTeam').dataset.recruits=joinedRecruits.length;
  el('titleTeam').setAttribute('aria-hidden',String(!desktopTitle.matches));
  el('titleSceneImage').alt=desktopTitle.matches?'':'5にんの レンジャーヒーローたち';
  const positions={red:50,blue:32,yellow:14,green:68,pink:86};
  el('titleTeam').innerHTML=desktopTitle.matches?joined.map(h=>`<div class="team-hero ${h.course?'team-recruit':'team-starter'} hero-${h.id}" data-hero="${h.id}" style="--hero-x:${h.course?50+(joinedRecruits.findIndex(r=>r.id===h.id)-(joinedRecruits.length-1)/2)*15:positions[h.id]}%;--hero-order:${h.course?1:h.id==='red'?8:4}"><img src="${h.image}" alt="${h.name}" width="512" height="512" draggable="false"></div>`).join(''):'';
  el('starterTeam').innerHTML=roster.filter(h=>!h.course).map(h=>`<div><img src="${h.image}" alt="" width="100" height="100"><span>${h.name}</span></div>`).join('');
  el('rosterTestNote').classList.toggle('hidden',!usingTestProgress());
  el('rosterCards').innerHTML=recruits.map(h=>{const c=COURSES.find(c=>c.id===h.course);return `<article class="roster-card ${h.joined?'joined':'waiting'}" data-roster-hero="${h.id}"><div class="roster-portrait"><img src="${h.image}" alt="${h.name}" width="160" height="160">${h.joined?'<span aria-hidden="true">★</span>':''}</div><div class="roster-copy"><h3>${h.name}</h3><p>${c.name}</p><div class="roster-progress" role="progressbar" aria-label="たおした あいて" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${h.cleared}"><i style="width:${h.cleared*10}%"></i></div><strong>${h.joined?'なかまに なった！':`${h.cleared} / 10 たい`}</strong><button type="button" class="outline-button" data-hero-course="${h.course}">${h.joined?'このコースで あそぶ':'このコースへ'} <span aria-hidden="true">→</span></button></div></article>`;}).join('');
 }
 function showJoinedHero(joined,isTest){
  const reward=el('heroJoinReward');reward.classList.toggle('hidden',!joined);
  el('result').classList.toggle('hero-joined',!!joined);
  reward.innerHTML=joined?`<img src="${joined.image}" alt="${joined.name}" width="86" height="86"><span><small>コース コンプリート！${isTest?' · テスト':''}</small><strong>${joined.name} が なかまに！</strong><span>なかまを みにいこう <b aria-hidden="true">→</b></span></span>`:'';
 }
 function practice(){start({practice:true});}
 function battleGuide(){
  if(multiplyGuideSeen||!state||state.practice||state.mode!=='normal'||state.course!=='multiply'||state.enemy!==0)return;
  guideBattle=state;state.paused=true;
  el('play').classList.add('manual-paused');el('multiplyGuide').showModal();window.GameMusic?.sync();
 }
 function closeBattleGuide(acknowledged=false){
  if(!guideBattle)return;
  if(acknowledged)multiplyGuideSeen=true;
  if(state===guideBattle){state.paused=false;lastTick=performance.now();el('play').classList.remove('manual-paused');}
  guideBattle=null;
  el('multiplyGuide').close();window.GameMusic?.sync();
  if(acknowledged)el('keypad').querySelector('[data-key="0"]')?.focus({preventScroll:true});
 }
 el('multiplyGuideStart').onclick=()=>closeBattleGuide(true);
 el('multiplyGuide').addEventListener('cancel',e=>{e.preventDefault();closeBattleGuide(true);});
 // A queued close from an older battle must not resume a newly opened guide.
 el('multiplyGuide').addEventListener('close',()=>{if(!el('multiplyGuide').open)closeBattleGuide(true);});
 function practiceGuide(){
  el('practiceCoach').classList.toggle('hidden',!state?.practice);
  if(!state?.practice)return;
  el('practiceStep').textContent=`${Math.min(3,state.done+1)} / 3`;
  const first=state.mode==='vision'?'まるの こたえを みつけて タップ！':state.course==='multiply'?'すうじを 2かい おそう！ 1けたの こたえは「0」から。':'こたえを 1かい タップしよう！';
  el('practiceMessage').textContent=state.done===0?`ぼくは レッド。${first}`:state.done===1?'いいぞ！ せいかいすると わざが でるよ。':'あと 1もん。じぶんの ちからで やってみよう！';
 }
 function practiceError(){if(state?.practice)el('practiceMessage').textContent='だいじょうぶ。もういちど かんがえよう！ シールドは へらないよ。';}
 function practiceComplete(){state.finished=true;state.locked=true;clearAttackEffect();GameSound.play('victory');screen('practiceDone');}
 function pause(){if(!state||state.finished||state.paused)return;state.paused=true;if(state.finishing){window.FinisherEffects?.setPaused(true);GameSound.stopEffects();}else clearAttackEffect();el('play').classList.add('manual-paused');el('pauseDialog').showModal();window.GameMusic?.sync();}
 function resume(){if(state)state.paused=false;window.FinisherEffects?.setPaused(false);lastTick=performance.now();el('play').classList.remove('manual-paused');window.GameMusic?.sync();}
 el('titleStart').onclick=home;el('titlePractice').onclick=practice;
 el('closeRoster').onclick=()=>el('rosterDialog').close();
 el('rosterCards').onclick=e=>{const button=e.target.closest('[data-hero-course]');if(!button)return;course=button.dataset.heroCourse;progress.activeCourse=course;selected=0;lastAttackEffectId=null;saveProgress();window.GameUI?.resetGacha();el('rosterDialog').close();home();};
 el('titleSkills').onclick=()=>el('changeEffects').click();el('titleGacha').onclick=()=>el('openGacha').click();
 for(const id of ['titleOptions','setupOptions'])el(id).onclick=()=>el('optionsDialog').showModal();
 el('closeOptions').onclick=()=>el('optionsDialog').close();el('setupToTitle').onclick=showTitle;
 el('practiceTitle').onclick=showTitle;el('practiceStart').onclick=()=>start();
 el('pauseBattle').onclick=pause;el('resumeBattle').onclick=()=>{resume();el('pauseDialog').close();};el('pauseToTitle').onclick=showTitle;
 el('pauseDialog').addEventListener('close',resume);
 for(const id of ['result','defeat'])el(id).insertAdjacentHTML('beforeend','<button class="textbtn result-to-title" type="button">タイトルへ</button>');
 document.querySelectorAll('.result-to-title').forEach(button=>button.onclick=showTitle);
 for(const id of ['result','defeat'])el(id).insertAdjacentHTML('afterbegin',`<div class="result-ranger">${hero}</div>`);
 el('effectReward').insertAdjacentHTML('afterend','<button id="heroJoinReward" class="hero-join-reward hidden" type="button" aria-label="なかまを みる"></button>');
 el('heroJoinReward').onclick=()=>{showTitle();if(!desktopTitle.matches)el('rosterDialog').showModal();};
 // Keep the three headline numbers visible; explanations live under one disclosure.
 for(const id of ['result','defeat']){
  const details=el(id).querySelector('.stats-definition');
  details.append(el(id+'AccuracyDetail'));
  const totals=el(id).querySelector('.battle-summary');if(totals)details.append(totals);
 }
 window.RangerUI={showTitle,renderRoster,showJoinedHero,practiceGuide,practiceError,practiceComplete,pause,battleGuide,closeBattleGuide};
 desktopTitle.addEventListener('change',renderRoster);
 GameSound.syncControls?.();showTitle();
})();
