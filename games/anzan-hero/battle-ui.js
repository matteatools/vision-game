(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const play = el('play'), battle = el('battleScene'), arena = play.querySelector('.arena');
  const landscape = matchMedia('(orientation: landscape)');
  arena.insertAdjacentHTML('beforeend', `
    <aside id="battlePlayerSide" class="battle-side battle-player-side" aria-label="ステージと じぶんの シールド">
      <div class="battle-stage"><span id="battleStageLabel">ステージ</span><strong><span id="battleStageNumber">1</span><small> / 10</small></strong></div>
    </aside>
    <aside id="battleEnemySide" class="battle-side battle-enemy-side" aria-label="あいてと もんだいの じょうきょう"></aside>`);
  play.querySelector('.panel').insertAdjacentHTML('afterbegin', '<div id="battleQuestionDock" class="battle-question-dock"></div>');
  const placements = [
    [play.querySelector('.player-hud'), el('battlePlayerSide')],
    [el('playerNotice'), el('battlePlayerSide')],
    [el('practiceCoach'), el('battlePlayerSide')],
    ...['enemyName', 'hpBar', 'hpText', 'round', 'comboCount', 'status', 'feedback'].map(id => [el(id), el('battleEnemySide')]),
    [el('questionCard'), el('battleQuestionDock')],
    [play.querySelector('.approach-hud'), el('battleQuestionDock')]
  ].filter(([node]) => node).map(([node, destination]) => {
    const home = document.createComment('portrait position: ' + (node.id || node.className));
    node.before(home);
    return { node, destination, home };
  });
  let arranged = null;
  function sync() {
    const wide = landscape.matches;
    play.classList.toggle('landscape-battle', wide);
    if (wide !== arranged) {
      placements.forEach(({ node, destination, home }) => wide ? destination.append(node) : home.after(node));
      arranged = wide;
    }
    if (state) {
      el('battleStageLabel').textContent = state.practice ? 'れんしゅう' : state.rules.awakened ? 'うらステージ' : 'ステージ';
      el('battleStageNumber').textContent = state.rules.number;
      play.classList.toggle('multiply-input', state.course === 'multiply');
      el('keypad').style.setProperty('--answer-count', courseAnswerValues(state.course).length);
    }
    if (!wide || state?.mode !== 'vision') battle.style.removeProperty('--vision-extra-height');
  }

  // Keep targets away from readable UI, but deliberately allow them over the enemy.
  function visionLayout(values, rng = Math.random) {
    sync();
    const blockedNodes = ['battlePlayerSide', 'battleEnemySide', 'battleQuestionDock'].map(el);
    const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
    let candidates = [], size = 44, rect;
    for (let extra = 0; extra <= 480; extra += 40) {
      battle.style.setProperty('--vision-extra-height', extra + 'px');
      rect = battle.getBoundingClientRect();
      const obstacles = blockedNodes.map(node => {
        const r = node.getBoundingClientRect();
        return { x:r.left - rect.left - 5, y:r.top - rect.top - 5, right:r.right - rect.left + 5, bottom:r.bottom - rect.top + 5 };
      });
      const preferred = Math.max(56, Math.min(96, rect.width * .065, rect.height * .16));
      for (size = Math.floor(preferred); ; size = Math.max(44, size - 2)) {
        const gap = rect.height < 400 ? 3 : 8, pad = rect.height < 400 ? 3 : 5;
        const columns = Math.floor((rect.width - 2 * pad + gap) / (size + gap));
        const rows = Math.floor((rect.height - 2 * pad + gap) / (size + gap));
        const cw = (rect.width - 2 * pad) / columns, ch = (rect.height - 2 * pad) / rows;
        candidates = [];
        for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
          const x = pad + (col + .5) * cw, y = pad + (row + .5) * ch;
          const box = { x:x-size/2, y:y-size/2, right:x+size/2, bottom:y+size/2 };
          if (!obstacles.some(o => overlaps(box, o))) candidates.push({ x, y });
        }
        if (candidates.length >= values.length || size === 44) break;
      }
      if (candidates.length >= values.length) break;
    }
    // Farthest-point sampling spreads even the small answer sets across the scene.
    const points = [];
    let pick = Math.floor(rng() * candidates.length);
    while (points.length < values.length && candidates.length) {
      points.push(candidates.splice(pick, 1)[0]);
      let best = -1;
      candidates.forEach((point, i) => {
        const distance = Math.min(...points.map(p => (p.x-point.x)**2 + (p.y-point.y)**2));
        const score = distance * (.95 + rng() * .1);
        if (score > best) { best = score; pick = i; }
      });
    }
    return { height:rect.height, points:points.map((p, i) => ({ ...p, size, value:values[i] })) };
  }
  window.GameBattleUI = { sync, visionLayout, isLandscape:() => landscape.matches };
  sync();
  landscape.addEventListener('change', () => {
    sync();
    if (state && !play.classList.contains('hidden') && state.mode === 'vision') renderVision();
  });
  window.addEventListener('resize', sync);
})();
