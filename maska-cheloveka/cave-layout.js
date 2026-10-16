/* Пещерные препятствия находятся только на центральном экране пещеры (mound-center).
   Каменная стена и высокий проход образуют одну композицию и всегда стоят вместе. */
(() => {
  /* ===== ИСПРАВЛЕНИЕ КУРГАНА =====
     Частичные PNG с цифрой 2 визуально не совпадали с верхними слоями при сборке в браузере.
     Поэтому для базового изображения снова используем цельные панорамы mound-*.png,
     а новые ПЗ_Курган_*.png оставляем только верхними foreground-слоями над препятствиями.
     Так сохраняются и нормальная геометрия кургана, и перекрытие верхушек колонн. */
  const moundSections = [...world.querySelectorAll(".location-scene--mound")];
  const moundBaseAssets = [
    "assets/locations/mound-start.png",
    "assets/locations/mound-center.png",
    "assets/locations/mound-end.png"
  ];

  moundSections.forEach((section, index) => {
    const src = moundBaseAssets[index];
    if (!src) return;

    section.replaceChildren();

    const base = document.createElement("img");
    base.className = "mound-base-panorama";
    base.src = src;
    base.alt = "";
    section.appendChild(base);
  });

  const sharedWallFraction = 0.68;

  const caveFractions = {
    "cave-low-passage": 0.28,
    "cave-wall": sharedWallFraction,
    "cave-high-passage": sharedWallFraction
  };

  const caveCenterSegment = 4;

  /* Актуальная графика препятствий. Версия в URL нужна, чтобы браузер
     не подхватывал старый PNG из кэша. */
  const updatedAssets = {
    "cave-low-passage": "assets/obstacles/%D0%9F%D0%97_%D0%9D%D0%B8%D0%B7%D0%BA%D0%B8%D0%B9%20%D0%BF%D1%80%D0%BE%D1%85%D0%BE%D0%B4%20(2).png?v=20261016-3",
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
