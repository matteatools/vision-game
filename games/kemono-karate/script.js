const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const MAX_KI = 5;
const MAX_ROUND_START_KI = 3;
const POINTS_TO_WIN = 3;
const POSES = ['charge', 'guard', 'attack', 'win', 'lose'];
const FIGHTERS = Object.freeze({
  kotaro: { name: 'コタロウ', asset: 'kotaro', startBonus: 0, strategy: null },
  leon: { name: 'レオン', asset: 'leon', startBonus: 0, strategy: 'balanced' },
  cheetah: { name: 'チースケ', asset: 'cheetah', startBonus: 1, strategy: 'rush' },
  jaguar: { name: 'ジャック', asset: 'jaguar', startBonus: 1, strategy: 'wall' },
  whiteTiger: { name: 'びゃっこ', asset: 'white-tiger', startBonus: 2, strategy: 'master' }
});
const CPU_ROSTER = ['leon', 'cheetah', 'jaguar', 'whiteTiger'];

const ICONS = {
  charge: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18 3c1 6-6 7-4 13 1-4 6-4 7-9 5 5 7 10 4 16-2 4-5 6-10 6S6 25 6 19c0-5 3-8 7-12-1 5 3 5 5-4Z"/><path d="M16 17c4 3 3 8 0 10-4-1-5-6 0-10Z"/></svg>',
  guard: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 7v8c0 7-4 11-11 14C9 26 5 22 5 15V7l11-4Z"/><path d="M11 15h10M16 10v10"/></svg>',
  attack: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 22 9-9 5 5-9 9H5v-5Z"/><path d="m16 11 3-3 5 5-3 3M22 6l4-3M25 10l5-1M20 4l1-3"/></svg>'
};

const ACTIONS = {
  charge: { name: 'ためる', hint: 'きあい ＋1' },
  guard: { name: 'まもる', hint: 'はなつを とめる' },
  attack: { name: 'はなつ', hint: 'きあい ぜんぶ' }
};

const SFX = {
  charge: { src: 'assets/audio/charge.mp3', volume: 0.28, voices: 2, cutoff: 1.15, fade: 0.18 },
  guardUp: { src: 'assets/audio/guard-up.mp3', volume: 0.24, voices: 2, cutoff: 0.58, fade: 0.12 },
  wave1: { src: 'assets/audio/ki-wave-1.mp3', volume: 0.26, voices: 2, cutoff: 0.7, fade: 0.12 },
  wave2: { src: 'assets/audio/ki-wave-2.mp3', volume: 0.28, voices: 2, cutoff: 0.75, fade: 0.13 },
  wave3: { src: 'assets/audio/ki-wave-3.mp3', volume: 0.3, voices: 2, cutoff: 0.8, fade: 0.14 },
  wave4: { src: 'assets/audio/ki-wave-4.mp3', volume: 0.32, voices: 2, cutoff: 0.88, fade: 0.16 },
  wave5: { src: 'assets/audio/ki-wave-5.mp3', volume: 0.35, voices: 2, cutoff: 0.98, fade: 0.18 },
  kiLow: { src: 'assets/audio/ki-low.mp3', volume: 0.2, voices: 2, cutoff: 1.05, fade: 0.22 },
  impact: { src: 'assets/audio/impact-heavy.mp3', volume: 0.36, voices: 3, cutoff: 0.62, fade: 0.12 },
  guardImpact: { src: 'assets/audio/guard-impact.mp3', volume: 0.3, voices: 3, cutoff: 0.56, fade: 0.11 },
  guardShatter: { src: 'assets/audio/guard-shatter.mp3', volume: 0.3, voices: 2, cutoff: 1.05, fade: 0.2 },
  waveBreak: { src: 'assets/audio/wave-break.mp3', volume: 0.32, voices: 2, cutoff: 1.3, fade: 0.24 },
  kiMax: { src: 'assets/audio/ki-max.mp3', volume: 0.24, voices: 2, cutoff: 1.3, fade: 0.24 },
  point: { src: 'assets/audio/ippon-bell.mp3', volume: 0.28, voices: 1, cutoff: 1.45, fade: 0.25 },
  victory: { src: 'assets/audio/victory.mp3', volume: 0.3, voices: 1, cutoff: 4.8, fade: 0.55 }
};

const BGM = {
  src: 'assets/audio/bgm-dojo.mp3',
  volume: 0.065
};

const WAVE_RATES = [1.015, 1.008, 1, 0.992, 0.985];
const WAVE_VOLUMES = [0.8, 0.85, 0.9, 0.95, 1];
const soundBank = new Map();
let soundGeneration = 0;
let soundPlayId = 0;
let bgmAudio = null;

const TRAINING = [
  {
    title: 'ためる ＞ まもる', focus: 'charge',
    text: 'わしは「まもる」！ いまは あんぜん。「ためる」で きあいを ふやすのじゃ。',
    expected: 'charge', cpu: 'guard', ki: [0, 0],
    result: 'せいかい！ まもる あいてには「ためる」。おぬしだけ きあいが 1ふえたぞ！',
    retry: { guard: 'まもる どうしでは なにも おきない。まもっている あいだに「ためる」！' }
  },
  {
    title: 'まもる ＞ はなつ', focus: 'guard',
    text: 'わしは きあい1で「はなつ」！ 「まもる」で きあいの なみを とめるのじゃ。',
    expected: 'guard', cpu: 'attack', ki: [1, 1],
    result: 'せいかい！ きあい1〜4の「はなつ」は「まもる」で とめられる！',
    retry: {
      charge: 'ためている すきに いっぽん！ 「はなつ」が くるときは「まもる」じゃ。',
      attack: 'おなじ きあいの「はなつ」は まんなかで はじける。ここは「まもる」で とめよう。'
    }
  },
  {
    title: 'はなつ ＞ ためる', focus: 'attack',
    text: 'わしは「ためる」！ すきが できたぞ。「はなつ」で いっぽんを とるのじゃ。',
    expected: 'attack', cpu: 'charge', ki: [1, 0],
    result: 'せいかい！ ためている あいてに「はなつ」で いっぽん！ きあいは ぜんぶ つかうぞ。',
    retry: {
      charge: 'ふたりで ためると、わしの きあいも ふえる。「ためる」の すきには「はなつ」！',
      guard: 'ためる あいてを まもっても とめられない。「はなつ」なら いっぽん！'
    }
  },
  {
    title: 'きあいくらべ・おしきる', focus: 'clash',
    text: 'おぬしは きあい2、わしは きあい1。いっしょに「はなつ」と どうなるか ためすのじゃ。',
    expected: 'attack', cpu: 'attack', ki: [2, 1],
    result: '2たい1！ はなつ どうしは、きあいが おおい おぬしが おしきったぞ！',
    retry: { charge: 'きあいの なみが くるときに ためると いっぽんを とられるぞ。こんかいは「はなつ」で きあいくらべ！', guard: 'まもれば とめられるが、こんかいは「はなつ」で きあいの さを たしかめよう。' }
  },
  {
    title: 'きあいくらべ・おしまける', focus: 'clash',
    text: 'こんどは おぬしが きあい1、わしが きあい2。あえて「はなつ」で きあいの さを みるのじゃ。',
    expected: 'attack', cpu: 'attack', ki: [1, 2],
    result: 'かんさつ せいこう！ 1たい2では、きあいが おおい わしに おしまけたな。',
    retry: { charge: 'こんかいは わざと きあいくらべを みる けいこ。「はなつ」を えらぼう。', guard: 'まもるのも ただしいが、こんかいは「はなつ」で すくない がわの なみを かんさつしよう。' }
  },
  {
    title: 'きあいくらべ・おなじ', focus: 'clash',
    text: 'ふたりとも きあい2。どうじに「はなつ」と まんなかで どうなる？',
    expected: 'attack', cpu: 'attack', ki: [2, 2],
    result: '2たい2！ おなじ きあいなら、まんなかで はじけて ひきわけ！',
    retry: { charge: 'こんかいは おなじ きあいの なみを ぶつける けいこ。「はなつ」を えらぼう。', guard: 'こんかいは まんなかの しょうとつを みよう。「はなつ」！' }
  },
  {
    title: 'きあいMAXは とくべつ', focus: 'max',
    phases: [
      {
        text: 'きあい4から「ためる」！ しろく スパークする きあいMAXを みよう。',
        expected: 'charge', cpu: 'guard', ki: [4, 0],
        result: 'きあいMAX！ 5まで たまると、つぎは「はなつ」だけ！',
        retry: { attack: 'まだ きあい4。いまは「ためる」で MAXにしよう。', guard: 'まもるだけでは きあいは ふえない。「ためる」で MAX！' }
      },
      {
        text: 'きあいMAXでは「はなつ」だけ！ わしの ガードを うちやぶるのじゃ。',
        expected: 'attack', cpu: 'guard', ki: [5, 0],
        result: 'ガードはかい！ きあいMAXの「はなつ」だけは「まもる」を やぶる！'
      }
    ]
  },
  {
    title: 'さんすくみ みきわめ', focus: 'all', review: true,
    text: 'わしの わざを みて、いちばん よい わざを 3かい えらぶのじゃ。'
  },
  {
    title: 'さいごの じっせん', focus: 'all', final: true,
    text: 'しあげしょうぶ！ さんすくみと きあいくらべを つかい、わしから いっぽん とるのじゃ。',
    expected: null, cpu: null, ki: [1, 1]
  }
];

const TRAINING_REVIEW = [
  {
    focus: 'charge', text: 'みきわめ 1/3　わしは「まもる」！ どの わざが いちばん おとくじゃ？',
    expected: 'charge', cpu: 'guard', ki: [0, 0],
    result: 'せいかい！ まもる あいてには「ためる」で、おぬしだけ きあい＋1じゃ！',
    retry: { guard: 'まもる どうしでは かわらない。あんぜんな いまに「ためる」！' }
  },
  {
    focus: 'guard', text: 'みきわめ 2/3　わしが きあい1で「はなつ」！ どうする？',
    expected: 'guard', cpu: 'attack', ki: [1, 1],
    result: 'せいかい！ 「まもる」で きあいの なみを とめた！',
    retry: { charge: 'ためている すきを ねらわれた！ 「はなつ」には「まもる」。', attack: 'きあいが おなじなので はじけた。いっぽんを とられない「まもる」が いちばん！' }
  },
  {
    focus: 'attack', text: 'みきわめ 3/3　わしは「ためる」！ いっぽんを とるには？',
    expected: 'attack', cpu: 'charge', ki: [1, 0],
    result: '3もん せいかい！ 「はなつ」で ためる すきを ついて いっぽん！',
    retry: { charge: 'わしにも きあいを ためさせてしまった。「ためる」には「はなつ」！', guard: 'ためる あいてを まもっても いっぽんには ならない。「はなつ」！' }
  }
];

let sessionCounter = 0;
let trainingStep = 0;
let trainingPhase = 0;
let trainingReviewIndex = 0;
let trainingMistakes = 0;
let versusSelections = ['kotaro', 'leon'];
let resultNextMatch = { mode: 'versus', opponentId: 'leon', fighterIds: [...versusSelections] };
let state;
state = freshState('versus');

function resolveFighterId(id) {
  if (Object.prototype.hasOwnProperty.call(FIGHTERS, id)) return id;
  return Object.keys(FIGHTERS).find((fighterId) => FIGHTERS[fighterId].asset === id) || null;
}

function normalizeVersusSelections(selections = versusSelections) {
  const secondPlayer = resolveFighterId(selections?.[1]);
  return ['kotaro', CPU_ROSTER.includes(secondPlayer) ? secondPlayer : 'leon'];
}

function freshState(mode, opponentId = 'leon', fighterIds = versusSelections) {
  const validOpponent = mode === 'practice'
    ? 'whiteTiger'
    : mode === 'cpu' && CPU_ROSTER.includes(opponentId) ? opponentId : 'leon';
  const opponentBonus = mode === 'cpu' ? FIGHTERS[validOpponent].startBonus : 0;
  const selectedFighters = mode === 'versus'
    ? normalizeVersusSelections(fighterIds)
    : ['kotaro', validOpponent];
  return {
    mode, fighterIds: selectedFighters, score: [0, 0],
    ki: mode === 'cpu' ? [0, Math.min(MAX_ROUND_START_KI, opponentBonus)] : [0, 0], choice: [null, null],
    locked: false, round: 1, pointWinner: null,
    aiMemory: { playerHistory: [], cpuHistory: [], guardStreak: 0 },
    sound: state?.sound ?? true, session: ++sessionCounter
  };
}

function screen(id) {
  $$('.screen').forEach((element) => element.classList.toggle('active', element.id === id));
}

function fighterId(player) {
  return state?.fighterIds?.[player] || (player === 0 ? 'kotaro' : 'leon');
}

function fighterDefinition(player) {
  return FIGHTERS[fighterId(player)] || FIGHTERS.leon;
}

function fighterAssetById(id, pose) {
  const safePose = POSES.includes(pose) ? pose : 'charge';
  const fighter = FIGHTERS[id] || FIGHTERS.leon;
  return `assets/fighters/${fighter.asset}-${safePose}-v1.webp`;
}

function fighterAsset(player, pose) {
  return fighterAssetById(fighterId(player), pose);
}

function actionButtons(container, playerNumber) {
  container.innerHTML = Object.entries(ACTIONS).map(([key, action]) => `
    <button class="action" data-action="${key}" data-player="${playerNumber}">
      <img class="action-art" src="${fighterAsset(playerNumber - 1, key)}" alt="">
      ${ICONS[key]}<span>${action.name}</span><small>${action.hint}</small>
    </button>`).join('');
}

function initButtons() {
  actionButtons($('.actions[data-player="1"]'), 1);
  actionButtons($('.actions[data-player="2"]'), 2);
}

function preloadFighter(id) {
  POSES.forEach((pose) => {
    const image = new Image();
    image.src = fighterAssetById(id, pose);
  });
}

function applyFighterIdentity() {
  [0, 1].forEach((player) => {
    const id = fighterId(player);
    const name = fighterDisplayName(player);
    const fighter = $(`#p${player + 1}Fighter`);
    const art = $(`#p${player + 1}Art`);
    fighter.dataset.fighter = id;
    art.src = fighterAsset(player, 'charge');
    art.alt = name;
  });
  const p1ScoreName = $('#p1Name');
  if (p1ScoreName) p1ScoreName.textContent = fighterDisplayName(0);
  $('#fighterP1Name').textContent = fighterDisplayName(0);
  $('#p2Name').textContent = $('#fighterP2Name').textContent = $('#panelP2Name').textContent = fighterDisplayName(1);
  initButtons();
}

function initSoundBank() {
  if (typeof Audio === 'undefined') return;
  Object.entries(SFX).forEach(([name, config]) => {
    try {
      const voices = Array.from({ length: config.voices }, () => {
        const audio = new Audio(config.src);
        const voice = { audio, busy: false, playId: 0, timers: [] };
        audio.preload = 'auto';
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.addEventListener('ended', () => {
          clearVoiceTimers(voice);
          voice.busy = false;
        });
        audio.load();
        return voice;
      });
      soundBank.set(name, { config, voices, cursor: 0 });
    } catch (_) { /* Audio is optional. */ }
  });
  try {
    bgmAudio = new Audio(BGM.src);
    bgmAudio.preload = 'auto';
    bgmAudio.loop = true;
    bgmAudio.volume = BGM.volume;
    bgmAudio.load();
  } catch (_) { /* Audio is optional. */ }
}

function clearVoiceTimers(voice) {
  voice.timers.forEach((timer) => clearTimeout(timer));
  voice.timers.length = 0;
}

function stopVoice(voice, playId, reset = true) {
  if (playId !== undefined && voice.playId !== playId) return;
  clearVoiceTimers(voice);
  voice.busy = false;
  voice.audio.pause();
  if (reset) {
    try { voice.audio.currentTime = 0; } catch (_) { /* Metadata may not be ready yet. */ }
  }
}

function scheduleVoiceCutoff(voice, playId, generation, baseVolume, cutoff, fade) {
  if (!Number.isFinite(cutoff) || cutoff <= 0) return;
  const fadeDuration = Math.max(0, Math.min(Number.isFinite(fade) ? fade : 0.12, cutoff));
  const fadeStart = cutoff - fadeDuration;
  const steps = fadeDuration > 0 ? 4 : 1;

  for (let step = 1; step <= steps; step += 1) {
    const delay = fadeStart + (fadeDuration * step / steps);
    const timer = setTimeout(() => {
      if (voice.playId !== playId || generation !== soundGeneration) return;
      if (step === steps) {
        stopVoice(voice, playId);
        return;
      }
      voice.audio.volume = baseVolume * (1 - step / steps);
    }, Math.max(0, delay * 1000));
    voice.timers.push(timer);
  }
}

function playSfx(name, options = {}) {
  if (!state.sound) return false;
  const pool = soundBank.get(name);
  if (!pool) return false;

  const { config, voices } = pool;
  let voice = voices.find((candidate) => !candidate.busy || candidate.audio.paused || candidate.audio.ended);
  if (!voice) {
    voice = voices[pool.cursor % voices.length];
    pool.cursor += 1;
  }

  const generation = soundGeneration;
  const playId = ++soundPlayId;
  clearVoiceTimers(voice);
  voice.audio.pause();
  voice.busy = true;
  voice.playId = playId;
  try {
    voice.audio.currentTime = 0;
    voice.audio.playbackRate = Math.max(0.98, Math.min(1.02, options.rate ?? 1));
    const baseVolume = Math.max(0, Math.min(1, config.volume * (options.volume ?? 1)));
    voice.audio.volume = baseVolume;
    const request = voice.audio.play();
    const armCutoff = () => {
      if (voice.playId !== playId || generation !== soundGeneration) return;
      scheduleVoiceCutoff(
        voice,
        playId,
        generation,
        baseVolume,
        options.cutoff ?? config.cutoff,
        options.fade ?? config.fade
      );
    };
    if (request?.then) request.then(armCutoff).catch(() => {
      if (voice.playId !== playId) return;
      stopVoice(voice, playId);
    });
    else armCutoff();
    return true;
  } catch (_) {
    stopVoice(voice, playId);
    return false;
  }
}

function playBgm() {
  if (!state.sound || !bgmAudio || !$('#game').classList.contains('active')) return false;
  bgmAudio.volume = BGM.volume;
  const request = bgmAudio.play();
  if (request?.catch) request.catch(() => { /* A later user action can retry playback. */ });
  return true;
}

function stopBgm(reset = true) {
  if (!bgmAudio) return;
  bgmAudio.pause();
  if (reset) {
    try { bgmAudio.currentTime = 0; } catch (_) { /* Metadata may not be ready yet. */ }
  }
}

function stopAllSounds({ resetBgm = true } = {}) {
  soundGeneration += 1;
  soundBank.forEach(({ voices }) => voices.forEach((voice) => {
    voice.playId = ++soundPlayId;
    stopVoice(voice);
  }));
  stopBgm(resetBgm);
}

function playKiWave(power, player) {
  const level = Math.max(1, Math.min(MAX_KI, power));
  const sideOffset = player === 0 ? 1.003 : 0.997;
  playSfx(`wave${level}`, {
    rate: WAVE_RATES[level - 1] * sideOffset,
    volume: WAVE_VOLUMES[level - 1]
  });
  if (level >= 4) {
    playSfx('kiLow', {
      rate: (level === MAX_KI ? 0.99 : 1.005) * sideOffset,
      volume: level === MAX_KI ? 1 : 0.68
    });
  }
}

function playActionSounds(actions, powers) {
  const doubled = actions[0] === actions[1];
  actions.forEach((action, player) => {
    const sideOffset = player === 0 ? 1.003 : 0.997;
    if (action === 'attack') {
      playKiWave(powers[player], player);
    } else if (action === 'charge') {
      const nextLevel = Math.min(MAX_KI, powers[player] + 1);
      playSfx('charge', {
        rate: (0.992 + nextLevel * 0.003) * sideOffset,
        volume: doubled ? 0.78 : 1
      });
    } else if (action === 'guard') {
      playSfx('guardUp', { rate: sideOffset, volume: doubled ? 0.82 : 1 });
    }
  });
}

function updateVersusSelectionUi() {
  $$('[data-versus-player="1"][data-fighter-id]').forEach((button) => {
    const fighterId = resolveFighterId(button.dataset.fighterId);
    const selected = versusSelections[1] === fighterId;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const p2Name = $('#versusP2Name');
  if (p2Name) p2Name.textContent = FIGHTERS[versusSelections[1]].name;
}

function showFighterSelect() {
  sessionCounter += 1;
  stopAllSounds();
  hideTrainingIntro();
  $('#game').classList.remove('practice-mode', 'cpu-mode');
  versusSelections = normalizeVersusSelections(versusSelections);
  updateVersusSelectionUi();
  screen('fighterSelect');
}

function start(mode, opponentId = 'leon', fighterIds = versusSelections) {
  stopAllSounds();
  hideTrainingIntro();
  const selectedCpuOpponent = mode === 'cpu' && CPU_ROSTER.includes(opponentId) ? opponentId : 'leon';
  if (mode === 'versus') versusSelections = normalizeVersusSelections(fighterIds);
  state = freshState(mode, selectedCpuOpponent, versusSelections);
  const cpu = mode === 'cpu';
  const cpuStage = cpu ? CPU_ROSTER.indexOf(fighterId(1)) + 1 : 0;
  $('#game').classList.remove('practice-mode');
  $('#game').classList.toggle('cpu-mode', cpu);
  $('#modeLabel').textContent = cpu
    ? `${cpuStage} / ${CPU_ROSTER.length}　${fighterDisplayName(1)}に ちょうせん`
    : 'ふたりで たいせん';
  $('#panelP1Label').textContent = `${fighterDisplayName(0)}の ばん`;
  $('#keyHelp').textContent = cpu
    ? `キー：${fighterDisplayName(0)} A・S・D`
    : `キー：${fighterDisplayName(0)} A・S・D ／ ${fighterDisplayName(1)} J・K・L`;
  $('.turn-panel.p2').style.display = cpu ? 'none' : '';
  applyFighterIdentity();
  preloadFighter(fighterId(0));
  preloadFighter(fighterId(1));
  screen('game');
  resetFighterEffects();
  setCountdown('かまえ！');
  announce(cpu && fighterDefinition(1).startBonus
    ? `${fighterDisplayName(1)}は せんてんきあい ${fighterDefinition(1).startBonus}から！`
    : `${fighterDisplayName(0)}から えらぼう`);
  render();
  playBgm();
}

function startPractice() {
  stopAllSounds();
  state = freshState('practice', 'whiteTiger');
  trainingStep = 0;
  trainingPhase = 0;
  trainingReviewIndex = 0;
  trainingMistakes = 0;
  $('#game').classList.remove('cpu-mode');
  $('#game').classList.add('practice-mode');
  $('#modeLabel').textContent = 'びゃっこの じっせんけいこ';
  $('#keyHelp').textContent = `キー：${fighterDisplayName(0)} A・S・D`;
  $('#panelP1Label').textContent = 'わざを えらぼう';
  $('.turn-panel.p2').style.display = 'none';
  applyFighterIdentity();
  preloadFighter('whiteTiger');
  screen('game');
  prepareTrainingStep(true);
  state.locked = true;
  render();
  const intro = $('#trainingIntro');
  intro.hidden = false;
  requestAnimationFrame(() => $('#trainingIntroBtn').focus());
  playBgm();
}

function hideTrainingIntro() {
  const intro = $('#trainingIntro');
  if (intro) intro.hidden = true;
}

function beginTraining() {
  if (state.mode !== 'practice') return;
  hideTrainingIntro();
  state.locked = false;
  announce('わしの わざを\nよく みるのじゃ！');
  render();
}

function currentTrainingChallenge() {
  const lesson = TRAINING[trainingStep];
  if (!lesson) return TRAINING[0];
  if (lesson.review) return { ...lesson, ...TRAINING_REVIEW[trainingReviewIndex] };
  if (lesson.phases) return { ...lesson, ...lesson.phases[trainingPhase] };
  return lesson;
}

function prepareTrainingStep(resetMistakes = true) {
  const lesson = TRAINING[trainingStep];
  const challenge = currentTrainingChallenge();
  if (resetMistakes) trainingMistakes = 0;
  state.ki = [...challenge.ki];
  state.choice = [null, null];
  state.locked = false;
  state.pointWinner = null;
  state.round = trainingStep + 1;
  if (lesson.final) state.aiMemory = { playerHistory: [], cpuHistory: [], guardStreak: 0 };
  resetFighterEffects();
  setCountdown(lesson.final ? 'しあげ！' : lesson.review ? `みきわめ ${trainingReviewIndex + 1} / ${TRAINING_REVIEW.length}` : 'やってみよう！');
  announce(lesson.review ? 'わしの わざを みきわめるのじゃ' : 'わざを えらぶのじゃ');
  renderCoach();
  render();
}

function renderCoach(overrideText, tone = '') {
  const lesson = TRAINING[trainingStep];
  const challenge = currentTrainingChallenge();
  $('#coachStep').textContent = lesson.final
    ? 'さいごの けいこ　じっせん'
    : `けいこ ${trainingStep + 1} / ${TRAINING.length}　${lesson.title}`;
  $('#coachText').textContent = overrideText || challenge.text;
  $('#coachPips').innerHTML = TRAINING.map((_, index) => `<i class="${index < trainingStep ? 'done' : index === trainingStep ? 'now' : ''}"></i>`).join('');
  const score = $('#coachScore');
  if (lesson.review) {
    score.hidden = false;
    score.textContent = `せいかい ${trainingReviewIndex} / ${TRAINING_REVIEW.length}`;
  } else if (lesson.phases) {
    score.hidden = false;
    score.textContent = `MAXけいこ ${trainingPhase + 1} / ${lesson.phases.length}`;
  } else {
    score.hidden = true;
    score.textContent = '';
  }
  const coach = $('#coach');
  coach.dataset.tone = tone;
  $('#coachGuide').dataset.focus = challenge.focus || lesson.focus || 'all';
}

function render() {
  $('#roundLabel').textContent = state.mode === 'practice' ? `けいこ ${trainingStep + 1}` : `${state.round} てめ`;
  $('#p1Score').textContent = Array.from({ length: POINTS_TO_WIN }, (_, i) => state.score[0] > i ? '●' : '○').join(' ');
  $('#p2Score').textContent = Array.from({ length: POINTS_TO_WIN }, (_, i) => state.score[1] > i ? '●' : '○').join(' ');
  renderKi($('#p1Ki'), state.ki[0], fighterDisplayName(0));
  renderKi($('#p2Ki'), state.ki[1], fighterDisplayName(1));
  $('#p1Fighter').dataset.ki = String(state.ki[0]);
  $('#p2Fighter').dataset.ki = String(state.ki[1]);

  $$('.actions').forEach((box) => {
    const player = Number(box.dataset.player) - 1;
    box.querySelectorAll('.action').forEach((button) => {
      const action = button.dataset.action;
      const waitingForP1 = state.mode === 'versus' && player === 1 && state.choice[0] === null;
      const challenge = state.mode === 'practice' ? currentTrainingChallenge() : null;
      const showTrainingHint = state.mode === 'practice' && player === 0 && trainingMistakes >= 2 &&
        challenge?.expected === action;
      button.classList.toggle('training-hint', showTrainingHint);
      button.disabled = state.locked || state.choice[player] !== null || waitingForP1 ||
        (action === 'attack' && state.ki[player] === 0) ||
        (state.ki[player] >= MAX_KI && action !== 'attack');
    });
  });

  $('.turn-panel.p1').classList.toggle('locked', state.choice[0] !== null);
  $('.turn-panel.p2').classList.toggle('locked', state.choice[1] !== null);
  $('.turn-panel.p2').classList.toggle('waiting', state.mode === 'versus' && state.choice[0] === null);
}

function renderKi(element, amount, name) {
  const pips = Array.from({ length: MAX_KI }, (_, index) => `<i class="${index < amount ? 'filled' : ''}"></i>`).join('');
  element.innerHTML = `${pips}${amount === MAX_KI ? '<strong class="ki-max">きあいMAX！</strong>' : ''}`;
  element.classList.toggle('is-max', amount === MAX_KI);
  element.setAttribute('aria-label', `${name}の きあい ${amount} / ${MAX_KI}`);
}

function choose(player, action) {
  if (state.locked || state.choice[player] !== null) return;
  if ((state.mode === 'cpu' || state.mode === 'practice') && player !== 0) return;
  if (state.mode === 'versus' && player === 1 && state.choice[0] === null) return;
  if (action === 'attack' && state.ki[player] === 0) return;
  if (state.ki[player] >= MAX_KI && action !== 'attack') return;

  const trainingChallenge = state.mode === 'practice' ? currentTrainingChallenge() : null;
  const plannedCpuAction = (state.mode === 'cpu' || state.mode === 'practice') && player === 0
    ? trainingChallenge?.cpu || cpuChoice() : null;
  state.choice[player] = action;

  if (state.mode === 'versus' && player === 0) {
    announce(`${fighterDisplayName(0)} けってい！ ${fighterDisplayName(1)}の ばん`);
  }
  render();

  if ((state.mode === 'cpu' || state.mode === 'practice') && player === 0) {
    state.locked = true;
    const currentSession = state.session;
    setTimeout(() => {
      if (state.session !== currentSession || !$('#game').classList.contains('active')) return;
      state.choice[1] = plannedCpuAction;
      resolveTurn();
    }, 430);
  } else if (state.choice[0] && state.choice[1]) {
    resolveTurn();
  }
}

function weightedAction(weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [action, weight] of entries) {
    roll -= weight;
    if (roll < 0) return action;
  }
  return entries.at(-1)?.[0] || 'guard';
}

function balancedWeights(ownKi, playerKi) {
  if (!ownKi) return { charge: 72, guard: 28, attack: 0 };
  if (playerKi >= MAX_KI) return { charge: 20, guard: 20, attack: 60 };
  if (!playerKi) return { charge: 42, guard: 8, attack: 50 };
  return { charge: 32, guard: 30, attack: 38 };
}

function rushWeights(ownKi, playerKi) {
  if (!ownKi) return { charge: 72, guard: 28, attack: 0 };
  let weights;
  if (ownKi === 1) weights = { charge: 15, guard: 15, attack: 70 };
  else if (ownKi === 2) weights = { charge: 10, guard: 12, attack: 78 };
  else weights = { charge: 15, guard: 20, attack: 65 };
  if (!playerKi) {
    const boost = Math.min(10, 85 - weights.attack);
    weights.attack += boost;
    weights.charge -= boost / 2;
    weights.guard -= boost / 2;
  }
  return weights;
}

function wallWeights(ownKi, playerKi) {
  if (!ownKi) return { charge: 50, guard: 50, attack: 0 };
  const weights = ownKi <= 2
    ? { charge: 24, guard: 58, attack: 18 }
    : { charge: 18, guard: 57, attack: 25 };
  if (!playerKi) {
    weights.attack += 12;
    weights.guard -= 8;
    weights.charge -= 4;
  } else if (playerKi >= 3 && playerKi < MAX_KI) {
    weights.guard += 12;
    weights.attack -= 6;
    weights.charge -= 6;
  }
  if (state.aiMemory.guardStreak >= 3) weights.guard *= 0.5;
  return weights;
}

function masterWeights(ownKi, playerKi) {
  if (!ownKi) return playerKi <= 2
    ? { charge: 60, guard: 40, attack: 0 }
    : { charge: 40, guard: 60, attack: 0 };

  let weights;
  if (!playerKi) weights = { charge: 35, guard: 15, attack: 50 };
  else if (playerKi <= 2) weights = { charge: 33, guard: 33, attack: 34 };
  else if (playerKi < MAX_KI) weights = { charge: 24, guard: 48, attack: 28 };
  else weights = { charge: 25, guard: 25, attack: 50 };

  const history = state.aiMemory.playerHistory;
  const repeatedAction = history.length >= 2 && history.at(-1) === history.at(-2) ? history.at(-1) : null;
  if (repeatedAction) {
    const counter = { charge: 'attack', attack: 'guard', guard: 'charge' }[repeatedAction];
    Object.keys(weights).forEach((action) => {
      weights[action] += action === counter ? 15 : -7.5;
    });
  }
  const lastCpuAction = state.aiMemory.cpuHistory.at(-1);
  if (lastCpuAction) weights[lastCpuAction] *= 0.55;
  Object.keys(weights).forEach((action) => {
    if (action === 'attack' && !ownKi) weights[action] = 0;
    else weights[action] = Math.max(10, Math.min(60, weights[action]));
  });
  return weights;
}

function cpuChoice() {
  const ownKi = state.ki[1];
  const playerKi = state.ki[0];
  if (ownKi >= MAX_KI) return 'attack';
  const strategy = fighterDefinition(1).strategy;
  const weights = strategy === 'rush' ? rushWeights(ownKi, playerKi)
    : strategy === 'wall' ? wallWeights(ownKi, playerKi)
      : strategy === 'master' ? masterWeights(ownKi, playerKi)
        : balancedWeights(ownKi, playerKi);
  return weightedAction(weights);
}

function outcome(first, second, firstPower, secondPower) {
  if (first === 'attack' && second === 'attack') {
    if (firstPower > secondPower) return 1;
    if (secondPower > firstPower) return -1;
    return 0;
  }
  if (first === 'attack' && second === 'guard') return firstPower >= MAX_KI ? 1 : 0;
  if (first === 'guard' && second === 'attack') return secondPower >= MAX_KI ? -1 : 0;
  if (first === 'attack' && second === 'charge') return 1;
  if (first === 'charge' && second === 'attack') return -1;
  return 0;
}

function energyAfter(actions, powers) {
  return actions.map((action, index) => {
    if (action === 'charge') return Math.min(MAX_KI, powers[index] + 1);
    if (action === 'attack') return 0;
    return powers[index];
  });
}

function updateAiMemory(actions, pointScored) {
  const trainingFinal = state.mode === 'practice' && TRAINING[trainingStep]?.final;
  if (state.mode !== 'cpu' && !trainingFinal) return;
  if (pointScored) {
    state.aiMemory = { playerHistory: [], cpuHistory: [], guardStreak: 0 };
    return;
  }
  state.aiMemory.playerHistory.push(actions[0]);
  state.aiMemory.cpuHistory.push(actions[1]);
  state.aiMemory.playerHistory = state.aiMemory.playerHistory.slice(-2);
  state.aiMemory.cpuHistory = state.aiMemory.cpuHistory.slice(-2);
  state.aiMemory.guardStreak = actions[1] === 'guard' ? state.aiMemory.guardStreak + 1 : 0;
}

function kiFromLosses(score) {
  const opponentBonus = state.mode === 'cpu' ? fighterDefinition(1).startBonus : 0;
  return [
    Math.min(MAX_ROUND_START_KI, score[1]),
    Math.min(MAX_ROUND_START_KI, score[0] + opponentBonus)
  ];
}

function announce(text) {
  $('#message').textContent = text;
}

function setCountdown(text) {
  const countdown = $('#countdown');
  countdown.classList.remove('matchup-countdown');
  countdown.removeAttribute('aria-label');
  countdown.textContent = text;
}

function showMatchup(actions, powers) {
  const countdown = $('#countdown');
  const labels = actions.map((action, index) => action === 'attack'
    ? `${ACTIONS[action].name} きあい${powers[index]}`
    : ACTIONS[action].name);
  const moveNodes = actions.map((action, index) => {
    const move = document.createElement('span');
    move.className = `matchup-move matchup-p${index + 1}`;
    const name = document.createElement('span');
    name.textContent = ACTIONS[action].name;
    move.append(name);
    if (action === 'attack') {
      const ki = document.createElement('small');
      ki.textContent = powers[index];
      ki.setAttribute('aria-hidden', 'true');
      move.append(ki);
    }
    return move;
  });
  const versus = document.createElement('span');
  versus.className = 'matchup-versus';
  versus.textContent = 'たい';
  countdown.classList.add('matchup-countdown');
  countdown.setAttribute('aria-label', `${labels[0]} たい ${labels[1]}`);
  countdown.replaceChildren(moveNodes[0], versus, moveNodes[1]);
}

function resolveTurn() {
  state.locked = true;
  const actions = [...state.choice];
  const powers = [...state.ki];
  const winner = outcome(actions[0], actions[1], powers[0], powers[1]);
  showMatchup(actions, powers);
  announce(actions[0] === 'attack' && actions[1] === 'attack' ? 'まんなかで ぶつかる！' : 'わざ はっこう！');
  setFighterPose(0, actions[0]);
  setFighterPose(1, actions[1]);
  $('#p1Fighter').classList.add(actions[0]);
  $('#p2Fighter').classList.add(actions[1]);
  render();

  const fxDuration = playBattleFx(actions, powers, winner);
  schedule(() => completeTurn({ actions, powers, winner }), fxDuration);
}

function playBattleFx(actions, powers, winner) {
  clearBattleFx();
  const fx = $('#battleFx');
  const p1Attack = actions[0] === 'attack';
  const p2Attack = actions[1] === 'attack';
  $('#p1Shot').dataset.level = String(Math.max(1, powers[0]));
  $('#p2Shot').dataset.level = String(Math.max(1, powers[1]));
  $('#clashFx').dataset.level = String(Math.max(1, powers[0], powers[1]));
  $('#breakthroughFx').dataset.level = String(Math.max(1, powers[0], powers[1]));
  playActionSounds(actions, powers);

  if (p1Attack && p2Attack) {
    fx.classList.add('duel', 'clashing');
    schedule(() => playSfx('impact', { volume: winner ? 0.72 : 0.9, rate: winner ? 0.995 : 1 }), 500);
    if (winner) {
      const winnerIndex = winner > 0 ? 0 : 1;
      fx.classList.add(winner > 0 ? 'break-right' : 'break-left');
      triggerFinisher('wave', winnerIndex, null, powers[winnerIndex], powers[1 - winnerIndex]);
    } else {
      schedule(() => playSfx('waveBreak', { volume: 0.72, rate: 1.01 }), 525);
    }
    return winner ? 1800 : 1100;
  }
  if (p1Attack) {
    if (actions[1] === 'guard') {
      $('#clashFx').style.left = '71%';
      fx.classList.add('p1-guard', 'guard-burst');
      schedule(() => playSfx('guardImpact', { volume: winner > 0 ? 0.72 : 1 }), 480);
      if (winner > 0) {
        fx.classList.add('break-right');
        triggerGuardBreak(1, 0, powers[0]);
      }
      return winner > 0 ? 1700 : 900;
    }
    fx.classList.add('p1-hit');
    schedule(() => playSfx('impact', { volume: 0.9, rate: 1.005 }), 625);
    return 820;
  }
  if (p2Attack) {
    if (actions[0] === 'guard') {
      $('#clashFx').style.left = '29%';
      fx.classList.add('p2-guard', 'guard-burst');
      schedule(() => playSfx('guardImpact', { volume: winner < 0 ? 0.72 : 1 }), 480);
      if (winner < 0) {
        fx.classList.add('break-left');
        triggerGuardBreak(0, 1, powers[1]);
      }
      return winner < 0 ? 1700 : 900;
    }
    fx.classList.add('p2-hit');
    schedule(() => playSfx('impact', { volume: 0.9, rate: 0.995 }), 625);
    return 820;
  }
  return 480;
}

function triggerGuardBreak(defender, winnerIndex, power) {
  $(`#p${defender + 1}Fighter`).classList.add('guard-break');
  triggerFinisher('guard', winnerIndex, defender, power);
}

function triggerFinisher(kind, winnerIndex, targetPlayer, power, loserPower = 0) {
  const fx = $('#battleFx');
  const finish = $('#finishFx');
  const isGuardBreak = kind === 'guard';
  const impactLeft = targetPlayer === null ? '50%' : targetPlayer === 0 ? '29%' : '71%';
  const targetLeft = winnerIndex === 0 ? '82%' : '18%';
  const winnerClass = winnerIndex === 0 ? 'win-p1' : 'win-p2';
  fx.classList.add('cinematic-impact', winnerClass, isGuardBreak ? 'guard-destroy' : 'wave-overpower');
  finish.style.setProperty('--finish-origin', impactLeft);
  finish.style.setProperty('--finish-target', targetLeft);
  finish.dataset.kind = kind;
  finish.dataset.level = String(Math.max(1, power));
  if (!isGuardBreak) finish.dataset.loserLevel = String(Math.max(1, loserPower));
  $('#finishFxText').textContent = isGuardBreak ? 'ガードはかい!!' : 'きあいとっぱ!!';

  const dojo = $('.dojo');
  dojo.classList.remove('cinematic-shake');
  void dojo.offsetWidth;
  dojo.classList.add('cinematic-shake');

  const impactDelay = isGuardBreak ? 560 : 620;
  schedule(() => {
    setCountdown(isGuardBreak ? 'ガードはかい!!' : 'きあいとっぱ!!');
    announce(isGuardBreak
      ? 'きあいMAXが ガードを こなごなに くだいた！'
      : `${fighterDisplayName(winnerIndex)}の きあいが おしきる！`);
    if (isGuardBreak) {
      playSfx('guardImpact', { volume: 0.86, rate: 0.99 });
    } else {
      playSfx('waveBreak', { volume: 0.9, rate: 1.01 - (power - 1) * 0.005 });
      playSfx('impact', { volume: 0.58, rate: 0.99 });
    }
  }, impactDelay);
  if (isGuardBreak) {
    schedule(() => playSfx('guardShatter', { volume: 0.92, rate: 1 }), impactDelay + 25);
    schedule(() => playSfx('impact', { volume: 0.74, rate: 0.99 }), impactDelay + 55);
  }
  schedule(() => {
    playSfx('impact', { volume: 0.68, rate: 0.98 });
    playSfx('kiLow', { volume: 0.68, rate: 0.99 });
  }, impactDelay + 560);
  schedule(() => $(`#p${2 - winnerIndex}Fighter`).classList.add('finish-hit'), impactDelay + 560);
  schedule(() => $(`#p${2 - winnerIndex}Fighter`).classList.remove('finish-hit'), impactDelay + 1080);
}

function completeTurn({ actions, powers, winner }) {
  state.ki = energyAfter(actions, powers);
  let message = turnMessage(actions[0], actions[1], powers, winner);
  const winnerIndex = winner ? (winner > 0 ? 0 : 1) : null;
  const reachedMax = actions
    .map((action, index) => action === 'charge' && powers[index] < MAX_KI && state.ki[index] === MAX_KI ? index : -1)
    .filter((index) => index >= 0);

  if (state.mode !== 'practice' && winnerIndex !== null) {
    state.score[winnerIndex] += 1;
    state.pointWinner = winnerIndex;
  }
  updateAiMemory(actions, winnerIndex !== null);
  if (winner) showOutcomePoses(winner);

  clearBattleFx();
  announce(message);
  render();

  if (winnerIndex !== null) {
    showEventBanner('point', fighterDisplayName(winnerIndex), 'いっぽん！');
  } else if (reachedMax.length) {
    const name = reachedMax.length === 2 ? 'ふたりとも' : fighterDisplayName(reachedMax[0]);
    showEventBanner('max', name, 'きあいMAX！');
    playSfx('kiMax', { volume: reachedMax.length === 2 ? 1 : 0.9 });
  }

  if (state.mode === 'practice') {
    handleTrainingResult({ actions, powers, winner, defaultMessage: message });
    return;
  }
  schedule(nextTurn, winner ? 2100 : reachedMax.length ? 1650 : 1050);
}

function fighterDisplayName(player) {
  return fighterDefinition(player).name;
}

function showEventBanner(kind, name, text) {
  const banner = $('#eventBanner');
  $('#eventBannerName').textContent = name;
  $('#eventBannerText').textContent = text;
  banner.className = 'event-banner';
  void banner.offsetWidth;
  banner.classList.add(kind, 'show');
}

function clearEventBanner() {
  const banner = $('#eventBanner');
  banner.className = 'event-banner';
  $('#eventBannerName').textContent = '';
  $('#eventBannerText').textContent = '';
}

function turnMessage(first, second, powers, winner) {
  const firstName = fighterDisplayName(0);
  const secondName = fighterDisplayName(1);
  if (first === 'attack' && second === 'attack') {
    if (!winner) return `きあい ${powers[0]} たい ${powers[1]}！ まんなかで はじけた！`;
    const name = winner > 0 ? firstName : secondName;
    return `きあい ${powers[0]} たい ${powers[1]}！ ${name}の いっぽん！`;
  }
  if (first === 'attack' && second === 'guard' && powers[0] >= MAX_KI) return `きあい 5！ ${firstName}が ガードを やぶった！`;
  if (first === 'guard' && second === 'attack' && powers[1] >= MAX_KI) return `きあい 5！ ${secondName}が ガードを やぶった！`;
  if (winner) return `${winner > 0 ? firstName : secondName}、いっぽん！`;
  if ((first === 'attack' && second === 'guard') || (second === 'attack' && first === 'guard')) return 'きあいの なみを しっかり まもった！';
  if (first === 'charge' && second === 'guard') return `${firstName}が きあいを ためた！`;
  if (second === 'charge' && first === 'guard') return `${secondName}が きあいを ためた！`;
  if (first === 'charge' && second === 'charge') return 'ふたりとも きあいが ふえた！';
  return 'どちらも ゆずらない！';
}

function showOutcomePoses(winner) {
  const winnerIndex = winner > 0 ? 0 : 1;
  const loserIndex = 1 - winnerIndex;
  setFighterPose(winnerIndex, 'win');
  setFighterPose(loserIndex, 'lose');
  $(`#p${winnerIndex + 1}Fighter`).classList.add('win');
  $(`#p${loserIndex + 1}Fighter`).classList.add('lose', 'hit');
  playSfx('point');
}

function trainingRetryMessage(challenge, selectedAction) {
  return challenge.retry?.[selectedAction] ||
    `おしい！ わしの「${ACTIONS[challenge.cpu]?.name || 'わざ'}」を よく みて、もういちど えらぶのじゃ。`;
}

function advanceTrainingChallenge() {
  const lesson = TRAINING[trainingStep];
  if (lesson.review) {
    trainingReviewIndex += 1;
    if (trainingReviewIndex < TRAINING_REVIEW.length) {
      prepareTrainingStep(true);
      return;
    }
    trainingReviewIndex = 0;
    trainingStep += 1;
    prepareTrainingStep(true);
    return;
  }
  if (lesson.phases) {
    trainingPhase += 1;
    if (trainingPhase < lesson.phases.length) {
      prepareTrainingStep(true);
      return;
    }
    trainingPhase = 0;
  }
  trainingStep += 1;
  prepareTrainingStep(true);
}

function handleTrainingResult({ actions, winner, defaultMessage }) {
  const lesson = TRAINING[trainingStep];
  const challenge = currentTrainingChallenge();

  if (!lesson.final) {
    const correct = actions[0] === challenge.expected;
    if (!correct) {
      trainingMistakes += 1;
      const hint = trainingRetryMessage(challenge, actions[0]);
      const message = `${hint}　おなじ かまえで もういちど！`;
      announce(message);
      renderCoach(message, 'mistake');
      render();
      schedule(() => prepareTrainingStep(false), 2350);
      return;
    }

    const message = challenge.result || defaultMessage;
    announce(message);
    renderCoach(message, 'correct');
    if (lesson.review) $('#coachScore').textContent = `せいかい ${trainingReviewIndex + 1} / ${TRAINING_REVIEW.length}`;
    render();
    schedule(advanceTrainingChallenge, 2250);
    return;
  }

  if (winner > 0) {
    const message = 'ごうかく！ さんすくみと きあいくらべを つかって、わしから いっぽん とったな！';
    announce(message);
    renderCoach(message, 'correct');
    schedule(finishPractice, 1800);
  } else if (winner < 0) {
    const message = 'おしい！ さんすくみの ずと きあいの かずを みて、おなじ じょうけんから もういちど！';
    announce(message);
    renderCoach(message, 'mistake');
    schedule(() => prepareTrainingStep(true), 2100);
  } else {
    const message = 'まだ しょうぶは つづく！ のこった きあいを みて、つぎの わざを えらぼう。';
    renderCoach(message);
    schedule(() => continueTrainingDuel(message), 1450);
  }
}

function continueTrainingDuel(coachText) {
  state.choice = [null, null];
  state.locked = false;
  resetFighterEffects();
  setCountdown('つづけよう！');
  announce('つぎの わざを えらぼう');
  renderCoach(coachText);
  render();
}

function schedule(callback, delay) {
  const currentSession = state.session;
  setTimeout(() => {
    if (state.session === currentSession && $('#game').classList.contains('active')) callback();
  }, delay);
}

function setFighterPose(player, pose) {
  const image = $(`#p${player + 1}Art`);
  image.src = fighterAsset(player, pose);
  const fighter = $(`#p${player + 1}Fighter`);
  fighter.classList.remove('pose-change');
  void fighter.offsetWidth;
  fighter.classList.add('pose-change');
}

function clearBattleFx() {
  const fx = $('#battleFx');
  fx.className = 'battle-fx';
  $('#clashFx').style.left = '';
  const finish = $('#finishFx');
  finish.style.removeProperty('--finish-origin');
  finish.style.removeProperty('--finish-target');
  finish.removeAttribute('data-kind');
  finish.removeAttribute('data-loser-level');
  $('#finishFxText').textContent = '';
  $('.dojo').classList.remove('cinematic-shake');
  ['p1Shot', 'p2Shot', 'clashFx', 'breakthroughFx', 'finishFx'].forEach((id) => $(`#${id}`).removeAttribute('data-level'));
}

function nextTurn() {
  if (state.score[0] >= POINTS_TO_WIN || state.score[1] >= POINTS_TO_WIN) {
    finish();
    return;
  }
  state.round += 1;
  let nextMessage = `${fighterDisplayName(0)}から えらぼう`;
  if (state.pointWinner !== null) {
    state.ki = kiFromLosses(state.score);
    const opponentBonus = state.mode === 'cpu' ? fighterDefinition(1).startBonus : 0;
    if (opponentBonus) {
      nextMessage = `かいしきあいは さいだい${MAX_ROUND_START_KI}！\n${fighterDisplayName(0)}${state.ki[0]}・${fighterDisplayName(1)}${state.ki[1]}から！`;
    } else if (state.ki[0] === state.ki[1]) {
      nextMessage = `ふたりとも ${state.ki[0]}はいぶん、きあい ${state.ki[0]}から スタート！`;
    } else {
      nextMessage = `まけた かずだけ きあい！\n${fighterDisplayName(0)}${state.ki[0]}・${fighterDisplayName(1)}${state.ki[1]}から！`;
    }
    state.pointWinner = null;
  }
  state.choice = [null, null];
  state.locked = false;
  resetFighterEffects();
  setCountdown('かまえ！');
  announce(nextMessage);
  render();
}

function resetFighterEffects() {
  ['charge', 'guard', 'guard-break', 'finish-hit', 'attack', 'hit', 'win', 'lose', 'pose-change'].forEach((className) => {
    $('#p1Fighter').classList.remove(className);
    $('#p2Fighter').classList.remove(className);
  });
  setFighterPose(0, 'charge');
  setFighterPose(1, 'charge');
  clearBattleFx();
  clearEventBanner();
}

function setResultPoses(winnerIndex) {
  const loserIndex = 1 - winnerIndex;
  const winnerArt = $('#resultWinnerArt');
  const loserArt = $('#resultLoserArt');
  winnerArt.src = fighterAsset(winnerIndex, 'win');
  loserArt.src = fighterAsset(loserIndex, 'lose');
  winnerArt.dataset.fighter = fighterId(winnerIndex);
  loserArt.dataset.fighter = fighterId(loserIndex);
  winnerArt.alt = `${fighterDisplayName(winnerIndex)}の しょうりポーズ`;
  loserArt.alt = `${fighterDisplayName(loserIndex)}の はいぼくポーズ`;
}

function finish() {
  const winner = state.score[0] >= POINTS_TO_WIN ? 0 : 1;
  const currentOpponentId = fighterId(1);
  const currentOpponentIndex = CPU_ROSTER.indexOf(currentOpponentId);
  const nextOpponentId = CPU_ROSTER[currentOpponentIndex + 1];
  const advances = state.mode === 'cpu' && winner === 0 && Boolean(nextOpponentId);
  const dojoCleared = state.mode === 'cpu' && winner === 0 && currentOpponentId === 'whiteTiger';
  state.locked = true;
  setResultPoses(winner);
  $('#resultTitle').textContent = dojoCleared ? 'どうじょうせいは！' : `${fighterDisplayName(winner)}の かち！`;
  $('#resultLine').textContent = dojoCleared
    ? `${state.score[0]} たい ${state.score[1]}！ ${fighterDisplayName(0)}が 4にんを たおした！`
    : advances
      ? `${state.score[0]} たい ${state.score[1]}！ つぎは ${FIGHTERS[nextOpponentId].name}！`
      : `${state.score[0]} たい ${state.score[1]}！ 3ぼん せんしゅ！`;
  $('#rematchBtn').textContent = dojoCleared
    ? 'さいしょから'
    : advances ? `つぎの あいて：${FIGHTERS[nextOpponentId].name}` : 'もういちど';
  if (dojoCleared) {
    resultNextMatch = { mode: 'cpu', opponentId: 'leon' };
  } else if (advances) {
    resultNextMatch = { mode: 'cpu', opponentId: nextOpponentId };
  } else if (state.mode === 'versus') {
    resultNextMatch = { mode: 'versus', opponentId: 'leon', fighterIds: [...state.fighterIds] };
  } else {
    resultNextMatch = { mode: 'cpu', opponentId: currentOpponentId };
  }
  stopBgm();
  schedule(() => {
    screen('result');
    playSfx('victory');
  }, 350);
}

function finishPractice() {
  stopBgm();
  setResultPoses(0);
  $('#resultTitle').textContent = 'けいこ かんりょう！';
  $('#resultLine').textContent = 'ためる・まもる・はなつ、きあいくらべ、MAXの とくべつルールまで みにつけた！';
  $('#rematchBtn').textContent = 'ひとりで たいせん';
  resultNextMatch = { mode: 'cpu', opponentId: 'leon' };
  screen('result');
  playSfx('victory');
}

document.addEventListener('click', (event) => {
  const versusCard = event.target.closest('[data-versus-player="1"][data-fighter-id]');
  if (versusCard) {
    const fighterId = resolveFighterId(versusCard.dataset.fighterId);
    if (fighterId) {
      versusSelections = normalizeVersusSelections(['kotaro', fighterId]);
      updateVersusSelectionUi();
    }
  }
  if (event.target.closest('[data-back]')) {
    sessionCounter += 1;
    stopAllSounds();
    hideTrainingIntro();
    $('#game').classList.remove('practice-mode', 'cpu-mode');
    screen('title');
  }
  const action = event.target.closest('.actions .action');
  if (action) choose(Number(action.dataset.player) - 1, action.dataset.action);
});

document.addEventListener('keydown', (event) => {
  const keyMap = { a: [0, 'charge'], s: [0, 'guard'], d: [0, 'attack'], j: [1, 'charge'], k: [1, 'guard'], l: [1, 'attack'] };
  const selection = keyMap[event.key.toLowerCase()];
  if (selection && $('#game').classList.contains('active')) choose(...selection);
});

$('#practiceBtn').onclick = startPractice;
$('#trainingIntroBtn').onclick = beginTraining;
const versusButton = $('#versusBtn');
const versusStartButton = $('#versusStartBtn');
if (versusButton) versusButton.onclick = showFighterSelect;
if (versusStartButton) {
  versusStartButton.onclick = () => start('versus', 'leon', [...versusSelections]);
}
$('#cpuBtn').onclick = () => start('cpu', 'leon');
$('#rematchBtn').onclick = () => {
  start(resultNextMatch.mode, resultNextMatch.opponentId, resultNextMatch.fighterIds);
};
$('#soundBtn').onclick = () => {
  state.sound = !state.sound;
  if (state.sound) {
    playBgm();
  } else {
    stopAllSounds({ resetBgm: false });
  }
  $('#soundBtn').textContent = state.sound ? '♪' : '×';
  $('#soundBtn').setAttribute('aria-label', state.sound ? 'おとを けす' : 'おとを だす');
};
$('#parkBtn').onclick = () => { window.location.href = '../../'; };

initButtons();
initSoundBank();
