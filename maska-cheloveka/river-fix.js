(() => {
  // Река — восьмая панорама маршрута: index 7 (после берлоги, тайги и кургана).
  const fixedRiverObstacles = [
    { id: "river", fraction: 0.30 },
    { id: "bridge", fraction: 0.72 }
  ];

  fixedRiverObstacles.forEach(({ id, fraction }) => {
    const matches = obstacles.filter((obstacle) => obstacle.id === id);
    const [primary, ...duplicates] = matches;
    if (!primary) return;

    const x = locationWidth * (7 + fraction);
    primary.x = x;
    primary.crossed = false;
    primary.inside = false;
    primary.attemptJump = null;

    primary.element.style.left = `${x}px`;
    primary.element.style.display = "block";
    primary.element.style.visibility = "visible";
    primary.element.style.opacity = "1";
    primary.element.style.zIndex = "7";

    if (primary.hint) {
      primary.hint.style.left = `${x}px`;
    }

    // Оставляем по одному экземпляру реки и моста, чтобы они не дублировались в случайных сценах.
    duplicates.forEach((duplicate) => {
      duplicate.crossed = true;
      duplicate.element?.remove();
      duplicate.hint?.remove();
    });
  });
})();
