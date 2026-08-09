(() => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-vision-training-link]");
    if (!link || typeof window.gtag !== "function") return;

    window.gtag("event", "vision_training_navigation", {
      link_role: link.dataset.visionTrainingLink,
      link_url: link.href,
    });
  });
})();
