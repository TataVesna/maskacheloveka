/* Двухэтапный туториал: сначала останавливаем игру и ждём подтверждения,
   затем оставляем подсказки поверх игры до прохождения первого препятствия. */
(() => {
  const TRIGGER_X = locationWidth * 0.68;
  const continueHint = tutorialOverlay.querySelector('.tutorial-continue');

  let tutorialStarted = false;
  let tutorialLingering = false;
  let firstObstacle = null;

  /* Блокируем старый ранний триггер из game.js. */
  tutorialShown = true;

  function findFirstObstacle() {
    if (firstObstacle && obstacles.includes(firstObstacle)) return firstObstacle;
    firstObstacle = [...obstacles]
      .filter((obstacle) => obstacle?.element && obstacle.element.isConnected)
      .sort((a, b) => a.x - b.x)[0] || null;
    return firstObstacle;
  }

  function hideTutorialCompletely() {
    tutorialActive = false;
    tutorialLingering = false;
    tutorialOverlay.classList.remove('is-lingering');
    tutorialOverlay.classList.add('is-hidden');
    tutorialOverlay.setAttribute('aria-hidden', 'true');
    tutorialOverlay.style.pointerEvents = '';
    if (continueHint) continueHint.style.visibility = '';
  }

  showTutorial = function showTutorialLater() {
    if (tutorialStarted || tutorialActive) return;

    tutorialStarted = true;
    tutorialActive = true;
    tutorialLingering = false;
    running = false;
    jump = null;

    hero.classList.remove('jumping', 'running');
    hero.classList.add('tutorial-paused');
    hero.style.transform = '';

    tutorialOverlay.classList.remove('is-hidden', 'is-lingering');
    tutorialOverlay.style.pointerEvents = 'auto';
    tutorialOverlay.setAttribute('aria-hidden', 'false');
    if (continueHint) continueHint.style.visibility = 'visible';
  };

  closeTutorial = function continueGameWithTutorialVisible() {
    if (!tutorialActive) return;

    tutorialActive = false;
    tutorialLingering = true;
    tutorialOverlay.classList.remove('is-hidden');
    tutorialOverlay.classList.add('is-lingering');
    tutorialOverlay.style.pointerEvents = 'none';
    tutorialOverlay.setAttribute('aria-hidden', 'false');
    if (continueHint) continueHint.style.visibility = 'hidden';

    hero.classList.remove('tutorial-paused');
    hero.classList.add('running');
    running = true;
    lastFrameAt = performance.now();
  };

  /* Не даём resetRun вернуть старый туториал. После обычного поражения
     обучение повторно не появляется в рамках этой загрузки страницы. */
  const originalResetRun = resetRun;
  resetRun = function resetRunWithTutorialState() {
    originalResetRun();
    tutorialShown = true;
    if (tutorialStarted && !tutorialLingering) {
      tutorialOverlay.classList.add('is-hidden');
      tutorialOverlay.classList.remove('is-lingering');
    }
  };

  function updateTutorialFlow() {
    if (gameStarted && !tutorialStarted && !tutorialActive) {
      tutorialShown = true;
      const center = worldX + heroScreenX();
      if (running && center >= TRIGGER_X) {
        const maxScroll = Math.max(0, world.scrollWidth - game.clientWidth);
        worldX = Math.min(Math.max(0, TRIGGER_X - heroScreenX()), maxScroll);
        world.style.transform = `translate3d(${-worldX}px, 0, 0)`;
        showTutorial();
      }
    }

    if (tutorialLingering) {
      const obstacle = findFirstObstacle();
      if (obstacle?.crossed) {
        hideTutorialCompletely();
      }
    }

    requestAnimationFrame(updateTutorialFlow);
  }

  requestAnimationFrame(updateTutorialFlow);
})();
