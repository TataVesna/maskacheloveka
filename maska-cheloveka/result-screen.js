/* Экран результата показывается и при проигрыше, и после финальной сцены. */
(() => {
  const overlay = document.createElement("div");
  overlay.id = "result-screen";
  overlay.setAttribute("aria-hidden", "true");

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "120",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
    transition: "opacity 420ms ease, visibility 420ms ease"
  });

  const image = document.createElement("img");
  image.src = "assets/UI/эеран успеха.png";
  image.alt = "Экран результата";

  Object.assign(image.style, {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#000",
    userSelect: "none",
    webkitUserDrag: "none"
  });

  overlay.appendChild(image);
  game.appendChild(overlay);

  window.showResultScreen = function showResultScreen(result = "loss") {
    overlay.dataset.result = result;
    overlay.style.visibility = "visible";
    overlay.style.pointerEvents = "auto";
    overlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });
  };

  /* При проигрыше вместо мгновенного рестарта показываем экран результата. */
  failRun = function failRunWithResultScreen() {
    if (!running || window.finalSequenceActive) return;

    running = false;
    jump = null;
    wading = null;
    hero.classList.remove("wading");
    hero.style.transform = "";
    hero.classList.remove("running", "jumping");
    hero.classList.add("falling");

    window.setTimeout(() => {
      window.showResultScreen("loss");
    }, 520);
  };
})();
