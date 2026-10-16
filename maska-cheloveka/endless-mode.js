/* Настоящий бесконечный режим: процедурные группы локаций и плотный набор препятствий. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  const METERS_PER_SCENE = 100;
  const INITIAL_SCENES = 14;
  const SCENES_AHEAD = 8;
  const SAFE_START_SCENES = 1;

  const singleScene = (src) => ({ type: "single", src });
  const moundScene = (back, front) => ({ type: "mound", back, front });

  const moundStart = moundScene(
    "assets/locations/ПЗ_Курган_начало_2.png",
    "assets/locations/ПЗ_Курган_начало.png"
  );
  const moundCenter = moundScene(
    "assets/locations/ПЗ_Курган_центр_2.png",
    "assets/locations/ПЗ_Курган_центр.png"
  );
  const moundEnd = moundScene(
    "assets/locations/ПЗ_Курган_конец2.png",
    "assets/locations/ПЗ_Курган_конец.png"
  );

  const locationGroups = {
    forest: () => {
      const extraCenters = Math.floor(Math.random() * 3);
      return [
        singleScene("assets/locations/forest-start.png"),
        singleScene("assets/locations/forest-center.png"),
        ...Array.from({ length: extraCenters }, () => singleScene("assets/locations/forest-center.png")),
        singleScene("assets/locations/forest-end.png")
      ];
    },
    mound: () => {
      const extraCenters = Math.floor(Math.random() * 3);
      return [
        moundStart,
        moundCenter,
        ...Array.from({ length: extraCenters }, () => ({ ...moundCenter })),
        moundEnd
      ];
    },
    settlement: () => [
      singleScene("assets/locations/settlement-start.png"),
      singleScene("assets/locations/settlement-end.png")
    ],
    river: () => [singleScene("assets/locations/river.png")]
  };

  const normalScenes = [...world.querySelectorAll(".location-scene")];
  const normalObstacles = obstacles.slice();
  const witch = document.getElementById("witch-midpoint");
  const witchBubble = document.getElementById("witch-bubble");

  const obstacleTemplates = new Map();
  normalObstacles.forEach((obstacle) => {
    if (!obstacleTemplates.has(obstacle.id)) obstacleTemplates.set(obstacle.id, obstacle);
  });

  const groundIds = ["crowd", "bridge", "river"].filter((id) => obstacleTemplates.has(id));
  const jumpIds = [
    "ravine",
    "stump",
    "blue-bush",
    "red-bush",
    "cave-blue-bush",
    "cave-red-bush"
  ].filter((id) => obstacleTemplates.has(id));
  const allIds = [...groundIds, ...jumpIds];

  let endlessActive = false;
  let endlessScenes = [];
  let endlessObstacleNodes = [];
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
    const names = Object.keys(locationGroups).filter((name) => name !== lastGroupName);
    const groupName = randomItem(names.length ? names : Object.keys(locationGroups));
    lastGroupName = groupName;
    sceneQueue.push(...locationGroups[groupName]());
  }

  function nextSceneSpec() {
    if (!sceneQueue.length) refillSceneQueue();
    return sceneQueue.shift();
  }

  function appendScene() {
    const spec = nextSceneSpec();
    const section = document.createElement("section");
    section.className = "location-scene endless-location-scene";
    section.setAttribute("aria-hidden", "true");

    if (spec.type === "mound") {
      section.classList.add("location-scene--mound");

      const back = document.createElement("img");
      back.className = "scene-layer scene-layer--back";
      back.src = spec.back;
      back.alt = "";
      section.appendChild(back);

      const front = document.createElement("img");
      front.className = "scene-layer scene-layer--front";
      front.src = spec.front;
      front.alt = "";
      section.appendChild(front);
    } else {
      const img = document.createElement("img");
      img.src = spec.src;
      img.alt = "";
      section.appendChild(img);
    }

    world.appendChild(section);

    endlessScenes.push(section);
    const sceneIndex = generatedSceneCount++;
    addObstaclesForScene(sceneIndex);
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

  function chooseObstacleId({ allowJump = true, excludeRiver = false } = {}) {
    let pool = allowJump ? allIds : groundIds;
    if (excludeRiver) pool = pool.filter((id) => id !== "river");
    return pool.length ? randomItem(pool) : null;
  }

  function placeObstacleAt(sceneIndex, fraction, options = {}) {
    const location = currentLocationWidth();
    const allowJump = !lastPlacedWasJump;
    const id = chooseObstacleId({ allowJump, ...options });
    if (!id) return false;

    const x = sceneIndex * location + fraction * location;
    if (x - lastObstacleX < location * 0.30) return false;

    if (cloneObstacleFromTemplate(id, x)) {
      lastObstacleX = x;
      lastPlacedWasJump = jumpIds.includes(id);
      return true;
    }

    return false;
  }

  function addObstaclesForScene(sceneIndex) {
    if (sceneIndex < SAFE_START_SCENES || !allIds.length) return;

    /* После первого спокойного экрана на каждом экране есть минимум одно препятствие.
       Примерно в 60% случаев добавляем второе, но не ставим два прыжка подряд. */
    placeObstacleAt(sceneIndex, 0.31 + Math.random() * 0.08);

    if (Math.random() < 0.60) {
      placeObstacleAt(sceneIndex, 0.72 + Math.random() * 0.08, { excludeRiver: true });
    }
  }

  function clearEndlessContent() {
    endlessScenes.forEach((scene) => scene.remove());
    endlessObstacleNodes.forEach((node) => node.remove());
    endlessScenes = [];
    endlessObstacleNodes = [];
  }

  function hideNormalContent() {
    normalScenes.forEach((scene) => {
      scene.dataset.endlessPrevDisplay = scene.style.display || "";
      scene.style.display = "none";
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
    }, 520);
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
