/* Бесконечный режим: процедурные группы локаций с правилами препятствий по типу сцены. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  const METERS_PER_SCENE = 100;
  const INITIAL_SCENES = 14;
  const SCENES_AHEAD = 8;
  const SAFE_START_SCENES = 1;
  const MIN_OBSTACLE_GAP = 0.34;

  const singleScene = (src, group, part = "single") => ({ type: "single", src, group, part });
  const moundScene = (back, front, part) => ({ type: "mound", back, front, group: "mound", part });

  const moundStart = moundScene(
    "assets/locations/ПЗ_Курган_начало_2.png?v=20261016-4",
    "assets/locations/ПЗ_Курган_начало.png?v=20261016-4",
    "start"
  );
  const moundCenter = moundScene(
    "assets/locations/ПЗ_Курган_центр_2.png?v=20261016-4",
    "assets/locations/ПЗ_Курган_центр.png?v=20261016-4",
    "center"
  );
  const moundEnd = moundScene(
    "assets/locations/ПЗ_Курган_конец2.png?v=20261016-4",
    "assets/locations/ПЗ_Курган_конец.png?v=20261016-4",
    "end"
  );

  /* Группы всегда собираются целиком. Одна и та же группа два раза подряд не идёт. */
  const locationGroups = {
    forest: () => {
      const extraCenters = Math.floor(Math.random() * 3);
      return [
        singleScene("assets/locations/forest-start.png", "forest", "start"),
        singleScene("assets/locations/forest-center.png", "forest", "center"),
        ...Array.from(
          { length: extraCenters },
          () => singleScene("assets/locations/forest-center.png", "forest", "center")
        ),
        singleScene("assets/locations/forest-end.png", "forest", "end")
      ];
    },
    mound: () => {
      const extraCenters = Math.floor(Math.random() * 3);
      return [
        { ...moundStart },
        { ...moundCenter },
        ...Array.from({ length: extraCenters }, () => ({ ...moundCenter })),
        { ...moundEnd }
      ];
    },
    settlement: () => [
      singleScene("assets/locations/settlement-start.png", "settlement", "start"),
      singleScene("assets/locations/settlement-end.png", "settlement", "end")
    ],
    river: () => [singleScene("assets/locations/river.png", "river", "single")]
  };

  const normalScenes = [...world.querySelectorAll(".location-scene")];
  const normalMoundFronts = [...world.querySelectorAll(".mound-front-overlay")];
  const normalObstacles = obstacles.slice();
  const witch = document.getElementById("witch-midpoint");
  const witchBubble = document.getElementById("witch-bubble");

  const obstacleTemplates = new Map();
  normalObstacles.forEach((obstacle) => {
    if (!obstacleTemplates.has(obstacle.id)) obstacleTemplates.set(obstacle.id, obstacle);
  });

  /* Обычные препятствия разрешены в лесу, на реке, в городище и в кургане.
     Пещерные препятствия разрешены только на центральных сценах кургана. */
  const regularIds = [
    "crowd",
    "bridge",
    "river",
    "ravine",
    "stump",
    "blue-bush",
    "red-bush"
  ].filter((id) => obstacleTemplates.has(id));

  const caveIds = [
    "cave-low-passage",
    "cave-wall",
    "cave-high-passage"
  ].filter((id) => obstacleTemplates.has(id));

  const jumpIds = [
    "ravine",
    "stump",
    "blue-bush",
    "red-bush"
  ].filter((id) => obstacleTemplates.has(id));

  let endlessActive = false;
  let endlessScenes = [];
  let endlessObstacleNodes = [];
  let endlessOverlayNodes = [];
  let generatedSceneCount = 0;
  let sceneQueue = [];
  let lastGroupName = null;
  let lastObstacleX = -Infinity;
  let lastPlacedWasJump = false;

  const baseResetRun = resetRun;
  const baseFailRun = failRun;

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function refillSceneQueue() {
    const groupNames = Object.keys(locationGroups);
    const available = groupNames.filter((name) => name !== lastGroupName);
    const groupName = randomItem(available.length ? available : groupNames);
    lastGroupName = groupName;
    sceneQueue.push(...locationGroups[groupName]());
  }

  function nextSceneSpec() {
    if (!sceneQueue.length) refillSceneQueue();
    return sceneQueue.shift();
  }

  function appendScene() {
    const spec = nextSceneSpec();
    const sceneIndex = generatedSceneCount;
    const section = document.createElement("section");
    section.className = "location-scene endless-location-scene";
    section.dataset.endlessGroup = spec.group;
    section.dataset.endlessPart = spec.part;
    section.setAttribute("aria-hidden", "true");

    if (spec.type === "mound") {
      section.classList.add("location-scene--mound");

      const back = document.createElement("img");
      back.className = "mound-layer mound-layer--back";
      back.src = spec.back;
      back.alt = "";
      section.appendChild(back);
    } else {
      const img = document.createElement("img");
      img.src = spec.src;
      img.alt = "";
      section.appendChild(img);
    }

    world.appendChild(section);

    /* В кургане препятствия находятся между нижним и верхним слоями. */
    if (spec.type === "mound") {
      const front = document.createElement("img");
      front.className = "mound-front-overlay endless-mound-front-overlay";
      front.src = spec.front;
      front.alt = "";
      front.style.left = `${sceneIndex * currentLocationWidth()}px`;
      world.appendChild(front);
      endlessOverlayNodes.push(front);
    }

    endlessScenes.push(section);
    generatedSceneCount += 1;
    addObstaclesForScene(sceneIndex, spec);
  }

  function cloneObstacleFromTemplate(id, x) {
    const template = obstacleTemplates.get(id);
    if (!template) return null;

    const element = template.element.cloneNode(true);
    element.style.display = "";
    element.style.opacity = "1";
    element.style.visibility = "visible";
    element.style.left = `${x}px`;
    element.dataset.obstacle = id;
    world.appendChild(element);

    const obstacle = {
      ...template,
      element,
      hint: null,
      x,
      _logicalX: x / currentLocationWidth(),
      crossed: false,
      inside: false,
      attemptJump: null,
      breaking: false,
      breakTimer: null
    };

    obstacles.push(obstacle);
    endlessObstacleNodes.push(element);
    return obstacle;
  }

  function obstaclePoolForScene(spec) {
    /* На реке и в городище разрешены любые обычные препятствия, кроме пещерных.
       В лесу — те же обычные препятствия. */
    if (spec.group === "river" || spec.group === "settlement" || spec.group === "forest") {
      return regularIds;
    }

    if (spec.group === "mound") {
      if (spec.part === "center") {
        return [...regularIds, ...caveIds];
      }

      /* Перед входом в пещеру не ставим красный куст. */
      if (spec.part === "start") {
        return regularIds.filter((id) => id !== "red-bush");
      }

      return regularIds;
    }

    return regularIds;
  }

  function chooseObstacleId(spec, { excludeRiver = false } = {}) {
    let pool = obstaclePoolForScene(spec);

    if (lastPlacedWasJump) {
      pool = pool.filter((id) => !jumpIds.includes(id));
    }

    if (excludeRiver) {
      pool = pool.filter((id) => id !== "river");
    }

    return pool.length ? randomItem(pool) : null;
  }

  function placeObstacleAt(sceneIndex, spec, fraction, options = {}) {
    const location = currentLocationWidth();
    const id = chooseObstacleId(spec, options);
    if (!id) return false;

    const x = sceneIndex * location + fraction * location;
    if (x - lastObstacleX < location * MIN_OBSTACLE_GAP) return false;

    if (cloneObstacleFromTemplate(id, x)) {
      lastObstacleX = x;
      lastPlacedWasJump = jumpIds.includes(id);
      return true;
    }

    return false;
  }

  function addObstaclesForScene(sceneIndex, spec) {
    if (sceneIndex < SAFE_START_SCENES || !regularIds.length) return;

    /* Первый объект — примерно в первой трети сцены. */
    placeObstacleAt(sceneIndex, spec, 0.31 + Math.random() * 0.08);

    /* Второй объект встречается часто, но не всегда. Между препятствиями
       остаётся запас для тапа/свайпа на телефоне. */
    if (Math.random() < 0.60) {
      placeObstacleAt(sceneIndex, spec, 0.72 + Math.random() * 0.08, { excludeRiver: true });
    }
  }

  function clearEndlessContent() {
    endlessScenes.forEach((scene) => scene.remove());
    endlessObstacleNodes.forEach((node) => node.remove());
    endlessOverlayNodes.forEach((node) => node.remove());
    endlessScenes = [];
    endlessObstacleNodes = [];
    endlessOverlayNodes = [];
  }

  function hideNormalContent() {
    normalScenes.forEach((scene) => {
      scene.dataset.endlessPrevDisplay = scene.style.display || "";
      scene.style.display = "none";
    });

    normalMoundFronts.forEach((front) => {
      front.dataset.endlessPrevDisplay = front.style.display || "";
      front.style.display = "none";
    });

    normalObstacles.forEach((obstacle) => {
      if (obstacle.element) {
        obstacle.element.dataset.endlessPrevDisplay = obstacle.element.style.display || "";
        obstacle.element.style.display = "none";
      }
      if (obstacle.hint) {
        obstacle.hint.dataset.endlessPrevDisplay = obstacle.hint.style.display || "";
        obstacle.hint.style.display = "none";
      }
    });

    if (witch) witch.style.display = "none";
    if (witchBubble) witchBubble.style.display = "none";
  }

  function showNormalContent() {
    normalScenes.forEach((scene) => {
      scene.style.display = scene.dataset.endlessPrevDisplay || "";
      delete scene.dataset.endlessPrevDisplay;
    });

    normalMoundFronts.forEach((front) => {
      front.style.display = front.dataset.endlessPrevDisplay || "";
      delete front.dataset.endlessPrevDisplay;
    });

    normalObstacles.forEach((obstacle) => {
      if (obstacle.element) {
        obstacle.element.style.display = obstacle.element.dataset.endlessPrevDisplay || "";
        delete obstacle.element.dataset.endlessPrevDisplay;
      }
      if (obstacle.hint) {
        obstacle.hint.style.display = obstacle.hint.dataset.endlessPrevDisplay || "";
        delete obstacle.hint.dataset.endlessPrevDisplay;
      }
    });

    if (witch) witch.style.display = "";
    if (witchBubble) witchBubble.style.display = "";
  }

  function hideTutorialForEndless() {
    tutorialActive = false;
    tutorialShown = true;
    tutorialOverlay.classList.add("is-hidden");
    tutorialOverlay.classList.remove("is-lingering");
    tutorialOverlay.style.pointerEvents = "none";
    tutorialOverlay.setAttribute("aria-hidden", "true");
  }

  function buildEndlessRun() {
    clearEndlessContent();
    hideNormalContent();
    hideTutorialForEndless();

    obstacles = [];
    generatedSceneCount = 0;
    sceneQueue = [];
    lastGroupName = null;
    lastObstacleX = -Infinity;
    lastPlacedWasJump = false;

    for (let i = 0; i < INITIAL_SCENES; i++) appendScene();

    worldX = 0;
    world.style.transform = "translate3d(0, 0, 0)";
    hero.style.left = "18vw";
    hero.style.transform = "";
    hero.classList.remove("falling", "witch-paused");
    hero.classList.add("running");
    setForm("human");
    jump = null;
    wading = null;
    running = true;
    lastFrameAt = performance.now();
    endlessActive = true;
  }

  function restoreNormalRun() {
    clearEndlessContent();
    showNormalContent();
    obstacles = normalObstacles;
    hero.style.left = "18vw";
    endlessActive = false;
  }

  resetRun = function resetRunWithEndlessMode() {
    if (window.infiniteMode) {
      baseResetRun();
      buildEndlessRun();
      return;
    }

    if (endlessActive) {
      restoreNormalRun();
      baseResetRun();
      return;
    }

    baseResetRun();
  };

  failRun = function failRunWithEndlessResult() {
    if (!window.infiniteMode) {
      baseFailRun();
      return;
    }

    if (!running) return;
    running = false;
    jump = null;
    wading = null;
    hero.classList.remove("wading", "running", "jumping");
    hero.style.transform = "";
    hero.classList.add("falling");

    window.setTimeout(() => {
      window.showResultScreen?.("endless-loss");
    }, 240);
  };

  window.getEndlessDistanceMeters = function getEndlessDistanceMeters() {
    if (!window.infiniteMode) return 0;
    return Math.max(0, Math.round((worldX / currentLocationWidth()) * METERS_PER_SCENE));
  };

  function keepWorldGenerated() {
    if (window.infiniteMode && endlessActive) {
      const location = currentLocationWidth();
      const currentScene = Math.floor((worldX + innerWidth) / location);

      while (generatedSceneCount < currentScene + SCENES_AHEAD) {
        appendScene();
      }

      const cleanupBefore = worldX - location * 2;
      obstacles = obstacles.filter((obstacle) => {
        if (obstacle.x >= cleanupBefore || !obstacle.crossed) return true;
        obstacle.element?.remove();
        obstacle.hint?.remove();
        return false;
      });
    }

    requestAnimationFrame(keepWorldGenerated);
  }

  requestAnimationFrame(keepWorldGenerated);
})();
