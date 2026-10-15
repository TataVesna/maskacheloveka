/* Финальная сцена в чуме невесты.
   При входе на последний экран герой плавно замедляется,
   затем поверх игры появляется финальная иллюстрация.
   По клику/тапу на глаза открывается экран результата. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  const FINAL_SCENE_INDEX = 10; // bride-chum — 11-й экран, индекс 10
  const TRIGGER_FRACTION = 0.04;
  const SLOWDOWN_DURATION = 1400;
  const REVEAL_DELAY = 700;
  const REVEAL_DURATION = 1200;

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
    background: "#000",
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
    cursor: "pointer",
    transition: `opacity ${REVEAL_DURATION}ms ease, visibility ${REVEAL_DURATION}ms ease`
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

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  function revealFinalImage() {
    overlay.style.visibility = "visible";
    overlay.style.pointerEvents = "auto";
    finalImageReady = true;

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      image.style.opacity = "1";
      image.style.transform = "scale(1)";
      image.style.filter = "blur(0px)";
    });
  }

  function showWinScreen(event) {
    if (!finalImageReady) return;
    event.preventDefault();
    event.stopPropagation();

    running = false;
    jump = null;
    wading = null;
    overlay.style.pointerEvents = "none";
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";

    window.showResultScreen?.("win");
  }

  overlay.addEventListener("pointerdown", showWinScreen);

  function startFinalScene() {
    if (triggered) return;
    triggered = true;
    window.finalSequenceActive = true;

    const startingSpeed = Number(speedSlider.value) || 1.5;
    const minimumSpeed = Math.min(startingSpeed, 0.45);
    const startedAt = performance.now();

    window.setTimeout(revealFinalImage, REVEAL_DELAY);

    function slowDown(now) {
      const progress = Math.max(0, Math.min((now - startedAt) / SLOWDOWN_DURATION, 1));
      const eased = 1 - Math.pow(1 - progress, 3);
      const speed = startingSpeed + (minimumSpeed - startingSpeed) * eased;

      speedSlider.value = String(Math.max(0.4, speed));
      speedValue.value = `${Number(speedSlider.value).toFixed(1)}×`;
      speedValue.textContent = speedValue.value;

      if (progress < 1) {
        requestAnimationFrame(slowDown);
        return;
      }

      running = false;
      jump = null;
      wading = null;
      hero.classList.remove("jumping", "wading");
      hero.classList.add("running");
      hero.style.transform = "";
    }

    requestAnimationFrame(slowDown);
  }

  function watchFinalScene() {
    if (!triggered && gameStarted && running && !tutorialActive) {
      const location = currentLocationWidth();
      const triggerX = location * (FINAL_SCENE_INDEX + TRIGGER_FRACTION);
      const heroCenter = worldX + heroScreenX();

      if (heroCenter >= triggerX) startFinalScene();
    }

    if (!triggered) requestAnimationFrame(watchFinalScene);
  }

  requestAnimationFrame(watchFinalScene);
})();
