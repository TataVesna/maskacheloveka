/* Встреча с ведьмой на выходе из пещеры.
   Герой останавливается, камера приближается, затем игрок кликает/тапает по ведьме.
   Позже вместо самой ведьмы сюда можно подключить отдельное интерактивное изображение. */
(() => {
  const witch = document.createElement("img");
  witch.id = "witch-midpoint";
  witch.src = "assets/characters/witch.png";
  witch.alt = "Ведьма";
  witch.style.position = "absolute";
  witch.style.bottom = "30px";
  witch.style.width = "clamp(92px, 9vw, 138px)";
  witch.style.height = "auto";
  witch.style.zIndex = "8";
  witch.style.pointerEvents = "none";
  witch.style.transform = "translateX(-50%)";
  witch.style.userSelect = "none";
  witch.style.webkitUserDrag = "none";
  world.appendChild(witch);

  /* Правый край последнего экрана пещеры (mound-end), с небольшим запасом от стыка. */
  const witchRoutePosition = 6.86;
  const currentLocationWidth = () => innerHeight * (3000 / 1080);
  const currentWitchX = () => currentLocationWidth() * witchRoutePosition;
  witch.style.left = `${currentWitchX()}px`;
  witch.dataset.logicalX = String(witchRoutePosition);

  let triggered = false;
  let waitingForInteraction = false;
  let completed = false;
  const zoomDuration = 850;

  function setWitchInteractive(enabled) {
    waitingForInteraction = enabled;
    witch.style.pointerEvents = enabled ? "auto" : "none";
    witch.style.cursor = enabled ? "pointer" : "default";
  }

  function triggerWitchScene() {
    if (triggered || completed) return;
    triggered = true;

    running = false;
    jump = null;
    wading = null;

    hero.classList.remove("running", "jumping", "wading");
    hero.classList.add("witch-paused");
    hero.style.transform = "";

    const witchX = currentWitchX();
    const witchScreenX = witchX - worldX;
    const focusX = Math.max(innerWidth * 0.25, Math.min(innerWidth * 0.75, witchScreenX));

    game.style.transformOrigin = `${focusX}px 72%`;
    game.style.transition = `transform ${zoomDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;

    requestAnimationFrame(() => {
      game.style.transform = "scale(1.42)";
    });

    window.setTimeout(() => {
      if (!completed) setWitchInteractive(true);
    }, zoomDuration);
  }

  function continueAfterWitch(event) {
    if (!waitingForInteraction || completed) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    completed = true;
    setWitchInteractive(false);
    game.style.transform = "scale(1)";

    /* Чекпоинт ставим сразу после ведьмы, но до первого препятствия следующей локации. */
    window.activateWitchCheckpoint?.(witchRoutePosition + 0.08);

    window.setTimeout(() => {
      hero.classList.remove("witch-paused");
      hero.classList.add("running");
      running = true;
      lastFrameAt = performance.now();
    }, zoomDuration);
  }

  witch.addEventListener("pointerdown", continueAfterWitch);
  witch.addEventListener("click", continueAfterWitch);

  function watchWitch() {
    if (!triggered && !completed && gameStarted && running && !tutorialActive) {
      const center = worldX + heroScreenX();
      const approachDistance = innerWidth * 0.28;
      if (center >= currentWitchX() - approachDistance) triggerWitchScene();
    }
    requestAnimationFrame(watchWitch);
  }

  requestAnimationFrame(watchWitch);
})();
