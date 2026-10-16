/* Красные и синие кусты теперь используются как самостоятельные препятствия.
   Синие проходит только человек, красные — только медведь.
   Пень по-прежнему нужно перепрыгнуть, но теперь только в облике человека. */
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
    }
  };

  /* Ставим по два куста каждого цвета: до пещеры и после неё.
     В самой пещере и на финальном экране кустов нет. */
  const bushPlan = [
    { type: bushTypes.human, segment: 0, fraction: 0.48 },
    { type: bushTypes.bear, segment: 1, fraction: 0.50 },
    { type: bushTypes.human, segment: 7, fraction: 0.50 },
    { type: bushTypes.bear, segment: 8, fraction: 0.50 }
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

  /* У пня сохраняем механику прыжка, но медведь больше не может его пройти. */
  const originalUpdateObstacleCollisions = updateObstacleCollisions;

  updateObstacleCollisions = function (previousCenter, center, now, speed, landedJump = null) {
    for (const obstacle of obstacles) {
      if (obstacle.id !== "stump" || obstacle.crossed) continue;

      const halfGap = obstacle.element.offsetWidth * (obstacle.gapFactor ?? 0.4);
      const gapStart = obstacle.x - halfGap;

      if (previousCenter < gapStart && center >= gapStart && hero.dataset.form !== "human") {
        failRun();
        return true;
      }
    }

    return originalUpdateObstacleCollisions(previousCenter, center, now, speed, landedJump);
  };
})();