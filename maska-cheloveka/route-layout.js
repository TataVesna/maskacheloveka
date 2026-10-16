/* Плотность обычных препятствий постепенно растёт по маршруту.
   Пещерные препятствия остаются отдельной системой; здесь размещаем
   обычные препятствия до и после пещеры и чередуем их между собой. */
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

  /* Сначала используем уже созданные экземпляры, затем при необходимости
     добавляем клоны. Последовательность специально меняет тип препятствия
     почти на каждом шаге, чтобы не было длинных повторов. */
  const desiredIds = [
    "stump",
    "crowd", "ravine",
    "bridge", "river", "stump",
    "crowd", "ravine", "bridge",
    "river", "stump", "crowd", "ravine",
    "bridge", "river", "stump", "crowd", "ravine"
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

  /* Удаляем лишние исходные экземпляры, которые не вошли в новую схему. */
  for (const leftovers of availableById.values()) {
    leftovers.forEach((obstacle) => {
      obstacle.element.remove();
      obstacle.hint?.remove();
    });
  }

  /* Пень должен уверенно перепрыгиваться человеком. */
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

     Чем дальше игрок проходит, тем меньше расстояние между препятствиями.
     Первое препятствие перенесено заметно ближе к началу тайги. */
  const slots = [
    { segment: 0, fraction: 0.14 },

    { segment: 1, fraction: 0.24 },
    { segment: 1, fraction: 0.72 },

    { segment: 2, fraction: 0.18 },
    { segment: 2, fraction: 0.50 },
    { segment: 2, fraction: 0.82 },

    { segment: 6, fraction: 0.18 },
    { segment: 6, fraction: 0.50 },
    { segment: 6, fraction: 0.82 },

    { segment: 7, fraction: 0.14 },
    { segment: 7, fraction: 0.38 },
    { segment: 7, fraction: 0.62 },
    { segment: 7, fraction: 0.86 },

    { segment: 8, fraction: 0.10 },
    { segment: 8, fraction: 0.28 },
    { segment: 8, fraction: 0.46 },
    { segment: 8, fraction: 0.64 },
    { segment: 8, fraction: 0.82 }
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