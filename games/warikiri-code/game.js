(function () {
  "use strict";

  const Data = globalThis.WarikiriData;
  const Core = globalThis.WarikiriCore;
  if (!Data || !Core) throw new Error("ゲームの データを よみこめませんでした");

  const STORAGE_KEY = "warikiri-code-v3";
  const MAX_LIVES = 3;
  const WRONG_SCORE_PENALTY = 50;
  const INVINCIBLE_SECONDS = 5;
  const BOSS_INTERVAL_SECONDS = 30;
  const BOSS_CLEAR_PROGRESS = 0.75;
  const REGULAR_ENEMY_MAX = 199;
  const PRIME_FACTORS = new Set([2, 3, 5, 7, 11, 13]);
  const POWER_FACTORS = new Set([4, 8, 9]);
  const COMBO_CALLS = new Set([3, 5, 10, 20, 30]);
  const SOUND_FILES = Object.freeze({
    hit: Object.freeze({ src: "assets/sfx/otologic-cyber21-hit.mp3", volume: 0.22, pool: 4 }),
    repair: Object.freeze({ src: "assets/sfx/otologic-pop-repair.mp3", volume: 0.25, pool: 2 }),
    wrong: Object.freeze({ src: "assets/sfx/otologic-quiz-wrong.mp3", volume: 0.22, pool: 2 }),
    boss: Object.freeze({ src: "assets/sfx/otologic-warning-boss.mp3", volume: 0.24, pool: 1 }),
    unlock: Object.freeze({ src: "assets/sfx/otologic-cyber19-unlock.mp3", volume: 0.27, pool: 2 })
  });
  const BGM_FILE = Object.freeze({
    src: "assets/bgm/otologic-sinkai-tuuro.mp3",
    volume: 0.1,
    duckedVolume: 0.035,
    ratePerBoss: 0.05,
    maxRate: 1.3,
    rateRampPerSecond: 0.025
  });
  const query = new URLSearchParams(location.search);
  const debugEnabled = query.get("debug") === "1";
  const seed = Number(query.get("seed")) || Math.floor(Math.random() * 0xffffffff);
  const random = Core.mulberry32(seed);

  const dom = {};
  [
    "title-screen", "play-screen", "result-screen", "main-start-button", "practice-start-button",
    "main-start-label", "main-start-note", "practice-start-label", "practice-start-note",
    "fraction-start-button", "title-best-score", "game-canvas", "arena", "sound-button", "bgm-button", "pause-button",
    "center-callout", "boss-banner", "boss-progress", "pico-tip", "pico-tip-text", "side-pico-message", "piko-panel",
    "mobile-pico-strip", "mobile-pico-title", "mobile-pico-message", "mobile-pico-go-button",
    "mission-overlay", "mission-title", "mission-text", "mission-go-button", "mission-home-button", "pause-overlay", "resume-button",
    "restart-button", "home-from-pause-button", "mode-name", "target-readout", "next-boss-readout",
    "mobile-time", "mobile-score", "mobile-lives", "desktop-time", "desktop-score", "desktop-lives", "side-lives",
    "desktop-combo", "desktop-boss-time", "factor-keys", "result-kicker", "result-title", "result-message", "result-score-label",
    "result-score", "result-time", "result-repaired", "result-bosses", "result-combo", "new-record",
    "result-retry-button", "result-home-button", "live-region"
  ].forEach((id) => {
    dom[id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = document.getElementById(id);
  });

  const factorButtons = [...document.querySelectorAll(".factor-key")];
  const context = dom.gameCanvas.getContext("2d", { alpha: false });

  let stored = loadStored();
  let frameHandle = 0;
  let calloutTimer = 0;
  let resizeObserver = null;
  let pendingMissionAction = null;
  let enemySerial = 0;

  const state = {
    view: "title",
    mode: "main",
    phase: "idle",
    width: 360,
    height: 620,
    runToken: 0,
    elapsed: 0,
    score: 0,
    lives: MAX_LIVES,
    combo: 0,
    maxCombo: 0,
    repaired: 0,
    bossesCleared: 0,
    bossNumber: 0,
    invincibleUntil: 0,
    nextBossAt: BOSS_INTERVAL_SECONDS,
    spawnTimer: 0.4,
    bossActive: false,
    bossPending: false,
    activeFactors: new Set([2, 3]),
    enemies: [],
    effects: [],
    particles: [],
    targetId: null,
    inputLocked: false,
    lastTimestamp: 0,
    practiceStep: 0,
    practiceTask: 0,
    fractionIndex: 0,
    bestWasBroken: false,
    soundEnabled: stored.soundEnabled !== false,
    bgmEnabled: stored.bgmEnabled !== false,
    shake: 0,
    flash: 0,
    lastHud: Object.create(null)
  };

  class TinySound {
    constructor() {
      this.audioContext = null;
      this.pools = new Map();
      this.poolIndexes = new Map();
      this.primed = false;
      if (typeof Audio === "function") {
        Object.entries(SOUND_FILES).forEach(([name, config]) => {
          const players = Array.from({ length: config.pool }, () => {
            const player = new Audio(config.src);
            player.preload = "auto";
            player.playsInline = true;
            return player;
          });
          this.pools.set(name, players);
          this.poolIndexes.set(name, 0);
        });
      }
    }

    unlock() {
      if (!state.soundEnabled) return;
      if (!this.audioContext) {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (AudioContext) this.audioContext = new AudioContext();
      }
      if (this.audioContext && this.audioContext.state === "suspended") this.audioContext.resume().catch(() => {});
      if (!this.primed) {
        this.primed = true;
        this.pools.forEach((players) => players.forEach((player) => player.load()));
      }
    }

    playSample(name, playbackRate = 1) {
      if (!state.soundEnabled) return true;
      this.unlock();
      const players = this.pools.get(name);
      const config = SOUND_FILES[name];
      if (!players?.length || !config) return false;
      const index = this.poolIndexes.get(name) || 0;
      const player = players[index];
      this.poolIndexes.set(name, (index + 1) % players.length);
      player.pause();
      try { player.currentTime = 0; } catch (_) {}
      player.volume = config.volume;
      player.playbackRate = playbackRate;
      const playback = player.play();
      if (playback?.catch) playback.catch(() => {});
      return true;
    }

    tone(frequency, duration, wave = "sine", volume = 0.035, delay = 0) {
      if (!state.soundEnabled) return;
      this.unlock();
      if (!this.audioContext) return;
      const start = this.audioContext.currentTime + delay;
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    correct(factor) {
      if (this.playSample("hit", Math.min(1.16, 0.96 + factor * 0.012))) return;
      this.tone(280 + factor * 18, 0.1, "triangle", 0.035);
      this.tone(470 + factor * 12, 0.12, "sine", 0.025, 0.055);
    }

    repair() {
      if (this.playSample("repair")) return;
      this.tone(420, 0.12, "triangle", 0.035);
      this.tone(620, 0.15, "triangle", 0.035, 0.08);
      this.tone(860, 0.18, "sine", 0.03, 0.16);
    }

    wrong() {
      if (this.playSample("wrong")) return;
      this.tone(145, 0.16, "square", 0.025);
    }

    boss() {
      if (this.playSample("boss")) return;
      this.tone(120, 0.2, "sawtooth", 0.03);
      this.tone(92, 0.28, "square", 0.02, 0.14);
    }

    unlockKeys() {
      if (this.playSample("unlock")) return;
      [440, 580, 760].forEach((frequency, index) => this.tone(frequency, 0.16, "triangle", 0.03, index * 0.07));
    }
  }

  const sound = new TinySound();

  class BackgroundMusic {
    constructor() {
      this.player = null;
      this.ducked = false;
      this.currentRate = 1;
      if (typeof Audio === "function") {
        this.player = new Audio(BGM_FILE.src);
        this.player.preload = "metadata";
        this.player.loop = true;
        this.player.playsInline = true;
        this.player.volume = BGM_FILE.volume;
        this.player.playbackRate = 1;
        this.player.defaultPlaybackRate = 1;
        if ("preservesPitch" in this.player) this.player.preservesPitch = true;
        if ("webkitPreservesPitch" in this.player) this.player.webkitPreservesPitch = true;
      }
    }

    targetRate() {
      if (state.mode !== "main") return 1;
      return Math.min(BGM_FILE.maxRate, 1 + state.bossesCleared * BGM_FILE.ratePerBoss);
    }

    update(delta) {
      if (!this.player) return;
      const target = this.targetRate();
      const distance = target - this.currentRate;
      const step = BGM_FILE.rateRampPerSecond * Math.max(0, delta);
      if (Math.abs(distance) <= step) this.currentRate = target;
      else this.currentRate += Math.sign(distance) * step;
      this.player.playbackRate = this.currentRate;
    }

    sync() {
      if (!this.player) return;
      this.player.volume = this.ducked ? BGM_FILE.duckedVolume : BGM_FILE.volume;
      const canPlay = state.bgmEnabled
        && state.view === "play"
        && state.phase !== "paused"
        && state.phase !== "ended";
      if (!canPlay) {
        this.player.pause();
        return;
      }
      const playback = this.player.play();
      if (playback?.catch) playback.catch(() => {});
    }

    start(ducked = false) {
      this.ducked = ducked;
      this.sync();
    }

    setDucked(ducked) {
      this.ducked = ducked;
      if (this.player) this.player.volume = ducked ? BGM_FILE.duckedVolume : BGM_FILE.volume;
    }

    pause() {
      this.player?.pause();
    }

    stop() {
      if (!this.player) return;
      this.player.pause();
      try { this.player.currentTime = 0; } catch (_) {}
      this.ducked = false;
      this.currentRate = 1;
      this.player.volume = BGM_FILE.volume;
      this.player.playbackRate = 1;
    }
  }

  const music = new BackgroundMusic();

  function loadStored() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        bestScore: Number.isFinite(value.bestScore) ? Math.max(0, value.bestScore) : 0,
        soundEnabled: value.soundEnabled !== false,
        bgmEnabled: value.bgmEnabled !== false,
        practiceDone: Boolean(value.practiceDone)
      };
    } catch (_) {
      return { bestScore: 0, soundEnabled: true, bgmEnabled: true, practiceDone: false };
    }
  }

  function saveStored() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (_) {
      // The game remains playable when storage is unavailable.
    }
  }

  function setText(element, value) {
    if (element && element.textContent !== String(value)) element.textContent = String(value);
  }

  function updateTitleEntry() {
    const firstVisit = !stored.practiceDone;
    dom.titleScreen.classList.toggle("is-first-visit", firstVisit);
    dom.practiceStartButton.classList.toggle("menu-button-main", firstVisit);
    dom.mainStartButton.classList.toggle("menu-button-main", !firstVisit);
    setText(dom.practiceStartLabel, firstVisit ? "まずは れんしゅう" : "れんしゅう");
    setText(dom.practiceStartNote, firstVisit ? "ピコと そうさを おぼえる" : "ピコと じゅんばんに おぼえる");
    setText(dom.mainStartLabel, firstVisit ? "すぐに はじめる" : "はじめる");
    setText(dom.mainStartNote, "エンドレス スコアアタック");
  }

  function schedule(action, delay) {
    const token = state.runToken;
    window.setTimeout(() => {
      if (state.runToken === token) action();
    }, delay);
  }

  function showScreen(name) {
    state.view = name;
    document.body.dataset.view = name;
    dom.titleScreen.hidden = name !== "title";
    dom.playScreen.hidden = name !== "play";
    dom.resultScreen.hidden = name !== "result";
    if (name === "play") {
      requestAnimationFrame(() => {
        resizeCanvas();
        dom.gameCanvas.focus?.({ preventScroll: true });
      });
    }
  }

  function resetRun(mode) {
    music.stop();
    state.runToken += 1;
    state.mode = mode;
    state.phase = "ready";
    state.elapsed = 0;
    state.score = 0;
    state.lives = MAX_LIVES;
    state.combo = 0;
    state.maxCombo = 0;
    state.repaired = 0;
    state.bossesCleared = 0;
    state.bossNumber = 0;
    state.invincibleUntil = 0;
    state.nextBossAt = BOSS_INTERVAL_SECONDS;
    state.spawnTimer = 0.35;
    state.bossActive = false;
    state.bossPending = false;
    state.activeFactors = new Set(mode === "main" ? [2, 3] : []);
    state.enemies = [];
    state.effects = [];
    state.particles = [];
    state.targetId = null;
    state.inputLocked = false;
    state.lastTimestamp = performance.now();
    state.practiceStep = 0;
    state.practiceTask = 0;
    state.fractionIndex = 0;
    state.bestWasBroken = false;
    state.shake = 0;
    state.flash = 0;
    state.lastHud = Object.create(null);
    pendingMissionAction = null;
    clearTimeout(calloutTimer);
    dom.centerCallout.hidden = true;
    dom.bossBanner.hidden = true;
    dom.picoTip.hidden = true;
    dom.mobilePicoGoButton.hidden = true;
    dom.mobilePicoStrip.classList.remove("is-briefing");
    setText(dom.mobilePicoTitle, "ピコ");
    dom.missionOverlay.hidden = true;
    dom.pikoPanel.classList.toggle("is-illustrated", mode === "practice" || mode === "main");
    dom.picoTip.classList.toggle("is-illustrated", mode === "practice");
    dom.missionOverlay.classList.toggle("is-illustrated", mode === "practice");
    dom.pauseOverlay.hidden = true;
    document.body.classList.remove("is-invincible");
    factorButtons.forEach((button) => button.classList.remove("is-hint", "is-wrong", "is-unlocking", "is-pressed"));
  }

  function startMain() {
    sound.unlock();
    resetRun("main");
    setText(dom.modeName, "エンドレス");
    showScreen("play");
    state.phase = "running";
    showCallout("コード バトル かいし！", "");
    setPicoMessage("ひかっている バグは じどうで ねらうよ。われる キーを おそう！");
    updateKeys();
    updateHud(true);
    music.start(false);
  }

  function startPractice() {
    sound.unlock();
    resetRun("practice");
    setText(dom.modeName, "れんしゅう");
    showScreen("play");
    const requestedStep = debugEnabled ? Math.trunc(Number(query.get("practice")) || 1) - 1 : 0;
    const startStep = Math.max(0, Math.min(Data.practiceSteps.length - 1, requestedStep));
    for (let index = 0; index < startStep; index += 1) {
      Data.practiceSteps[index].unlock.forEach((factor) => state.activeFactors.add(factor));
    }
    beginPracticeStep(startStep);
    updateHud(true);
    music.start(true);
  }

  function startFraction() {
    sound.unlock();
    resetRun("fraction");
    state.activeFactors = new Set(Data.keyOrder);
    setText(dom.modeName, "やくぶんコード");
    setPicoMessage("うえと したを いっしょに われる キーを えらぼう。");
    showScreen("play");
    showMission(
      "やくぶんコード",
      "ふたつの かずを おなじ キーで わろう。もう いっしょに われなくなれば しゅうりょう！",
      () => {
        state.phase = "running";
        spawnFractionQuestion();
      }
    );
    updateHud(true);
    music.start(true);
  }

  function restartCurrentMode() {
    if (state.mode === "practice") startPractice();
    else if (state.mode === "fraction") startFraction();
    else startMain();
  }

  function goHome() {
    music.stop();
    document.body.classList.remove("is-invincible");
    state.runToken += 1;
    state.phase = "idle";
    state.enemies = [];
    state.effects = [];
    state.particles = [];
    dom.pauseOverlay.hidden = true;
    dom.missionOverlay.hidden = true;
    setText(dom.titleBestScore, stored.bestScore);
    updateTitleEntry();
    showScreen("title");
  }

  function showMission(title, message, action) {
    state.phase = "briefing";
    music.setDucked(true);
    pendingMissionAction = action;
    setText(dom.missionTitle, title);
    setText(dom.missionText, message);
    setText(dom.mobilePicoTitle, title);
    setPicoMessage(message);
    dom.mobilePicoStrip.classList.add("is-briefing");
    syncMissionSurface();
    updateKeys();
    schedule(() => (isCompactLayout() ? dom.mobilePicoGoButton : dom.missionGoButton).focus({ preventScroll: true }), 30);
  }

  function isCompactLayout() {
    return matchMedia("(max-width: 940px)").matches;
  }

  function syncMissionSurface() {
    if (state.phase !== "briefing" || !pendingMissionAction) return;
    const compact = isCompactLayout();
    dom.missionOverlay.hidden = compact;
    dom.mobilePicoGoButton.hidden = !compact;
  }

  function continueMission() {
    const action = pendingMissionAction;
    pendingMissionAction = null;
    dom.missionOverlay.hidden = true;
    dom.mobilePicoGoButton.hidden = true;
    dom.mobilePicoStrip.classList.remove("is-briefing");
    setText(dom.mobilePicoTitle, "ピコ");
    if (action) action();
    music.setDucked(false);
    music.sync();
    updateKeys();
  }

  function beginPracticeStep(index) {
    if (index >= Data.practiceSteps.length) {
      stored.practiceDone = true;
      saveStored();
      finishRun("practice");
      return;
    }

    state.practiceStep = index;
    state.practiceTask = 0;
    const step = Data.practiceSteps[index];
    const unlocked = [];
    step.unlock.forEach((factor) => {
      if (!state.activeFactors.has(factor)) {
        state.activeFactors.add(factor);
        unlocked.push(factor);
      }
    });
    updateKeys(unlocked);
    setPicoMessage(step.message);
    updateHud(true);
    showMission(`${index + 1}／${Data.practiceSteps.length}　${step.title}`, step.message, () => {
      state.phase = "running";
      spawnPracticeTask();
    });
  }

  function spawnPracticeTask() {
    const step = Data.practiceSteps[state.practiceStep];
    const task = step.tasks[state.practiceTask];
    if (!task) {
      beginPracticeStep(state.practiceStep + 1);
      return;
    }

    state.enemies = [];
    const enemy = makeEnemy(task, true);
    enemy.prefer = task.prefer || null;
    state.enemies.push(enemy);
    state.targetId = enemy.id;
    dom.picoTip.hidden = true;
    setPicoMessage(practiceTaskHint(task));
    state.phase = "running";
    updateKeys();
    updateHud(true);
  }

  function practiceTaskHint(task) {
    if (task.type === "double") return "ふたつに つうじる キーを おしてね。";
    if (task.type === "boss") return "おおきな かずでも、われる キーは おなじだよ。";
    return task.prefer ? `${task.prefer}の キーを ためしてみよう。` : "われる キーを えらぼう。";
  }

  function spawnFractionQuestion() {
    if (state.fractionIndex >= Data.fractionQuestions.length) {
      finishRun("fraction");
      return;
    }
    const values = Data.fractionQuestions[state.fractionIndex].slice();
    state.enemies = [makeEnemy({ type: "fraction", values }, true)];
    state.targetId = state.enemies[0].id;
    const message = `${state.fractionIndex + 1}もんめ。うえと したを いっしょに わろう。`;
    dom.picoTip.hidden = isCompactLayout();
    setText(dom.picoTipText, message);
    setPicoMessage(message);
    state.phase = "running";
    updateKeys();
    updateHud(true);
  }

  function makeEnemy(spec, stationary = false) {
    const isBoss = spec.type === "boss" || spec.type === "double" || spec.type === "fraction";
    const horizontalPadding = isBoss ? 84 : 52;
    const x = stationary || isBoss
      ? state.width * 0.5
      : horizontalPadding + random() * Math.max(1, state.width - horizontalPadding * 2);
    const y = stationary || isBoss ? stationaryTargetY(state.height) : -56;
    const speedScale = Math.max(0.72, state.height / 700);
    const speed = stationary || isBoss ? 0 : regularEnemySpeed(speedScale);
    const enemy = {
      id: ++enemySerial,
      type: spec.type || "single",
      x,
      y,
      baseX: x,
      speed,
      age: 0,
      phase: random() * Math.PI * 2,
      radius: spec.type === "boss" ? 58 : (spec.type === "double" || spec.type === "fraction" ? 48 : 34),
      pendingRepair: false,
      hitFlash: 0,
      prefer: null,
      entering: false,
      arrivalY: null,
      entrySpeed: 0,
      stationaryOffsetX: 0,
      stationaryOffsetY: 0,
      bossFragment: false,
      splitGroup: null,
      fragmentSide: 0,
      groupStartTotal: 0,
      queuedFragment: false
    };
    enemy.baseRadius = enemy.radius;
    if (spec.values) {
      enemy.values = spec.values.slice();
      enemy.startMetric = Core.gcd(enemy.values[0], enemy.values[1]);
    } else {
      enemy.value = spec.value;
      enemy.startMetric = spec.value;
    }
    return enemy;
  }

  function spawnRegularEnemy() {
    const maxValue = Math.min(
      REGULAR_ENEMY_MAX,
      54 + Math.min(210, state.bossesCleared * 32 + state.elapsed * 1.1)
    );
    const value = Core.createSingleNumber([...state.activeFactors], {
      random,
      maxValue,
      maxSteps: state.elapsed < 25 ? 2 : 3
    });
    state.enemies.push(makeEnemy({ type: "single", value }, false));
    chooseTarget();
  }

  function spawnMainBoss(force = false) {
    if (state.bossActive && !force) return;
    state.bossNumber += 1;
    state.bossActive = true;
    state.bossPending = false;
    state.nextBossAt = state.elapsed + BOSS_INTERVAL_SECONDS;
    state.enemies.forEach((enemy) => burst(enemy.x, enemy.y, "#64e9ff", 5));
    state.enemies = [];
    const spec = Core.createBoss([...state.activeFactors], state.bossNumber, state.elapsed, random);
    const boss = makeEnemy(spec, true);
    boss.arrivalY = stationaryTargetY(state.height);
    boss.y = -boss.radius - 20;
    boss.entering = true;
    boss.entrySpeed = Math.max(72, Math.min(112, state.height * 0.16));
    state.enemies.push(boss);
    state.targetId = boss.id;
    dom.bossBanner.hidden = false;
    setPicoMessage(spec.type === "double" ? "ダブル ボス！ふたつを いっしょに わろう。" : "ボスの かずを 1まで わろう！");
    showCallout(spec.type === "double" ? "ダブル ボス せっきん！" : "ボス せっきん！", "is-mixed", 1150);
    sound.boss();
    updateKeys();
  }

  function chooseTarget() {
    const current = getTarget();
    if (current && !current.pendingRepair && !current.queuedFragment) return current;
    const candidates = state.enemies.filter((enemy) => !enemy.pendingRepair && !enemy.queuedFragment);
    if (!candidates.length) {
      state.targetId = null;
      return null;
    }
    candidates.sort((a, b) => {
      const aBoss = a.type === "boss" || a.type === "double" || a.type === "fraction";
      const bBoss = b.type === "boss" || b.type === "double" || b.type === "fraction";
      if (aBoss !== bBoss) return aBoss ? -1 : 1;
      return b.y - a.y;
    });
    state.targetId = candidates[0].id;
    return candidates[0];
  }

  function getTarget() {
    return state.enemies.find((enemy) => enemy.id === state.targetId) || null;
  }

  function pressFactor(factor, button = null) {
    factor = Number(factor);
    if (state.view !== "play" || state.phase !== "running" || state.inputLocked) return false;
    if (!state.activeFactors.has(factor)) return false;
    const target = chooseTarget();
    if (!target) {
      showCallout("すうじを まってね", "");
      return false;
    }
    if (target.entering) {
      showCallout("ボスが くるよ！", "is-mixed", 520);
      return false;
    }

    state.inputLocked = true;
    button?.classList.add("is-pressed");
    schedule(() => {
      state.inputLocked = false;
      button?.classList.remove("is-pressed");
      updateKeys();
    }, 125);

    const targetData = target.type === "double" || target.type === "fraction"
      ? { type: target.type, values: target.values }
      : { type: target.type, value: target.value };
    const result = Core.applyFactor(targetData, factor);

    if (!result.ok) {
      handleWrongFactor(factor, button, target);
      return false;
    }

    if (result.target.values) target.values = result.target.values.slice();
    else target.value = result.target.value;
    target.hitFlash = 0.22;
    addShot(target, factor);
    sound.correct(factor);
    state.score += state.mode === "practice" ? 0 : Core.scoreForHit(factor, state.combo);

    const family = Core.factorFamily(factor);
    if (family === "power") showCallout(`${factor}アタック！`, "is-power", 620);
    else if (family === "mixed") showCallout(`${factor}アタック！`, "is-mixed", 620);
    else showCallout("ナイス！", "", 430);

    if (result.complete && target.type === "double") {
      target.pendingRepair = true;
      schedule(() => splitDoubleBoss(target.id), 240);
    } else if (result.complete) {
      target.pendingRepair = true;
      schedule(() => completeEnemy(target.id), 240);
    } else if (state.mode === "practice") {
      const valid = Core.validFactors(
        target.values ? { type: target.type, values: target.values } : { type: target.type, value: target.value },
        [...state.activeFactors]
      );
      setPicoMessage(valid.length ? `つぎは ${valid.join("・")}で われるよ。` : "もう われないよ。");
    }

    updateHud(true);
    updateBossProgress(target);
    return true;
  }

  function handleWrongFactor(factor, button, target) {
    sound.wrong();
    button?.classList.add("is-wrong");
    schedule(() => button?.classList.remove("is-wrong"), 260);
    const targetData = target.values
      ? { type: target.type, values: target.values }
      : { type: target.type, value: target.value };
    const valid = Core.validFactors(targetData, [...state.activeFactors]);

    if (state.mode === "practice") {
      showCallout("その キーでは われないよ", "is-danger", 850);
      if (valid.length) {
        const hint = valid.slice(0, 3).join("・");
        setPicoMessage(`${hint}を ためしてみよう。`);
      }
    } else {
      state.score -= WRONG_SCORE_PENALTY;
      showCallout(`その キーでは われない！ ${WRONG_SCORE_PENALTY}てん マイナス`, "is-danger", 850);
      if (state.mode === "fraction" && valid.length) {
        setText(dom.picoTipText, `${valid.slice(0, 3).join("・")}を ためしてみよう。`);
      }
    }
    updateKeys();
    updateHud(true);
  }

  function addShot(target, factor) {
    const family = Core.factorFamily(factor);
    const color = family === "power" ? "#b395ff" : family === "mixed" ? "#ffd26f" : "#64e9ff";
    const origin = picoBeamOrigin();
    state.effects.push({
      type: "shot",
      x1: origin.x,
      y1: origin.y,
      x2: target.x,
      y2: target.y,
      color,
      ttl: 0.19,
      duration: 0.19,
      factor
    });
    burst(target.x, target.y, color, 8);
  }

  function splitDoubleBoss(id) {
    const index = state.enemies.findIndex((enemy) => enemy.id === id);
    if (index < 0) return;
    const original = state.enemies[index];
    const fragmentSpecs = Core.createDoubleFragments(original.values);
    state.enemies.splice(index, 1);
    state.targetId = null;
    burst(original.x, original.y, "#ffd26f", 30);

    if (!fragmentSpecs.length) {
      sound.repair();
      state.repaired += 1;
      finishSplitDouble(original);
      return;
    }

    const group = `double-${original.id}`;
    const groupStartTotal = fragmentSpecs.reduce((total, spec) => total + spec.value, 0);
    const sides = fragmentSpecs.length === 1 ? [0] : [-1, 1];
    const verticalOffsets = fragmentSpecs.length === 1 ? [26] : [58, -42];
    const gap = Math.min(78, state.width * 0.19);
    const fragments = fragmentSpecs.map((spec, fragmentIndex) => {
      const fragment = makeEnemy(spec, true);
      fragment.bossFragment = true;
      fragment.splitGroup = group;
      fragment.fragmentSide = sides[fragmentIndex];
      fragment.stationaryOffsetX = fragment.fragmentSide * gap;
      fragment.stationaryOffsetY = verticalOffsets[fragmentIndex];
      fragment.x = state.width * 0.5 + fragment.stationaryOffsetX;
      fragment.baseX = fragment.x;
      fragment.y = Math.max(72, Math.min(state.height - 126, original.y + fragment.stationaryOffsetY));
      fragment.radius = fragment.baseRadius = 39;
      fragment.groupStartTotal = groupStartTotal;
      fragment.queuedFragment = fragmentIndex > 0;
      if (state.mode === "main") fragment.speed = bossDescentSpeed(0.82);
      return fragment;
    });
    state.enemies.push(...fragments);
    state.targetId = fragments[0].id;
    showCallout("ふたつに ぶんり！", "is-mixed", 950);
    const splitMessage = "いっしょには われないよ。ここからは ひとつずつ 1にしよう！";
    setPicoMessage(splitMessage);
    sound.unlockKeys();
    updateKeys();
    updateHud(true);
  }

  function finishSplitDouble(original) {
    if (state.mode === "main") {
      finishBoss({ ...original, type: "double" });
      chooseTarget();
    } else if (state.mode === "practice") {
      state.practiceTask += 1;
      updateHud(true);
      schedule(spawnPracticeTask, 520);
    }
  }

  function completeEnemy(id) {
    const index = state.enemies.findIndex((enemy) => enemy.id === id);
    if (index < 0) return;
    const enemy = state.enemies[index];
    state.enemies.splice(index, 1);
    state.targetId = null;
    const splitSiblingRemains = enemy.bossFragment && state.enemies.some((candidate) => candidate.splitGroup === enemy.splitGroup);
    burst(enemy.x, enemy.y, enemy.type === "boss" || enemy.type === "double" || enemy.bossFragment ? "#ffd26f" : "#8dffd6", enemy.type === "single" && !enemy.bossFragment ? 15 : 28);
    sound.repair();
    state.repaired += 1;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);

    if (state.mode !== "practice") {
      const bossBonus = enemy.bossFragment
        ? (splitSiblingRemains ? 180 : 520)
        : (enemy.type === "boss" ? 520 : (enemy.type === "double" ? 760 : 120));
      state.score += bossBonus + Math.min(300, state.combo * 12);
    }

    if (COMBO_CALLS.has(state.combo) || (state.combo > 30 && state.combo % 10 === 0)) {
      showCallout(`${state.combo}コンボ！`, "", 900);
    }

    if (enemy.bossFragment) {
      if (splitSiblingRemains) {
        state.enemies
          .filter((candidate) => candidate.splitGroup === enemy.splitGroup)
          .forEach((candidate) => { candidate.queuedFragment = false; });
        chooseTarget();
        const siblingMessage = "もう ひとつも 1まで わろう！";
        setPicoMessage(siblingMessage);
      } else {
        finishSplitDouble({ ...enemy, type: "double" });
      }
    } else if (state.mode === "main") {
      if (enemy.type === "boss" || enemy.type === "double") finishBoss(enemy);
      chooseTarget();
    } else if (state.mode === "practice") {
      state.practiceTask += 1;
      updateHud(true);
      schedule(spawnPracticeTask, 520);
    } else if (state.mode === "fraction") {
      state.fractionIndex += 1;
      updateHud(true);
      schedule(spawnFractionQuestion, 520);
    }
    updateHud(true);
  }

  function finishBoss(enemy) {
    state.bossActive = false;
    state.bossesCleared += 1;
    state.nextBossAt = state.elapsed + BOSS_INTERVAL_SECONDS;
    dom.bossBanner.hidden = true;
    const unlock = Data.mainUnlocks.find((item) => item.afterBoss === state.bossesCleared);
    if (unlock) {
      unlock.factors.forEach((factor) => state.activeFactors.add(factor));
      updateKeys(unlock.factors);
      showCallout(unlock.message, Core.factorFamily(unlock.factors[0]) === "power" ? "is-power" : "is-mixed", 1450);
      setPicoMessage(unlock.message);
      sound.unlockKeys();
    } else {
      showCallout(enemy.type === "double" ? "ダブル しゅうり！" : "ボス しゅうり！", "is-mixed", 950);
      setPicoMessage(state.elapsed >= 50 ? "ここから ダブル ボスも ランダムで くるよ。" : "つぎの ボスは 30びょうたって、いまの バグが すすんでから！");
    }
    updateHud(true);
  }

  function invincibleSecondsLeft() {
    return Math.max(0, state.invincibleUntil - state.elapsed);
  }

  function registerMiss(message) {
    if (state.phase !== "running") return false;
    if (invincibleSecondsLeft() > 0) {
      showCallout("むてき！", "", 420);
      return false;
    }
    state.lives = Math.max(0, state.lives - 1);
    state.invincibleUntil = state.lives > 0 ? state.elapsed + INVINCIBLE_SECONDS : 0;
    state.combo = 0;
    state.shake = 0.42;
    state.flash = 0.24;
    showCallout(state.lives ? `${message} 5びょう むてき！` : message, "is-danger", 1100);
    setPicoMessage(state.lives
      ? `${message} ライフは あと ${state.lives}こ。5びょうは むてきだよ。`
      : `${message} だいじょうぶ。れんしゅうで こつを つかめるよ。`);
    updateHud(true);
    if (state.lives <= 0) schedule(() => finishRun("miss"), 520);
    return true;
  }

  function finishRun(reason) {
    if (state.phase === "ended") return;
    state.phase = "ended";
    state.runToken += 1;
    state.inputLocked = true;
    state.invincibleUntil = 0;
    document.body.classList.remove("is-invincible");
    music.stop();
    dom.pauseOverlay.hidden = true;
    dom.missionOverlay.hidden = true;

    if (state.mode === "main") {
      state.bestWasBroken = state.score > stored.bestScore;
      if (state.bestWasBroken) {
        stored.bestScore = state.score;
        saveStored();
      }
      setText(dom.resultKicker, "コード バトル リザルト");
      setText(dom.resultTitle, state.bossesCleared >= 4 ? "バグ ブレイカー！" : "ナイス プレイ！");
      setText(dom.resultMessage, reason === "miss" ? "3つの ライフを つかったよ。つぎは もっと きろくを のばせる！" : "バグを つぎつぎ げきはした！");
    } else if (state.mode === "practice") {
      setText(dom.resultKicker, "トレーニング クリア");
      setText(dom.resultTitle, "オール コンプリート！");
      setText(dom.resultMessage, "ぜんぶの キーを つかいこなしたよ。");
    } else {
      setText(dom.resultKicker, "やくぶん チャレンジ");
      setText(dom.resultTitle, "10もん クリア！");
      setText(dom.resultMessage, "ふたつを いっしょに わる こつを つかんだね。");
    }

    const practiceComplete = state.mode === "practice";
    setText(dom.resultScoreLabel, practiceComplete ? "れんしゅう" : "スコア");
    setText(dom.resultScore, practiceComplete ? "コンプリート！" : state.score);
    dom.resultScore.parentElement.classList.toggle("is-complete", practiceComplete);
    setText(dom.resultTime, Core.formatTime(state.elapsed));
    setText(dom.resultRepaired, state.repaired);
    setText(dom.resultBosses, state.bossesCleared);
    setText(dom.resultCombo, state.maxCombo);
    dom.newRecord.hidden = !state.bestWasBroken;
    setText(dom.titleBestScore, stored.bestScore);
    showScreen("result");
    schedule(() => dom.resultRetryButton.focus({ preventScroll: true }), 30);
  }

  function setPicoMessage(message) {
    setText(dom.sidePicoMessage, message);
    setText(dom.mobilePicoMessage, message);
    setText(dom.liveRegion, `ピコ：${message}`);
  }

  function showCallout(message, className = "", duration = 700) {
    clearTimeout(calloutTimer);
    if (state.mode === "main" || state.mode === "practice") {
      dom.centerCallout.hidden = true;
      setPicoMessage(message);
      return;
    }
    setText(dom.centerCallout, message);
    dom.centerCallout.className = `center-callout${className ? ` ${className}` : ""}`;
    dom.centerCallout.hidden = false;
    setText(dom.liveRegion, message);
    calloutTimer = window.setTimeout(() => {
      dom.centerCallout.hidden = true;
    }, duration);
  }

  function togglePause() {
    if (state.view !== "play") return;
    if (state.phase === "running") {
      state.phase = "paused";
      music.pause();
      dom.pauseOverlay.hidden = false;
      updateKeys();
      schedule(() => dom.resumeButton.focus({ preventScroll: true }), 25);
    } else if (state.phase === "paused") {
      resumeGame();
    }
  }

  function resumeGame() {
    if (state.phase !== "paused") return;
    dom.pauseOverlay.hidden = true;
    state.phase = "running";
    state.lastTimestamp = performance.now();
    music.sync();
    updateKeys();
  }

  function update(delta) {
    if (state.phase !== "running") return;
    music.update(delta);
    state.elapsed += delta;
    state.shake = Math.max(0, state.shake - delta);
    state.flash = Math.max(0, state.flash - delta);

    state.effects.forEach((effect) => { effect.ttl -= delta; });
    state.effects = state.effects.filter((effect) => effect.ttl > 0);
    state.particles.forEach((particle) => {
      particle.ttl -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 18 * delta;
    });
    state.particles = state.particles.filter((particle) => particle.ttl > 0);

    for (const enemy of state.enemies) {
      enemy.age += delta;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - delta);
      if (enemy.entering && !enemy.pendingRepair) {
        enemy.y += enemy.entrySpeed * delta;
        enemy.x = enemy.baseX;
        if (enemy.y >= enemy.arrivalY) {
          enemy.y = enemy.arrivalY;
          enemy.entering = false;
          if (state.mode === "main") enemy.speed = bossDescentSpeed();
          showCallout(enemy.type === "double" ? "ダブル ボス とうちゃく！" : "ボス とうちゃく！", "is-mixed", 760);
          updateKeys();
        }
      } else if (state.mode === "main" && enemy.speed > 0 && !enemy.pendingRepair) {
        enemy.y += enemy.speed * delta;
        enemy.x = enemy.baseX + Math.sin(enemy.age * 1.8 + enemy.phase) * Math.min(18, state.width * 0.035);
      }
    }

    if (state.mode === "main") {
      const escaped = state.enemies.filter((enemy) => enemy.speed > 0 && enemy.y > state.height - 72);
      if (escaped.length) {
        const bossEscaped = escaped.some((enemy) => enemy.type === "boss" || enemy.type === "double" || enemy.bossFragment);
        if (bossEscaped) {
          const encounterEnemies = state.enemies.filter((enemy) => enemy.type === "boss" || enemy.type === "double" || enemy.bossFragment);
          encounterEnemies.forEach((enemy) => burst(enemy.x, state.height - 78, "#ff668b", 14));
          state.enemies = state.enemies.filter((enemy) => enemy.type !== "boss" && enemy.type !== "double" && !enemy.bossFragment);
          state.targetId = null;
          state.bossActive = false;
          state.bossPending = false;
          state.bossNumber = Math.max(0, state.bossNumber - 1);
          state.nextBossAt = state.elapsed + BOSS_INTERVAL_SECONDS;
          dom.bossBanner.hidden = true;
          registerMiss("ボスに にげられた！");
        } else {
          const escapedIds = new Set(escaped.map((enemy) => enemy.id));
          state.enemies = state.enemies.filter((enemy) => !escapedIds.has(enemy.id));
          if (escapedIds.has(state.targetId)) state.targetId = null;
          escaped.forEach((enemy) => burst(enemy.x, state.height - 78, "#ff668b", 10));
          registerMiss("バグが ぬけた！");
        }
      }

      if (!state.bossActive && state.elapsed >= state.nextBossAt) {
        if (regularEnemiesReadyForBoss()) {
          spawnMainBoss();
        } else if (!state.bossPending) {
          state.bossPending = true;
          setPicoMessage("いまの バグが 4ぶんの3まで すすんだら ボスが くるよ。");
        }
      } else if (!state.bossActive) {
        state.spawnTimer -= delta;
        const maxEnemies = state.bossesCleared === 0 ? 1 : state.elapsed < 110 ? 2 : state.elapsed < 180 ? 3 : 4;
        if (state.spawnTimer <= 0 && state.enemies.length < maxEnemies) {
          spawnRegularEnemy();
          state.spawnTimer = Math.max(0.92, 1.82 - state.elapsed * 0.0045 - state.bossesCleared * 0.018);
        }
      }
    }

    chooseTarget();
    updateHud();
  }

  function updateHud(force = false) {
    const time = Core.formatTime(state.elapsed);
    const lives = "●".repeat(state.lives) + "○".repeat(MAX_LIVES - state.lives);
    const invincibleSeconds = Math.ceil(invincibleSecondsLeft());
    document.body.classList.toggle("is-invincible", invincibleSeconds > 0);
    const target = getTarget();
    let targetText = "じどうで ねらう：まってね";
    if (target) {
      if (target.entering) targetText = "ボス せっきんちゅう";
      else if (target.type === "fraction") targetText = `じどうで ねらう：${target.values[0]}／${target.values[1]}`;
      else if (target.values) targetText = `じどうで ねらう：${target.values[0]} と ${target.values[1]}`;
      else targetText = `じどうで ねらう：${target.value}`;
    }
    let nextText;
    let bossSeconds = 0;
    if (state.mode === "main") {
      bossSeconds = state.bossActive ? 0 : Math.max(0, Math.ceil(state.nextBossAt - state.elapsed));
      nextText = state.bossActive
        ? (target?.entering ? "ボス せっきんちゅう" : "ボス しゅうりちゅう")
        : state.bossPending ? "いまの バグの あと ボス" : `ボスまで ${bossSeconds}びょう`;
    } else if (state.mode === "practice") {
      const step = Data.practiceSteps[state.practiceStep];
      nextText = step ? `${state.practiceStep + 1}／${Data.practiceSteps.length}　${state.practiceTask + 1}たいめ` : "れんしゅう";
      bossSeconds = "－";
    } else {
      nextText = `${Math.min(10, state.fractionIndex + 1)}／10もん`;
      bossSeconds = "－";
    }

    const values = { time, score: state.score, lives, combo: state.combo, targetText, nextText, bossSeconds, invincibleSeconds };
    if (!force && Object.keys(values).every((key) => state.lastHud[key] === values[key])) return;
    state.lastHud = values;
    setText(dom.mobileTime, time);
    setText(dom.desktopTime, time);
    setText(dom.mobileScore, state.score);
    setText(dom.desktopScore, state.score);
    setText(dom.mobileLives, lives);
    setText(dom.desktopLives, lives);
    setText(dom.sideLives, lives);
    setText(dom.desktopCombo, state.combo);
    setText(dom.targetReadout, targetText);
    setText(dom.nextBossReadout, nextText);
    setText(dom.desktopBossTime, bossSeconds);
    updateBossProgress(target);
  }

  function updateBossProgress(target) {
    if (!target || (target.type !== "boss" && target.type !== "double" && !target.bossFragment)) return;
    const current = target.bossFragment
      ? state.enemies
        .filter((enemy) => enemy.splitGroup === target.splitGroup)
        .reduce((total, enemy) => total + enemy.value, 0)
      : (target.values ? Core.gcd(target.values[0], target.values[1]) : target.value);
    const start = target.bossFragment ? target.groupStartTotal : target.startMetric;
    const ratio = Math.max(0, Math.min(1, current / Math.max(1, start)));
    dom.bossProgress.style.transform = `scaleX(${ratio})`;
  }

  function updateKeys(newlyUnlocked = []) {
    const unlockSet = new Set(newlyUnlocked);
    const target = getTarget();
    const practicePrefer = state.mode === "practice" && target ? target.prefer : null;
    factorButtons.forEach((button) => {
      const factor = Number(button.dataset.factor);
      const active = state.activeFactors.has(factor);
      button.disabled = !active || state.phase !== "running" || Boolean(target?.entering);
      button.setAttribute("aria-disabled", String(button.disabled));
      button.classList.toggle("is-hint", Boolean(practicePrefer && practicePrefer === factor && active));
      if (unlockSet.has(factor)) {
        button.classList.remove("is-unlocking");
        requestAnimationFrame(() => button.classList.add("is-unlocking"));
        schedule(() => button.classList.remove("is-unlocking"), 760);
      }
    });
  }

  function burst(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 28 + random() * 72;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttl: 0.35 + random() * 0.45,
        duration: 0.8,
        color,
        size: 1.5 + random() * 3.5
      });
    }
    if (state.particles.length > 90) state.particles.splice(0, state.particles.length - 90);
  }

  function resizeCanvas() {
    const rect = dom.arena.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    dom.gameCanvas.width = Math.round(width * dpr);
    dom.gameCanvas.height = Math.round(height * dpr);
    dom.gameCanvas.style.width = `${width}px`;
    dom.gameCanvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const oldWidth = state.width || width;
    const oldHeight = state.height || height;
    const scaleX = width / oldWidth;
    const scaleY = height / oldHeight;
    state.enemies.forEach((enemy) => {
      if (enemy.entering) {
        enemy.x = width * 0.5;
        enemy.baseX = enemy.x;
        enemy.y *= scaleY;
        enemy.arrivalY = stationaryTargetY(height);
        enemy.radius = enemy.baseRadius * (height < 360 ? 0.82 : 1);
      } else if (enemy.speed === 0) {
        if (enemy.bossFragment) {
          enemy.stationaryOffsetX = enemy.fragmentSide * Math.min(78, width * 0.19);
        }
        enemy.x = width * 0.5 + (enemy.stationaryOffsetX || 0);
        enemy.baseX = enemy.x;
        enemy.y = stationaryTargetY(height) + (enemy.stationaryOffsetY || 0);
        enemy.radius = enemy.baseRadius * (height < 360 ? 0.82 : 1);
      } else {
        enemy.x *= scaleX;
        enemy.baseX *= scaleX;
        enemy.y *= scaleY;
      }
    });
    state.width = width;
    state.height = height;
    draw(performance.now());
  }

  function stationaryTargetY(height) {
    return height < 360 ? Math.max(88, height * 0.3) : Math.max(110, height * 0.28);
  }

  function regularEnemySpeed(speedScale = Math.max(0.72, state.height / 700)) {
    const timeBoost = Math.min(36, state.elapsed * 0.22);
    const bossBoost = Math.min(12, state.bossesCleared * 1.5);
    return (39 + timeBoost + bossBoost) * speedScale;
  }

  function regularEnemiesReadyForBoss() {
    const regularEnemies = state.enemies.filter((enemy) => enemy.type === "single" && !enemy.bossFragment);
    if (!regularEnemies.length) return true;
    const routeStart = -56;
    const routeEnd = Math.max(routeStart + 1, state.height - 72);
    const clearLine = routeStart + (routeEnd - routeStart) * BOSS_CLEAR_PROGRESS;
    return regularEnemies.every((enemy) => enemy.y >= clearLine);
  }

  function bossDescentSpeed(multiplier = 1) {
    const base = Math.max(8, Math.min(18, state.height * 0.025));
    return (base + Math.min(8, state.bossesCleared)) * multiplier;
  }

  function picoVisualScale() {
    return Math.max(0.72, Math.min(1, state.width / 430));
  }

  function picoBaseY() {
    return state.height < 360 ? state.height - 28 : state.height - 44;
  }

  function picoBeamOrigin() {
    const scale = picoVisualScale();
    return {
      x: state.width * 0.5 - 35 * scale,
      y: picoBaseY() - 49 * scale
    };
  }

  function frame(timestamp) {
    const delta = Math.min(0.05, Math.max(0, (timestamp - state.lastTimestamp) / 1000 || 0));
    state.lastTimestamp = timestamp;
    if (state.view === "play") {
      update(delta);
      draw(timestamp);
    }
    frameHandle = requestAnimationFrame(frame);
  }

  function draw(timestamp) {
    const width = state.width;
    const height = state.height;
    if (!width || !height) return;
    context.save();
    if (state.shake > 0) {
      const strength = 5 * (state.shake / 0.42);
      context.translate((random() - 0.5) * strength, (random() - 0.5) * strength);
    }
    drawBackground(timestamp, width, height);
    state.enemies.forEach((enemy) => drawEnemy(enemy, timestamp));
    drawShots();
    drawParticles();
    drawPico(timestamp, width * 0.5, picoBaseY());
    if (state.flash > 0) {
      context.fillStyle = `rgba(255, 72, 116, ${state.flash * 0.45})`;
      context.fillRect(0, 0, width, height);
    }
    context.restore();
  }

  function drawBackground(timestamp, width, height) {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#061a2d");
    gradient.addColorStop(0.55, "#041322");
    gradient.addColorStop(1, "#020914");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.strokeStyle = "rgba(89, 216, 255, 0.075)";
    context.lineWidth = 1;
    const grid = Math.max(28, Math.min(42, width / 9));
    const offset = (timestamp * 0.018) % grid;
    for (let x = 0; x <= width; x += grid) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = -grid + offset; y <= height; y += grid) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(255, 210, 111, 0.14)";
    context.setLineDash([7, 9]);
    context.beginPath();
    context.moveTo(14, height - 88);
    context.lineTo(width - 14, height - 88);
    context.stroke();
    context.setLineDash([]);

    const scanY = (timestamp * 0.07) % height;
    const scan = context.createLinearGradient(0, scanY - 18, 0, scanY + 18);
    scan.addColorStop(0, "rgba(100,233,255,0)");
    scan.addColorStop(0.5, "rgba(100,233,255,0.055)");
    scan.addColorStop(1, "rgba(100,233,255,0)");
    context.fillStyle = scan;
    context.fillRect(0, scanY - 18, width, 36);

    context.fillStyle = "rgba(100,233,255,0.05)";
    for (let index = 0; index < 8; index += 1) {
      const blockX = ((index * 83 + 37) % Math.max(1, width - 24)) + 8;
      const blockY = ((index * 137 + timestamp * 0.009) % Math.max(1, height - 120)) + 35;
      context.fillRect(blockX, blockY, 2 + (index % 3) * 3, 2);
    }
    context.restore();
  }

  function drawEnemy(enemy, timestamp) {
    const bob = enemy.speed === 0 && !enemy.entering ? Math.sin(timestamp * 0.003 + enemy.phase) * 4 : 0;
    const x = enemy.x;
    const y = enemy.y + bob;
    const selected = enemy.id === state.targetId;
    context.save();
    context.globalAlpha = enemy.queuedFragment ? 0.56 : 1;
    context.translate(x, y);

    if (selected) {
      context.save();
      context.rotate(timestamp * 0.0008);
      context.strokeStyle = "rgba(255, 210, 111, 0.92)";
      context.lineWidth = 2;
      context.setLineDash([9, 8]);
      context.beginPath();
      context.arc(0, 0, enemy.radius + (enemy.values ? 34 : 16), 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (enemy.type === "double") drawDoubleEnemy(enemy);
    else if (enemy.type === "fraction") drawFractionEnemy(enemy);
    else drawSingleEnemy(enemy);
    context.restore();
  }

  function drawSingleEnemy(enemy) {
    const boss = enemy.type === "boss" || enemy.bossFragment;
    const radius = enemy.radius;
    context.save();
    if (enemy.hitFlash > 0) {
      context.shadowColor = "#ffffff";
      context.shadowBlur = 24;
    } else {
      context.shadowColor = boss ? "rgba(255, 154, 100, 0.56)" : "rgba(100, 233, 255, 0.44)";
      context.shadowBlur = boss ? 24 : 14;
    }
    const gradient = context.createRadialGradient(-radius * 0.28, -radius * 0.3, 3, 0, 0, radius);
    gradient.addColorStop(0, enemy.hitFlash > 0 ? "#eaffff" : (boss ? "#744a69" : "#184d70"));
    gradient.addColorStop(0.5, boss ? "#321f4a" : "#0a2946");
    gradient.addColorStop(1, "#04111f");
    context.fillStyle = gradient;
    context.strokeStyle = boss ? "#ffd26f" : "#64e9ff";
    context.lineWidth = boss ? 3 : 2;
    context.beginPath();
    if (boss) hexPath(radius);
    else context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    context.strokeStyle = boss ? "rgba(255,210,111,0.46)" : "rgba(100,233,255,0.38)";
    context.lineWidth = 2;
    for (let index = 0; index < (boss ? 8 : 5); index += 1) {
      const angle = (Math.PI * 2 * index) / (boss ? 8 : 5);
      context.beginPath();
      context.moveTo(Math.cos(angle) * (radius + 4), Math.sin(angle) * (radius + 4));
      context.lineTo(Math.cos(angle) * (radius + (boss ? 14 : 9)), Math.sin(angle) * (radius + (boss ? 14 : 9)));
      context.stroke();
    }

    context.fillStyle = "#f7fdff";
    context.font = `900 ${boss ? Math.min(34, radius * 0.63) : Math.min(27, radius * 0.8)}px ui-monospace, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(enemy.value), 0, 1);

    context.fillStyle = boss ? "#ffd26f" : "#ff8c7a";
    context.fillRect(-radius * 0.55, radius * 0.56, radius * 0.22, 3);
    context.fillRect(radius * 0.34, radius * 0.56, radius * 0.18, 3);
    context.restore();
  }

  function hexPath(radius) {
    for (let index = 0; index < 6; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
  }

  function drawDoubleEnemy(enemy) {
    const spacing = Math.min(48, state.width * 0.115);
    context.strokeStyle = "rgba(255,210,111,0.76)";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-spacing + 25, 0);
    context.lineTo(spacing - 25, 0);
    context.stroke();
    context.fillStyle = "#ffd26f";
    context.beginPath();
    context.arc(0, 0, 7, 0, Math.PI * 2);
    context.fill();
    enemy.values.forEach((value, index) => {
      context.save();
      context.translate(index === 0 ? -spacing : spacing, 0);
      const fake = { ...enemy, type: "boss", value, radius: 35 };
      drawSingleEnemy(fake);
      context.restore();
    });
  }

  function drawFractionEnemy(enemy) {
    const width = Math.min(130, state.width * 0.38);
    const height = Math.min(126, Math.max(100, state.height * 0.4));
    context.save();
    context.shadowColor = "rgba(179,149,255,0.54)";
    context.shadowBlur = 22;
    context.fillStyle = "rgba(12,28,55,0.95)";
    context.strokeStyle = "#b395ff";
    context.lineWidth = 2.5;
    roundedRect(-width / 2, -height / 2, width, height, 16);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.strokeStyle = "#ffd26f";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-width * 0.3, 0);
    context.lineTo(width * 0.3, 0);
    context.stroke();
    context.fillStyle = "#f7fdff";
    context.font = `900 ${height < 115 ? 27 : 31}px ui-monospace, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(enemy.values[0]), 0, -height * 0.24);
    context.fillText(String(enemy.values[1]), 0, height * 0.25);
    context.restore();
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawShots() {
    state.effects.forEach((effect) => {
      const progress = 1 - effect.ttl / effect.duration;
      context.save();
      context.globalAlpha = Math.max(0, effect.ttl / effect.duration);
      context.strokeStyle = effect.color;
      context.shadowColor = effect.color;
      context.shadowBlur = 14;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(effect.x1, effect.y1);
      context.lineTo(effect.x1 + (effect.x2 - effect.x1) * progress, effect.y1 + (effect.y2 - effect.y1) * progress);
      context.stroke();
      context.fillStyle = effect.color;
      context.font = "900 15px ui-monospace, monospace";
      context.textAlign = "center";
      context.fillText(String(effect.factor), effect.x1 + (effect.x2 - effect.x1) * progress, effect.y1 + (effect.y2 - effect.y1) * progress - 8);
      context.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      context.save();
      context.globalAlpha = Math.max(0, particle.ttl / particle.duration);
      context.fillStyle = particle.color;
      context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      context.restore();
    });
  }

  function drawPico(timestamp, x, y) {
    const scale = picoVisualScale();
    const hover = Math.sin(timestamp * 0.0045) * 1.4;
    context.save();
    context.translate(x, y + hover);
    context.scale(scale, scale);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = "rgba(105,238,255,0.55)";
    context.shadowBlur = 14;

    // からだと おひれ。てんぷの ぴこと おなじ、よこむきの でじたるくじら。
    context.fillStyle = "rgba(5, 28, 52, 0.96)";
    context.strokeStyle = "#aaf8ff";
    context.lineWidth = 2.6;
    context.beginPath();
    context.moveTo(-69, 1);
    context.bezierCurveTo(-65, -22, -38, -35, -3, -34);
    context.bezierCurveTo(20, -33, 39, -24, 49, -10);
    context.bezierCurveTo(59, -16, 74, -17, 87, -12);
    context.bezierCurveTo(82, -2, 74, 4, 62, 7);
    context.bezierCurveTo(75, 12, 83, 21, 87, 29);
    context.bezierCurveTo(70, 29, 57, 23, 49, 14);
    context.bezierCurveTo(36, 25, 16, 30, -8, 28);
    context.bezierCurveTo(-41, 26, -65, 16, -69, 1);
    context.closePath();
    context.fill();
    context.stroke();

    // ひれ。
    context.fillStyle = "rgba(4, 23, 44, 0.98)";
    context.beginPath();
    context.moveTo(-9, 10);
    context.quadraticCurveTo(4, 28, 23, 28);
    context.quadraticCurveTo(13, 15, 1, 7);
    context.closePath();
    context.fill();
    context.stroke();

    // ふんすいこうを、でーたを ひろう あんてなに。
    context.shadowBlur = 8;
    context.beginPath();
    context.moveTo(-35, -29);
    context.lineTo(-35, -41);
    context.lineTo(-42, -41);
    context.lineTo(-42, -48);
    context.moveTo(-35, -41);
    context.lineTo(-27, -41);
    context.lineTo(-27, -47);
    context.stroke();

    // めと きいろい かいろ。
    context.shadowColor = "rgba(255,203,91,0.82)";
    context.shadowBlur = 9;
    context.fillStyle = "#ffd26f";
    context.beginPath();
    context.arc(-47, -8, 3.3, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#ffc957";
    context.lineWidth = 2.3;
    context.beginPath();
    context.moveTo(-53, 6);
    context.lineTo(-23, 6);
    context.lineTo(-11, -6);
    context.lineTo(22, -6);
    context.lineTo(22, -15);
    context.moveTo(-9, 8);
    context.lineTo(6, 20);
    context.stroke();

    [-53, 22, 6].forEach((nodeX, index) => {
      const nodeY = index === 0 ? 6 : index === 1 ? -15 : 20;
      context.beginPath();
      context.arc(nodeX, nodeY, 2.5, 0, Math.PI * 2);
      context.fill();
    });

    // すこしだけ でじたるな みずしぶき。
    context.shadowColor = "rgba(112,239,255,0.55)";
    context.shadowBlur = 7;
    context.fillStyle = "rgba(170,248,255,0.72)";
    const bubbleLift = (timestamp * 0.018) % 12;
    context.fillRect(-49, -55 - bubbleLift, 3, 3);
    context.fillRect(-34, -60 + bubbleLift * 0.35, 2, 2);
    context.restore();
  }

  function canvasSelect(event) {
    if (state.phase !== "running" || state.bossActive) return;
    const rect = dom.gameCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const candidates = state.enemies
      .filter((enemy) => !enemy.pendingRepair && !enemy.queuedFragment)
      .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - x, enemy.y - y) }))
      .filter((item) => item.distance <= item.enemy.radius + 24)
      .sort((a, b) => a.distance - b.distance);
    if (candidates.length) {
      state.targetId = candidates[0].enemy.id;
      showCallout("ねらいを かえたよ", "", 420);
      updateKeys();
      updateHud(true);
    }
  }

  function keyboardFactor(event) {
    if (event.repeat) return;
    const map = {
      Digit2: 2, Numpad2: 2, Digit3: 3, Numpad3: 3, Digit4: 4, Numpad4: 4,
      Digit5: 5, Numpad5: 5, Digit6: 6, Numpad6: 6, Digit7: 7, Numpad7: 7,
      Digit8: 8, Numpad8: 8, Digit9: 9, Numpad9: 9, Digit0: 10, Numpad0: 10,
      KeyQ: 11, KeyW: 12, KeyE: 13
    };
    if (event.code === "Escape" && state.view === "play") {
      event.preventDefault();
      togglePause();
      return;
    }
    const factor = map[event.code];
    if (!factor) return;
    event.preventDefault();
    const button = factorButtons.find((item) => Number(item.dataset.factor) === factor);
    pressFactor(factor, button);
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    stored.soundEnabled = state.soundEnabled;
    saveStored();
    dom.soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
    dom.soundButton.setAttribute("aria-label", state.soundEnabled ? "こうかおんを きる" : "こうかおんを だす");
    setText(dom.soundButton, state.soundEnabled ? "SE" : "×");
    if (state.soundEnabled) {
      sound.unlock();
      sound.tone(520, 0.12, "sine", 0.03);
    }
  }

  function toggleBgm() {
    state.bgmEnabled = !state.bgmEnabled;
    stored.bgmEnabled = state.bgmEnabled;
    saveStored();
    dom.bgmButton.setAttribute("aria-pressed", String(state.bgmEnabled));
    dom.bgmButton.setAttribute("aria-label", state.bgmEnabled ? "BGMを きる" : "BGMを だす");
    if (state.bgmEnabled) music.sync();
    else music.pause();
  }

  function attachEvents() {
    dom.mainStartButton.addEventListener("click", startMain);
    dom.practiceStartButton.addEventListener("click", startPractice);
    dom.fractionStartButton.addEventListener("click", startFraction);
    dom.soundButton.addEventListener("click", toggleSound);
    dom.bgmButton.addEventListener("click", toggleBgm);
    dom.pauseButton.addEventListener("click", togglePause);
    dom.resumeButton.addEventListener("click", resumeGame);
    dom.restartButton.addEventListener("click", restartCurrentMode);
    dom.homeFromPauseButton.addEventListener("click", goHome);
    dom.resultRetryButton.addEventListener("click", restartCurrentMode);
    dom.resultHomeButton.addEventListener("click", goHome);
    dom.missionGoButton.addEventListener("click", continueMission);
    dom.mobilePicoGoButton.addEventListener("click", continueMission);
    dom.missionHomeButton.addEventListener("click", goHome);
    factorButtons.forEach((button) => {
      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        pressFactor(button.dataset.factor, button);
      });
    });
    dom.gameCanvas.addEventListener("pointerup", canvasSelect);
    document.addEventListener("keydown", keyboardFactor);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.view === "play" && state.phase === "running") togglePause();
    });
    window.addEventListener("resize", () => {
      resizeCanvas();
      syncMissionSurface();
    }, { passive: true });
    if (globalThis.ResizeObserver) {
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(dom.arena);
    }
  }

  function initialize() {
    setText(dom.titleBestScore, stored.bestScore);
    updateTitleEntry();
    dom.soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
    dom.soundButton.setAttribute("aria-label", state.soundEnabled ? "こうかおんを きる" : "こうかおんを だす");
    setText(dom.soundButton, state.soundEnabled ? "SE" : "×");
    dom.bgmButton.setAttribute("aria-pressed", String(state.bgmEnabled));
    dom.bgmButton.setAttribute("aria-label", state.bgmEnabled ? "BGMを きる" : "BGMを だす");
    attachEvents();
    showScreen("title");
    cancelAnimationFrame(frameHandle);
    state.lastTimestamp = performance.now();
    frameHandle = requestAnimationFrame(frame);
  }

  globalThis.WarikiriGame = Object.freeze({
    start: startMain,
    startPractice,
    startFraction,
    pressFactor,
    pause: togglePause,
    getState() {
      return Object.freeze({
        view: state.view,
        mode: state.mode,
        phase: state.phase,
        bgmEnabled: state.bgmEnabled,
        bgmRate: Number(music.currentRate.toFixed(3)),
        elapsed: state.elapsed,
        score: state.score,
        lives: state.lives,
        combo: state.combo,
        repaired: state.repaired,
        bossesCleared: state.bossesCleared,
        invincibleSeconds: Number(invincibleSecondsLeft().toFixed(2)),
        nextBossAt: state.nextBossAt,
        bossPending: state.bossPending,
        activeFactors: Object.freeze([...state.activeFactors]),
        target: getTarget() ? JSON.parse(JSON.stringify(getTarget())) : null,
        enemyCount: state.enemies.length,
        seed
      });
    },
    debugAdvance(seconds = 10) {
      if (!debugEnabled || state.mode !== "main") return false;
      state.elapsed += Math.max(0, Number(seconds) || 0);
      updateHud(true);
      return true;
    },
    debugBoss() {
      if (!debugEnabled || state.mode !== "main") return false;
      spawnMainBoss(true);
      return true;
    },
    debugMiss() {
      if (!debugEnabled || state.mode !== "main") return false;
      return registerMiss("デバッグ ミス");
    }
  });

  initialize();
})();
