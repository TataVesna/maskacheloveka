/* Расстановка обычных препятствий по маршруту.
   Прыжковые препятствия специально разведены дальше друг от друга,
   чтобы после приземления игрок успевал сменить облик и начать новый прыжок. */
(() => {
  const caveObstacleIds = new Set([
    "cave-low-passage",
    "cave-wall",
    "cave-high-passage"
  ]);

  const caveObstacles = obstacles.filter((obstacle) => caveObstacleIds.has(obstacle.id));
  const originalRegular = obstacles.filter((obstacle) => !caveObstacleIds.has(obstacle.id));

  const templates = new Map();
  originalRegular.forEach((obstacle) => {
    if (!templates.has(obstacle.id)) templates.set(obstacle.id, obstacle);
  });

  function cloneObstacle(template) {
    const element = template.element.cloneNode(true);
    element.dataset.obstacle = template.id;
    world.appendChild(element);

    return {
      ...template,
      element,
      hint: null,
      crossed: false,
      inside: false,
      attemptJump: null,
      breaking: false,
      breakTimer: null
    };
  }

  /* Первым препятствием остаётся овраг для медведя.
     Между оврагами/пнями оставляем наземные препятствия, чтобы маршрут был
     плотным, но не требовал двух прыжков почти подряд. */
  const desiredIds = [
    "ravine",
    "crowd", "bridge", "stump",
    "river", "crowd", "ravine",
    "bridge", "crowd", "stump",
    "river", "crowd", "ravine",
    "bridge", "crowd", "stump", "river"
  ];

  const availableById = new Map();
  originalRegular.forEach((obstacle) => {
    if (!availableById.has(obstacle.id)) availableById.set(obstacle.id, []);
    availableById.get(obstacle.id).push(obstacle);
  });

  const regularObstacles = desiredIds.map((id) => {
    const available = availableById.get(id) || [];
    const existing = available.shift();
    if (existing) return existing;

    const template = templates.get(id);
    return template ? cloneObstacle(template) : null;
  }).filter(Boolean);

  for (const leftovers of availableById.values()) {
    leftovers.forEach((obstacle) => {
      obstacle.element.remove();
      obstacle.hint?.remove();
    });
  }

  /* Пень перепрыгивается только человеком; оставляем компактную коллизию. */
  regularObstacles
    .filter((obstacle) => obstacle.id === "stump")
    .forEach((obstacle) => {
      obstacle.gapFactor = 0.28;
    });

  /* segment считается после берлоги:
     0..2 — тайга,
     3..5 — пещера,
     6 — река,
     7..8 — городище.

     Наземные препятствия могут стоять плотнее. Овраги и пни размещены так,
     чтобы между ними оставался запас под окончание прыжка и новую команду. */
  const slots = [
    { segment: 0, fraction: 0.14 }, // ravine

    { segment: 1, fraction: 0.08 }, // crowd
    { segment: 1, fraction: 0.56 }, // bridge
    { segment: 1, fraction: 0.84 }, // stump

    { segment: 2, fraction: 0.12 }, // river
    { segment: 2, fraction: 0.62 }, // crowd
    { segment: 2, fraction: 0.86 }, // ravine

    { segment: 6, fraction: 0.36 }, // bridge
    { segment: 6, fraction: 0.58 }, // crowd
    { segment: 6, fraction: 0.84 }, // stump

    { segment: 7, fraction: 0.10 }, // river
    { segment: 7, fraction: 0.58 }, // crowd
    { segment: 7, fraction: 0.82 }, // ravine

    { segment: 8, fraction: 0.46 }, // bridge
    { segment: 8, fraction: 0.62 }, // crowd
    { segment: 8, fraction: 0.82 }, // stump
    { segment: 8, fraction: 0.96 }  // river
  ];

  regularObstacles.forEach((obstacle, index) => {
    const slot = slots[index];
    const x = locationWidth * (1 + slot.segment + slot.fraction);

    obstacle.x = x;
    obstacle._logicalX = x / locationWidth;
    obstacle.element.style.left = `${x}px`;
    if (obstacle.hint) obstacle.hint.style.left = `${x}px`;
  });

  obstacles = [...regularObstacles, ...caveObstacles];
})();