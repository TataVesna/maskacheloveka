/* Во время брода медведь может прыгать; человек всегда проигрывает.
   Для препятствий с требуемым обликом прыжок сам по себе больше не считается ошибкой. */
updateObstacleCollisions = function (previousCenter, center, now, speed, landedJump = null) {
  const airborneJump = jump && now >= jump.takeoffAt ? jump : null;

  for (const obstacle of obstacles) {
    if (obstacle.crossed) continue;

    if (obstacle.mode === "all-pass") {
      if (previousCenter < obstacle.x && center >= obstacle.x) obstacle.crossed = true;
      continue;
    }

    if (obstacle.mode === "cave-wall") {
      if (previousCenter < obstacle.x && center >= obstacle.x) {
        if (hero.dataset.form !== "bear") {
          failRun();
          return true;
        }
        breakCaveWall(obstacle);
      }
      continue;
    }

    if (obstacle.id === "river") {
      const halfRiver = obstacle.element.offsetWidth * 0.4;
      const start = obstacle.x - halfRiver;
      const end = obstacle.x + halfRiver;

      if (!wading && previousCenter < start && center >= start) {
        if (hero.dataset.form !== "bear") {
          failRun();
          return true;
        }
        wading = { obstacle, start, end };
        hero.classList.add("wading");
      }

      if (wading?.obstacle === obstacle) {
        if (hero.dataset.form !== "bear") {
          failRun();
          return true;
        }

        const progress = Math.max(0, Math.min(1, (center - wading.start) / (wading.end - wading.start)));

        /* На земле медведь погружается в воду, в прыжке сохраняется обычная дуга. */
        if (!airborneJump) {
          const depth = innerHeight * 0.065 * Math.sin(Math.PI * progress);
          hero.style.transform = `translateY(${depth}px)`;
        }

        if (center >= wading.end) {
          obstacle.crossed = true;
          wading = null;
          hero.classList.remove("wading");
          if (!airborneJump) hero.style.transform = "";
        }
      }
      continue;
    }

    if (["ravine", "bear-jump", "any-jump"].includes(obstacle.mode)) {
      const halfGap = obstacle.element.offsetWidth * (obstacle.gapFactor ?? 0.4);
      const gapStart = obstacle.x - halfGap;
      const gapEnd = obstacle.x + halfGap;

      if (!obstacle.inside && previousCenter < gapStart && center >= gapStart) {
        obstacle.inside = true;
        const enteringJump = airborneJump || (landedJump && jumpDistanceAtBoundary(landedJump, now, speed, center, gapStart) > 0 ? landedJump : null);
        if (!enteringJump) {
          failRun();
          return true;
        }
        obstacle.attemptJump = enteringJump;
      }

      if (obstacle.inside && landedJump === obstacle.attemptJump) {
        const jumpMatches = obstacle.mode === "any-jump"
          ? obstacle.attemptJump && hero.dataset.form === obstacle.attemptJump.form
          : obstacle.attemptJump?.form === "bear" && hero.dataset.form === "bear";

        const cleared = center >= gapEnd && jumpMatches;
        if (!cleared) {
          failRun();
          return true;
        }
        obstacle.inside = false;
        obstacle.crossed = true;
        obstacle.attemptJump = null;
      }
      continue;
    }

    if (previousCenter < obstacle.x && center >= obstacle.x) {
      obstacle.crossed = true;
      const requiredForm = obstacle.form;
      if (hero.dataset.form !== requiredForm) {
        failRun();
        return true;
      }
    }
  }

  return false;
};
