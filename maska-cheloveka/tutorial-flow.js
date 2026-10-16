/* Непрерывающий туториал: подсказка появляется поверх игры,
   не останавливает героя и остаётся до прохождения первого препятствия. */
(() => {
  /* Показываем заметно раньше, но не прямо в момент старта. */
  const TRIGGER_X = locationWidth * 0.38;
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

  function prepareTutorialForNewRun() {
    tutorialStarted = false;
    tutorialVisible = false;
    firstObstacle = null;
    tutorialShown = true;
    tutorialActive = false;
    tutorialOverlay.classList.add('is-hidden');
    tutorialOverlay.classList.remove('is-lingering');
    tutorialOverlay.style.pointerEvents = 'none';
    tutorialOverlay.setAttribute('aria-hidden', 'true');
    if (continueHint) continueHint.style.display = 'none';
  }

  /* Эти функции больше не должны останавливать игру, даже если их вызовет
     старый обработчик из game.js. */
  showTutorial = showTutorialWhileRunning;
  closeTutorial = hideTutorialCompletely;

  const originalResetRun = resetRun;
  resetRun = function resetRunWithTutorialState() {
    originalResetRun();

    /* При полном новом прохождении resetRun возвращает мир к началу —
       тогда туториал снова разрешён. При респавне от ведьмы worldX уже
       устанавливается на чекпоинт, поэтому обучение повторно не всплывает. */
    const isFullRunFromStart = worldX < locationWidth * 0.08;
    if (isFullRunFromStart) {
      prepareTutorialForNewRun();
      return;
    }

    tutorialShown = true;
    tutorialActive = false;
    tutorialOverlay.classList.add('is-hidden');
    tutorialOverlay.classList.remove('is-lingering');
    tutorialOverlay.style.pointerEvents = 'none';
    tutorialOverlay.setAttribute('aria-hidden', 'true');
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
