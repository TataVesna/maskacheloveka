/* Пещерные препятствия находятся только на центральном экране пещеры (mound-center).
   Каменная стена и высокий проход образуют одну композицию и всегда стоят вместе. */
(() => {
  const sharedWallFraction = 0.68;

  const caveFractions = {
    "cave-low-passage": 0.28,
    "cave-wall": sharedWallFraction,
    "cave-high-passage": sharedWallFraction
  };

  const caveCenterSegment = 4;

  const updatedAssets = {
    "cave-low-passage": "assets/obstacles/ПЗ_Низкий проход (1).png",
    "cave-wall": "assets/obstacles/ПЗ_Стена (1).png"
  };

  for (const obstacle of obstacles) {
    const fraction = caveFractions[obstacle.id];
    if (fraction == null) continue;

    const updatedSrc = updatedAssets[obstacle.id];
    if (updatedSrc) {
      obstacle.src = updatedSrc;
      obstacle.element.src = updatedSrc;
    }

    const x = locationWidth * (1 + caveCenterSegment + fraction);
    obstacle.x = x;
    obstacle.element.style.left = `${x}px`;

    if (obstacle.hint) {
      obstacle.hint.style.left = `${x}px`;
    }

    /* Высокий проход служит общей верхней частью композиции,
       разрушаемая стена находится непосредственно под ним. */
    if (obstacle.id === "cave-high-passage") {
      obstacle.element.style.zIndex = "4";
    }

    if (obstacle.id === "cave-wall") {
      obstacle.element.style.zIndex = "5";
    }
  }
})();
