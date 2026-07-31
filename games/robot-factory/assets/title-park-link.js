const root = document.getElementById("root");

function ensureTitleParkLink() {
  const titleMenu = root?.querySelector(".title-menu-panel");
  if (!titleMenu || titleMenu.querySelector(".game-park-link")) return;

  const parkLink = document.createElement("a");
  parkLink.className = "game-park-link";
  parkLink.href = "../../index.html";
  parkLink.textContent = "ゲームパークへ もどる";
  titleMenu.append(parkLink);
}

if (root) {
  new MutationObserver(ensureTitleParkLink).observe(root, {
    childList: true,
    subtree: true,
  });
  ensureTitleParkLink();
}
