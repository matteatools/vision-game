const gameRoot = document.getElementById("root");
const musicStorageKey = "magic_gems_music_v1";
let musicEnabled = window.localStorage.getItem(musicStorageKey) !== "off";

const bgm = new Audio("./assets/audio/maou-loop-bgm-ethnic12.mp3");
bgm.id = "magic-gems-bgm";
bgm.loop = true;
bgm.preload = "auto";
bgm.volume = 0.12;
bgm.playsInline = true;
bgm.setAttribute("aria-hidden", "true");
document.body.append(bgm);

function isPlayingScreen() {
  return Boolean(gameRoot?.querySelector(".game-board-shell"));
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
  document
    .querySelectorAll("[data-magic-gems-music-toggle]")
    .forEach((button) => {
      const label = musicEnabled ? "♫ BGM" : "♫ BGM×";
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
  button.dataset.magicGemsMusicToggle = "";
  button.addEventListener("click", toggleMusic);
  return button;
}

function createTitleAudioPanel() {
  const panel = document.createElement("div");
  panel.className = "magic-audio-panel";

  const button = createMusicButton(
    "magic-music-toggle magic-music-toggle--title",
  );
  panel.append(button);

  const credit = document.createElement("a");
  credit.className = "magic-audio-credit";
  credit.href = "https://maou.audio/bgm_ethnic12/";
  credit.target = "_blank";
  credit.rel = "noopener";
  credit.textContent = "BGM「民族12（アラブの商人）」：魔王魂／森田交一";
  panel.append(credit);

  return panel;
}

function startsRound(button) {
  return button.matches(
    ".rank-choice, .practice-primary-button, .result-retry-button",
  );
}

function leavesRound(button) {
  return button.matches(
    ".game-exit-button, .practice-home-button, .result-home-button",
  );
}

function ensureMusicControls() {
  const titleScreen = gameRoot?.querySelector(".title-art-screen");
  const gameExitBar = gameRoot?.querySelector(".game-exit-bar");

  gameRoot?.querySelectorAll(".magic-audio-panel").forEach((panel) => {
    if (!titleScreen?.contains(panel)) panel.remove();
  });
  if (titleScreen && !titleScreen.querySelector(".magic-audio-panel")) {
    titleScreen.append(createTitleAudioPanel());
  }

  gameRoot
    ?.querySelectorAll(".magic-music-toggle--game")
    .forEach((button) => {
      if (!gameExitBar?.contains(button)) button.remove();
    });
  if (gameExitBar && !gameExitBar.querySelector(".magic-music-toggle--game")) {
    gameExitBar.append(
      createMusicButton("magic-music-toggle magic-music-toggle--game"),
    );
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
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!button) return;

      if (leavesRound(button)) pauseMusic(true);
      else if (musicEnabled && !document.hidden && startsRound(button)) {
        bgm.play().catch(() => {});
      }
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
