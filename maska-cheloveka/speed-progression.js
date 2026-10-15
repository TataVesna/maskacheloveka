/* Постепенное усложнение: скорость растёт по мере прохождения экранов.
   Стартуем с 1.0× и к последним обычным экранам доходим до 1.5×. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  const SPEED_BY_SCENE = [
    1.0, // берлога
    1.0, // тайга — начало
    1.1, // тайга — центр
    1.1, // тайга — конец
    1.2, // курган — начало
    1.2, // курган — центр
    1.3, // курган — выход
    1.3, // река
    1.4, // городище — начало
    1.5, // городище — конец
    1.5  // чум невесты до запуска финальной сцены
  ];

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  function setGameSpeed(speed) {
    const next = Math.max(1, Math.min(1.5, speed));
    speedSlider.value = String(next);
    speedValue.value = `${next.toFixed(1)}×`;
    speedValue.textContent = speedValue.value;
  }

  function updateProgressiveSpeed() {
    if (gameStarted && !window.finalSequenceActive) {
      const location = currentLocationWidth();
      const heroCenter = worldX + heroScreenX();
      const sceneIndex = Math.max(0, Math.min(
        SPEED_BY_SCENE.length - 1,
        Math.floor(heroCenter / location)
      ));

      setGameSpeed(SPEED_BY_SCENE[sceneIndex]);
    }

    requestAnimationFrame(updateProgressiveSpeed);
  }

  setGameSpeed(1.0);
  requestAnimationFrame(updateProgressiveSpeed);
})();
