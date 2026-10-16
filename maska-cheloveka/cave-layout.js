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

  /* Новая графика препятствий. Добавляем версию в URL, чтобы GitHub Pages
     и браузер не отдавали ранее закэшированные PNG с теми же препятствиями. */
  const updatedAssets = {
    "cave-low-passage": "assets/obstacles/%D0%9F%D0%97_%D0%9D%D0%B8%D0%B7%D0%BA%D0%B8%D0%B9%20%D0%BF%D1%80%D0%BE%D1%85%D0%BE%D0%B4%20(1).png?v=20261016-2",
    "cave-wall": "assets/obstacles/%D0%9F%D0%97_%D0%A1%D1%82%D0%B5%D0%BD%D0%B0%20(1).png?v=20261016-2"
  };

  for (const obstacle of obstacles) {
    const fraction = caveFractions[obstacle.id];
    if (fraction == null) continue;

    const updatedSrc = updatedAssets[obstacle.id];
    if (updatedSrc) {
      obstacle.src = updatedSrc;
      obstacle.element.removeAttribute("srcset");
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
