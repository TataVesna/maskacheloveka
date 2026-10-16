/* Непрерывающий туториал: подсказка появляется поверх игры,
   не останавливает героя и остаётся до прохождения первого препятствия. */
(() => {
  const TRIGGER_X = locationWidth * 0.68;
  const continueHint = tutorialOverlay.querySelector('.tutorial-continue');

  let tutorialStarted = false;
  let tutorialVisible = false;
  let firstObstacle = null;

  /* Полностью отключаем старый триггер из game.js, который ставил игру на паузу. */
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
    if (tutorialStarted) return;

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

  /* Эти функции больше не должны останавливать игру, даже если их вызовет
     старый обработчик из game.js. */
  showTutorial = showTutorialWhileRunning;
  closeTutorial = hideTutorialCompletely;

  const originalResetRun = resetRun;
  resetRun = function resetRunWithTutorialState() {
    originalResetRun();
    tutorialShown = true;
    tutorialActive = false;

    if (tutorialStarted && tutorialVisible) {
      tutorialOverlay.classList.remove('is-hidden');
      tutorialOverlay.classList.add('is-lingering');
      tutorialOverlay.style.pointerEvents = 'none';
      tutorialOverlay.setAttribute('aria-hidden', 'false');
      if (continueHint) continueHint.style.display = 'none';
    } else {
      tutorialOverlay.classList.add('is-hidden');
      tutorialOverlay.classList.remove('is-lingering');
    }
  };

  function updateTutorialFlow() {
    if (gameStarted && !tutorialStarted) {
      tutorialShown = true;
      const center = worldX + heroScreenX();
      if (running && center >= TRIGGER_X) {
        showTutorialWhileRunning();
      }
    }

    if (tutorialVisible) {
      const obstacle = findFirstObstacle();
      if (obstacle?.crossed) {
        hideTutorialCompletely();
      }
    }

    requestAnimationFrame(updateTutorialFlow);
  }

  requestAnimationFrame(updateTutorialFlow);
})();
