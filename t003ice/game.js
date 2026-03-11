/* ========================================
   わがままアイスクリーム - ゲームロジック
   ======================================== */

// ===== フレーバーデータ =====
const ALL_FLAVORS = [
  { id: 'vanilla', name: 'バニラ', color: '#FFF8DC', textColor: '#8B7040', emoji: '⬜' },
  { id: 'chocolate', name: 'チョコ', color: '#7B4A2D', textColor: '#FFE0C8', emoji: '🟫' },
  { id: 'strawberry', name: 'いちご', color: '#FF8FAB', textColor: '#5C001E', emoji: '🩷' },
  { id: 'soda', name: 'ソーダ', color: '#4FC3C8', textColor: '#003040', emoji: '🟦' },
  { id: 'lemon', name: 'レモン', color: '#FFF176', textColor: '#5A4200', emoji: '🟡' },
  { id: 'melon', name: 'メロン', color: '#A5D64C', textColor: '#1A3C00', emoji: '🟩' },
  { id: 'grape', name: 'ぶどう', color: '#8A5BAE', textColor: '#F0E0FF', emoji: '🟣' },
  { id: 'orange', name: 'オレンジ', color: '#FF9A3C', textColor: '#4A2000', emoji: '🟠' },
  { id: 'mint', name: 'ミント', color: '#78D8C0', textColor: '#1A3C30', emoji: '🟢' },
  { id: 'cookie', name: 'クッキー', color: '#D4C5A9', textColor: '#3A2A10', emoji: '🍪' },
  { id: 'caramel', name: 'キャラメル', color: '#C8860A', textColor: '#FFF0D0', emoji: '🟡' },
  { id: 'matcha', name: 'まっちゃ', color: '#4E8B3A', textColor: '#E8FFE0', emoji: '🌿' },
];

// ===== ゲーム状態 =====
let gameState = {
  difficulty: 'normal',
  answer: [],        // 正解 [bot, mid, top] のflavorId配列
  currentGuess: { top: null, mid: null, bot: null },
  turnsLeft: 5,
  history: [],
  activeFlavors: [],
  isOver: false,
  selectedFlavorId: null, // スマホ用：タップ選択中のフレーバー
};

// 難易度ごとのフレーバー数
const DIFFICULTY_MAP = {
  easy: { count: 8, label: 'かんたん' },
  normal: { count: 10, label: 'ふつう' },
  hard: { count: 12, label: 'むずかしい' },
};

// キャラクターセリフ集
const SPEECHES = {
  start: ['はやくたべたーい'],
  thinking: ['うーん…', 'えーっとね…', '少し待って…', 'んー…どうかな…'],
  allHit: ['これよこれ！すっごくおいしいわ！'],
  gameOver: ['あーあ、とけちゃったじゃない！もう1かいよ！'],
};

// ===== 画面切替 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el.classList.add('active');
}

// ===== タイトルへ =====
function gotoTitle() {
  showScreen('screen-title');
}

// ===== ゲーム開始 =====
function startGame(difficulty) {
  gameState.difficulty = difficulty;
  gameState.turnsLeft = 10;
  gameState.history = [];
  gameState.isOver = false;
  gameState.currentGuess = { top: null, mid: null, bot: null };
  gameState.selectedFlavorId = null;

  const { count } = DIFFICULTY_MAP[difficulty];
  // フレーバーをシャッフルして難易度分だけ使用
  const shuffled = [...ALL_FLAVORS].sort(() => Math.random() - 0.5);
  gameState.activeFlavors = shuffled.slice(0, count);

  // 答えを生成（重複なし3種）
  const answerFlavors = [...gameState.activeFlavors].sort(() => Math.random() - 0.5).slice(0, 3);
  gameState.answer = [
    answerFlavors[0].id,  // bot (下)
    answerFlavors[1].id,  // mid (中)
    answerFlavors[2].id,  // top (上)
  ];

  // UI初期化
  renderDifficultyBadge();
  renderHearts();
  renderFlavorGrid();
  renderSlots();
  clearHistoryUI();
  setCharExpression('allwrong');
  setSpeech(pick(SPEECHES.start));
  updateSubmitBtn();

  showScreen('screen-game');
}

// ===== リトライ =====
function retryGame() {
  startGame(gameState.difficulty);
}

// ===== 難易度バッジ =====
function renderDifficultyBadge() {
  const { label } = DIFFICULTY_MAP[gameState.difficulty];
  document.getElementById('diff-label').textContent = label;
}

// ===== ハート表示 =====
function renderHearts() {
  const row = document.getElementById('heart-row');
  row.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const heart = document.createElement('span');
    heart.textContent = i < gameState.turnsLeft ? '💖' : '🖤';
    row.appendChild(heart);
  }
}

// ===== スロット初期レンダリング =====
function renderSlots() {
  ['top', 'mid', 'bot'].forEach(pos => {
    renderSlotFill(pos, null);
    const item = document.getElementById(`slot-${pos}`);
    if (item) item.classList.remove('selected', 'drag-over');
  });
  updateNextSlotHighlight();
}

// ===== SVGプレビューを更新 =====
function updateScoopSvg(pos, flavorId) {
  const DEFAULTS = {
    top: { fill: '#D8D8D8' },
    mid: { fill: '#E0E0E0' },
    bot: { fill: '#E8E8E8' },
  };
  const pathEl = document.getElementById(`scoop-${pos}`);
  const textEl = document.getElementById(`scoop-${pos}-text`);
  if (!pathEl || !textEl) return;

  if (!flavorId) {
    pathEl.setAttribute('fill', DEFAULTS[pos].fill);
    pathEl.setAttribute('stroke', 'rgba(255,255,255,0.8)');
    textEl.textContent = '？';
    textEl.setAttribute('fill', 'rgba(0,0,0,0.25)');
  } else {
    const fl = getFlavor(flavorId);
    pathEl.setAttribute('fill', fl.color);
    pathEl.setAttribute('stroke', 'rgba(255,255,255,0.8)');
    textEl.textContent = fl.name;
    textEl.setAttribute('fill', fl.textColor);
  }
}



// ===== スロットをクリア =====
function clearSlots() {
  gameState.currentGuess = { top: null, mid: null, bot: null };
  gameState.selectedFlavorId = null;
  renderSlots();
  updateUsedChips();
  updateSubmitBtn();
  // 選択ハイライトも解除
  document.querySelectorAll('.slot-item').forEach(el => el.classList.remove('selected'));
}

// ===== フレーバーグリッドの描画 =====
function renderFlavorGrid() {
  const grid = document.getElementById('flavor-grid');
  grid.innerHTML = '';
  gameState.activeFlavors.forEach(fl => {
    const chip = document.createElement('div');
    chip.className = 'flavor-chip';
    chip.id = `chip-${fl.id}`;
    chip.style.background = fl.color;
    chip.style.color = fl.textColor;
    chip.innerHTML = `<span>${fl.name}</span>`;
    chip.setAttribute('draggable', 'true');
    chip.addEventListener('click', () => selectFlavorChip(fl.id));
    chip.addEventListener('dragstart', (e) => dragStart(e, fl.id));
    chip.addEventListener('dragend', (e) => dragEnd(e));
    grid.appendChild(chip);
  });
}

// ===== ドラッグ処理 =====
let draggingFlavorId = null;

function dragStart(e, flavorId) {
  draggingFlavorId = flavorId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', flavorId);
  // 少し遅らせてdraggingクラスを付ける（Chromeの仕様対策）
  setTimeout(() => {
    const chip = document.getElementById(`chip-${flavorId}`);
    if (chip) chip.classList.add('dragging');
  }, 0);
}

function dragEnd(e) {
  if (draggingFlavorId) {
    const chip = document.getElementById(`chip-${draggingFlavorId}`);
    if (chip) chip.classList.remove('dragging');
  }
  draggingFlavorId = null;
  // ハイライト解除
  ['top', 'mid', 'bot'].forEach(pos => {
    const g = document.getElementById(`scoop-${pos}-group`);
    if (g) g.classList.remove('drag-over');
  });
}

function allowDrop(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function dropFlavor(e, pos) {
  e.preventDefault();
  const flavorId = e.dataTransfer.getData('text/plain') || draggingFlavorId;
  if (!flavorId) return;
  placeFlavor(pos, flavorId);
  const g = document.getElementById(`scoop-${pos}-group`);
  if (g) g.classList.remove('drag-over');
}

function scoopDragEnter(e, pos) {
  e.preventDefault();
  const g = document.getElementById(`scoop-${pos}-group`);
  if (g) g.classList.add('drag-over');
}

function scoopDragLeave(e, pos) {
  // relatedTarget がグループ内の子要素なら無視
  const g = document.getElementById(`scoop-${pos}-group`);
  if (g && !g.contains(e.relatedTarget)) {
    g.classList.remove('drag-over');
  }
}

// ===== フレーバーチップをクリック → 下→中→上へ自動配置 =====
function selectFlavorChip(flavorId) {
  const fl = getFlavor(flavorId);
  if (!fl) return;
  // すでに使われている → 取り除く
  if (isFlavorUsed(flavorId)) {
    removeFlavorFromSlots(flavorId);
    return;
  }
  // 次の空きスロットへ順番に配置（下→中→上）
  const order = ['bot', 'mid', 'top'];
  const nextEmpty = order.find(pos => !gameState.currentGuess[pos]);
  if (!nextEmpty) return; // 全部埋まっている
  placeFlavor(nextEmpty, flavorId);
}

// スロットをタップ → そのスロットのフレーバーを取り除く
function clickSlot(pos) {
  if (gameState.currentGuess[pos]) {
    removeFlavorByPos(pos);
  }
}

function removeFlavorByPos(pos) {
  gameState.currentGuess[pos] = null;
  renderSlotFill(pos, null);
  updateUsedChips();
  updateSubmitBtn();
  updateNextSlotHighlight();
}

function removeFlavorFromSlots(flavorId) {
  ['top', 'mid', 'bot'].forEach(pos => {
    if (gameState.currentGuess[pos] === flavorId) {
      gameState.currentGuess[pos] = null;
      renderSlotFill(pos, null);
    }
  });
  updateUsedChips();
  updateSubmitBtn();
}

function isFlavorUsed(flavorId) {
  return Object.values(gameState.currentGuess).includes(flavorId);
}

// ===== フレーバーをスロットに配置 =====
function placeFlavor(pos, flavorId) {
  // すでに他スロットで同じフレーバーが使われていたら無視
  const otherPositions = ['top', 'mid', 'bot'].filter(p => p !== pos);
  if (otherPositions.some(p => gameState.currentGuess[p] === flavorId)) {
    shakeFlavor(flavorId);
    return;
  }
  gameState.currentGuess[pos] = flavorId;
  renderSlotFill(pos, flavorId);
  updateUsedChips();
  updateSubmitBtn();
  updateNextSlotHighlight();
}

function renderSlotFill(pos, flavorId) {
  updateScoopSvg(pos, flavorId);
  const zone = document.getElementById(`slot-${pos}`);
  if (!zone) return;
  if (!flavorId) {
    zone.classList.remove('filled');
  } else {
    zone.classList.add('filled');
  }
}

function updateUsedChips() {
  const usedIds = Object.values(gameState.currentGuess).filter(Boolean);
  gameState.activeFlavors.forEach(fl => {
    const chip = document.getElementById(`chip-${fl.id}`);
    if (!chip) return;
    if (usedIds.includes(fl.id)) {
      chip.classList.add('used');
      chip.setAttribute('draggable', 'false');
    } else {
      chip.classList.remove('used');
      chip.setAttribute('draggable', 'true');
    }
  });
}

function shakeFlavor(flavorId) {
  const chip = document.getElementById(`chip-${flavorId}`);
  if (!chip) return;
  chip.style.animation = 'none';
  requestAnimationFrame(() => {
    chip.style.animation = 'shake 0.4s ease';
  });
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-6px)}
  40%{transform:translateX(6px)}
  60%{transform:translateX(-4px)}
  80%{transform:translateX(4px)}
}`;
document.head.appendChild(shakeStyle);

// ===== 送信ボタン有効化 =====
function updateSubmitBtn() {
  const btn = document.getElementById('submit-btn');
  const filled = gameState.currentGuess.top && gameState.currentGuess.mid && gameState.currentGuess.bot;
  btn.disabled = !filled || gameState.isOver;
}

// ===== 次に入るスロットをSVG上で点滅表示 =====
function updateNextSlotHighlight() {
  ['bot', 'mid', 'top'].forEach(pos => {
    const g = document.getElementById(`scoop-${pos}-group`);
    if (g) g.classList.remove('next-slot');
  });
  if (gameState.isOver) return;
  const order = ['bot', 'mid', 'top'];
  const next = order.find(pos => !gameState.currentGuess[pos]);
  if (next) {
    const g = document.getElementById(`scoop-${next}-group`);
    if (g) g.classList.add('next-slot');
  }
}

// ===== 回答判定 =====
function submitGuess() {
  if (gameState.isOver) return;
  const guess = [
    gameState.currentGuess.bot,
    gameState.currentGuess.mid,
    gameState.currentGuess.top,
  ];
  const answer = gameState.answer; // [bot, mid, top]

  let hits = 0, blows = 0;
  for (let i = 0; i < 3; i++) {
    if (guess[i] === answer[i]) {
      hits++;
    } else if (answer.includes(guess[i])) {
      blows++;
    }
  }

  gameState.turnsLeft--;

  // 履歴に追加
  gameState.history.push({
    guessBot: guess[0],
    guessMid: guess[1],
    guessTop: guess[2],
    hits,
    blows,
    turn: gameState.history.length + 1,
  });

  // 思考中の演出
  setCharExpression('thinking');
  setSpeech(pick(SPEECHES.thinking));

  setTimeout(() => {
    // 判定表示
    if (hits === 3) {
      // クリア
      gameState.isOver = true;
      setCharExpression('victory');
      animateChar('jump');
      setSpeech('これよこれ！\nすっごくおいしいわ！');
      setTimeout(() => showClear(), 1000);
    } else if (gameState.turnsLeft <= 0) {
      // ゲームオーバー
      gameState.isOver = true;
      setCharExpression('gameover');
      setSpeech('あーあ、とけちゃったじゃない！\nもう1かいよ！');
      setTimeout(() => showGameOver(), 1200);
    } else {
      // 継続
      addHistory(gameState.history[gameState.history.length - 1]);
      renderHearts();
      updateTurnsUI();
      feedbackSpeech(hits, blows);
      clearSlots();
    }
  }, 900);
}

function feedbackSpeech(hits, blows) {
  if (hits === 0 && blows === 0) {
    setCharExpression('allwrong');
    setSpeech('ぜんぜんちがう！\nやりなおし！');
  } else if (hits === 0 && (blows === 1 || blows === 2)) {
    setCharExpression('blow12');
    setSpeech(blows === 1 ? 'あじは1つだけ、あってるわ！' : 'あじは2つせいかい！\nじゅんばんがちがうわ。');
  } else if (hits === 0 && blows === 3) {
    setCharExpression('blow3');
    setSpeech('あじはぜんぶせいかい！\nあとはじゅんばんだけよ！');
  } else if (hits === 1 && blows === 0) {
    setCharExpression('hit1blow0');
    setSpeech('1つはバッチリ！\nほかはダメね。');
  } else if (hits === 1 && blows === 1) {
    setCharExpression('hit1blow1');
    setSpeech('1つはカンペキ！\nもう1つは、あじだけせいかいよ。');
  } else if (hits === 1 && blows === 2) {
    setCharExpression('hit1blow2');
    setSpeech('1つはカンペキ！\nのこりは、ばしょをいれかえて！');
  } else if (hits === 2 && blows === 0) {
    setCharExpression('hit2blow0');
    setSpeech('2つはカンペキよ！\nあと1つ、はやくあてて！');
    animateChar('wobble');
  }
}

function updateTurnsUI() {
  document.getElementById('turns-left').textContent = gameState.turnsLeft;
}

// ===== 履歴UI =====
function addHistory(entry) {
  const list = document.getElementById('history-list');
  const row = document.createElement('div');
  row.className = 'history-row';

  const positions = [
    { id: entry.guessTop },
    { id: entry.guessMid },
    { id: entry.guessBot },
  ];

  const scoopsHTML = positions.map(p => {
    const fl = getFlavor(p.id);
    return `<span class="hist-scoop" style="background:${fl.color};color:${fl.textColor}">${fl.name}</span>`;
  }).join('');

  row.innerHTML = `
    <div class="history-scoops">${scoopsHTML}</div>
    <div class="history-result">
      <span class="hit-count">ぴったり ${entry.hits}</span>
      <span class="blow-count">あじだけ ${entry.blows}</span>
    </div>
  `;
  list.appendChild(row);
}

function clearHistoryUI() {
  document.getElementById('history-list').innerHTML = '';
  document.getElementById('turns-left').textContent = '10';
}

// ===== クリア画面 =====
function showClear() {
  const hintsUsed = gameState.history.length - 1; // 最後の正解ターンを除いた回数
  const msgEl = document.getElementById('clear-msg');
  const imgEl = document.getElementById('result-char-img');

  let imgFile, msg;
  if (hintsUsed === 0)      { imgFile = '13J'; msg = 'えっ？あんたエスパー？'; }
  else if (hintsUsed <= 2)  { imgFile = '13E'; msg = 'すごい！あんたもひとくちたべる？'; }
  else if (hintsUsed <= 5)  { imgFile = '13D'; msg = 'やるねー！よくわかってる！'; }
  else if (hintsUsed <= 8)  { imgFile = '13A'; msg = 'ありがとう！やっとたべれるわ'; }
  else                      { imgFile = '13N'; msg = 'ギリギリじゃない・・・。'; }

  msgEl.textContent = msg;
  if (imgEl) imgEl.src = `13/${imgFile}.png`;

  // アイスの表示を消し、ヒント回数を表示
  const container = document.getElementById('clear-answer');
  container.innerHTML = `<p class="hint-count-msg" style="font-size: 1.1rem; color: #5C3A52; margin: 16px 0;">ヒントを<span style="color:var(--pink); font-size:1.3rem; font-weight:700;">${hintsUsed}</span>回 使ったわ！</p>`;

  showScreen('screen-clear');
}

// ===== ゲームオーバー画面 =====
function showGameOver() {
  const hintsUsed = gameState.history.length;
  const container = document.getElementById('gameover-answer');
  container.innerHTML = `<p class="hint-count-msg" style="font-size: 1.1rem; color: #5C3A52; margin: 16px 0;">ヒントを<span style="color:var(--pink); font-size:1.3rem; font-weight:700;">${hintsUsed}</span>回 使ったわ…。</p>`;

  showScreen('screen-gameover');
}

function renderAnswerRevealCone(containerId) {
  const container = document.getElementById(containerId);
  const bot = getFlavor(gameState.answer[0]);
  const mid = getFlavor(gameState.answer[1]);
  const top = getFlavor(gameState.answer[2]);

  container.innerHTML = `
    <div class="reveal-cone-wrap">
      <svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg" class="reveal-cone-svg">
        <!-- コーン画像（PNG） -->
        <image href="corn.png" x="20" y="140" width="160" height="215" preserveAspectRatio="xMidYMid meet"/>
        <!-- bot スクープ（下） -->
        <ellipse cx="100" cy="185" rx="34" ry="8" fill="rgba(0,0,0,0.09)"/>
        <path d="M66 177 A34 34 0 0 1 134 177 Z" fill="${bot.color}" stroke="rgba(255,255,255,0.8)" stroke-width="2.5"/>
        <text x="100" y="171" text-anchor="middle" font-size="10" fill="${bot.textColor}" font-family="'Mochiy Pop P One',sans-serif">${bot.name}</text>
        <!-- mid スクープ（中） -->
        <ellipse cx="100" cy="150" rx="32" ry="7" fill="rgba(0,0,0,0.08)"/>
        <path d="M68 145 A32 32 0 0 1 132 145 Z" fill="${mid.color}" stroke="rgba(255,255,255,0.8)" stroke-width="2.5"/>
        <text x="100" y="140" text-anchor="middle" font-size="10" fill="${mid.textColor}" font-family="'Mochiy Pop P One',sans-serif">${mid.name}</text>
        <!-- top スクープ（上） -->
        <ellipse cx="100" cy="118" rx="30" ry="6" fill="rgba(0,0,0,0.07)"/>
        <path d="M70 113 A30 30 0 0 1 130 113 Z" fill="${top.color}" stroke="rgba(255,255,255,0.8)" stroke-width="2.5"/>
        <text x="100" y="108" text-anchor="middle" font-size="10" fill="${top.textColor}" font-family="'Mochiy Pop P One',sans-serif">${top.name}</text>
      </svg>
    </div>
  `;
}


// ===== キャラクター演出 =====
const CHAR_IMAGES = ['allwrong', 'blow12', 'blow3', 'hit1blow0', 'hit1blow1', 'hit1blow2', 'hit2blow0', 'victory', 'gameover', 'thinking'];

function setCharExpression(expression) {
  CHAR_IMAGES.forEach(name => {
    const el = document.getElementById(`char-img-${name}`);
    if (el) el.classList.toggle('active', name === expression);
  });
}

function animateChar(type) {
  const fig = document.getElementById('char-figure');
  fig.classList.remove('wobble', 'jump');
  void fig.offsetWidth; // reflow
  fig.classList.add(type);
  setTimeout(() => fig.classList.remove(type), 600);
}

function setSpeech(text) {
  // \n を <br> に変換して改行対応
  document.getElementById('speech-text').innerHTML =
    text.replace(/\n/g, '<br>');
}

// ===== ユーティリティ =====
function getFlavor(id) {
  return ALL_FLAVORS.find(f => f.id === id) || null;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
