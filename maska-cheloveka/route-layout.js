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
     После ведьмы маршрут намеренно становится чуть свободнее: на телефоне
     игроку нужен запас времени между свайпом и тапом для смены облика. */
  const desiredIds = [
    "ravine",
    "crowd", "bridge", "stump",
    "river", "crowd", "ravine",

    /* После ведьмы */
    "bridge", "crowd", "stump",
    "river", "crowd", "ravine",
    "bridge", "crowd", "stump"
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

     После чекпоинта у ведьмы первое препятствие — безопасный для стартовой
     формы мост, а первые активные действия находятся заметно дальше. */
  const slots = [
    { segment: 0, fraction: 0.08 }, // ravine — ближе к началу маршрута

    { segment: 1, fraction: 0.08 }, // crowd
    { segment: 1, fraction: 0.56 }, // bridge
    { segment: 1, fraction: 0.84 }, // stump

    { segment: 2, fraction: 0.12 }, // river
    { segment: 2, fraction: 0.62 }, // crowd
    { segment: 2, fraction: 0.86 }, // ravine

    /* После ведьмы: запас для реакции после респауна. */
    { segment: 6, fraction: 0.42 }, // bridge — человек, без срочного действия
    { segment: 6, fraction: 0.68 }, // crowd — человек
    { segment: 6, fraction: 0.90 }, // stump — первый прыжок после чекпоинта

    { segment: 7, fraction: 0.32 }, // river — успеть смениться на медведя
    { segment: 7, fraction: 0.68 }, // crowd — вернуться в человека

    { segment: 8, fraction: 0.20 }, // ravine — большой запас перед прыжком медведя
    { segment: 8, fraction: 0.56 }, // bridge — человек
    { segment: 8, fraction: 0.76 }, // crowd — человек
    { segment: 8, fraction: 0.94 }  // stump — финальный прыжок человеком
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