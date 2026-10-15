/* Покадровая анимация прыжка для человека и медведя.
   Используются готовые кадры assets/characters/frames/*-jump-1..4.png.
   Траектория, высота и дальность прыжка остаются в game.js. */

updateHeroAnimation = function (now) {
  if (hero.classList.contains("falling")) return;

  const form = hero.dataset.form;

  if (jump && hero.classList.contains("jumping")) {
    const jumpFrames = spriteFrames[form].jump;

    /* До фактического отрыва показываем первый кадр подготовки. */
    if (now < jump.takeoffAt) {
      setHeroSpriteFrame(form, "jump", 0);
      return;
    }

    const progress = Math.max(
      0,
      Math.min((now - jump.takeoffAt) / (jump.duration * 1000), 1)
    );

    /*
      1 — отрыв,
      2 — набор высоты,
      3 — верхняя точка / начало снижения,
      4 — приземление.
    */
    let frameIndex = 0;
    if (progress >= 0.22 && progress < 0.5) frameIndex = 1;
    else if (progress >= 0.5 && progress < 0.76) frameIndex = 2;
    else if (progress >= 0.76) frameIndex = 3;

    frameIndex = Math.min(frameIndex, jumpFrames.length - 1);
    setHeroSpriteFrame(form, "jump", frameIndex);
    return;
  }

  const cycleDuration = form === "bear" ? 420 : 330;
  const runFrames = spriteFrames[form].run;
  const frameIndex = Math.floor(now / (cycleDuration / runFrames.length)) % runFrames.length;
  setHeroSpriteFrame(form, "run", frameIndex);
};

/* Убираем старые программные наклоны/растяжения: теперь движение только покадровое. */
heroImage.style.transition = "none";
heroImage.style.transform = "";
