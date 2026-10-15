/* Единый адаптивный масштаб сцены.
   Базовый макет рассчитан на высоту 1080 px и панорамы 3000×1080.
   Фон, герой, препятствия, кусты и ведьма масштабируются от одной высоты. */
(() => {
  const DESIGN_HEIGHT = 1080;
  const LOCATION_ASPECT = 3000 / 1080;
  const HERO_BASE_WIDTH = { human: 114, bear: 162 };
  const WITCH_BASE_WIDTH = 138;
  const OBSTACLE_VERTICAL_OFFSET = 35;

  let previousLocationWidth = innerHeight * LOCATION_ASPECT;

  function scale() {
    return innerHeight / DESIGN_HEIGHT;
  }

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  function rememberLogicalPositions() {
    const baseLocationWidth = currentLocationWidth();

    obstacles.forEach((obstacle) => {
      if (obstacle._logicalX == null) obstacle._logicalX = obstacle.x / baseLocationWidth;
    });

    world.querySelectorAll('.form-indicator-bush').forEach((indicator) => {
      if (!indicator.dataset.logicalX) {
        const left = parseFloat(indicator.style.left || '0');
        indicator.dataset.logicalX = String(left / baseLocationWidth);
      }
    });

    const witch = document.getElementById('witch-midpoint');
    if (witch && !witch.dataset.logicalX) {
      const left = parseFloat(witch.style.left || '0');
      witch.dataset.logicalX = String(left / baseLocationWidth);
    }
  }

  function setScaledImageWidth(img, multiplier = 1) {
    const apply = () => {
      if (!img.naturalWidth) return;
      if (!img.dataset.baseNaturalWidth) img.dataset.baseNaturalWidth = String(img.naturalWidth);
      const baseWidth = Number(img.dataset.baseNaturalWidth);
      img.style.setProperty('width', `${baseWidth * scale() * multiplier}px`, 'important');
      img.style.height = 'auto';
    };

    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  function applyScale({ preserveScroll = true } = {}) {
    const sceneScale = scale();
    const newLocationWidth = currentLocationWidth();

    document.documentElement.style.setProperty('--scene-scale', String(sceneScale));

    /* Герой: те же размеры относительно фона на любой высоте экрана. */
    const form = hero.dataset.form === 'bear' ? 'bear' : 'human';
    hero.style.width = `${HERO_BASE_WIDTH[form] * sceneScale}px`;
    hero.style.bottom = `calc(var(--run-line-bottom) - ${12 * sceneScale}px)`;

    /* Препятствия: фактическая ширина меняется, поэтому offsetWidth и коллизии
       остаются синхронны с визуальным размером. */
    obstacles.forEach((obstacle) => {
      if (obstacle._logicalX != null) {
        obstacle.x = obstacle._logicalX * newLocationWidth;
        obstacle.element.style.left = `${obstacle.x}px`;
        if (obstacle.hint) obstacle.hint.style.left = `${obstacle.x}px`;
      }

      setScaledImageWidth(obstacle.element);

      const baseBottom = obstacle.id === 'crowd' ? 40 : 30;
      const loweredBottom = (baseBottom - OBSTACLE_VERTICAL_OFFSET) * sceneScale;
      obstacle.element.style.setProperty('bottom', `${loweredBottom}px`, 'important');
    });

    /* Цветные кусты получают тот же коэффициент и сохраняют позицию
       относительно конкретного экрана маршрута. */
    world.querySelectorAll('.form-indicator-bush').forEach((indicator) => {
      const logicalX = Number(indicator.dataset.logicalX);
      if (Number.isFinite(logicalX)) indicator.style.left = `${logicalX * newLocationWidth}px`;
      setScaledImageWidth(indicator);
      indicator.style.setProperty('bottom', `${30 * sceneScale}px`, 'important');
    });

    /* Ведьма использует дизайнерскую ширину 138 px при высоте сцены 1080. */
    const witch = document.getElementById('witch-midpoint');
    if (witch) {
      const logicalX = Number(witch.dataset.logicalX);
      if (Number.isFinite(logicalX)) witch.style.left = `${logicalX * newLocationWidth}px`;
      witch.style.setProperty('width', `${WITCH_BASE_WIDTH * sceneScale}px`, 'important');
      witch.style.setProperty('bottom', `${30 * sceneScale}px`, 'important');
    }

    /* При изменении размеров iframe/окна сохраняем ту же точку маршрута. */
    if (preserveScroll && previousLocationWidth > 0 && previousLocationWidth !== newLocationWidth) {
      const routePosition = worldX / previousLocationWidth;
      worldX = routePosition * newLocationWidth;
      const maxScroll = Math.max(0, world.scrollWidth - game.clientWidth);
      worldX = Math.max(0, Math.min(worldX, maxScroll));
      world.style.transform = `translate3d(${-worldX}px, 0, 0)`;
    }

    previousLocationWidth = newLocationWidth;
  }

  rememberLogicalPositions();
  applyScale({ preserveScroll: false });

  /* Форма героя меняется во время игры, поэтому ширину обновляем автоматически. */
  const heroObserver = new MutationObserver(() => applyScale({ preserveScroll: false }));
  heroObserver.observe(hero, { attributes: true, attributeFilter: ['class', 'data-form'] });

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => applyScale({ preserveScroll: true }));
  });
})();
