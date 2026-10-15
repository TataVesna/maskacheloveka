/* Расстановка обычных препятствий вокруг пещеры.
   Три экрана пещеры остаются свободными от обычных препятствий.
   Пни встречаются чаще, чтобы игрок чаще использовал прыжок. */
(() => {
  const caveObstacleIds = new Set([
    "cave-low-passage",
    "cave-wall",
    "cave-high-passage"
  ]);

  const regularObstacles = obstacles
    .filter((obstacle) => !caveObstacleIds.has(obstacle.id))
    .sort((a, b) => a.x - b.x);

  /* Добавляем ещё два пня поверх двух исходных: всего по маршруту будет 4 пня. */
  const stumpTemplate = regularObstacles.find((obstacle) => obstacle.id === "stump");
  if (stumpTemplate) {
    for (let i = 0; i < 2; i++) {
      const element = stumpTemplate.element.cloneNode(true);
      element.dataset.obstacle = "stump";
      world.appendChild(element);

      const stump = {
        ...stumpTemplate,
        element,
        hint: null,
        crossed: false,
        inside: false,
        attemptJump: null,
        breaking: false,
        breakTimer: null,
        gapFactor: 0.28
      };

      obstacles.push(stump);
      regularObstacles.push(stump);
    }
  }

  /* Все пни должны уверенно перепрыгиваться в обоих обликах. */
  regularObstacles
    .filter((obstacle) => obstacle.id === "stump")
    .forEach((obstacle) => {
      obstacle.gapFactor = 0.28;
    });

  /* segment считается после берлоги:
     0..2 — тайга,
     3..5 — пещера,
     6 — река,
     7..8 — городище,
     9 — финальная локация.
     В пещеру обычные препятствия не ставим. */
  const slots = [
    { segment: 0, fraction: 0.28 },
    { segment: 0, fraction: 0.68 },
    { segment: 1, fraction: 0.30 },
    { segment: 1, fraction: 0.70 },
    { segment: 2, fraction: 0.30 },
    { segment: 2, fraction: 0.70 },
    { segment: 6, fraction: 0.28 },
    { segment: 6, fraction: 0.70 },
    { segment: 7, fraction: 0.30 },
    { segment: 7, fraction: 0.70 },
    { segment: 8, fraction: 0.34 },
    { segment: 8, fraction: 0.72 }
  ];

  regularObstacles.forEach((obstacle, index) => {
    const slot = slots[index % slots.length];
    const x = locationWidth * (1 + slot.segment + slot.fraction);

    obstacle.x = x;
    obstacle._logicalX = x / locationWidth;
    obstacle.element.style.left = `${x}px`;
    if (obstacle.hint) obstacle.hint.style.left = `${x}px`;
  });
})();