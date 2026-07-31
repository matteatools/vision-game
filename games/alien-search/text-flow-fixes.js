const root = document.getElementById("root");

function repairStoryBreaks() {
  root
    ?.querySelectorAll(".story p:last-child br:not([data-flow-fixed])")
    .forEach((lineBreak) => {
      lineBreak.dataset.flowFixed = "true";
      const before = lineBreak.previousSibling;
      const after = lineBreak.nextSibling;

      if (
        before?.nodeType === Node.TEXT_NODE &&
        after?.nodeType === Node.TEXT_NODE &&
        before.textContent?.endsWith(" かくれた")
      ) {
        before.textContent = before.textContent.slice(0, -"かくれた".length);
        after.textContent = `かくれた ${after.textContent.trimStart()}`;
      }
    });

  root
    ?.querySelectorAll(".complete-card > p:last-of-type br")
    .forEach((lineBreak) => {
      lineBreak.replaceWith(document.createTextNode(" "));
    });
}

if (root) {
  new MutationObserver(repairStoryBreaks).observe(root, {
    childList: true,
    subtree: true,
  });
  repairStoryBreaks();
}
