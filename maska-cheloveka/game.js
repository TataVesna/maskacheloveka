const game = document.getElementById("game");
const world = document.getElementById("world");
const hero = document.getElementById("hero");
const heroImage = document.getElementById("hero-image");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const jumpPreparationMs = 50;
const spriteFrames = {
  human: {
    // Три опорные позы: правая нога впереди, ноги под корпусом, левая впереди.
    run: [1, 3, 4].map((frame) => `assets/characters/frames/human-run-${frame}.png`),
    jump: [1, 2, 3, 4].map((frame) => `assets/characters/frames/human-jump-${frame}.png`)
  },
  bear: {
    run: [1, 3, 4].map((frame) => `assets/characters/frames/bear-run-${frame}.png`),
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
    id: "ravine", src: "assets/obstacles/ravine-bear-jump.png", className: "obstacle--ravine",
    alt: "Овраг: перепрыгнуть можно медведем", hint: "МЕДВЕДЬ — ПРЫЖОК",
    rule: "Для оврага нужен прыжок медведем.", mode: "ravine"
  },
  {
    id: "tree", src: "assets/obstacles/fallen-tree-human-pass.png", className: "obstacle--tree",
    alt: "Поваленное дерево: под ним проходит человек", hint: "ЧЕЛОВЕК — ПРОБЕЖАТЬ ПОД",
    rule: "Под деревом можно пробежать только человеком.", mode: "ground", form: "human"
  },
  {
    id: "river", src: "assets/obstacles/deep-river-bear-wade-filled.png", className: "obstacle--river",
    alt: "Глубокая река: перейти вброд может медведь", hint: "МЕДВЕДЬ — ВБРОД",
    rule: "Глубокую реку вброд проходит медведь.", mode: "ground", form: "bear"
  },
  {
    id: "bridge", src: "assets/obstacles/fragile-bridge-human-pass.png", className: "obstacle--bridge",
    alt: "Хрупкий мост: пройти может человек", hint: "ЧЕЛОВЕК — ПО МОСТУ",
    rule: "Хрупкий мост выдерживает только человека.", mode: "ground", form: "human"
  },
  {
    id: "passage", src: "assets/cave/cave-narrow-passage-human.png", className: "obstacle--passage",
    alt: "Узкий проход между камнями: пройти может человек", hint: "ЧЕЛОВЕК — ЧЕРЕЗ ПРОХОД",
    rule: "В узкий проход проходит только человек.", mode: "ground", form: "human"
  },
  {
    id: "rubble", src: "assets/cave/cave-rubble-bear.png", className: "obstacle--rubble",
    alt: "Заваленные камни: перепрыгнуть можно только медведем", hint: "МЕДВЕДЬ — ПРЫЖОК",
    rule: "Заваленные камни можно перепрыгнуть только медведем.", mode: "bear-jump"
  },
  {
    id: "bush", src: "assets/cave/cave-bush-obstacle.png", className: "obstacle--bush",
    alt: "Густой кустарник: человек перепрыгивает, медведь проходит или прыгает", hint: "ЧЕЛОВЕК — ПРЫЖОК · МЕДВЕДЬ — НАПРОЛОМ ИЛИ ПРЫЖОК",
    rule: "Человек должен перепрыгнуть куст. Медведь может пройти напролом или перепрыгнуть.", mode: "bush"
  }
];

let obstacles = [];
let worldX = 0;
let running = true;
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

function placeObstacles() {
  obstacles = [];
  // Два экземпляра каждого типа; перемешиваем так, чтобы одинаковые не стояли рядом.
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

  // Раскладываем препятствия по лесу, горам и реке; начало и финал маршрута остаются свободными.
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
    // Первый сегмент маршрута — берлога, поэтому препятствия начинаются со следующей сцены.
    const x = locationWidth * (1 + item.segment + fraction);
    const img = document.createElement("img");
    img.className = `obstacle ${item.type.className}`;
    img.src = item.type.src;
    img.alt = item.type.alt;
    img.dataset.obstacle = item.type.id;
    img.style.left = `${x}px`;
    world.appendChild(img);

    const hint = document.createElement("div");
    hint.className = `obstacle-hint obstacle-hint--${item.type.id}`;
    hint.textContent = item.type.hint;
    hint.title = item.type.rule;
    hint.style.left = `${x}px`;
    world.appendChild(hint);

    obstacles.push({ ...item.type, x, element: img, hint, crossed: false, inside: false, attemptJump: null });
  }
}
placeObstacles();

function setForm(form) {
  hero.dataset.form = form;
  hero.classList.toggle("human", form === "human");
  hero.classList.toggle("bear", form === "bear");
  heroImage.setAttribute("aria-label", form === "bear"
    ? "Кудым-Ош в облике медведя"
    : "Кудым-Ош в облике человека");
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
    // Кадр приседания держится 50 мс на земле; при отрыве сразу видны вытянутые руки.
    const frameIndex = now < jump.takeoffAt
      ? 0
      : progress < 0.16 ? 1 : progress < 0.44 ? 2 : 3;
    setHeroSpriteFrame(form, "jump", frameIndex);
    return;
  }

  const cycleDuration = form === "bear" ? 285 : 210;
  const runFrames = spriteFrames[form].run;
  const frameIndex = Math.floor(now / (cycleDuration / runFrames.length)) % runFrames.length;
  setHeroSpriteFrame(form, "run", frameIndex);
}

function toggleHeroForm() {
  if (!running) return;
  setForm(hero.dataset.form === "human" ? "bear" : "human");
  // Физика текущего прыжка остаётся такой, какой была при отталкивании.
}

function startJump() {
  if (jump || !running) return;
  const form = hero.dataset.form;
  jump = {
    takeoffAt: performance.now() + jumpPreparationMs,
    form,
    // В облике медведя прыжок выше и дольше, значит и горизонтальный пролёт длиннее.
    duration: (form === "bear" ? 1.12 : 0.55) / Number(speedSlider.value),
    height: innerHeight * (form === "bear" ? 0.38 : 0.16)
  };
  hero.classList.remove("running");
  hero.classList.add("jumping");
}

function resetRun() {
  running = true;
  worldX = 0;
  world.style.transform = "translate3d(0, 0, 0)";
  setForm("human");
  jump = null;
  wading = null;
  hero.classList.remove("wading");
  hero.classList.remove("jumping", "falling", "falling-human", "falling-bear");
  hero.classList.add("running");
  hero.style.transform = "";
  obstacles.forEach((obstacle) => { obstacle.crossed = false; obstacle.inside = false; obstacle.attemptJump = null; });
}

function failRun() {
  if (!running) return;
  running = false;
  const failedForm = hero.dataset.form;
  jump = null;
  wading = null;
  hero.classList.remove("wading");
  hero.style.transform = "";
  hero.classList.remove("running", "jumping");
  hero.classList.add("falling", `falling-${failedForm}`);
  window.setTimeout(resetRun, 520);
}

game.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.target.closest("#speed-control")) return;
  if (event.button === 0) startJump();
  else if (event.button === 2) toggleHeroForm();
});
game.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
game.addEventListener("touchstart", (event) => {
  if (event.target.closest("#speed-control")) return;
  event.preventDefault();
  toggleHeroForm();
}, { passive: false });
window.addEventListener("keydown", (event) => {
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

    if (obstacle.mode === "bush") {
      const halfBush = obstacle.element.offsetWidth * 0.5;
      const bushStart = obstacle.x - halfBush;
      const bushEnd = obstacle.x + halfBush;
      if (!obstacle.inside && previousCenter < bushStart && center >= bushStart) {
        obstacle.inside = true;
        const enteringJump = airborneJump || (landedJump && jumpDistanceAtBoundary(landedJump, now, speed, center, bushStart) > 0 ? landedJump : null);
        const bearCanPass = hero.dataset.form === "bear" && (!enteringJump || enteringJump.form === "bear");
        if (bearCanPass) {
          if (center >= bushEnd) {
            obstacle.inside = false;
            obstacle.crossed = true;
          }
        } else if (enteringJump) {
          obstacle.attemptJump = enteringJump;
        } else {
          failRun();
          return true;
        }
      }
      if (obstacle.inside) {
        if (obstacle.attemptJump) {
          if (landedJump === obstacle.attemptJump) {
            const cleared = center >= bushEnd
              && obstacle.attemptJump.form === "human"
              && hero.dataset.form === "human";
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
        if (center >= bushEnd) {
          const bearCleared = hero.dataset.form === "bear" && (!airborneJump || airborneJump.form === "bear");
          const humanCleared = hero.dataset.form === "human" && (!airborneJump || airborneJump.form === "human");
          if (!bearCleared && !humanCleared) {
            failRun();
            return true;
          }
          obstacle.inside = false;
          obstacle.crossed = true;
        } else {
          const bearCanPass = hero.dataset.form === "bear" && (!airborneJump || airborneJump.form === "bear");
          const humanIsJumping = hero.dataset.form === "human" && airborneJump?.form === "human";
          if (!bearCanPass && !humanIsJumping) {
            failRun();
            return true;
          }
        }
      }
      continue;
    }

    if (obstacle.mode === "ravine" || obstacle.mode === "bear-jump") {
      // У оврага проверяем открытый провал, у завала — почти всю ширину камней.
      const halfGap = obstacle.element.offsetWidth * (obstacle.mode === "ravine" ? 0.15 : 0.47);
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
      if (obstacle.inside) {
        if (landedJump === obstacle.attemptJump) {
          const cleared = center >= gapEnd
            && obstacle.attemptJump?.form === "bear"
            && hero.dataset.form === "bear";
          if (!cleared) {
            failRun();
            return true;
          }
          obstacle.inside = false;
          obstacle.crossed = true;
          obstacle.attemptJump = null;
        }
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
