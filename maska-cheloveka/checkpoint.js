/* Чекпоинт после встречи с ведьмой.
   До встречи поражение возвращает в начало. После встречи — к ведьме. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  let checkpointActive = false;
  let checkpointRoutePosition = 0;

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  window.activateWitchCheckpoint = function activateWitchCheckpoint(routePosition) {
    checkpointRoutePosition = Number(routePosition) || 0;
    checkpointActive = checkpointRoutePosition > 0;
  };

  const resetRunFromStart = resetRun;

  resetRun = function resetRunFromCheckpoint() {
    if (!checkpointActive) {
      resetRunFromStart();
      return;
    }

    running = gameStarted;
    jump = null;
    wading = null;
    tutorialActive = false;
    touchStart = null;

    tutorialOverlay.classList.add("is-hidden");
    tutorialOverlay.setAttribute("aria-hidden", "true");

    game.style.transform = "scale(1)";

    setForm("human");
    hero.classList.remove(
      "wading",
      "tutorial-paused",
      "witch-paused",
      "jumping",
      "falling",
      "falling-human",
      "falling-bear"
    );
    hero.classList.add("running");
    hero.style.transform = "";

    const location = currentLocationWidth();
    const respawnCenter = location * checkpointRoutePosition;
    const maxScroll = Math.max(0, world.scrollWidth - game.clientWidth);
    worldX = Math.max(0, Math.min(respawnCenter - heroScreenX(), maxScroll));
    world.style.transform = `translate3d(${-worldX}px, 0, 0)`;

    /* Всё, что осталось позади чекпоинта, считается уже пройденным.
       Благодаря этому игрок не сталкивается повторно со стеной или другими
       препятствиями, расположенными рядом с ведьмой. */
    obstacles.forEach((obstacle) => {
      obstacle.inside = false;
      obstacle.attemptJump = null;

      const alreadyBehindCheckpoint = obstacle.x <= respawnCenter;
      obstacle.crossed = alreadyBehindCheckpoint;

      if (obstacle.mode === "cave-wall") {
        if (alreadyBehindCheckpoint) {
          if (obstacle.breakTimer) {
            window.clearInterval(obstacle.breakTimer);
            obstacle.breakTimer = null;
          }
          obstacle.breaking = false;
          obstacle.element.style.opacity = "0";
          obstacle.element.style.visibility = "hidden";
        } else {
          resetCaveWall(obstacle);
        }
      }
    });

    lastFrameAt = performance.now();
  };
})();
