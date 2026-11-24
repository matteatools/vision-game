(()=>{
  'use strict';
  const $=id=>document.getElementById(id),core=globalThis.FlashMath;
  // Only these independent preferences are saved. Battle progress is never read or written.
  const key='hero-flash-training-settings-v1';
  let settings={...core.defaults},round=null,phase='setup',raf=0,startTime=0,lastFrame='',ownsFullscreen=false;
  let runId=0;
  let heroAnswer=[],heroHistory=[],activeSlot=0,heroAssetsReady=false,heroAssetsFailed=false;
  const heroById=new Map(core.heroes.map(h=>[h.id,h]));
  try{settings=core.sanitize(JSON.parse(localStorage.getItem(key)));}catch{}
  for(let i=1;i<=100;i++){
    const option=document.createElement('option');
    option.value=(i/10).toFixed(1);option.textContent=option.value;$('seconds').append(option);
  }
  const fmt=n=>Number(n).toLocaleString('ja-JP'),seconds=n=>Number(n).toFixed(1).replace(/\.0$/,'');
  function save(){try{localStorage.setItem(key,JSON.stringify(settings));}catch{}}
  function renderSettings(){
    const heroMode=settings.mode==='heroes';
    document.body.classList.toggle('hero-mode',heroMode);
    for(const b of $('mode-options').children)b.setAttribute('aria-pressed',String(b.dataset.mode===settings.mode));
    $('digits-field').hidden=heroMode;$('number-count-field').hidden=heroMode;$('hero-count-field').hidden=!heroMode;
    $('mode-tag').textContent=heroMode?'おぼえる':'たしざん';
    $('intro-copy').textContent=heroMode?'ヒーローが でてくる じゅんばんを おぼえよう！':'でてくる すうじを、ぜんぶ たそう！';
    $('speed-title').textContent=heroMode?'ヒーローの はやさ':'すうじの はやさ';
    $('seconds').setAttribute('aria-label',heroMode?'ひとりの ヒーローを だす じかん':'ひとつの すうじを だす じかん');
    $('preview-number').hidden=heroMode;$('preview-hero').hidden=!heroMode;
    $('preview-instruction').textContent=heroMode?'みて、おぼえて、ならべよう！':'みて、たして、ひらめこう！';
    $('guide-step1').textContent=heroMode?'はやさと かずを えらぼう。':'けた・はやさ・かずを えらぼう。';
    $('guide-copy1').textContent=heroMode?'はじめは「3びょう・3こ」から。':'はじめは「1けた・3びょう・5こ」から。';
    $('guide-copy2').textContent=heroMode?'ヒーローが でてくる じゅんばんを おぼえよう。おなじ ヒーローが あとで また でることも あるよ。':'でてくる すうじを、あたまの なかで たそう。';
    $('guide-step3').textContent=heroMode?'でてきた じゅんに タップ！':'ぜんぶで、いくつ？';
    $('guide-copy3').textContent=heroMode?'ならべた ところを タップすると なおせるよ。':'さいごに こたえを いれてね。';
    $('start').disabled=heroMode&&!heroAssetsReady;
    for(const [id,prop] of [['digits-options','digits'],['count-options','count'],['hero-count-options','heroCount']]){
      for(const b of $(id).children)b.setAttribute('aria-pressed',String(Number(b.dataset.value)===settings[prop]));
    }
    $('seconds').value=settings.seconds.toFixed(1);$('speed-range').value=settings.seconds;
    const pct=(settings.seconds-.1)/9.9*100;
    $('speed-range').style.background=`linear-gradient(to right,var(--accent) ${pct}%,#3a424d ${pct}%)`;
    $('speed-caption').textContent=settings.seconds>=5?'じっくり あわてずに':settings.seconds>=2?'ゆっくり かんがえよう':settings.seconds>=1?'リズムよく いこう':'スピードに チャレンジ';
    for(const b of document.querySelectorAll('[data-seconds]'))b.setAttribute('aria-pressed',String(Number(b.dataset.seconds)===settings.seconds));
    $('fullscreen').checked=settings.fullscreen;
    $('preview-number').textContent=['7','24','128','1024'][settings.digits-1];
    $('preview-number').dataset.digits=settings.digits;
    $('challenge-summary').textContent=roundText(settings);
    save();
  }
  for(const [id,prop] of [['digits-options','digits'],['count-options','count'],['hero-count-options','heroCount']]){
    $(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;settings[prop]=Number(b.dataset.value);renderSettings();});
  }
  $('mode-options').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    settings.mode=b.dataset.mode;$('setup-notice').textContent=settings.mode==='heroes'&&!heroAssetsReady?(heroAssetsFailed?'ヒーローを よみこめなかったよ。もういちど ひらいてね':'ヒーローを よびだしているよ…'):'';
    renderSettings();
  });
  function changeSpeed(value){settings.seconds=core.sanitize({...settings,seconds:Number(value)}).seconds;renderSettings();}
  $('seconds').addEventListener('change',e=>changeSpeed(e.target.value));
  $('speed-range').addEventListener('input',e=>changeSpeed(e.target.value));
  for(const b of document.querySelectorAll('[data-seconds]'))b.addEventListener('click',()=>changeSpeed(b.dataset.seconds));
  $('fullscreen').addEventListener('change',e=>{settings.fullscreen=e.target.checked;save();});

  function screen(name){
    for(const id of ['setup','game','answer-screen','hero-answer-screen','result-screen'])$(id).hidden=id!==name;
    document.body.classList.toggle('in-session',name==='game');
    window.scrollTo(0,0);
  }
  function leaveFullscreen(){
    const leave=ownsFullscreen&&document.fullscreenElement;
    ownsFullscreen=false;
    if(leave)document.exitFullscreen?.().catch(()=>{});
  }
  function back(message=''){
    runId++;cancelAnimationFrame(raf);phase='setup';leaveFullscreen();screen('setup');
    $('setup-notice').textContent=message;$('start').focus({preventScroll:true});
  }
  function closeTraining(e){
    if(window.parent===window)return;
    e?.preventDefault();back();
    window.parent.postMessage({type:'hero-flash-close'},location.protocol==='file:'?'*':location.origin);
  }
  $('back-home').addEventListener('click',closeTraining);

  function start(){
    if(phase==='countdown'||phase==='numbers')return;
    const heroMode=settings.mode==='heroes';
    if(heroMode&&!heroAssetsReady)return;
    const id=++runId;
    round={settings:{...settings},numbers:heroMode?[]:core.generate(settings),heroIds:heroMode?core.generateHeroes(settings):[]};
    round.sum=round.numbers.reduce((a,b)=>a+b,0);
    phase='countdown';lastFrame='';$('setup-notice').textContent='';
    $('answer-input').value='';$('answer-error').textContent='';$('answer-input').removeAttribute('aria-invalid');
    screen('game');$('game').classList.add('countdown');
    $('game').setAttribute('aria-label',heroMode?'ヒーローの じゅんばん':'フラッシュあんざん');
    $('game-hero').hidden=true;$('game-number').hidden=false;
    $('game-number').style.visibility='visible';$('game-number').style.fontSize='min(60dvh, 70vw)';
    $('game-number').textContent='3';$('game-progress').style.transform='scaleX(0)';
    $('game-instruction').textContent='じゅんびは いい？';$('game-status').textContent='もうすぐ はじまるよ';
    $('game-footnote').textContent=heroMode?'でてきた じゅんに おぼえてね':'ぜんぶ たしてね';
    $('game-announcement').textContent='3びょうで はじまるよ';$('quit').focus({preventScroll:true});
    if(settings.fullscreen&&!document.fullscreenElement&&document.documentElement.requestFullscreen){
      document.documentElement.requestFullscreen().then(()=>{
        if(id===runId&&(phase==='countdown'||phase==='numbers'))ownsFullscreen=true;
        else if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
      }).catch(()=>{});
    }
    startTime=performance.now();raf=requestAnimationFrame(tick);
  }
  function tick(now){
    if(phase!=='countdown'&&phase!=='numbers')return;
    const f=core.frameAt(now-startTime,round.settings);
    if(f.phase==='answer'){finish();return;}
    const stamp=`${f.phase}-${f.value??f.index}-${f.visible??true}`;
    if(stamp!==lastFrame){
      lastFrame=stamp;
      if(f.phase==='countdown')$('game-number').textContent=f.value;
      else{
        const heroMode=round.settings.mode==='heroes';
        if(phase==='countdown'){
          phase='numbers';$('game').classList.remove('countdown');$('game-instruction').textContent='';
          $('game-number').hidden=heroMode;$('game-hero').hidden=!heroMode;
          $('game-number').style.fontSize=`min(60dvh, ${Math.min(78,142/round.settings.digits)}vw)`;
          $('game-announcement').textContent=heroMode?'ヒーローが でるよ':'すうじを だすよ';
        }
        if(heroMode){
          const h=heroById.get(round.heroIds[f.index]);
          if($('game-hero-image').dataset.hero!==h.id){
            $('game-hero-image').src=h.image;$('game-hero-image').alt=h.name;$('game-hero-image').dataset.hero=h.id;
            $('game-hero-name').textContent=h.name;
          }
          $('game-hero').style.visibility=f.visible?'visible':'hidden';
        }else{
          $('game-number').textContent=round.numbers[f.index];
          $('game-number').style.visibility=f.visible?'visible':'hidden';
        }
        $('game-status').textContent=`${f.index+1} / ${core.countFor(round.settings)}`;
      }
    }
    $('game-progress').style.transform=`scaleX(${f.progress})`;raf=requestAnimationFrame(tick);
  }
  function roundText(s=round.settings){return s.mode==='heroes'?`${s.heroCount}こ・${seconds(s.seconds)}びょうずつ`:`${s.digits}けた・${s.count}こ・${seconds(s.seconds)}びょうずつ`;}
  function finish(){
    cancelAnimationFrame(raf);phase='answer';leaveFullscreen();
    if(round.settings.mode==='heroes'){
      heroAnswer=Array(round.settings.heroCount).fill(null);heroHistory=[];activeSlot=0;
      screen('hero-answer-screen');$('hero-round-settings').textContent=roundText();renderHeroAnswer();
      $('hero-slots').firstElementChild.focus({preventScroll:true});
    }else{
      screen('answer-screen');$('round-settings').textContent=roundText();$('answer-input').focus({preventScroll:true});
    }
  }
  function heroMarkup(id){
    const h=heroById.get(id);
    return `<img class="hero-face" src="${h.image}" alt="" width="90" height="90"><span class="hero-name">${h.name}</span>`;
  }
  function renderHeroAnswer(){
    $('hero-slots').replaceChildren();
    heroAnswer.forEach((id,i)=>{
      const b=document.createElement('button');b.type='button';b.className='hero-slot';b.dataset.slot=i;
      b.setAttribute('aria-pressed',String(i===activeSlot));
      b.setAttribute('aria-label',`${i+1}ばんめ：${id?heroById.get(id).name:'まだ えらんでいない'}。タップで なおせるよ`);
      b.innerHTML=`<span class="slot-number">${i+1}</span>${id?heroMarkup(id):'<span class="slot-empty" aria-hidden="true">？</span>'}`;
      $('hero-slots').append(b);
    });
    const filled=heroAnswer.filter(Boolean).length;
    $('hero-answer-status').textContent=activeSlot<0?'ぜんぶ ならべたね！ こたえあわせを しよう':`${activeSlot+1}ばんめを えらぼう（${filled} / ${heroAnswer.length}）`;
    $('hero-check').disabled=filled!==heroAnswer.length;$('hero-undo').disabled=!heroHistory.length;$('hero-clear').disabled=!filled;
    for(const b of $('hero-bank').children)b.disabled=activeSlot<0;
  }
  for(const h of core.heroes){
    const b=document.createElement('button');b.type='button';b.className='hero-choice';b.dataset.hero=h.id;b.setAttribute('aria-label',h.name);b.innerHTML=heroMarkup(h.id);$('hero-bank').append(b);
  }
  function rememberHeroEdit(){heroHistory.push({order:[...heroAnswer],slot:activeSlot});}
  function answeringHeroes(){return phase==='answer'&&round?.settings.mode==='heroes';}
  $('hero-slots').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!answeringHeroes())return;
    activeSlot=Number(b.dataset.slot);renderHeroAnswer();$('hero-slots').children[activeSlot].focus({preventScroll:true});
  });
  $('hero-bank').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!answeringHeroes()||activeSlot<0)return;
    rememberHeroEdit();heroAnswer[activeSlot]=b.dataset.hero;activeSlot=heroAnswer.findIndex(id=>id===null);
    renderHeroAnswer();if(activeSlot<0)$('hero-check').focus({preventScroll:true});
  });
  $('hero-undo').addEventListener('click',()=>{
    if(!answeringHeroes())return;const previous=heroHistory.pop();if(!previous)return;
    heroAnswer=previous.order;activeSlot=previous.slot;renderHeroAnswer();
  });
  $('hero-clear').addEventListener('click',()=>{
    if(!answeringHeroes())return;rememberHeroEdit();heroAnswer.fill(null);activeSlot=0;renderHeroAnswer();
  });
  $('hero-check').addEventListener('click',()=>{if(answeringHeroes()&&heroAnswer.every(Boolean))showResult([...heroAnswer]);});
  $('hero-reveal').addEventListener('click',()=>{if(answeringHeroes())showResult(null);});
  function renderHeroResult(id,order,matches){
    $(id).replaceChildren();order.forEach((heroId,i)=>{
      const li=document.createElement('li');li.className='hero-result-item'+(matches?(matches[i]?' is-correct':' is-wrong'):'');
      li.setAttribute('aria-label',`${i+1}ばんめ ${heroById.get(heroId).name}${matches?(matches[i]?'、せいかい':'、ちがうよ'):''}`);
      li.innerHTML=`<span class="slot-number">${i+1}</span>${heroMarkup(heroId)}${matches?`<span class="order-mark">${matches[i]?'✓':'×'}</span>`:''}`;
      $(id).append(li);
    });
  }
  function showResult(answer){
    if(phase!=='answer')return;
    const heroMode=round.settings.mode==='heroes',reveal=answer===null;
    const orderResult=heroMode&&!reveal?core.checkOrder(round.heroIds,answer):null;
    const correct=heroMode?!!orderResult?.correct:answer===round.sum;
    phase='result';screen('result-screen');
    document.querySelector('.result-card').classList.toggle('review',!correct);
    document.querySelector('.result-card').classList.toggle('hero-result-card',heroMode);
    document.querySelector('.correct-answer').hidden=heroMode;document.querySelector('.calculation').hidden=heroMode;$('hero-comparison').hidden=!heroMode;
    $('result-symbol').textContent=correct?'✓':reveal?'＋':'↻';
    $('result-title').textContent=correct?'せいかい！':reveal?'こたえを みてみよう':'もういちど やってみよう！';
    if(heroMode){
      $('your-answer').textContent=reveal?'でてきた じゅんばんを たしかめよう':correct?'じゅんばんどおりに できたね！':`${round.heroIds.length}このうち ${orderResult.matched}この ばしょが あっていたよ`;
      $('hero-yours-section').hidden=reveal;
      if(!reveal)renderHeroResult('hero-yours',answer,orderResult.matches);
      renderHeroResult('hero-correct',round.heroIds);
    }else{
      $('your-answer').textContent=reveal?'でてきた すうじを たしかめよう':`きみの こたえ：${fmt(answer)}`;
      $('correct-answer').textContent=fmt(round.sum);
      $('calculation').textContent=`${round.numbers.map(fmt).join(' ＋ ')} ＝ ${fmt(round.sum)}`;
      document.querySelector('.calculation').open=false;
    }
    $('result-settings').textContent=roundText();$('retry').focus({preventScroll:true});
  }
  $('answer-form').addEventListener('submit',e=>{
    e.preventDefault();if(phase!=='answer'||round.settings.mode!=='numbers')return;
    const answer=core.parseAnswer($('answer-input').value);
    if(answer===null){$('answer-error').textContent='こたえを すうじで いれてね';$('answer-input').setAttribute('aria-invalid','true');$('answer-input').focus();return;}
    showResult(answer);
  });
  $('answer-input').addEventListener('input',()=>{$('answer-error').textContent='';$('answer-input').removeAttribute('aria-invalid');});
  $('start').addEventListener('click',start);$('retry').addEventListener('click',start);
  $('quit').addEventListener('click',()=>back());
  for(const id of ['answer-back','hero-back','result-back'])$(id).addEventListener('click',()=>back());
  $('reveal').addEventListener('click',()=>showResult(null));
  $('guide-open').addEventListener('click',()=>$('guide').showModal());
  for(const id of ['guide-close','guide-done'])$(id).addEventListener('click',()=>$('guide').close());
  document.addEventListener('keydown',e=>{
    if($('guide').open)return;
    if(e.key==='Escape'){
      if(phase!=='setup'){e.preventDefault();back();}
      else if(window.parent!==window)closeTraining(e);
    }
    if(e.key==='Enter'&&phase==='setup'&&e.target===document.body){e.preventDefault();start();}
  });
  // As in the original app, never keep showing unseen numbers in a background tab.
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&(phase==='countdown'||phase==='numbers'))back('がめんが かわったよ。もういちど はじめよう！');
  });
  document.addEventListener('fullscreenchange',()=>{
    if(ownsFullscreen&&!document.fullscreenElement){ownsFullscreen=false;if(phase==='countdown'||phase==='numbers')back();}
  });
  renderSettings();
  if(settings.mode==='heroes')$('setup-notice').textContent='ヒーローを よびだしているよ…';
  // Decode all five sprites before enabling this mode, so a first flash is never a loading image.
  Promise.all(core.heroes.map(h=>{const img=new Image();img.src=h.image;return img.decode();})).then(()=>{
    heroAssetsReady=true;renderSettings();if(settings.mode==='heroes')$('setup-notice').textContent='';
  }).catch(()=>{heroAssetsFailed=true;if(settings.mode==='heroes')$('setup-notice').textContent='ヒーローを よみこめなかったよ。もういちど ひらいてね';});
})();
