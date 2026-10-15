/* Финальная сцена в чуме невесты.
   Сначала панорама доезжает до самого конца и замирает.
   Затем герой продолжает бежать вправо уже по неподвижному фону.
   Только у правого края экран затемняется и проявляются глаза невесты.
   По клику/тапу на глаза открывается экран результата. */
(() => {
  const REVEAL_DURATION = 1200;
  const DARKEN_DURATION = 500;
  const RIGHT_EDGE_PADDING = 18;

  let triggered = false;
  let finalImageReady = false;
  window.finalSequenceActive = false;

  const overlay = document.createElement("div");
  overlay.id = "final-scene-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "85",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0)",
    opacity: "1",
    visibility: "hidden",
    pointerEvents: "none",
    cursor: "pointer",
    transition: `background ${DARKEN_DURATION}ms ease, visibility ${DARKEN_DURATION}ms ease`
  });

  const image = document.createElement("img");
  image.src = "assets/UI/ПЗ_Фин_Иллюстрация.png";
  image.alt = "Финальная иллюстрация — глаза невесты";
  Object.assign(image.style, {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#000",
    transform: "scale(1.035)",
    filter: "blur(9px)",
    opacity: "0",
    userSelect: "none",
    webkitUserDrag: "none",
    transition: `transform ${REVEAL_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${REVEAL_DURATION}ms ease, opacity ${REVEAL_DURATION}ms ease`
  });

  overlay.appendChild(image);
  game.appendChild(overlay);

  function revealFinalImage() {
    overlay.style.visibility = "visible";
    overlay.style.background = "rgba(0, 0, 0, 1)";

    window.setTimeout(() => {
      finalImageReady = true;
      overlay.style.pointerEvents = "auto";
      image.style.opacity = "1";
      image.style.transform = "scale(1)";
      image.style.filter = "blur(0px)";
    }, DARKEN_DURATION * 0.65);
  }

  function showWinScreen(event) {
    if (!finalImageReady) return;
    event.preventDefault();
    event.stopPropagation();

    running = false;
    jump = null;
    wading = null;
    overlay.style.pointerEvents = "none";
    overlay.style.visibility = "hidden";

    window.showResultScreen?.("win");
  }

  overlay.addEventListener("pointerdown", showWinScreen);

  function runHeroToRightEdge() {
    if (triggered) return;
    triggered = true;
    window.finalSequenceActive = true;

    /* Фон уже дошёл до конца — фиксируем его и продолжаем только бег героя. */
    running = false;
    jump = null;
    wading = null;
    hero.classList.remove("jumping", "wading", "witch-paused");
    hero.classList.add("running");
    hero.style.transform = "";

    const startLeft = hero.offsetLeft;
    const targetLeft = Math.max(startLeft, innerWidth - hero.offsetWidth - RIGHT_EDGE_PADDING);
    const distance = Math.max(0, targetLeft - startLeft);
    const currentSpeed = Math.max(1, Number(speedSlider.value) || 1.5);
    const pixelsPerSecond = innerWidth * 0.21 * currentSpeed;
    const duration = Math.max(900, distance / pixelsPerSecond * 1000);
    const startedAt = performance.now();

    function moveHero(now) {
      const progress = Math.max(0, Math.min((now - startedAt) / duration, 1));
      const left = startLeft + distance * progress;
      hero.style.left = `${left}px`;
      updateHeroAnimation(now);

      if (progress < 1) {
        requestAnimationFrame(moveHero);
        return;
      }

      /* Герой дошёл до правого края: затемняем фон и только потом проявляем глаза. */
      revealFinalImage();
    }

    requestAnimationFrame(moveHero);
  }

  function watchFinalScene() {
    if (!triggered && gameStarted && !tutorialActive) {
      const maxScroll = Math.max(0, world.scrollWidth - game.clientWidth);
      const backgroundAtEnd = maxScroll > 0 && worldX >= maxScroll - 1;

      if (backgroundAtEnd) runHeroToRightEdge();
    }

    if (!triggered) requestAnimationFrame(watchFinalScene);
  }

  requestAnimationFrame(watchFinalScene);
})();
