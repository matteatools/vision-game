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
  charge: { src: '../assets/audio/charge.mp3', volume: 0.28, voices: 2, cutoff: 1.15, fade: 0.18 },
  guardUp: { src: '../assets/audio/guard-up.mp3', volume: 0.24, voices: 2, cutoff: 0.58, fade: 0.12 },
  wave1: { src: '../assets/audio/ki-wave-1.mp3', volume: 0.26, voices: 2, cutoff: 0.7, fade: 0.12 },
  wave2: { src: '../assets/audio/ki-wave-2.mp3', volume: 0.28, voices: 2, cutoff: 0.75, fade: 0.13 },
  wave3: { src: '../assets/audio/ki-wave-3.mp3', volume: 0.3, voices: 2, cutoff: 0.8, fade: 0.14 },
  wave4: { src: '../assets/audio/ki-wave-4.mp3', volume: 0.32, voices: 2, cutoff: 0.88, fade: 0.16 },
  wave5: { src: '../assets/audio/ki-wave-5.mp3', volume: 0.35, voices: 2, cutoff: 0.98, fade: 0.18 },
  kiLow: { src: '../assets/audio/ki-low.mp3', volume: 0.2, voices: 2, cutoff: 1.05, fade: 0.22 },
  impact: { src: '../assets/audio/impact-heavy.mp3', volume: 0.36, voices: 3, cutoff: 0.62, fade: 0.12 },
  guardImpact: { src: '../assets/audio/guard-impact.mp3', volume: 0.3, voices: 3, cutoff: 0.56, fade: 0.11 },
  guardShatter: { src: '../assets/audio/guard-shatter.mp3', volume: 0.3, voices: 2, cutoff: 1.05, fade: 0.2 },
  waveBreak: { src: '../assets/audio/wave-break.mp3', volume: 0.32, voices: 2, cutoff: 1.3, fade: 0.24 },
  kiMax: { src: '../assets/audio/ki-max.mp3', volume: 0.24, voices: 2, cutoff: 1.3, fade: 0.24 },
  point: { src: '../assets/audio/ippon-bell.mp3', volume: 0.28, voices: 1, cutoff: 1.45, fade: 0.25 },
  victory: { src: '../assets/audio/victory.mp3', volume: 0.3, voices: 1, cutoff: 4.8, fade: 0.55 }
};

const BGM = {
  src: '../assets/audio/bgm-dojo.mp3',
  volume: 0.065
};

const WAVE_RATES = [1.015, 1.008, 1, 0.992, 0.985];
const WAVE_VOLUMES = [0.8, 0.85, 0.9, 0.95, 1];
const soundBank = new Map();
let soundGeneration = 0;
let soundPlayId = 0;
let bgmAudio = null;
function resolveFighterId(id) {
  if (Object.prototype.hasOwnProperty.call(FIGHTERS, id)) return id;
  return Object.keys(FIGHTERS).find((fighterId) => FIGHTERS[fighterId].asset === id) || null;
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
  return `../assets/fighters/${fighter.asset}-${safePose}-v1.webp`;
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

function renderKi(element, amount, name) {
  const pips = Array.from({ length: MAX_KI }, (_, index) => `<i class="${index < amount ? 'filled' : ''}"></i>`).join('');
  element.innerHTML = `${pips}${amount === MAX_KI ? '<strong class="ki-max">きあいMAX！</strong>' : ''}`;
  element.classList.toggle('is-max', amount === MAX_KI);
  element.setAttribute('aria-label', `${name}の きあい ${amount} / ${MAX_KI}`);
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

import {roomRequest} from './room-api.js';

const id = new URL(location.href).searchParams.get('room');
const token = sessionStorage.getItem('kemono-karate:' + id);
const state = {sound:true, fighterIds:[]};
let current, locked = true;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const schedule = (callback, delay) => setTimeout(callback, delay);

// Both devices show their own fighter and controls on the left.
function localOrder(pair) {
  return [pair[current.seat], pair[1 - current.seat]];
}

function drawMeters(round, score, ki) {
  $('#roundLabel').textContent = round + ' てめ';
  score.forEach((points, i) => {
    const side = '#p' + (i + 1);
    $(side + 'Score').textContent = Array.from({length:POINTS_TO_WIN}, (_, n) => n < points ? '●' : '○').join(' ');
    $(side + 'Fighter').dataset.ki = ki[i];
    renderKi($(side + 'Ki'), ki[i], fighterDisplayName(i));
  });
}

function lockInput(value) {
  locked = value;
  const ki = current?.ki[current.seat] ?? 0;
  for (const button of $$('.p1 .action')) {
    button.disabled = locked || (button.dataset.action === 'attack' ? ki === 0 : ki === MAX_KI);
  }
}

async function replay(turn) {
  const actions = localOrder(turn.moves);
  const powers = localOrder(turn.powers);
  const winner = turn.winner === null ? 0 : turn.winner === current.seat ? 1 : -1;
  const scores = localOrder(current.score);
  if (winner) scores[winner > 0 ? 0 : 1]--;
  drawMeters(turn.round, scores, powers);
  showMatchup(actions, powers);
  announce('わざを こうかい！');
  actions.forEach((action, i) => {
    setFighterPose(i, action);
    $('#p' + (i + 1) + 'Fighter').classList.add(action);
  });
  await pause(playBattleFx(actions, powers, winner));
  clearBattleFx();
  const after = powers.map((power,i) => actions[i] === 'attack' ? 0 : power + Number(actions[i] === 'charge'));
  drawMeters(turn.round, localOrder(current.score), after);
  announce(turnMessage(...actions, powers, winner));
  if (winner) {
    showOutcomePoses(winner);
    showEventBanner('point', fighterDisplayName(winner > 0 ? 0 : 1), 'いっぽん！');
  } else {
    const charged = actions.map((action,i) => action === 'charge' && after[i] === MAX_KI);
    if (charged.some(Boolean)) {
      showEventBanner('max', charged.every(Boolean) ? 'ふたりとも' : fighterDisplayName(charged.indexOf(true)), 'きあいMAX！');
      playSfx('kiMax');
    }
  }
  await pause(winner ? 2100 : 1050);
}

async function applySnapshot(next) {
  const previous = current;
  current = next;
  if (next.fighters.length !== 2) { location.replace('./?room=' + encodeURIComponent(id)); return; }
  if (!previous) {
    state.fighterIds = localOrder(next.fighters).map(resolveFighterId);
    applyFighterIdentity();
    state.fighterIds.forEach(preloadFighter);
    $('#modeLabel').textContent = 'オンライン対戦　' + id;
    $('#panelP1Label').textContent = 'あなた：' + fighterDisplayName(0);
    $('#keyHelp').textContent = 'キー：ためる A ／ まもる S ／ はなつ D';
    initSoundBank();
    playBgm();
  }
  lockInput(true);
  if (previous && next.last && next.last.round > (previous.last?.round ?? 0)) await replay(next.last);
  if (next.finished) {
    const winner = next.score[next.seat] === 3 ? 0 : 1;
    setResultPoses(winner);
    $('#resultTitle').textContent = fighterDisplayName(winner) + 'の かち！';
    $('#resultLine').textContent = localOrder(next.score).join(' たい ') + '　' + (winner === 0 ? 'あなたの かち！' : 'あいての かち！');
    stopBgm();
    screen('result');
    playSfx('victory');
    return;
  }
  if (!previous || next.round !== previous.round) {
    resetFighterEffects();
    drawMeters(next.round, localOrder(next.score), localOrder(next.ki));
    setCountdown('かまえ！');
  }
  const waiting = next.ready[next.seat];
  announce(waiting ? 'けってい！ あいての わざを まっています' : 'あなたの わざを えらぼう');
  lockInput(waiting);
  if (waiting) schedule(refresh, 850);
}

async function refresh() {
  let next;
  try { next = await roomRequest(id, token, 'state'); }
  catch (error) {
    announce(error.status ? error.message : '通信を再試行しています');
    if (!error.status || error.status >= 500) schedule(refresh, 2000);
    return;
  }
  await applySnapshot(next);
}

async function choose(action) {
  const button = $('.p1 [data-action="' + action + '"]');
  if (locked || !button || button.disabled) return;
  lockInput(true);
  playBgm();
  announce('わざを そうしん中');
  let next;
  try { next = await roomRequest(id, token, 'play', {round:current.round, move:action}); }
  catch { await refresh(); return; }
  await applySnapshot(next);
}

$('.turn-panel.p1').onclick = event => {
  const action = event.target.closest('.action');
  if (action) choose(action.dataset.action);
};
document.addEventListener('keydown', event => {
  const action = {a:'charge',s:'guard',d:'attack'}[event.key.toLowerCase()];
  if (action && !event.repeat && !event.ctrlKey && !event.metaKey) choose(action);
});
$('#soundBtn').onclick = () => {
  state.sound = !state.sound;
  if (state.sound) playBgm();
  else stopAllSounds({resetBgm:false});
  $('#soundBtn').textContent = state.sound ? '♪' : '×';
  $('#soundBtn').setAttribute('aria-label', state.sound ? 'おとを けす' : 'おとを だす');
};
$$('[data-back]').forEach(button => button.onclick = () => location.assign('./'));
if (!token || !id) location.replace(id ? './?room=' + encodeURIComponent(id) : './');
else refresh();
