/* Красные и синие кусты — прыжковые препятствия до ведьмы и в пещере.
   Синие нужно перепрыгивать человеком, красные — медведем.
   Пень также нужно перепрыгивать только человеком.

   После ведьмы цветные кусты не ставим: после мобильного респауна они
   требовали слишком быстрой связки смены облика и свайпа. */
(() => {
  const bushTypes = {
    human: {
      id: "blue-bush",
      src: "assets/obstacles/human-indicator-bush.png",
      className: "obstacle--blue-bush",
      alt: "Синий куст: перепрыгнуть человеком",
      rule: "Синий куст нужно перепрыгнуть человеком.",
      mode: "any-jump",
      form: "human",
      indicatorForm: null,
      gapFactor: 0.24,
      zIndex: "5"
    },
    bear: {
      id: "red-bush",
      src: "assets/obstacles/bear-indicator-bush.png",
      className: "obstacle--red-bush",
      alt: "Красный куст: перепрыгнуть медведем",
      rule: "Красный куст нужно перепрыгнуть медведем.",
      mode: "any-jump",
      form: "bear",
      indicatorForm: null,
      gapFactor: 0.24,
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

  /* До ведьмы кусты чередуются по цвету. В пещере остаются два специальных
     прыжковых куста. После ведьмы кусты убраны ради нормального управления
     свайпом/тапом на телефоне после чекпоинта. */
  const bushPlan = [
    { type: bushTypes.human, segment: 0, fraction: 0.60 },
    { type: bushTypes.bear, segment: 1, fraction: 0.32 },
    { type: bushTypes.human, segment: 2, fraction: 0.38 },

    { type: bushTypes.bearJump, segment: 3, fraction: 0.35 },
    { type: bushTypes.humanJump, segment: 5, fraction: 0.28 }
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

  /* Для всех кустов дополнительно проверяем правильный облик.
     Базовая логика game.js проверяет сам факт и длину прыжка. */
  const originalUpdateObstacleCollisions = updateObstacleCollisions;

  updateObstacleCollisions = function (previousCenter, center, now, speed, landedJump = null) {
    for (const obstacle of obstacles) {
      if (obstacle.crossed) continue;

      const isStump = obstacle.id === "stump";
      const isBush = [
        "blue-bush",
        "red-bush",
        "cave-blue-bush",
        "cave-red-bush"
      ].includes(obstacle.id);
      if (!isStump && !isBush) continue;

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