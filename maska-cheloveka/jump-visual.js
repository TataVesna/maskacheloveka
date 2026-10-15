/* Во время прыжка у обоих обликов остаётся обычный кадр бега.
   Физика прыжка сохраняется: меняются только визуальные кадры. */

updateHeroAnimation = function (now) {
  if (hero.classList.contains("falling")) return;

  const form = hero.dataset.form;

  if (jump && hero.classList.contains("jumping")) {
    setHeroSpriteFrame(form, "run", 0);
    return;
  }

  const cycleDuration = form === "bear" ? 420 : 330;
  const runFrames = spriteFrames[form].run;
  const frameIndex = Math.floor(now / (cycleDuration / runFrames.length)) % runFrames.length;
  setHeroSpriteFrame(form, "run", frameIndex);
};

startJump = function () {
  if (!gameStarted || jump || !running || tutorialActive) return;

  const form = hero.dataset.form;
  const isBear = form === "bear";

  jump = {
    takeoffAt: performance.now() + jumpPreparationMs,
    form,
    duration: (isBear ? 1.12 : 0.66) / Number(speedSlider.value),
    height: innerHeight * (isBear ? 0.24 : 0.18)
  };

  hero.classList.remove("running");
  hero.classList.add("jumping");
};

heroImage.style.transition = "none";
heroImage.style.transform = "";
