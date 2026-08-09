document.querySelectorAll("[data-guide-play]").forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "guide_play_click", {
        game_slug: link.dataset.gameSlug || "unknown"
      });
    }
  });
});
