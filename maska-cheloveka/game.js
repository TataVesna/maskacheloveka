const game = document.getElementById("game");
const world = document.getElementById("world");
const hero = document.getElementById("hero");
const heroImage = document.getElementById("hero-image");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const startScreen = document.getElementById("start-screen");
const jumpPreparationMs = 50;

const spriteFrames = {
  human: {
    run: [
      "assets/characters/human-1.png",
      "assets/characters/human-2.png",
      "assets/characters/human-3.png"
    ],
    jump: [1, 2, 3, 4].map((frame) => `assets/characters/frames/human-jump-${frame}.png`)
  },
  bear: {
    run: [
      "assets/characters/bear-1.png",
      "assets/characters/bear-2.png",
      "assets/characters/bear-3.png"
    ],
    jump: [1, 2, 3, 4].map((frame) => `assets/characters/frames/bear-jump-${frame}.png`)
  }
};

const spriteImageCache = new Map();
Object.values(spriteFrames).forEach((actions) => {
  Object.values(actions).flat().forEach((path) => {
    const image = new Image();
    image.src = path;
    spriteImageCache.set(path, image);
  });
});

const css = getComputedStyle(document.documentElement);
const locationWidth = parseFloat(css.getPropertyValue("--location-width")) * innerHeight / 100;
const heroScreenX = () => hero.offsetLeft + hero.offsetWidth / 2;

const obstacleTypes = [
  {
    id: "ravine",
    src: "assets/obstacles/cliff-bear-jump.png",
    className: "obstacle--ravine",
    alt: "Овраг: перепрыгнуть можно медведем",
    hint: "МЕДВЕДЬ — ПРЫЖОК",
    rule: "Для оврага нужен прыжок медведем.",
    mode: "ravine",
    indicatorForm: "bear",
    width: "63vw",
    bottom: "20.1dvh",
    transform: "translate(-50%, 60%)",
    zIndex: "4",
    hintTop: "61vh",
    gapFactor: 0.15
  },
  {
    id: "river",
    src: "assets/obstacles/river-ford-bear.png",
    className: "obstacle--river",
    alt: "Глубокая река: перейти вброд может медведь",
    hint: "МЕДВЕДЬ — ВБРОД",
    rule: "Глубокую реку вброд проходит медведь.",
    mode: "ground",
    form: "bear",
    indicatorForm: "bear",
    width: "clamp(460px, 55vw, 860px)",
    bottom: "15.8dvh",
    transform: "translate(-50%, 68%)",
    zIndex: "4",
    hintTop: "68vh"
  },
  {
    id: "bridge",
    src: "assets/obstacles/river-bridge-human.png",
    className: "obstacle--bridge",
    alt: "Хрупкий мост: пройти может человек",
    hint: "ЧЕЛОВЕК — ПО МОСТУ",
    rule: "Хрупкий мост выдерживает только человека.",
    mode: "ground",
    form: "human",
    indicatorForm: "human",
    width: "clamp(520px, 48vw, 780px)",
    bottom: "18.5dvh",
    transform: "translate(-50%, 48%)",
    zIndex: "4",
    hintTop: "60vh"
  },
  {
    id: "passage",
    src: "assets/cave/cave-narrow-passage-human.png",
    className: "obstacle--passage",
    alt: "Узкий проход между камнями: пройти может человек",
    hint: "ЧЕЛОВЕК — ЧЕРЕЗ ПРОХОД",
    rule: "В узкий проход проходит только человек.",
    mode: "ground",
    form: "human",
    indicatorForm: "human",
    width: "clamp(720px, 145vh, 1600px)",
    bottom: "13.1dvh",
    zIndex: "4",
    hintTop: "31vh"
  },
  {
    id: "rubble",
    src: "assets/cave/cave-rubble-bear.png",
    className: "obstacle--rubble",
    alt: "Заваленные камни: перепрыгнуть можно только медведем",
    hint: "МЕДВЕДЬ — ПРЫЖОК",
    rule: "Заваленные камни можно перепрыгнуть только медведем.",
    mode: "bear-jump",
    indicatorForm: "bear",
    width: "22.1vw",
    bottom: "14.6dvh",
    zIndex: "4",
    hintTop: "35vh",
    gapFactor: 0.47
  },
  {
    id: "stump",
    src: "assets/obstacles/stump-jump-both.png",
    className: "obstacle--stump",
    alt: "Пень: перепрыгивают оба облика",
    hint: "ОБА ОБЛИКА — ПРЫЖОК",
    rule: "Пень нужно перепрыгнуть в любом облике.",
    mode: "any-jump",
    indicatorForm: null,
    width: "clamp(120px, 13vw, 210px)",
    bottom: "17.6dvh",
    zIndex: "4",
    hintTop: "40vh",
    gapFactor: 0.44
  },
  {
    id: "crowd",
    src: "assets/obstacles/crowd-human-pass.png",
    className: "obstacle--crowd",
    alt: "Толпа людей: пройти может только человек",
    hint: "ЧЕЛОВЕК — ПРОЙТИ",
    rule: "Через толпу людей проходит только человек.",
    mode: "ground",
    form: "human",
    indicatorForm: "human",
    width: "clamp(240px, 22vw, 360px)",
    bottom: "15.8dvh",
    zIndex: "4",
    hintTop: "43vh"
  }
];

const indicatorBushes = {
  human: "assets/obstacles/human-indicator-bush.png",
  bear: "assets/obstacles/bear-indicator-bush.png"
};

let obstacles = [];
let worldX = 0;
let gameStarted = false;
let running = false;
let jump = null;
let wading = null;
let lastFrameAt = 0;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function applyObstacleStyle(element, type) {
  if (type.width) element.style.width = type.width;
  if (type.bottom) element.style.bottom = type.bottom;
  if (type.transform) element.style.transform = type.transform;
  if (type.zIndex) element.style.zIndex = type.zIndex;
}

function placeObstacles() {
  world.querySelectorAll(".obstacle, .obstacle-hint, .form-indicator-bush").forEach((element) => element.remove());
  obstacles = [];

  const types = obstacleTypes.flatMap((type) => [type, type]);
  let orderedTypes = [];
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = shuffle(types);
    if (candidate.every((type, i) => i === 0 || type.id !== candidate[i - 1].id)) {
      orderedTypes = candidate;
      break;
    }
  }
  if (!orderedTypes.length) orderedTypes = types;

  const obstacleSceneCount = 7;
  const counts = Array(obstacleSceneCount).fill(Math.floor(orderedTypes.length / obstacleSceneCount));
  for (let i = 0; i < orderedTypes.length % obstacleSceneCount; i++) counts[i]++;
  const shuffledCounts = shuffle(counts);
  const plan = [];
  let typeIndex = 0;

  shuffledCounts.forEach((count, segment) => {
    for (let i = 0; i < count; i++) {
      const spacing = 1 / (count + 1);
      const fraction = Math.max(0.12, Math.min(0.88,
        (i + 1) * spacing + (Math.random() - 0.5) * spacing * 0.3));
      plan.push({ type: orderedTypes[typeIndex++], segment, fraction });
    }
  });

  for (const item of plan) {
    const fraction = item.fraction ?? (0.22 + Math.random() * 0.56);
    const x = locationWidth * (1 + item.segment + fraction);

    if (item.type.indicatorForm) {
      const indicator = document.createElement("img");
      indicator.className = `form-indicator-bush form-indicator-bush--${item.type.indicatorForm}`;
      indicator.src = indicatorBushes[item.type.indicatorForm];
      indicator.alt = item.type.indicatorForm === "bear"
        ? "Красный куст: дальше нужен медведь"
        : "Синий куст: дальше нужен человек";
      indicator.style.position = "absolute";
      indicator.style.left = `${x - Math.min(innerWidth * 0.22, locationWidth * 0.1)}px`;
      indicator.style.bottom = "16.8dvh";
      indicator.style.width = "clamp(120px, 12vw, 200px)";
      indicator.style.height = "auto";
      indicator.style.transform = "translateX(-50%)";
      indicator.style.pointerEvents = "none";
      indicator.style.zIndex = "6";
      world.appendChild(indicator);
    }

    const img = document.createElement("img");
    img.className = `obstacle ${item.type.className}`;
    img.src = item.type.src;
    img.alt = item.type.alt;
    img.dataset.obstacle = item.type.id;
    img.style.left = `${x}px`;
    applyObstacleStyle(img, item.type);
    world.appendChild(img);

    const hint = document.createElement("div");
    hint.className = `obstacle-hint obstacle-hint--${item.type.id}`;
    hint.textContent = item.type.hint;
    hint.title = item.type.rule;
    hint.style.left = `${x}px`;
    if (item.type.hintTop) hint.style.top = item.type.hintTop;
    world.appendChild(hint);

    obstacles.push({
      ...item.type,
      x,
      element: img,
      hint,
      crossed: false,
      inside: false,
      attemptJump: null
    });
  }
}
placeObstacles();

function setForm(form) {
  hero.dataset.form = form;
  hero.classList.toggle("human", form === "human");
  hero.classList.toggle("bear", form === "bear");
  heroImage.setAttribute(
    "aria-label",
    form === "bear"
      ? "Кудым-Ош в облике медведя"
      : "Кудым-Ош в облике человека"
  );
  updateHeroAnimation(performance.now());
}

function setHeroSpriteFrame(form, action, frameIndex) {
  const path = spriteFrames[form][action][frameIndex];
  if (heroImage.dataset.frame === path) return;
  const image = spriteImageCache.get(path);
  heroImage.dataset.frame = path;

  const applyFrame = () => {
    if (heroImage.dataset.frame === path) {
      heroImage.style.backgroundImage = `url("${path}")`;
    }
  };

  if (image?.complete && image.naturalWidth > 0) applyFrame();
  else if (image && typeof image.decode === "function") image.decode().then(applyFrame).catch(() => {});
}

function updateHeroAnimation(now) {
  if (hero.classList.contains("falling")) return;

  const form = hero.dataset.form;
  if (jump && hero.classList.contains("jumping")) {
    const progress = Math.max(0, Math.min((now - jump.takeoffAt) / (jump.duration * 1000), 1));
    const frameIndex = now < jump.takeoffAt
      ? 0
      : progress < 0.16 ? 1 : progress < 0.44 ? 2 : 3;
    setHeroSpriteFrame(form, "jump", frameIndex);
    return;
  }

  const cycleDuration = form === "bear" ? 420 : 330;
  const runFrames = spriteFrames[form].run;
  const frameIndex = Math.floor(now / (cycleDuration / runFrames.length)) % runFrames.length;
  setHeroSpriteFrame(form, "run", frameIndex);
}

function toggleHeroForm() {
  if (!gameStarted || !running) return;
  setForm(hero.dataset.form === "human" ? "bear" : "human");
}

function startJump() {
  if (!gameStarted || jump || !running) return;
  const form = hero.dataset.form;
  jump = {
    takeoffAt: performance.now() + jumpPreparationMs,
    form,
    duration: (form === "bear" ? 1.12 : 0.55) / Number(speedSlider.value),
    height: innerHeight * (form === "bear" ? 0.38 : 0.16)
  };
  hero.classList.remove("running");
  hero.classList.add("jumping");
}

function resetRun() {
  running = gameStarted;
  worldX = 0;
  world.style.transform = "translate3d(0, 0, 0)";
  setForm("human");
  jump = null;
  wading = null;
  hero.classList.remove("wading");
  hero.classList.remove("jumping", "falling", "falling-human", "falling-bear");
  hero.classList.add("running");
  hero.style.transform = "";
  obstacles.forEach((obstacle) => {
    obstacle.crossed = false;
    obstacle.inside = false;
    obstacle.attemptJump = null;
  });
}

function failRun() {
  if (!running) return;
  running = false;
  jump = null;
  wading = null;
  hero.classList.remove("wading");
  hero.style.transform = "";
  hero.classList.remove("running", "jumping");
  hero.classList.add("falling");
  window.setTimeout(resetRun, 520);
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  startScreen.classList.add("is-hidden");
  resetRun();
  lastFrameAt = performance.now();
}

startScreen.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startGame();
}, { once: true });

startScreen.addEventListener("keydown", (event) => {
  if (event.code === "Enter" || event.code === "Space") {
    event.preventDefault();
    startGame();
  }
});

game.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.target.closest("#speed-control, #start-screen")) return;
  if (event.button === 0) startJump();
  else if (event.button === 2) toggleHeroForm();
});

game.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

game.addEventListener("touchstart", (event) => {
  if (event.target.closest("#speed-control, #start-screen")) return;
  event.preventDefault();
  toggleHeroForm();
}, { passive: false });

window.addEventListener("keydown", (event) => {
  if (!gameStarted) return;
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    startJump();
  } else if (event.code === "KeyE" || event.code === "ArrowDown") {
    toggleHeroForm();
  }
});

speedSlider.addEventListener("input", () => {
  speedValue.value = `${Number(speedSlider.value).toFixed(1)}×`;
  speedValue.textContent = speedValue.value;
});

function jumpDistanceAtBoundary(activeJump, now, speed, center, boundary) {
  if (!activeJump || speed <= 0) return 0;
  const elapsedAtBoundary = (now - activeJump.takeoffAt) / 1000 - (center - boundary) / speed;
  return speed * Math.max(0, activeJump.duration - elapsedAtBoundary);
}

function updateObstacleCollisions(previousCenter, center, now, speed, landedJump = null) {
  const airborneJump = jump && now >= jump.takeoffAt ? jump : null;

  for (const obstacle of obstacles) {
    if (obstacle.crossed) continue;

    if (obstacle.id === "river") {
      const halfRiver = obstacle.element.offsetWidth * 0.4;
      const start = obstacle.x - halfRiver;
      const end = obstacle.x + halfRiver;
      if (!wading && previousCenter < start && center >= start) {
        if (hero.dataset.form !== "bear" || airborneJump) {
          failRun();
          return true;
        }
        wading = { obstacle, start, end };
        hero.classList.add("wading");
      }
      if (wading?.obstacle === obstacle) {
        if (hero.dataset.form !== "bear" || airborneJump) {
          failRun();
          return true;
        }
        const progress = Math.max(0, Math.min(1, (center - wading.start) / (wading.end - wading.start)));
        const depth = innerHeight * 0.065 * Math.sin(Math.PI * progress);
        hero.style.transform = `translateY(${depth}px)`;
        if (center >= wading.end) {
          obstacle.crossed = true;
          wading = null;
          hero.classList.remove("wading");
          hero.style.transform = "";
        }
      }
      continue;
    }

    if (["ravine", "bear-jump", "any-jump"].includes(obstacle.mode)) {
      const halfGap = obstacle.element.offsetWidth * (obstacle.gapFactor ?? 0.4);
      const gapStart = obstacle.x - halfGap;
      const gapEnd = obstacle.x + halfGap;

      if (!obstacle.inside && previousCenter < gapStart && center >= gapStart) {
        obstacle.inside = true;
        const enteringJump = airborneJump || (landedJump && jumpDistanceAtBoundary(landedJump, now, speed, center, gapStart) > 0 ? landedJump : null);
        if (!enteringJump) {
          failRun();
          return true;
        }
        obstacle.attemptJump = enteringJump;
      }

      if (obstacle.inside && landedJump === obstacle.attemptJump) {
        const jumpMatches = obstacle.mode === "any-jump"
          ? obstacle.attemptJump && hero.dataset.form === obstacle.attemptJump.form
          : obstacle.attemptJump?.form === "bear" && hero.dataset.form === "bear";

        const cleared = center >= gapEnd && jumpMatches;
        if (!cleared) {
          failRun();
          return true;
        }
        obstacle.inside = false;
        obstacle.crossed = true;
        obstacle.attemptJump = null;
      }
      continue;
    }

    if (!obstacle.crossed && previousCenter < obstacle.x && center >= obstacle.x) {
      obstacle.crossed = true;
      const requiredForm = obstacle.form;
      const isGrounded = !airborneJump;
      if (hero.dataset.form !== requiredForm || !isGrounded) {
        failRun();
        return true;
      }
    }
  }

  return false;
}

function gameLoop(now) {
  const dt = lastFrameAt ? Math.min((now - lastFrameAt) / 1000, 0.05) : 0;
  lastFrameAt = now;

  if (running) {
    const previousCenter = worldX + heroScreenX();
    const activeJump = jump;
    const maxScroll = Math.max(0, world.scrollWidth - game.clientWidth);
    const pixelsPerSecond = innerWidth * 0.21 * Number(speedSlider.value);
    worldX = Math.min(worldX + pixelsPerSecond * dt, maxScroll);
    world.style.transform = `translate3d(${-worldX}px, 0, 0)`;

    let landedJump = null;
    if (activeJump && jump === activeJump) {
      const hasTakenOff = now >= activeJump.takeoffAt;
      const progress = hasTakenOff
        ? Math.min((now - activeJump.takeoffAt) / (activeJump.duration * 1000), 1)
        : 0;
      hero.style.transform = hasTakenOff
        ? `translateY(${-4 * activeJump.height * progress * (1 - progress)}px)`
        : "";
      if (hasTakenOff && progress >= 1) {
        landedJump = activeJump;
        jump = null;
        hero.classList.remove("jumping");
        hero.classList.add("running");
        hero.style.transform = "";
      }
    }

    updateHeroAnimation(now);

    const center = worldX + heroScreenX();
    if (updateObstacleCollisions(previousCenter, center, now, pixelsPerSecond, landedJump)) {
      requestAnimationFrame(gameLoop);
      return;
    }

    if (worldX >= maxScroll) running = false;
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
