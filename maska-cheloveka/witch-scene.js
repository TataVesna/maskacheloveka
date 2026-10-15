/* Встреча с ведьмой в середине маршрута.
   При приближении герой останавливается, затем камера плавно приближается. */
(() => {
  const witch = document.createElement("img");
  witch.id = "witch-midpoint";
  witch.src = "assets/characters/witch.png";
  witch.alt = "Ведьма";
  witch.style.position = "absolute";
  witch.style.left = `${locationWidth * 6.12}px`;
  witch.style.bottom = "30px";
  witch.style.width = "clamp(92px, 9vw, 138px)";
  witch.style.height = "auto";
  witch.style.zIndex = "8";
  witch.style.pointerEvents = "none";
  witch.style.transform = "translateX(-50%)";
  world.appendChild(witch);

  const witchX = locationWidth * 6.12;
  let triggered = false;

  function triggerWitchScene() {
    if (triggered) return;
    triggered = true;

    running = false;
    jump = null;
    wading = null;

    hero.classList.remove("running", "jumping", "wading");
    hero.classList.add("witch-paused");
    hero.style.transform = "";

    const witchScreenX = witchX - worldX;
    const focusX = Math.max(innerWidth * 0.25, Math.min(innerWidth * 0.75, witchScreenX));

    game.style.transformOrigin = `${focusX}px 72%`;
    game.style.transition = "transform 850ms cubic-bezier(0.22, 1, 0.36, 1)";

    requestAnimationFrame(() => {
      game.style.transform = "scale(1.42)";
    });
  }

  function watchWitch() {
    if (!triggered && gameStarted && running && !tutorialActive) {
      const center = worldX + heroScreenX();
      const approachDistance = innerWidth * 0.28;
      if (center >= witchX - approachDistance) triggerWitchScene();
    }
    requestAnimationFrame(watchWitch);
  }

  requestAnimationFrame(watchWitch);
})();
