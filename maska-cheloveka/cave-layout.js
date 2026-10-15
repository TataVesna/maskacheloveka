/* Пещерные препятствия находятся только на центральном экране пещеры (mound-center). */
(() => {
  const caveFractions = {
    "cave-low-passage": 0.24,
    "cave-wall": 0.5,
    "cave-high-passage": 0.76
  };

  const caveCenterSegment = 4;

  for (const obstacle of obstacles) {
    const fraction = caveFractions[obstacle.id];
    if (fraction == null) continue;

    const x = locationWidth * (1 + caveCenterSegment + fraction);
    obstacle.x = x;
    obstacle.element.style.left = `${x}px`;

    if (obstacle.hint) {
      obstacle.hint.style.left = `${x}px`;
    }
  }
})();
