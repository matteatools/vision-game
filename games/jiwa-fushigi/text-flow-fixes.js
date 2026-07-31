const root = document.getElementById("root");

const naturalFlowSelectors = [
  ".intro-copy br",
  ".stage-select-copy br",
  ".practice-lead br",
];

function restoreNaturalCopyFlow() {
  for (const selector of naturalFlowSelectors) {
    root?.querySelectorAll(selector).forEach((lineBreak) => {
      lineBreak.replaceWith(document.createTextNode(" "));
    });
  }

  const titleCard = root?.querySelector(
    ".intro-screen:not(.practice-screen) .intro-card",
  );
  if (titleCard && !titleCard.querySelector(".game-park-link")) {
    const parkLink = document.createElement("a");
    parkLink.className = "game-park-link";
    parkLink.href = "../../index.html";
    parkLink.textContent = "ゲームパークへ もどる";
    titleCard.querySelector(".intro-note")?.before(parkLink);
  }
}

if (root) {
  new MutationObserver(restoreNaturalCopyFlow).observe(root, {
    childList: true,
    subtree: true,
  });
  restoreNaturalCopyFlow();
}
