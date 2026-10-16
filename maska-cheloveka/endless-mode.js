/* Настоящий бесконечный режим: процедурные сцены и препятствия.
   Режим включается кнопкой на экране результата через window.infiniteMode = true. */
(() => {
  const LOCATION_ASPECT = 3000 / 1080;
  const METERS_PER_SCENE = 100;
  const INITIAL_SCENES = 12;
  const SCENES_AHEAD = 6;
  const SAFE_START_SCENES = 2;

  const backgroundPool = [
    "assets/locations/forest-start.png",
    "assets/locations/forest-center.png",
    "assets/locations/forest-end.png",
    "assets/locations/mound-start.png",
    "assets/locations/mound-center.png",
    "assets/locations/mound-end.png",
    "assets/locations/river.png",
    "assets/locations/settlement-start.png",
    "assets/locations/settlement-end.png"
  ];

  const normalScenes = [...world.querySelectorAll(".location-scene")];
  const normalObstacles = obstacles.slice();
  const witch = document.getElementById("witch-midpoint");
  const witchBubble = document.getElementById("witch-bubble");

  const obstacleTemplates = new Map();
  normalObstacles.forEach((obstacle) => {
    if (!obstacleTemplates.has(obstacle.id)) obstacleTemplates.set(obstacle.id, obstacle);
  });

  const groundIds = ["crowd", "bridge", "river"].filter((id) => obstacleTemplates.has(id));
  const jumpIds = ["ravine", "stump", "blue-bush", "red-bush"].filter((id) => obstacleTemplates.has(id));
  const allIds = [...groundIds, ...jumpIds];

  let endlessActive = false;
  let endlessScenes = [];
  let endlessObstacleNodes = [];
  let generatedSceneCount = 0;
  let lastBackground = "";
  let lastObstacleX = -Infinity;
  let lastJumpScene = -10;

  const baseResetRun = resetRun;
  const baseFailRun = failRun;

  function currentLocationWidth() {
    return innerHeight * LOCATION_ASPECT;
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function chooseBackground() {
    const choices = backgroundPool.filter((src) => src !== lastBackground);
    const src = randomItem(choices.length ? choices : backgroundPool);
    lastBackground = src;
    return src;
  }

  function appendScene() {
    const section = document.createElement("section");
    section.className = "location-scene endless-location-scene";
    section.setAttribute("aria-hidden", "true");

    const img = document.createElement("img");
    img.src = chooseBackground();
    img.alt = "";
    section.appendChild(img);
    world.appendChild(section);

    endlessScenes.push(section);
    const sceneIndex = generatedSceneCount++;
    maybeAddObstacle(sceneIndex);
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

  function maybeAddObstacle(sceneIndex) {
    if (sceneIndex < SAFE_START_SCENES || !allIds.length) return;
    if (Math.random() > 0.82) return;

    const location = currentLocationWidth();
    let pool = allIds;

    if (sceneIndex - lastJumpScene < 2 && groundIds.length) {
      pool = groundIds;
    }

    const id = randomItem(pool);
    const isJump = jumpIds.includes(id);
    const fraction = 0.42 + Math.random() * 0.34;
    const x = sceneIndex * location + fraction * location;

    /* Не ставим препятствия почти вплотную друг к другу. */
    if (x - lastObstacleX < location * 0.58) return;

    if (cloneObstacleFromTemplate(id, x)) {
      lastObstacleX = x;
      if (isJump) lastJumpScene = sceneIndex;
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

  function buildEndlessRun() {
    clearEndlessContent();
    hideNormalContent();

    obstacles = [];
    generatedSceneCount = 0;
    lastBackground = "";
    lastObstacleX = -Infinity;
    lastJumpScene = -10;

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

      /* Всегда держим несколько полноценных экранов впереди героя,
         поэтому gameLoop не успевает дойти до текущего maxScroll. */
      while (generatedSceneCount < currentScene + SCENES_AHEAD) {
        appendScene();
      }

      /* Удаляем уже пройденные препятствия далеко позади героя, чтобы DOM не разрастался. */
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
