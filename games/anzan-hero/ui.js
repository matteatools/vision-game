(function () {
  'use strict';
  const el = id => document.getElementById(id);
  let gachaBusy = false, gachaTimer = null, lastGachaReward = null;
  let selectedFamilyId = null, selectedSlot = 0, lastFinisherRewards = [];
  const rarityOf = effect => effect.ultimate ? {name:'ひっさつ'} : GameModel.rarities.find(item => item.id === effect.rarity);

  function renderSetup() {
    const enemy = enemies[selected];
    const rules = M.stageRules(course, selected, progress.mode);
    el('selectedEnemyArt').innerHTML = art(selected);
    el('selectedEnemyName').textContent = enemy.name;
    el('selectedEnemyDetail').textContent = enemy.powered
      ? 'うらステージ。ほんきになると こうげきが つよくなる！'
      : enemy.type;
    el('stageRule').innerHTML = `<div class="stage-mission"><div class="stage-number"><span>${rules.awakened?'うらステージ':'ステージ'}</span><strong>${rules.number}<small> / 10</small></strong></div><div class="stage-clock"><small>こうげきまで</small><strong>${rules.seconds}<span>びょう</span></strong></div>${rules.tableLabel?`<p class="stage-tables">${rules.tableLabel}</p>`:''}</div><div class="stage-track" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i+1===rules.number?'current':''}">${i+1}</i>`).join('')}</div>`;
    el('rewardRule').textContent = `クリアで シールド × ${GameModel.SHIELD_POWER[rules.rewardTier]} パワー`;
    el('startSummary').textContent = `${COURSES.find(c => c.id === course).name} ／ ${stageLabel(rules)} ／ ${rules.seconds}びょう`;
  }

  function effectImage(effect) {
    return `<div class="skill-art rarity-${effect.rarity}">${AttackEffects.icon(effect)}</div><span>${effect.name}</span><small class="effect-color-label"><i style="background:${effect.color}"></i>${effect.colorName}</small>`;
  }

  function renderPowerBalance() {
    const balance = heroCollectionProgress().heroPower;
    const remaining=GameModel.remainingGachaEffects(heroProgress()).length;
    el('gachaCourse').textContent = 'いろも ランダム！ もっていない わざ・いろが でるよ';
    el('effectCourse').textContent = GameModel.SLOT_LABELS[selectedSlot] + 'の わざ　① しゅるい → ② いろ';
    el('gachaOdds').textContent = 'きほんは いつも 49% ／ 5コンボ 49% ／ 10コンボ 2%。いつも・5コンボは、それぞれ ' + GameModel.rarities.map(r => `${r.name} ${r.weight}%`).join(' ／ ') + '。あつめおわった グループは でないよ。あいての ごほうびわざも でるよ。ビジョンごほうびの ひっさつは ガチャでは でないよ。';
    el('heroBalance').textContent = balance;
    el('gachaBalance').textContent = balance;
    el('gachaTestNote').textContent = usingTestProgress() ? 'テスト' : '';
    el('pullGacha').disabled = gachaBusy || !remaining || balance < GameModel.GACHA_COST;
    el('pullGacha').textContent = gachaBusy ? 'ヒーローパワーを かいほうちゅう…' : !remaining ? 'ガチャ コンプリート！' : '1かい ひく · 10パワー';
  }
  function resetGacha() {
    if (gachaTimer !== null) clearTimeout(gachaTimer);
    gachaTimer = null; gachaBusy = false; lastGachaReward = null;
    el('gachaReveal').className = 'gacha-reveal';
    el('gachaReveal').innerHTML = '<div class="hero-orb" aria-hidden="true"><span>✦</span></div><p>どんな ヒーローパワーに であえるかな？</p>';
    el('previewGachaSkill').classList.add('hidden'); el('gachaStatus').textContent = '';
  }

  function renderEquippedEditor() {
    const equipped = activeEffects();
    el('effectEditorTitle').textContent = 'かえたい ところを タップ！';
    el('effectCurrentSlots').innerHTML = equipped.map((effect,slot) =>
      '<button type="button" class="current-effect combo-slot '+(selectedSlot===slot?'active-slot':'')+'" data-select-slot="'+slot+'" aria-pressed="'+(selectedSlot===slot)+'" aria-label="'+GameModel.SLOT_LABELS[slot]+'のわざをかえる"><b class="slot-role">'+GameModel.SLOT_LABELS[slot]+'</b>'+effectImage(effect)+'</button>'
    ).join('');
  }
  function renderEquipment() {
    renderPowerBalance();renderEquippedEditor();
    const owned=availableEffects(),equipped=activeEffects(),current=equipped[selectedSlot],ownedIds=new Set(owned.map(e=>e.id));
    const catalog=GameModel.familiesForSlot(selectedSlot);
    if(selectedFamilyId&&!catalog.some(f=>f.id===selectedFamilyId))selectedFamilyId=null;
    el('equippedSlots').innerHTML=equipped.map((effect,slot)=>
      '<button type="button" class="equipped-slot filled" data-open-effects="'+slot+'" aria-label="'+GameModel.SLOT_LABELS[slot]+'。'+GameModel.effectLabel(effect)+'。わざをかえる"><b class="slot-role">'+GameModel.SLOT_LABELS[slot]+'</b>'+effectImage(effect)+'</button>'
    ).join('');
    el('equippedSummary').textContent='れんぞく せいかいで、わざが きまる！';
    el('effectSummary').textContent=GameModel.SLOT_LABELS[selectedSlot]+'の わざ '+new Set(owned.filter(e=>GameModel.slotAccepts(e,selectedSlot)).map(e=>e.familyId)).size+' / '+catalog.length+(usingTestProgress()?'　テスト':'');
    const pickingColor=!!selectedFamilyId;
    el('effectDialogTitle').textContent=pickingColor?GameModel.familyById.get(selectedFamilyId).name:'わざを えらぼう';
    el('backToEffectFamilies').classList.toggle('hidden',!pickingColor);
    el('effectPickerTitle').textContent=pickingColor?'② いろを えらぼう':selectedSlot===2?'10コンボの ひっさつわざ':'① '+GameModel.SLOT_LABELS[selectedSlot]+'の わざを えらぼう';
    el('effectCollection').classList.toggle('hidden',pickingColor);el('effectColors').classList.toggle('hidden',!pickingColor);el('effectColorSummary').classList.toggle('hidden',!pickingColor);
    el('effectCollection').innerHTML=catalog.map(family=>{
      const variants=GameModel.familyVariants(family.id),collected=variants.filter(e=>ownedIds.has(e.id)),chosen=current.familyId===family.id;
      const representative=chosen?current:collected[0]||variants[0],monster=enemies.find(e=>e.file===family.enemy);
      const source=family.ultimate?(family.source==='starter'?'はじめの ひっさつ':family.source==='vision'?'ビジョン コンプリート':'ガチャ'):monster?monster.name+'・ガチャ':family.starter?'はじめの わざ':'ガチャ';
      return '<button type="button" class="effect-family '+(collected.length?'owned':'locked')+(chosen?' equipped':'')+(family.ultimate?' ultimate-family':'')+'" data-family="'+family.id+'" aria-label="'+family.name+'、'+collected.length+'いろ。いろをえらぶ"><div class="family-art">'+AttackEffects.icon(representative)+'</div><strong>'+family.name+'</strong><small>'+collected.length+' / '+variants.length+' いろ</small><span class="family-source">'+source+'</span></button>';
    }).join('');
    if(!pickingColor){el('effectColors').replaceChildren();el('effectColorSummary').replaceChildren();return;}
    const family=GameModel.familyById.get(selectedFamilyId),variants=GameModel.familyVariants(family.id);
    el('effectColorSummary').innerHTML='<p>'+family.description+'</p>';
    el('effectColors').classList.toggle('single-color',variants.length===1);
    el('effectColors').innerHTML=variants.map(effect=>{
      const isOwned=ownedIds.has(effect.id),isSelected=current.id===effect.id,palette=GameModel.palettes.find(p=>p.id===effect.paletteId);
      const courseLabels={'add-basic':'たしざん<br>くりあがり なし','add-carry':'たしざん<br>くりあがり あり','sub-basic':'ひきざん<br>くりさがり なし','sub-borrow':'ひきざん<br>くりさがり あり',multiply:'かけざん'};
      const source=palette?'<span>'+courseLabels[palette.course]+'</span><b>'+(palette.back?'うらステージ':'おもて')+'</b>':'はじめから';
      const monster=enemies.find(e=>e.file===family.enemy);
      const unlock=family.source==='vision'?'ビジョン '+GameModel.visionCount(heroProgress(),family.course,family.back)+' / 10たい':family.ultimate?'ガチャ':monster?monster.name+'を たおす・ガチャ':'ガチャ';
      return '<article class="effect-color-card '+(isOwned?'owned':'locked')+(isSelected?' equipped':'')+'"><button type="button" data-equip="'+effect.id+'" aria-pressed="'+isSelected+'" aria-label="'+GameModel.effectLabel(effect)+'をえらぶ" '+(isOwned?'':'disabled')+'><div class="color-art">'+AttackEffects.icon(effect)+'</div><b><i class="color-dot" style="background:'+effect.color+'"></i>'+effect.colorName+'</b><span class="color-state">'+(isSelected?'✓ つかっている':isOwned?'これに する':'まだ もっていない')+'</span></button><small class="color-source">'+source+'</small>'+(isOwned?'<button class="color-preview" type="button" data-preview-effect="'+effect.id+'" aria-label="'+GameModel.effectLabel(effect)+'をためす">ためす</button>':'<small class="color-unlock">'+unlock+'</small>')+'</article>';
    }).join('');
  }
  function renderFinisherReward(rewards) {
    lastFinisherRewards=rewards;
    const target=el('finisherReward');target.classList.toggle('hidden',!rewards.length);
    target.innerHTML=rewards.length?'<div class="finisher-reward-art">'+AttackEffects.icon(rewards[0])+'</div><span><small>ビジョン コンプリート！</small><strong>'+rewards[0].name+'</strong><span>10コンボの わざを ゲット！ →</span></span>':'';
  }

  function renderStats(prefix, battle) {
    const stats = GameModel.battleStats(battle), victory = prefix === 'result';
    el(victory ? 'count' : 'defeatCorrect').textContent = `${stats.correct}もん`;
    el(victory ? 'accuracy' : 'defeatAccuracy').textContent = stats.accuracy === null ? '—' : `${stats.accuracy}%`;
    el(victory ? 'average' : 'defeatAverage').textContent = stats.average === null ? '—' : stats.average.toFixed(1);
    el(prefix + 'Context').textContent = `${COURSES.find(c => c.id === battle.course).name} · ${battle.mode === 'vision' ? 'ビジョン' : 'けいさん'} · ${stageLabel(battle.rules)} · ${battle.rules.seconds}びょう${battle.rules.tableLabel?' · '+battle.rules.tableLabel:''}`;
    el(prefix + 'AccuracyDetail').textContent = stats.attempts
      ? `${stats.attempts}かいの こたえのうち、${stats.correct}かい せいかい！`
      : 'まだ こたえを えらんでいないよ。';
  }

  function openDialog(id, slot=0) {
    if (id === 'effectDialog') {
      selectedSlot = slot; selectedFamilyId = null;
      renderEquipment();
      el('effectPreviewPanel').open = false;
      el('effectSelectionStatus').textContent = '';
      el('effectPreviewTarget').innerHTML = art(selected);
      el('effectPreviewName').textContent = 'わざを ためしてみよう';
    }
    if (id === 'gachaDialog') {
      renderPowerBalance();
      if (!lastGachaReward) el('gachaStatus').textContent = !GameModel.remainingGachaEffects(heroProgress()).length ? (usingTestProgress()?'テストでは ぜんぶの わざを もっているよ。':'ガチャの わざ・いろを ぜんぶ あつめたよ！') : heroCollectionProgress().heroPower < GameModel.GACHA_COST ? 'あいてを たおして、ヒーローパワーを あつめよう。' : 'じゅんびOK！ どんな わざが でるかな？';
    }
    el(id).showModal();
    window.GameMusic?.sync();
    el(id).scrollTop = 0;
  }

  el('changeEnemy').addEventListener('click', () => openDialog('enemyDialog'));
  el('changeEffects').addEventListener('click', () => openDialog('effectDialog'));
  el('resultEffectsButton').addEventListener('click', () => openDialog('effectDialog'));
  el('openGacha').addEventListener('click', () => openDialog('gachaDialog'));
  el('resultGachaButton').addEventListener('click', () => openDialog('gachaDialog'));
  el('equipGachaSkill').addEventListener('click', () => { el('gachaDialog').close(); openDialog('effectDialog',lastGachaReward?.effect.slot??0); if(lastGachaReward){selectedFamilyId=lastGachaReward.effect.familyId;renderEquipment();} });
  el('equippedSlots').addEventListener('click',e=>{const slot=e.target.closest('[data-open-effects]');if(slot)openDialog('effectDialog',Number(slot.dataset.openEffects));});
  el('finisherReward').addEventListener('click',()=>{openDialog('effectDialog',2);if(lastFinisherRewards.length){selectedFamilyId=lastFinisherRewards[0].familyId;renderEquipment();}});
  el('cards').addEventListener('click', e => { const button = e.target.closest('[data-enemy]'); if (button && !button.disabled) el('enemyDialog').close(); });
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => { el(button.dataset.closeDialog).close(); clearAttackEffect(); window.GameMusic?.sync(); }));
  document.querySelectorAll('.collection-dialog').forEach(dialog => dialog.addEventListener('close', () => { clearAttackEffect(); window.GameMusic?.sync(); }));
  el('gachaDialog').addEventListener('close', () => {
    if (gachaTimer !== null) clearTimeout(gachaTimer);
    gachaTimer = null; gachaBusy = false;
    if (lastGachaReward) revealReward(lastGachaReward);
    renderPowerBalance();
  });
  function revealReward(reward) {
    const effect = reward.effect, rarity = rarityOf(effect);
    el('gachaReveal').className = 'gacha-reveal rarity-' + effect.rarity;
    el('gachaReveal').innerHTML = `<div class="gacha-rarity">あたらしい わざ・いろ！ · ${rarity.name}</div><b class="slot-role reward-slot">${GameModel.SLOT_LABELS[effect.slot]}の わざ</b><div id="gachaSkillArt" class="gacha-skill-art">${AttackEffects.icon(effect)}</div><h3>${GameModel.effectLabel(effect)}</h3><p>${effect.description}</p>`;
    el('gachaStatus').textContent = 'ゲット！ つかう わざを えらぼう。';
    el('previewGachaSkill').classList.remove('hidden');
  }
  el('pullGacha').addEventListener('click', () => {
    if (gachaBusy) return;
    const outcome = drawHeroPower();
    if (!outcome.reward) { renderPowerBalance(); el('gachaStatus').textContent = outcome.reason==='complete'?'ガチャの わざ・いろを ぜんぶ あつめたよ！':'ヒーローパワーを 10あつめよう。'; return; }
    gachaBusy = true; lastGachaReward = outcome.reward;
    renderPowerBalance(); GameSound.play('gacha');
    el('previewGachaSkill').classList.add('hidden');
    el('gachaStatus').textContent = 'ヒーローパワー、かいほう！';
    el('gachaReveal').className = 'gacha-reveal opening';
    el('gachaReveal').innerHTML = '<div class="hero-orb" aria-hidden="true"><span>✦</span></div><p>どんな ちからが めざめるかな…</p>';
    gachaTimer = setTimeout(() => { gachaTimer = null; gachaBusy = false; revealReward(outcome.reward); renderPowerBalance(); }, 650);
  });
  el('previewGachaSkill').addEventListener('click', () => {
    if (!lastGachaReward || gachaBusy) return;
    const effect = lastGachaReward.effect;
    AttackEffects.play(effect, el('gachaSkillArt')); GameSound.playEffect(effect);
  });
  el('effectCurrentSlots').addEventListener('click',e=>{
    const slot=e.target.closest('[data-select-slot]');if(!slot)return;
    selectedSlot=Number(slot.dataset.selectSlot);selectedFamilyId=null;el('effectSelectionStatus').textContent='';renderEquipment();
  });
  el('backToEffectFamilies').addEventListener('click',()=>{selectedFamilyId=null;el('effectSelectionStatus').textContent='';renderEquipment();});
  function handleEffectClick(e){
    const family=e.target.closest('[data-family]');
    if(family){selectedFamilyId=family.dataset.family;renderEquipment();el('effectSelectionStatus').textContent='';el('effectPickerHeading').scrollIntoView({block:'nearest'});return;}
    const equip=e.target.closest('[data-equip]');
    if(equip&&!equip.disabled){
      equipEffectForSlot(equip.dataset.equip,selectedSlot);
      el('effectColors').querySelector('[data-equip="'+equip.dataset.equip+'"]')?.focus({preventScroll:true});return;
    }
    const preview = e.target.closest('[data-preview-effect]');
    if (preview) {
      const effect = (testMode ? GameModel.effects : availableEffects()).find(item => item.id === preview.dataset.previewEffect);
      if (effect) {
        el('effectPreviewPanel').open = true;
        el('effectPreviewName').textContent = GameModel.effectLabel(effect);
        el('effectDialog').scrollTop = 0;
        window.AttackEffects?.play(effect, el('effectPreviewTarget'));
        GameSound.playEffect(effect);
      }
    }
  }
  el('effectCollection').addEventListener('click', handleEffectClick);
  el('effectColors').addEventListener('click', handleEffectClick);
  window.GameUI = { renderSetup, renderEquipment, renderStats, renderPowerBalance, resetGacha, renderFinisherReward };
  renderSetup();
  renderEquipment();
})();
