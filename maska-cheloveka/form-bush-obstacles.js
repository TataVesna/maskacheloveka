/* Красные и синие кусты — самостоятельные препятствия.
   Синие проходит только человек, красные — только медведь.
   В пещере кусты становятся прыжковыми препятствиями.
   Пень нужно перепрыгивать только человеком. */
(() => {
  const bushTypes = {
    human: {
      id: "blue-bush",
      src: "assets/obstacles/human-indicator-bush.png",
      className: "obstacle--blue-bush",
      alt: "Синий куст: пройти может только человек",
      rule: "Синий куст проходит только человек.",
      mode: "ground",
      form: "human",
      indicatorForm: null,
      zIndex: "5"
    },
    bear: {
      id: "red-bush",
      src: "assets/obstacles/bear-indicator-bush.png",
      className: "obstacle--red-bush",
      alt: "Красный куст: пройти может только медведь",
      rule: "Красный куст проходит только медведь.",
      mode: "ground",
      form: "bear",
      indicatorForm: null,
      zIndex: "5"
    },
    humanJump: {
      id: "cave-blue-bush",
      src: "assets/obstacles/human-indicator-bush.png",
      className: "obstacle--blue-bush obstacle--cave-bush",
      alt: "Синий куст в пещере: перепрыгнуть человеком",
      rule: "Этот куст нужно перепрыгнуть человеком.",
      mode: "any-jump",
      form: "human",
      indicatorForm: null,
      gapFactor: 0.24,
      zIndex: "5"
    },
    bearJump: {
      id: "cave-red-bush",
      src: "assets/obstacles/bear-indicator-bush.png",
      className: "obstacle--red-bush obstacle--cave-bush",
      alt: "Красный куст в пещере: перепрыгнуть медведем",
      rule: "Этот куст нужно перепрыгнуть медведем.",
      mode: "any-jump",
      form: "bear",
      indicatorForm: null,
      gapFactor: 0.24,
      zIndex: "5"
    }
  };

  /* Кусты ставятся между обычными препятствиями. Их становится больше ближе
     к финалу, поэтому визуально и механически плотность маршрута растёт. */
  const bushPlan = [
    { type: bushTypes.human, segment: 0, fraction: 0.55 },

    { type: bushTypes.bear, segment: 1, fraction: 0.46 },

    { type: bushTypes.human, segment: 2, fraction: 0.34 },
    { type: bushTypes.bear, segment: 2, fraction: 0.68 },

    /* В пещере кусты требуют прыжка соответствующим обликом. */
    { type: bushTypes.humanJump, segment: 3, fraction: 0.35 },
    { type: bushTypes.bearJump, segment: 5, fraction: 0.32 },

    { type: bushTypes.human, segment: 6, fraction: 0.34 },
    { type: bushTypes.bear, segment: 6, fraction: 0.66 },

    { type: bushTypes.human, segment: 7, fraction: 0.26 },
    { type: bushTypes.bear, segment: 7, fraction: 0.50 },
    { type: bushTypes.human, segment: 7, fraction: 0.74 },

    { type: bushTypes.bear, segment: 8, fraction: 0.19 },
    { type: bushTypes.human, segment: 8, fraction: 0.37 },
    { type: bushTypes.bear, segment: 8, fraction: 0.55 },
    { type: bushTypes.human, segment: 8, fraction: 0.73 }
  ];

  bushPlan.forEach((item) => {
    const x = locationWidth * (1 + item.segment + item.fraction);
    const img = document.createElement("img");
    img.className = `obstacle ${item.type.className}`;
    img.src = item.type.src;
    img.alt = item.type.alt;
    img.dataset.obstacle = item.type.id;
    img.style.left = `${x}px`;
    applyObstacleStyle(img, item.type);
    world.appendChild(img);

    obstacles.push({
      ...item.type,
      x,
      _logicalX: x / locationWidth,
      element: img,
      hint: null,
      crossed: false,
      inside: false,
      attemptJump: null,
      breaking: false,
      breakTimer: null
    });
  });

  /* Для прыжковых препятствий дополнительно проверяем нужный облик.
     Базовая логика game.js после этого проверит сам факт и длину прыжка. */
  const originalUpdateObstacleCollisions = updateObstacleCollisions;

  updateObstacleCollisions = function (previousCenter, center, now, speed, landedJump = null) {
    for (const obstacle of obstacles) {
      if (obstacle.crossed) continue;

      const isStump = obstacle.id === "stump";
      const isCaveBush = obstacle.id === "cave-blue-bush" || obstacle.id === "cave-red-bush";
      if (!isStump && !isCaveBush) continue;

      const halfGap = obstacle.element.offsetWidth * (obstacle.gapFactor ?? 0.4);
      const gapStart = obstacle.x - halfGap;
      if (!(previousCenter < gapStart && center >= gapStart)) continue;

      const requiredForm = isStump ? "human" : obstacle.form;
      if (hero.dataset.form !== requiredForm) {
        failRun();
        return true;
      }
    }

    return originalUpdateObstacleCollisions(previousCenter, center, now, speed, landedJump);
  };
})();