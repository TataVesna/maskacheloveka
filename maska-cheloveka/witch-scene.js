/* Встреча с ведьмой на выходе из пещеры.
   Герой останавливается, камера приближается, появляется бабл ведьмы.
   По клику/тапу на бабл камера отдаляется и бег продолжается. */
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

  const bubble = document.createElement("img");
  bubble.id = "witch-bubble";
  bubble.src = "assets/Бабл_Бабки.png";
  bubble.alt = "Реплика ведьмы";
  bubble.style.position = "absolute";
  bubble.style.height = "auto";
  bubble.style.zIndex = "12";
  bubble.style.opacity = "0";
  bubble.style.pointerEvents = "none";
  bubble.style.cursor = "default";
  bubble.style.userSelect = "none";
  bubble.style.webkitUserDrag = "none";
  bubble.style.transition = "opacity 420ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)";
  world.appendChild(bubble);

  /* Правый край последнего экрана пещеры (mound-end), с небольшим запасом от стыка. */
  const witchRoutePosition = 6.86;
  const currentLocationWidth = () => innerHeight * (3000 / 1080);
  const currentWitchX = () => currentLocationWidth() * witchRoutePosition;
  const sceneScale = () => innerHeight / 1080;

  function positionWitchAndBubble() {
    const scale = sceneScale();
    const witchX = currentWitchX();

    witch.style.left = `${witchX}px`;
    witch.dataset.logicalX = String(witchRoutePosition);

    /* Бабл — справа и немного выше ведьмы. */
    bubble.style.left = `${witchX + 205 * scale}px`;
    bubble.style.bottom = `calc(var(--run-line-bottom) + ${95 * scale}px)`;
    bubble.style.width = `${300 * scale}px`;
    bubble.style.transform = `translate(-50%, ${18 * scale}px) scale(0.96)`;
  }

  positionWitchAndBubble();

  let triggered = false;
  let waitingForInteraction = false;
  let completed = false;
  const zoomDuration = 850;

  function setBubbleInteractive(enabled) {
    waitingForInteraction = enabled;
    bubble.style.pointerEvents = enabled ? "auto" : "none";
    bubble.style.cursor = enabled ? "pointer" : "default";
  }

  function showBubble() {
    positionWitchAndBubble();
    requestAnimationFrame(() => {
      bubble.style.opacity = "1";
      bubble.style.transform = "translate(-50%, 0) scale(1)";
    });
  }

  function hideBubble() {
    bubble.style.opacity = "0";
    bubble.style.transform = `translate(-50%, ${12 * sceneScale()}px) scale(0.97)`;
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

    /* Бабл появляется одновременно с приближением камеры. */
    showBubble();

    requestAnimationFrame(() => {
      game.style.transform = "scale(1.42)";
    });

    window.setTimeout(() => {
      if (!completed) setBubbleInteractive(true);
    }, zoomDuration);
  }

  function continueAfterWitch(event) {
    if (!waitingForInteraction || completed) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    completed = true;
    setBubbleInteractive(false);
    hideBubble();
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

  bubble.addEventListener("pointerdown", continueAfterWitch);
  bubble.addEventListener("click", continueAfterWitch);

  function watchWitch() {
    if (!triggered && !completed && gameStarted && running && !tutorialActive) {
      const center = worldX + heroScreenX();
      const approachDistance = innerWidth * 0.28;
      if (center >= currentWitchX() - approachDistance) triggerWitchScene();
    }
    requestAnimationFrame(watchWitch);
  }

  window.addEventListener("resize", positionWitchAndBubble);
  requestAnimationFrame(watchWitch);
})();
