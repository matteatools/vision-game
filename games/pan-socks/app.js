/* Screen orchestration, rendering and pointer input. Rules live in game-core.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const board = $('board'), wrap = $('board-wrap'), pauseDialog = $('pause-dialog'), modeDialog = $('mode-dialog');
  let game = null, modeId = Socks.MODES[Math.min(Save.progress(), 29)].id, size = 76, drag = null, lastFrame = 0, raf = 0;
  const incidentVisitors = [$('incident-visitor'), ...[1,2].map(slot => { const img = document.createElement('img'); img.className = 'incident-visitor'; img.dataset.slot = slot; img.src = 'assets/ghost.svg'; img.alt = ''; img.setAttribute('aria-hidden','true'); img.hidden = true; wrap.appendChild(img); return img; })];
  function syncEffects() {
    const types = game?.effect?.types || [];
    wrap.dataset.effect = game?.effect?.type || ''; wrap.dataset.effects = types.join(' ');
    incidentVisitors.forEach((img,i) => { img.hidden = !types[i]; if(types[i]) { img.src='assets/'+types[i]+'.svg'; img.dataset.kind=types[i]; } });
    if (!types.includes('dragon')) wrap.dataset.breath = '';
    if (types.includes('fairy')) paintLight();
    if (game) game.cards.forEach((c,i) => { if(nodes[i])nodes[i].innerHTML = sockSVG(c.color,c.pattern,types.includes('wizard')?1+c.id%3:0,types.includes('devil')); });
  }
  let nodes = [], messageUntil = 0, expressionUntil = 0, visitors = {}, lessonReady = true, lastPaint = 0;
  const selectedMode = () => Socks.MODES.find(m => m.id === modeId) || Socks.MODES[0];
  const modeRecord = m => m.day <= 10 ? 'story-v1:normal:' + m.id : 'story20pairs:' + m.day;
  const recordId = () => modeRecord(selectedMode());
  const hasIncident = m => m.cat || m.baby || m.incident || m.rescue;
  // Temporary playtest access; set false to restore normal chapter locks.
  const TEST_UNLOCK_ALL = false;
  const accessibleDay = () => TEST_UNLOCK_ALL ? 30 : Math.min(30, Save.progress() + 1);
  const timeWords = m => m.limit === 60000 ? '1ぷん' : '1ぷん30びょう';
  function intro() {
    cancelAnimationFrame(raf); clearDrag(); if (game) game.stop(); game = null; Sound.stop();
    if (selectedMode().day > accessibleDay()) modeId = Socks.MODES[accessibleDay() - 1].id;
    const m = selectedMode(); screen('intro-screen');
    $('intro-day').textContent = m.day + 'にちめ / 30にち'; $('intro-story').textContent = m.story;
    const illustrations = m.hazards.length ? m.hazards : [m.day === 11 ? 'centipede' : 'pan'];
    $('intro-art').replaceChildren(...illustrations.map(kind => {
      if (kind === 'rescue') {
        const sock = document.createElement('span');
        sock.innerHTML = sockSVG('#fffdf7', 'solid');
        return sock;
      }
      const img = document.createElement('img');
      img.alt = '';
      img.src = ['cat', 'baby', 'pan'].includes(kind) ? kind + '.svg' : 'assets/' + kind + '.svg';
      return img;
    }));
    $('intro-rules').textContent = m.pairs + 'くみを ' + timeWords(m) + 'いないに そろえよう。';
    $('intro-tip').textContent = m.tip; $('intro-start').focus({ preventScroll: true });
  }
  let boardWidth = 1, boardHeight = 1;
  let lightX = .5, lightY = .5;
  function paintLight() {
    board.style.setProperty('--light-x', lightX * boardWidth + 'px');
    board.style.setProperty('--light-y', lightY * boardHeight + 'px');
    board.style.setProperty('--light-radius', Math.sqrt(boardWidth * boardHeight * .35 / Math.PI) + 'px');
  }
  function moveLight(e) {
    if (!game?.active || (drag && drag.pointerId !== e.pointerId)) return;
    const b = board.getBoundingClientRect();
    lightX = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
    lightY = Math.max(0, Math.min(1, (e.clientY - b.top) / b.height));
    if (game.hasEffect('fairy')) paintLight();
  }
  const fmt = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const practiceText = [
    'ぼくは パン。おなじ いろ と もようを ふたつ タップしてね。',
    'かさなっているね。くつしたを ひっぱって、はなしてみよう。',
    'つぎは おじゃまの れんしゅう。ためしてみよう。'
  ];
  function screen(id) { for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id; }
  function say(text, duration = 0) { $('message').textContent = text; messageUntil = duration && game ? game.time + duration : 0; }
  function defaultMessage() {
    if (!game) return '';
    if (game.practice) {
      if (game.stage === 1 && game.dragged) return 'うごかせたね。いろも もようも おなじペアを さがそう。';
      if (game.stage === 2 && game.babyShown) return 'あかちゃんが もどしたね。もういちど そろえよう。';
      if (game.stage === 2 && lessonReady) return game.mode.tip;
      if (game.stage === 2 && game.mode.hazards.length > 1) return game.mode.tip;
      if (game.stage === 2) return game.mode.rescue ? 'かたほうが まっしろに。いれかわる もようを おぼえよう。' : 'つぎは ' + (game.mode.cat ? 'ねこ' : game.mode.baby ? 'あかちゃん' : Socks.INCIDENTS[game.mode.incident].name) + 'の れんしゅう。ためしてみよう。';
      return practiceText[game.stage];
    }
    return game.mode.tip;
  }
  function expression(name, duration = 1500) { $('pan-image').src = name === 'normal' ? 'pan.svg' : 'assets/pan-' + name + '.svg'; expressionUntil = duration ? game.time + duration : 0; }
  function title() {
    cancelAnimationFrame(raf); if (game) game.stop(); game = null; clearDrag();
    Sound.stop(); syncEffects(); if (pauseDialog.open) pauseDialog.close(); screen('title-screen');
    $('chosen-mode').textContent = selectedMode().day + 'にちめ・' + selectedMode().name;
    $('journey-progress').textContent = Save.progress() + ' / 30にち クリア' + (TEST_UNLOCK_ALL ? '・おためし 全ステージかいほう中' : '');
    $('start-button').focus({ preventScroll: true });
  }
  function updateSound() { document.querySelectorAll('[data-sound]').forEach(el => { el.textContent = Sound.muted ? 'おと なし' : 'おと あり'; el.setAttribute('aria-pressed', String(!Sound.muted)); }); }
  let modePage = 0;
  const lastModePage = () => TEST_UNLOCK_ALL ? 2 : Math.min(2, Math.floor(Save.progress() / 10));
  function renderModePage() {
    modePage = Math.max(0, Math.min(modePage, lastModePage()));
    $('mode-pages').replaceChildren(...Array.from({length:lastModePage()+1}, (_,page) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mode-page'; b.dataset.page = page;
      b.textContent = (page+1) + 'ページめ'; b.setAttribute('aria-label', (page+1) + 'ページめ：' + (page*10+1) + '〜' + (page*10+10) + 'にち');
      if(page===modePage)b.setAttribute('aria-current','page');
      b.onclick=()=>{modePage=page;renderModePage();$('mode-pages').querySelector(`[data-page="${page}"]`).focus();}; return b;
    }));
    $('mode-page-range').textContent = (modePage*10+1) + '〜' + (modePage*10+10) + 'にち';
    $('mode-list').replaceChildren(...Socks.MODES.slice(modePage*10, modePage*10+10).map(m => {
      const b = document.createElement('button'); b.className = 'mode-option'; b.dataset.mode = m.id;
      b.disabled = m.day > accessibleDay(); const best = Save.best(modeRecord(m));
      b.setAttribute('aria-pressed', String(m.id === modeId)); b.innerHTML = `<span class="mode-number">${String(m.day).padStart(2,'0')}</span><span><strong>${m.name}</strong><small>${b.disabled ? 'まえのひを クリアすると ひらく' : m.pairs + 'くみ・' + timeWords(m) + (best ? '・きろく ' + fmt(best) : '')}</small></span>`;
      b.onclick = () => { modeId = m.id; modeDialog.close(); title(); }; return b;
    })); $('mode-list').scrollTop = 0;
  }
  function chooseMode() {
    modePage = Math.min(lastModePage(), Math.floor((selectedMode().day-1)/10));
    renderModePage(); modeDialog.showModal();
  }
  async function start(stage = -1) {
    cancelAnimationFrame(raf); Sound.stop(); clearDrag(); if (game) game.stop();
    await Sound.unlock();
    // A single user gesture can only start one screen transition.
    if (pauseDialog.open) pauseDialog.close();
    const params = new URLSearchParams(location.search);
    const seed = params.has('seed') ? Number(params.get('seed')) : Date.now();
    game = new Socks.Game(stage === 2 ? (hasIncident(selectedMode()) ? modeId : 2) : stage >= 0 ? 1 : modeId, seed, stage);
    screen('play-screen'); $('play-screen').classList.remove('paused'); nodes = []; visitors = {}; messageUntil = 0; expressionUntil = 0; lastPaint = 0;
    incidentVisitors.forEach(img=>img.hidden=true); wrap.dataset.effect = ''; wrap.dataset.effects = ''; wrap.dataset.breath = ''; lightX = lightY = .5;
    $('pan-image').src = 'pan.svg'; $('visitor-cat').classList.remove('show'); $('visitor-baby').classList.remove('show');
    $('mode-name').textContent = game.practice ? 'れんしゅう' : game.mode.day + 'にちめ・' + game.mode.name;
    const best = Save.best(recordId()); $('best-label').textContent = game.practice ? 'あせらず やってみよう' : best ? 'きろく ' + fmt(best) : timeWords(game.mode) + 'で おかたづけ';
    $('lesson-label').textContent = game.practice ? `パン・${stage + 1} / 3` : 'パン';
    $('obstacles').hidden = game.practice || !hasIncident(game.mode);
    $('incident-label').textContent = game.mode.cat ? 'ねこ' : game.mode.baby ? 'あかちゃん' : game.mode.rescue ? 'すくおう' : Socks.INCIDENTS[game.mode.incident]?.name || '';
    if (game.mode.hazards.length > 1) $('incident-label').textContent = 'おじゃま ×' + game.mode.hazards.length;
    $('board-help').hidden = !game.practice && hasIncident(game.mode);
    $('lesson-action').hidden = !(game.practice && stage === 2); $('lesson-action').textContent = 'ためしてみる'; lessonReady = !(game.practice && stage === 2);
    board.replaceChildren();
    for (const c of game.cards) {
      const el = document.createElement('button'); el.className = 'sock'; el.dataset.card = c.id; el.type = 'button';
      el.setAttribute('aria-label', c.colorName + 'の ' + c.patternName + 'の くつした');
      el.innerHTML = sockSVG(c.color, c.pattern); board.appendChild(el); nodes.push(el);
    }
    wrap.classList.toggle('has-character', game.mode.incidents.some(type => type !== 'hole'));
    arrange(); resize(); say(defaultMessage()); render(); lastFrame = performance.now(); raf = requestAnimationFrame(frame);
    Sound.startMusic();
    $('pause-button').focus({ preventScroll: true });
  }
  function arrange() {
    const b = board.getBoundingClientRect(), n = game.cards.length;
    const cols = Math.ceil(Math.sqrt(n * b.width / Math.max(1, b.height))), rows = Math.ceil(n / cols);
    game.cards.forEach((c, i) => { c.x = (i % cols + .5 + (game.rng() - .5) * .45) / cols; c.y = (Math.floor(i / cols) + .5 + (game.rng() - .5) * .4) / rows; });
    if (game.practice && game.stage === 1) {
      // The top socks really cover partners; moving any sock unlocks matching.
      game.cards.forEach((c, i) => { c.x = .3 + (i % 3) * .2; c.y = i < 3 ? .48 : .52; c.rotation = i < 3 ? -15 : 12; });
    }
  }
  function clamp(c) {
    const b = board.getBoundingClientRect(), margin = size * .71;
    const xpad = Math.min(.45, margin / b.width), ypad = Math.min(.45, margin / b.height);
    c.x = Math.max(xpad, Math.min(1 - xpad, c.x)); c.y = Math.max(ypad, Math.min(1 - ypad, c.y));
  }
  function resize() {
    if (!game || $('play-screen').hidden) return;
    clearDrag(); const b = board.getBoundingClientRect();
    if (!b.width || !b.height) return;
    board.classList.add('resizing');
    boardWidth = b.width; boardHeight = b.height;
    paintLight();
    size = Math.max(52, Math.min(game.practice ? 105 : 96, Math.sqrt(b.width * b.height / (game.cards.length * .66))));
    board.style.setProperty('--sock-size', size + 'px'); game.cards.forEach(clamp); renderCards();
    void board.offsetWidth; board.classList.remove('resizing');
  }
  function position(c, el, dx = 0, dy = 0) {
    const off = game.motionOffset(c);
    el.style.setProperty('--rotation', c.rotation + off.angle + 'deg');
    const px = Math.max(size * .71, Math.min(boardWidth - size * .71, (c.x + off.x) * boardWidth));
    const py = Math.max(size * .71, Math.min(boardHeight - size * .71, (c.y + off.y) * boardHeight));
    el.style.transform = `translate(${px - size / 2 + dx}px,${py - size / 2 + dy}px) rotate(${c.rotation + off.angle}deg)`;
    el.style.zIndex = c.z;
  }
  function renderCards() {
    if (!game) return;
    game.cards.forEach((c, i) => { const el = nodes[i]; const white = game.isWhite(c); el.classList.toggle('blank', white); el.setAttribute('aria-label', white ? 'まっしろな くつした' : c.colorName + 'の ' + c.patternName + 'の くつした'); el.classList.toggle('selected', game.selected.includes(i)); el.classList.toggle('matched', c.matched); el.disabled = c.matched; el.setAttribute('aria-pressed', String(game.selected.includes(i))); if (drag?.id !== i) position(c, el); });
  }
  function render() {
    if (!game) return;
    $('matched-label').textContent = game.matched; $('total-label').textContent = game.cards.length / 2;
    $('time-label').textContent = game.practice ? '—' : fmt(Math.ceil(Math.max(0, game.limit - game.time) / 1000) * 1000);
    $('time-label').classList.toggle('urgent', !game.practice && game.limit - game.time <= 10000);
    const period = game.mode.baby ? 20000 : game.mode.cat ? 15000 : 14000;
    const next = game.mode.baby ? game.nextBaby : game.mode.cat ? game.nextCat : game.nextIncident;
    const fraction = game.effect ? (game.effect.end - game.time) / (game.effect.end-game.effect.start) : 1 - (next - game.time) / period;
    $('incident-progress').style.transform = 'scaleX(' + Math.min(1,Math.max(0,fraction)) + ')';
    $('incident-status').textContent = game.effect ? 'あと ' + Math.ceil((game.effect.end-game.time)/1000) + 'びょう' : '';
    if (game.mode.rescue) { $('incident-progress').style.transform = 'scaleX(' + (1 - ((game.time - game.rescueStart) % 3000) / 3000) + ')'; $('incident-status').textContent = (game.time - game.rescueStart) % 3000 >= 2000 ? 'いまは りょうほう みえる' : '2びょう＋ひとやすみ'; }

  }
  function events() {
    const queue = game.drain();
    for (const e of queue) {
      Sound.play(e.type);
      if (e.type === 'select') say(game.practice && game.stage === 0 ? 'おなじものを もうひとつ。おなじくつしたを タップで とりけし。' : 'もうひとつ。おなじ いろ と もようは どれかな？');
      if (e.type === 'cancel') say('えらびなおせるよ。ゆっくり さがそう。', 2000);
      if (e.type === 'drag') say(defaultMessage());
      if (e.type === 'miss') {
        const [a, b] = e.ids.map(i => game.cards[i]);
        say(a.color === b.color ? 'いろは おなじ。もようを よく みてみよう。' : 'いろが ちがうみたい。もういちど みてみよう。', 3500); expression('thinking');
        e.ids.forEach(i => { nodes[i].classList.add('miss'); nodes[i].dataset.missUntil = game.time + 650; });
      }
      if (e.type === 'match') { say(e.combo > 1 ? `${e.combo}くみ れんぞく。こつこつ、いいちょうし。` : 'ひとくみ、そろった。いいちょうし。', 2200); expression('happy'); }
      if (e.type === 'cat' || e.type === 'baby') {
        const el = $('visitor-' + e.type); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); if (e.type === 'baby') visitors.baby = game.time + 2700;
        say(e.type === 'cat' ? 'あっ、ねこが かけぬける！' : game.practice ? defaultMessage() : `あかちゃんが ${e.count}くみ もどしたよ。もういちど、こつこつ。`, 4000); expression('thinking'); game.cards.forEach(clamp);
      }
      if (e.type === 'incident' || e.type === 'incidentEnd') {
        const on = e.type === 'incident', type = e.incident;
        syncEffects();
        say(on ? game.mode.hazards.length>1 ? game.mode.tip : Socks.INCIDENTS[type].message : type === 'hole' ? 'あつまったね。ひとつずつ ひっぱりだそう。' : type === 'ghost' ? 'やっと おちついたね。つづきを そろえよう。' : 'もとに もどったね。つづきを そろえよう。',4000);
        if (on) { Sound.play(type); expression('thinking'); }
      }
      if (e.type === 'scatter') game.cards.forEach(clamp);
      if (e.type === 'sneeze') { game.cards.forEach(clamp); say('はっくしょん！ ' + e.direction + 'へ とんでいった。', 1800); }
      if (e.type === 'catGone') $('visitor-cat').classList.remove('show');
      if (e.type === 'win') win();
      if (e.type === 'timeout') timeup();
    }
    if (queue.length) renderCards();
    if (queue.length || game.time - lastPaint >= 100) { render(); lastPaint = game.time; }
  }
  function frame(now) {
    if (!game || !game.active) return;
    game.tick(Math.max(0, now - lastFrame)); lastFrame = now;
    events();
    if (game.effect?.type === 'dragon') {
      const effect = game.effect;
      wrap.dataset.breath = game.time - effect.lastSneeze < 650 ? 'puff' : effect.nextSneeze - game.time < 800 ? 'inhale' : '';
    }
    if (game.effect && ['ghost','hole'].includes(game.effect.type)) game.cards.forEach((c,i) => { if (!c.matched && drag?.id !== i) position(c,nodes[i]); });
    if (game.catRun) {
      const p = Math.min(1, (game.time - game.catRun.start) / game.catRun.duration);
      const el = $('visitor-cat');
      el.style.transform = 'translate(' + ((1.16 - 1.32 * p) * wrap.clientWidth - el.clientWidth / 2) + 'px,-50%)';
    } else $('visitor-cat').classList.remove('show');
    if (messageUntil && game.time >= messageUntil) { messageUntil = 0; say(defaultMessage()); }
    if (expressionUntil && game.time >= expressionUntil) expression('normal', 0);
    for (const [type, until] of Object.entries(visitors)) if (game.time >= until) { $('visitor-' + type).classList.remove('show'); delete visitors[type]; }
    nodes.forEach(el => { if (el.dataset.missUntil && game.time >= +el.dataset.missUntil) { el.classList.remove('miss'); delete el.dataset.missUntil; } });
    if (game.active) raf = requestAnimationFrame(frame);
  }
  function win() {
    clearDrag(); Sound.stop(); Sound.play('win'); syncEffects();
    if (game.practice && game.stage < 2) { say(game.stage === 0 ? 'いろも もようも、そろったね。つぎは うごかしてみよう。' : 'うごかして さがせたね。つぎは おじゃまの れんしゅう。'); $('lesson-action').textContent = 'つぎへ'; $('lesson-action').hidden = false; return; }
    screen('result-screen');
    const ending = !game.practice && game.mode.day === 30;
    if (!game.practice) Save.complete(game.mode.day);
    $('result-eyebrow').textContent = game.practice ? 'れんしゅう おしまい' : game.mode.day + 'にちめ・クリア';
    $('result-title').textContent = game.practice ? 'これで、だいじょうぶ。' : game.mode.rescue ? 'くつしたを、すくった。' : 'それでも、そろった。';
    $('result-message').textContent = game.practice ? 'いろ と もようを みて、タップ。つぎは ほんばんへ。' : ending ? '30にちかん、ありがとう。あしたも、ぼくはくつしたをそろえる。' : game.mode.day===10 ? 'あしたからは、かぞくのくつしたも。' : game.mode.day===20 ? 'あしたは、なんだか にぎやかになりそう。' : 'あしたも、ぼくはくつしたをそろえる。';
    document.querySelector('.result-pan').src = 'assets/pan-happy.svg'; document.querySelector('.result-pan').alt = 'にっこりした パン';
    $('result-stats').hidden = game.practice;
    $('result-pairs').textContent = game.matched + 'くみ'; $('result-time').textContent = fmt(game.time);
    const newBest = !game.practice && Save.saveBest(recordId(), game.time);
    $('record-message').textContent = game.practice ? '' : !Save.available() ? 'このブラウザーでは きろくを のこせないよ。' : newBest ? 'いちばん はやく そろえられた！' : 'きょうも、おかたづけ できたね。';
    $('again-button').textContent = game.practice ? 'スタート' : 'もういちど'; $('again-button').focus({ preventScroll: true });
    $('next-button').hidden = game.practice || ending;
    $('next-button').textContent = 'つぎのひへ';
  }
  function timeup() {
    clearDrag(); Sound.stop(); syncEffects(); screen('result-screen');
    $('result-eyebrow').textContent = game.mode.day + 'にちめ・じかんぎれ'; $('result-title').textContent = 'それでも、もういちど。';
    $('result-message').textContent = timeWords(game.mode) + 'が たったね。おなじひに もういちど ちょうせんしよう。';
    document.querySelector('.result-pan').src = 'assets/pan-thinking.svg'; document.querySelector('.result-pan').alt = 'かんがえる パン';
    $('result-stats').hidden = false; $('result-pairs').textContent = game.matched + ' / ' + game.cards.length / 2 + 'くみ'; $('result-time').textContent = fmt(game.time);
    $('record-message').textContent = 'クリアきろくは そのまま。'; $('next-button').hidden = true; $('again-button').textContent = 'もういちど'; $('again-button').focus({ preventScroll: true });
  }
  function clearDrag() {
    if (drag) { const el = nodes[drag.id]; if (el?.hasPointerCapture(drag.pointerId)) el.releasePointerCapture(drag.pointerId); el?.classList.remove('dragging'); drag = null; }
    if (game) game.dragging = null;
  }
  function pause() {
    if (!game?.active) return; clearDrag(); game.pause(); Sound.stop(); cancelAnimationFrame(raf);
    $('play-screen').classList.add('paused'); pauseDialog.showModal();
  }
  function resume() { if (!game || game.state !== 'paused') return; pauseDialog.close(); game.resume(); Sound.startMusic(); $('play-screen').classList.remove('paused'); renderCards(); lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  function allowSelect() {
    if (!game?.active || !lessonReady) return false;
    if (game.practice && game.stage === 1 && !game.dragged) { say('まずは ひとつ、ひっぱって はなしてみよう。'); return false; }
    return true;
  }
  // The clipped board cannot receive input in darkness; its parent still moves the light.
  document.querySelectorAll('img').forEach(img => { img.draggable = false; });
  wrap.addEventListener('selectstart', e => e.preventDefault());
  wrap.addEventListener('dragstart', e => e.preventDefault());
  wrap.addEventListener('pointerdown', e => {
    moveLight(e);
    if (game?.active && game.hasEffect('fairy') && !e.target.closest('.sock') && !drag) wrap.setPointerCapture(e.pointerId);
  }, true);
  wrap.addEventListener('pointermove', moveLight, true);
  board.addEventListener('focusin', e => {
    if (!game?.hasEffect('fairy') || !e.target.matches('.sock')) return;
    const r = e.target.getBoundingClientRect(), b = board.getBoundingClientRect();
    lightX = (r.left + r.width / 2 - b.left) / b.width; lightY = (r.top + r.height / 2 - b.top) / b.height; paintLight();
  });
  board.addEventListener('pointerdown', e => {
    const el = e.target.closest('.sock'); if (!el || drag || e.button !== 0 || !lessonReady) return;
    const id = +el.dataset.card; if (!game?.beginDrag(id)) return;
    e.preventDefault(); drag = { id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false };
    el.setPointerCapture(e.pointerId); el.classList.add('dragging'); Sound.unlock();
  });
  board.addEventListener('pointermove', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y; if (Math.hypot(drag.dx, drag.dy) > 7) drag.moved = true;
    if (drag.moved) position(game.cards[drag.id], nodes[drag.id], drag.dx, drag.dy);
  });
  function dropTarget(id) {
    const dragged = nodes[id], shape = dragged.querySelector('.sock-hit');
    const matrix = shape.getScreenCTM(), hits = new Map();
    let clothPoints = 0;
    dragged.classList.add('drop-probe');
    try {
      // Sample actual cloth, so transparent corners never form a pair.
      for (let y = 6; y < 74; y += 6) {
        for (let x = 4; x < 54; x += 6) {
          const local = new DOMPoint(x, y);
          if (!shape.isPointInFill(local)) continue;
          clothPoints++;
          const point = local.matrixTransform(matrix);
          const target = document.elementFromPoint(point.x, point.y)?.closest('.sock');
          if (!target || target.disabled || target === dragged) continue;
          const targetId = Number(target.dataset.card);
          hits.set(targetId, (hits.get(targetId) || 0) + 1);
        }
      }
    } finally { dragged.classList.remove('drop-probe'); }
    const best = [...hits].sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= Math.max(3, clothPoints * .15) ? best[0] : null;
  }
  board.addEventListener('pointerup', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const d = drag, b = board.getBoundingClientRect(), c = game.cards[d.id];
    const maySelect = d.moved || allowSelect();
    if (d.moved) { c.x += (e.clientX - d.x) / b.width; c.y += (e.clientY - d.y) / b.height; clamp(c); }
    let targetId = null;
    if (d.moved) {
      position(c, nodes[d.id]);
      if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) targetId = dropTarget(d.id);
    }
    // Release the pointer before the shared core handles the tap or move.
    drag = null; nodes[d.id].classList.remove('dragging'); if (nodes[d.id].hasPointerCapture(e.pointerId)) nodes[d.id].releasePointerCapture(e.pointerId);
    if (maySelect) game.endDrag(d.id, c.x, c.y, d.moved, targetId); else game.dragging = null;
    events();
  });
  board.addEventListener('pointercancel', () => { clearDrag(); renderCards(); });
  board.addEventListener('lostpointercapture', () => { if (drag) { clearDrag(); renderCards(); } });
  board.addEventListener('click', e => { const el = e.target.closest('.sock'); if (e.detail === 0 && el && allowSelect()) { game.select(+el.dataset.card); events(); } });
  board.addEventListener('keydown', e => {
    const moves = { ArrowLeft: [-18, 0], ArrowRight: [18, 0], ArrowUp: [0, -18], ArrowDown: [0, 18] };
    const el = e.target.closest('.sock'); if (!el || !moves[e.key] || !lessonReady) return;
    e.preventDefault(); const id = +el.dataset.card; if (!game?.beginDrag(id)) return;
    const c = game.cards[id], b = board.getBoundingClientRect(), [dx, dy] = moves[e.key]; c.x += dx / b.width; c.y += dy / b.height; clamp(c); game.endDrag(id, c.x, c.y, true); events();
  });
  $('lesson-action').onclick = () => {
    if (!game?.practice) return;
    if (game.state === 'result') guardedStart(game.stage + 1);
    else if (game.stage === 2 && !lessonReady) { lessonReady = true; $('lesson-action').hidden = true;
      if (game.mode.cat) game.scatter();
      if (game.mode.incident) game.startIncident();
      if (game.mode.rescue) game.startRescue();
      if (game.mode.baby) say('ひとくみ そろえてみよう。あかちゃんが みているよ。');
      events(); }
  };
  let starting = false;
  async function guardedStart(stage) { if (starting) return; starting = true; try { await start(stage); } finally { starting = false; } }
  $('start-button').onclick = intro; $('practice-button').onclick = () => guardedStart(0);
  $('intro-start').onclick = () => guardedStart(-1); $('intro-back').onclick = title;
  $('mode-button').onclick = chooseMode; $('mode-close').onclick = () => modeDialog.close();
  $('pause-button').onclick = pause; $('resume-button').onclick = resume; $('pause-home').onclick = title;
  $('result-home').onclick = title; $('again-button').onclick = intro;
  $('next-button').onclick = () => { if (game?.state !== 'result' || game.practice || selectedMode().day>=30) return; modeId = Socks.MODES[selectedMode().day].id; intro(); };
  document.querySelectorAll('[data-sound]').forEach(el => el.onclick = () => { Sound.toggle(); updateSound(); });
  pauseDialog.addEventListener('cancel', e => { e.preventDefault(); resume(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && game?.active) { e.preventDefault(); pause(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => { pause(); Sound.stop(); });
  window.addEventListener('resize', resize);
  new ResizeObserver(() => {
    if (!game || $('play-screen').hidden) return;
    const b = board.getBoundingClientRect();
    if (b.width !== boardWidth || b.height !== boardHeight) resize();
  }).observe(board);
  updateSound(); title();
})();
