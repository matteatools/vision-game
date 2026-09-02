const gameRoot = document.getElementById("root");
const musicStorageKey = "jiwa_fushigi_music_v1";
let musicEnabled = window.localStorage.getItem(musicStorageKey) !== "off";

const bgm = new Audio("./assets/audio/otologic-tsumetai-kehai-slow.mp3");
bgm.id = "jiwa-bgm";
bgm.loop = true;
bgm.preload = "auto";
bgm.volume = 0.12;
bgm.playsInline = true;
bgm.setAttribute("aria-hidden", "true");
document.body.append(bgm);

function isPlayingScreen() {
  return Boolean(
    gameRoot?.querySelector(
      ".game-shell.phase-playing, .game-shell.phase-dark",
    ),
  );
}

function pauseMusic(reset = false) {
  if (!bgm.paused) bgm.pause();
  if (!reset || bgm.currentTime === 0) return;

  try {
    bgm.currentTime = 0;
  } catch {
    // 読み込み前なら停止だけでよい。
  }
}

function syncMusic() {
  const shouldPlay = musicEnabled && isPlayingScreen() && !document.hidden;

  if (shouldPlay) {
    if (bgm.paused) bgm.play().catch(() => {});
  } else {
    pauseMusic(!isPlayingScreen());
  }
}

function updateMusicButtons() {
  document.querySelectorAll("[data-jiwa-music-toggle]").forEach((button) => {
    const label = musicEnabled ? "BGM" : "BGM×";
    const ariaLabel = musicEnabled ? "BGMをオフにする" : "BGMをオンにする";

    if (button.textContent !== label) button.textContent = label;
    if (button.getAttribute("aria-label") !== ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
    if (button.getAttribute("aria-pressed") !== String(musicEnabled)) {
      button.setAttribute("aria-pressed", String(musicEnabled));
    }
  });
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  window.localStorage.setItem(musicStorageKey, musicEnabled ? "on" : "off");
  updateMusicButtons();
  syncMusic();
}

function createMusicButton(className) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.dataset.jiwaMusicToggle = "";
  button.addEventListener("click", toggleMusic);
  return button;
}

function startsRound(button) {
  return button.matches(
    ".stage-card, .practice-screen .start-button, " +
      ".phase-answer .replay-button, .phase-timeout .replay-button, " +
      ".jiwa-checks-ended .replay-button, .checks-failed button",
  );
}

function leavesRound(button) {
  return button.matches(
    ".wordmark, .phase-answer .practice-back, .phase-timeout .practice-back",
  );
}

function ensureMusicControls() {
  const titleActions = gameRoot?.querySelector(
    ".intro-screen:not(.practice-screen) .intro-actions",
  );
  const practiceActions = gameRoot?.querySelector(
    ".practice-screen .practice-actions",
  );
  const stageActions = gameRoot?.querySelector(".stage-footer-actions");
  const gameHeader = gameRoot?.querySelector(".game-header");

  let target = null;
  let placement = "append";
  let className = "";

  if (gameHeader) {
    target = gameHeader;
    className = "jiwa-music-toggle jiwa-music-toggle--header";
  } else if (stageActions) {
    target = stageActions;
    className = "practice-back stage-back jiwa-music-toggle";
  } else if (practiceActions) {
    target = practiceActions;
    className = "practice-back jiwa-music-toggle";
  } else if (titleActions) {
    target = titleActions;
    placement = "after";
    className = "jiwa-music-toggle jiwa-music-toggle--standalone";
  }

  gameRoot?.querySelectorAll("[data-jiwa-music-toggle]").forEach((button) => {
    const isCurrent =
      placement === "after"
        ? target?.nextElementSibling === button
        : Boolean(target?.contains(button));
    if (!isCurrent) button.remove();
  });

  if (target) {
    const hasCurrentButton =
      placement === "after"
        ? target.nextElementSibling?.matches("[data-jiwa-music-toggle]")
        : target.querySelector("[data-jiwa-music-toggle]");

    if (!hasCurrentButton) {
      const button = createMusicButton(className);
      if (placement === "after") target.after(button);
      else target.append(button);
    }
  }

  const introCard = gameRoot?.querySelector(
    ".intro-screen:not(.practice-screen) .intro-card",
  );
  gameRoot?.querySelectorAll(".jiwa-audio-credit").forEach((credit) => {
    if (!introCard?.contains(credit)) credit.remove();
  });
  if (introCard && !introCard.querySelector(".jiwa-audio-credit")) {
    const credit = document.createElement("a");
    credit.className = "jiwa-audio-credit";
    credit.href = "https://otologic.jp/free/bgm/music-box01.html";
    credit.target = "_blank";
    credit.rel = "noopener";
    credit.textContent = "BGM「冷たい気配-1」：OtoLogic（CC BY 4.0）";
    introCard.querySelector(".intro-note")?.after(credit);
  }

  updateMusicButtons();
}

let syncFrame = 0;
function scheduleSync() {
  if (syncFrame) return;
  syncFrame = window.requestAnimationFrame(() => {
    syncFrame = 0;
    ensureMusicControls();
    syncMusic();
  });
}

if (gameRoot) {
  document.addEventListener(
    "click",
    (event) => {
      if (!musicEnabled || document.hidden || !(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest("button");
      if (button && leavesRound(button)) pauseMusic(true);
      else if (button && startsRound(button)) bgm.play().catch(() => {});
    },
    true,
  );

  new MutationObserver(scheduleSync).observe(gameRoot, {
    childList: true,
    subtree: true,
  });
  scheduleSync();
}

document.addEventListener("visibilitychange", syncMusic);
window.addEventListener("pagehide", () => pauseMusic());
