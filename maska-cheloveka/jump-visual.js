/* Покадровая анимация прыжка только для медведя.
   У человека во время прыжка остаётся обычный актуальный кадр бега.
   Для человека немного увеличены высота и длительность прыжка,
   чтобы пень стабильно проходился в обоих обликах. */

updateHeroAnimation = function (now) {
  if (hero.classList.contains("falling")) return;

  const form = hero.dataset.form;

  if (jump && hero.classList.contains("jumping")) {
    if (form === "human") {
      setHeroSpriteFrame("human", "run", 0);
      return;
    }

    const jumpFrames = spriteFrames.bear.jump;

    if (now < jump.takeoffAt) {
      setHeroSpriteFrame("bear", "jump", 0);
      return;
    }

    const progress = Math.max(
      0,
      Math.min((now - jump.takeoffAt) / (jump.duration * 1000), 1)
    );

    let frameIndex = 0;
    if (progress >= 0.22 && progress < 0.5) frameIndex = 1;
    else if (progress >= 0.5 && progress < 0.76) frameIndex = 2;
    else if (progress >= 0.76) frameIndex = 3;

    frameIndex = Math.min(frameIndex, jumpFrames.length - 1);
    setHeroSpriteFrame("bear", "jump", frameIndex);
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
