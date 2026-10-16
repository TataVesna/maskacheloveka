/* Встреча с ведьмой на выходе из пещеры.
   Герой останавливается, камера приближается, появляется бабл ведьмы.
   По клику/тапу в любом месте экрана камера отдаляется и бег продолжается. */
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
  bubble.src = "assets/UI/Бабл_Бабки.png";
  bubble.alt = "Реплика ведьмы";
  bubble.style.position = "absolute";
  bubble.style.height = "auto";
  bubble.style.zIndex = "12";
  bubble.style.opacity = "0";
  bubble.style.pointerEvents = "none";
  bubble.style.userSelect = "none";
  bubble.style.webkitUserDrag = "none";
  bubble.style.transition = "opacity 420ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)";
  world.appendChild(bubble);

  /* Правый край последнего экрана пещеры (mound-end), с небольшим запасом от стыка. */
  const witchRoutePosition = 6.86;
  const currentLocationWidth = () => innerHeight * (3000 / 1080);
  const currentWitchX = () => currentLocationWidth() * witchRoutePosition;
  const sceneScale = () => innerHeight / 1080;
  const isTouchLayout = () => window.matchMedia("(pointer: coarse)").matches || innerWidth <= 900;

  function positionWitchAndBubble() {
    const scale = sceneScale();
    const witchX = currentWitchX();
    const mobile = isTouchLayout();

    witch.style.left = `${witchX}px`;
    witch.dataset.logicalX = String(witchRoutePosition);

    /* На телефоне бабл масштабируется от ширины экрана, а не только от высоты сцены:
       в landscape высота маленькая, поэтому прежняя формула делала реплику слишком мелкой. */
    if (mobile) {
      const bubbleWidth = Math.min(innerWidth * 0.50, 430);
      bubble.style.left = `${witchX + Math.min(innerWidth * 0.16, 155)}px`;
      bubble.style.bottom = `calc(var(--run-line-bottom) + ${Math.max(72, innerHeight * 0.18)}px)`;
      bubble.style.width = `${bubbleWidth}px`;
    } else {
      bubble.style.left = `${witchX + 175 * scale}px`;
      bubble.style.bottom = `calc(var(--run-line-bottom) + ${95 * scale}px)`;
      bubble.style.width = `${300 * scale}px`;
    }

    bubble.style.transform = `translate(-50%, ${18 * scale}px) scale(0.96)`;
  }

  positionWitchAndBubble();

  let triggered = false;
  let waitingForInteraction = false;
  let completed = false;
  const zoomDuration = 850;

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
    if (triggered || completed || window.infiniteMode) return;
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

    showBubble();

    requestAnimationFrame(() => {
      game.style.transform = "scale(1.42)";
    });

    window.setTimeout(() => {
      if (!completed) waitingForInteraction = true;
    }, zoomDuration);
  }

  function continueAfterWitch(event) {
    if (!waitingForInteraction || completed || window.infiniteMode) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    completed = true;
    waitingForInteraction = false;
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

  /* Продолжение — по клику/тапу в любом месте экрана, а не только по баблу. */
  game.addEventListener("pointerdown", continueAfterWitch);

  function watchWitch() {
    if (!window.infiniteMode && !triggered && !completed && gameStarted && running && !tutorialActive) {
      const center = worldX + heroScreenX();
      const approachDistance = innerWidth * 0.08;
      if (center >= currentWitchX() - approachDistance) triggerWitchScene();
    }
    requestAnimationFrame(watchWitch);
  }

  window.addEventListener("resize", positionWitchAndBubble);
  requestAnimationFrame(watchWitch);
})();
