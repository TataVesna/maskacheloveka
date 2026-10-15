/* Единый адаптивный масштаб сцены.
   Базовый макет рассчитан на высоту 1080 px и панорамы 3000×1080.
   Фон, герой, препятствия, кусты и ведьма масштабируются от одной высоты. */
(() => {
  const DESIGN_HEIGHT = 1080;
  const LOCATION_ASPECT = 3000 / 1080;
  const HERO_BASE_WIDTH = { human: 114, bear: 162 };
  const WITCH_BASE_WIDTH = 138;
  const OBSTACLE_VERTICAL_OFFSET = 35;
  const BUSH_VERTICAL_OFFSET = 35;
  const CROWD_VERTICAL_LIFT = 5;
  const WITCH_VERTICAL_LIFT = 5;

  let previousLocationWidth = innerHeight * LOCATION_ASPECT;

  function scale() {
    return innerHeight / DESIGN_HEIGHT;
  }

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  /* У толпы людей больше нет цветового куста-подсказки. */
  function removeCrowdIndicators() {
    const indicators = [...world.querySelectorAll('.form-indicator-bush--human')];
    const offset = Math.min(innerWidth * 0.22, currentLocationWidth() * 0.1);

    obstacles
      .filter((obstacle) => obstacle.id === 'crowd')
      .forEach((crowd) => {
        const expectedX = crowd.x - offset;
        let closest = null;
        let closestDistance = Infinity;

        indicators.forEach((indicator) => {
          if (!indicator.isConnected) return;
          const x = parseFloat(indicator.style.left || '0');
          const distance = Math.abs(x - expectedX);
          if (distance < closestDistance) {
            closest = indicator;
            closestDistance = distance;
          }
        });

        if (closest && closestDistance < 6) closest.remove();
      });
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
      const lift = obstacle.id === 'crowd' ? CROWD_VERTICAL_LIFT : 0;
      const loweredBottom = (baseBottom - OBSTACLE_VERTICAL_OFFSET + lift) * sceneScale;
      obstacle.element.style.setProperty('bottom', `${loweredBottom}px`, 'important');
    });

    /* Цветные кусты опущены на те же 35 px, что и препятствия. */
    world.querySelectorAll('.form-indicator-bush').forEach((indicator) => {
      const logicalX = Number(indicator.dataset.logicalX);
      if (Number.isFinite(logicalX)) indicator.style.left = `${logicalX * newLocationWidth}px`;
      setScaledImageWidth(indicator);
      const loweredBushBottom = (30 - BUSH_VERTICAL_OFFSET) * sceneScale;
      indicator.style.setProperty('bottom', `${loweredBushBottom}px`, 'important');
    });

    /* Ведьма стоит на линии бега и дополнительно поднята на 5 px. */
    const witch = document.getElementById('witch-midpoint');
    if (witch) {
      const logicalX = Number(witch.dataset.logicalX);
      if (Number.isFinite(logicalX)) witch.style.left = `${logicalX * newLocationWidth}px`;
      witch.style.setProperty('width', `${WITCH_BASE_WIDTH * sceneScale}px`, 'important');
      witch.style.setProperty(
        'bottom',
        `calc(var(--run-line-bottom) - ${(12 - WITCH_VERTICAL_LIFT) * sceneScale}px)`,
        'important'
      );
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

  removeCrowdIndicators();
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
