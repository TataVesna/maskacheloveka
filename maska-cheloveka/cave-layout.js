/* Пещерные препятствия находятся только на центральном экране пещеры (mound-center). */
(() => {
  const caveFractions = {
    "cave-low-passage": 0.24,
    "cave-wall": 0.5,
    "cave-high-passage": 0.76
  };

  const caveIndicators = {
    "cave-low-passage": "human",
    "cave-wall": "bear"
  };

  const caveCenterSegment = 4;
  const indicatorOffset = Math.min(innerWidth * 0.22, locationWidth * 0.1);

  for (const obstacle of obstacles) {
    const fraction = caveFractions[obstacle.id];
    if (fraction == null) continue;

    const x = locationWidth * (1 + caveCenterSegment + fraction);
    obstacle.x = x;
    obstacle.element.style.left = `${x}px`;

    if (obstacle.hint) {
      obstacle.hint.style.left = `${x}px`;
    }

    const indicatorForm = caveIndicators[obstacle.id];
    if (!indicatorForm) continue;

    const indicator = document.createElement("img");
    indicator.className = `form-indicator-bush form-indicator-bush--${indicatorForm}`;
    indicator.dataset.caveIndicator = "true";
    indicator.src = indicatorBushes[indicatorForm];
    indicator.alt = indicatorForm === "bear"
      ? "Красный куст: дальше нужен медведь"
      : "Синий куст: дальше нужен человек";
    indicator.style.position = "absolute";
    indicator.style.left = `${x - indicatorOffset}px`;
    indicator.style.bottom = "calc(var(--run-line-bottom) - 12px)";
    indicator.style.height = "auto";
    indicator.style.transform = "translateX(-50%)";
    indicator.style.pointerEvents = "none";
    indicator.style.zIndex = "6";
    world.appendChild(indicator);
  }
})();
