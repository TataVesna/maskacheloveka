/* Дополнительная визуальная анимация прыжка.
   Траектория и дальность остаются в game.js — здесь меняется только пластика спрайта. */

let jumpVisualLastJump = null;
let jumpVisualLanding = null;

function setJumpVisualTransform(value) {
  heroImage.style.transition = "none";
  heroImage.style.transform = value;
}

function resetJumpVisual() {
  heroImage.style.transition = "none";
  heroImage.style.transform = "";
  jumpVisualLastJump = null;
  jumpVisualLanding = null;
}

function animateJumpVisual(now) {
  if (hero.classList.contains("falling") || hero.classList.contains("tutorial-paused")) {
    resetJumpVisual();
    requestAnimationFrame(animateJumpVisual);
    return;
  }

  if (jump) {
    jumpVisualLastJump = jump;
    jumpVisualLanding = null;

    const form = jump.form;
    const beforeTakeoff = now < jump.takeoffAt;

    if (beforeTakeoff) {
      if (form === "bear") {
        setJumpVisualTransform("rotate(-2deg) scaleX(1.06) scaleY(0.92)");
      } else {
        setJumpVisualTransform("rotate(-3deg) scaleX(1.04) scaleY(0.95)");
      }
    } else {
      const progress = Math.max(0, Math.min((now - jump.takeoffAt) / (jump.duration * 1000), 1));

      if (form === "bear") {
        // Медведь прыгает тяжело и низко: небольшой наклон, меньше растяжения.
        const rotation = -4 + progress * 7;
        const lift = Math.sin(Math.PI * progress);
        const scaleX = 1.03 - lift * 0.05;
        const scaleY = 0.97 + lift * 0.06;
        setJumpVisualTransform(`rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`);
      } else {
        // Человек — более лёгкий и подвижный прыжок.
        const rotation = -7 + progress * 12;
        const lift = Math.sin(Math.PI * progress);
        const scaleX = 1.01 - lift * 0.05;
        const scaleY = 0.99 + lift * 0.09;
        setJumpVisualTransform(`rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`);
      }
    }
  } else if (jumpVisualLastJump) {
    if (!jumpVisualLanding) {
      jumpVisualLanding = {
        startedAt: now,
        form: jumpVisualLastJump.form,
        duration: jumpVisualLastJump.form === "bear" ? 190 : 140
      };
    }

    const p = Math.min((now - jumpVisualLanding.startedAt) / jumpVisualLanding.duration, 1);
    const impact = Math.sin(Math.PI * p);

    if (jumpVisualLanding.form === "bear") {
      // Более тяжёлое приземление.
      const scaleX = 1 + impact * 0.09;
      const scaleY = 1 - impact * 0.11;
      const rotation = 2 * (1 - p);
      setJumpVisualTransform(`rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`);
    } else {
      const scaleX = 1 + impact * 0.055;
      const scaleY = 1 - impact * 0.065;
      const rotation = 1.5 * (1 - p);
      setJumpVisualTransform(`rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`);
    }

    if (p >= 1) resetJumpVisual();
  } else if (heroImage.style.transform) {
    heroImage.style.transform = "";
  }

  requestAnimationFrame(animateJumpVisual);
}

requestAnimationFrame(animateJumpVisual);
