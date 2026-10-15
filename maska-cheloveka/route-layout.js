/* Расстановка обычных препятствий вокруг пещеры.
   Центральная пещера и экран с ведьмой остаются свободными от обычных препятствий.
   После пещеры продолжаются обычные препятствия маршрута. */
(() => {
  const caveObstacleIds = new Set([
    "cave-low-passage",
    "cave-wall",
    "cave-high-passage"
  ]);

  const regularObstacles = obstacles
    .filter((obstacle) => !caveObstacleIds.has(obstacle.id))
    .sort((a, b) => a.x - b.x);

  /* segment считается после берлоги:
     0..2 — тайга,
     3..5 — три экрана пещеры,
     6..9 — река, городище и финальная локация.
     Все три экрана пещеры резервируем: в центре только пещерные препятствия,
     на выходе справа стоит ведьма. */
  const slots = [
    { segment: 0, fraction: 0.34 },
    { segment: 0, fraction: 0.72 },
    { segment: 1, fraction: 0.48 },
    { segment: 2, fraction: 0.34 },
    { segment: 2, fraction: 0.72 },
    { segment: 6, fraction: 0.34 },
    { segment: 6, fraction: 0.72 },
    { segment: 7, fraction: 0.48 },
    { segment: 8, fraction: 0.50 },
    { segment: 9, fraction: 0.46 }
  ];

  const indicatorOffset = Math.min(innerWidth * 0.22, locationWidth * 0.1);
  const availableIndicators = [...world.querySelectorAll('.form-indicator-bush')]
    .filter((indicator) => indicator.dataset.caveIndicator !== 'true');

  /* Сначала связываем существующие кусты с их обычными препятствиями по старой позиции. */
  const indicatorByObstacle = new Map();
  for (const obstacle of regularObstacles) {
    if (!obstacle.indicatorForm) continue;

    const expectedX = obstacle.x - indicatorOffset;
    const className = `form-indicator-bush--${obstacle.indicatorForm}`;
    let closest = null;
    let closestDistance = Infinity;

    for (const indicator of availableIndicators) {
      if (!indicator.isConnected || !indicator.classList.contains(className)) continue;
      if ([...indicatorByObstacle.values()].includes(indicator)) continue;
      const x = parseFloat(indicator.style.left || '0');
      const distance = Math.abs(x - expectedX);
      if (distance < closestDistance) {
        closest = indicator;
        closestDistance = distance;
      }
    }

    if (closest) indicatorByObstacle.set(obstacle, closest);
  }

  regularObstacles.forEach((obstacle, index) => {
    const slot = slots[index % slots.length];
    const x = locationWidth * (1 + slot.segment + slot.fraction);

    obstacle.x = x;
    obstacle._logicalX = x / locationWidth;
    obstacle.element.style.left = `${x}px`;
    if (obstacle.hint) obstacle.hint.style.left = `${x}px`;

    const indicator = indicatorByObstacle.get(obstacle);
    if (!indicator) return;

    /* Перед толпой куст не нужен. */
    if (obstacle.id === 'crowd') {
      indicator.remove();
      return;
    }

    const indicatorX = x - indicatorOffset;
    indicator.style.left = `${indicatorX}px`;
    indicator.dataset.logicalX = String(indicatorX / locationWidth);
  });
})();
