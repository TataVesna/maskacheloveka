/* Непрерывающий туториал: подсказка появляется через секунду после старта,
   не останавливает героя и остаётся до прохождения первого препятствия.
   В бесконечном режиме туториал полностью отключён. */
(() => {
  const TUTORIAL_DELAY_MS = 1000;
  const continueHint = tutorialOverlay.querySelector('.tutorial-continue');

  let tutorialStarted = false;
  let tutorialVisible = false;
  let firstObstacle = null;
  let runStartedAt = null;

  tutorialShown = true;
  tutorialActive = false;

  function findFirstObstacle() {
    if (firstObstacle && obstacles.includes(firstObstacle)) return firstObstacle;
    firstObstacle = [...obstacles]
      .filter((obstacle) => obstacle?.element && obstacle.element.isConnected)
      .sort((a, b) => a.x - b.x)[0] || null;
    return firstObstacle;
  }

  function showTutorialWhileRunning() {
    if (tutorialStarted || window.infiniteMode) return;

    tutorialStarted = true;
    tutorialVisible = true;
    tutorialActive = false;

    tutorialOverlay.classList.remove('is-hidden');
    tutorialOverlay.classList.add('is-lingering');
    tutorialOverlay.style.pointerEvents = 'none';
    tutorialOverlay.setAttribute('aria-hidden', 'false');

    if (continueHint) continueHint.style.display = 'none';
  }

  function hideTutorialCompletely() {
    tutorialVisible = false;
    tutorialActive = false;
    tutorialOverlay.classList.remove('is-lingering');
    tutorialOverlay.classList.add('is-hidden');
    tutorialOverlay.style.pointerEvents = 'none';
    tutorialOverlay.setAttribute('aria-hidden', 'true');
  }

  function prepareTutorialForNewRun() {
    tutorialStarted = false;
    tutorialVisible = false;
    firstObstacle = null;
    runStartedAt = performance.now();
    tutorialShown = true;
    tutorialActive = false;
    hideTutorialCompletely();
    if (continueHint) continueHint.style.display = 'none';
  }

  function disableTutorialForEndless() {
    tutorialStarted = true;
    firstObstacle = null;
    runStartedAt = null;
    tutorialShown = true;
    hideTutorialCompletely();
  }

  showTutorial = showTutorialWhileRunning;
  closeTutorial = hideTutorialCompletely;

  const originalResetRun = resetRun;
  resetRun = function resetRunWithTutorialState() {
    originalResetRun();

    if (window.infiniteMode) {
      disableTutorialForEndless();
      return;
    }

    const isFullRunFromStart = worldX < locationWidth * 0.08;
    if (isFullRunFromStart) {
      prepareTutorialForNewRun();
      return;
    }

    runStartedAt = null;
    tutorialShown = true;
    tutorialStarted = true;
    hideTutorialCompletely();
  };

  function updateTutorialFlow(now) {
    if (window.infiniteMode) {
      if (tutorialVisible || !tutorialStarted) disableTutorialForEndless();
      requestAnimationFrame(updateTutorialFlow);
      return;
    }

    if (gameStarted && !tutorialStarted) {
      tutorialShown = true;
      if (runStartedAt === null) runStartedAt = now;

      if (running && now - runStartedAt >= TUTORIAL_DELAY_MS) {
        showTutorialWhileRunning();
      }
    }

    if (tutorialVisible) {
      const obstacle = findFirstObstacle();
      if (obstacle?.crossed) hideTutorialCompletely();
    }

    requestAnimationFrame(updateTutorialFlow);
  }

  requestAnimationFrame(updateTutorialFlow);
})();
