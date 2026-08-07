const gameRoot = document.getElementById("root");

function createAllFoundMessage() {
  const message = document.createElement("p");
  message.className = "jiwa-all-found-message";
  message.hidden = true;
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "assertive");
  message.textContent = "ぜんぶみつけた！";
  document.body.append(message);
  return message;
}

function createChecksEndedDialog() {
  const backdrop = document.createElement("div");
  backdrop.className = "jiwa-checks-ended";
  backdrop.hidden = true;
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-labelledby", "jiwa-checks-ended-title");

  const card = document.createElement("section");
  card.className = "jiwa-checks-ended-card";

  const kicker = document.createElement("p");
  kicker.className = "question-kicker";
  kicker.textContent = "5かいチェックしました。";

  const heading = document.createElement("h1");
  heading.id = "jiwa-checks-ended-title";
  heading.textContent = "チェックは おわり";

  const copy = document.createElement("p");
  copy.textContent = "まだ3つみつかっていません。もういちど、よくみてちょうせんしよう。";

  const retryButton = document.createElement("button");
  retryButton.className = "replay-button result-button";
  retryButton.type = "button";
  retryButton.textContent = "やりなおす";
  retryButton.addEventListener("click", () => {
    const originalRetry = gameRoot?.querySelector(".checks-failed button");
    originalRetry?.click();
  });

  card.append(kicker, heading, copy, retryButton);
  backdrop.append(card);
  document.body.append(backdrop);
  return { backdrop, retryButton };
}

if (gameRoot) {
  let ignoreSceneClicksUntil = 0;

  function rememberMultiTouch(event) {
    if (event.touches.length > 1) {
      ignoreSceneClicksUntil = Date.now() + 1000;
    }
  }

  document.addEventListener("touchstart", rememberMultiTouch, {
    capture: true,
    passive: true,
  });
  document.addEventListener("touchmove", rememberMultiTouch, {
    capture: true,
    passive: true,
  });
  document.addEventListener(
    "touchend",
    () => {
      if (ignoreSceneClicksUntil > Date.now()) {
        ignoreSceneClicksUntil = Date.now() + 600;
      }
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    "click",
    (event) => {
      if (
        Date.now() < ignoreSceneClicksUntil &&
        event.target instanceof Element &&
        event.target.closest(".scene-button")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  const allFoundMessage = createAllFoundMessage();
  const { backdrop: checksEndedDialog, retryButton } =
    createChecksEndedDialog();
  let checksEndedWasVisible = false;

  function syncOutcomeMessages() {
    const playing = Boolean(gameRoot.querySelector(".game-shell.phase-playing"));
    const allFound = playing && Boolean(gameRoot.querySelector(".fast-forward-status"));
    const checksEnded = playing && Boolean(gameRoot.querySelector(".checks-failed"));

    allFoundMessage.hidden = !allFound;
    checksEndedDialog.hidden = !checksEnded;

    if (checksEnded && !checksEndedWasVisible) {
      try {
        retryButton.focus({ preventScroll: true });
      } catch {
        retryButton.focus();
      }
    }
    checksEndedWasVisible = checksEnded;
  }

  new MutationObserver(syncOutcomeMessages).observe(gameRoot, {
    childList: true,
    subtree: true,
  });
  syncOutcomeMessages();
}
