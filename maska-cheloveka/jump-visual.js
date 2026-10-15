/* Выраженная программная анимация прыжка.
   Траектория и дальность остаются в game.js — здесь меняется только пластика спрайта. */

let jumpVisualLastJump = null;
let jumpVisualLanding = null;

function setJumpVisualTransform(value) {
  heroImage.style.transition = "none";
  heroImage.style.transformOrigin = "50% 100%";
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
        /* Медведь заметно приседает перед тяжёлым прыжком. */
        setJumpVisualTransform("translateY(8%) rotate(-4deg) scaleX(1.14) scaleY(0.82)");
      } else {
        /* Человек слегка группируется и подаётся вперёд. */
        setJumpVisualTransform("translateY(5%) rotate(-7deg) scaleX(1.08) scaleY(0.88)");
      }
    } else {
      const progress = Math.max(0, Math.min((now - jump.takeoffAt) / (jump.duration * 1000), 1));
      const lift = Math.sin(Math.PI * progress);

      if (form === "bear") {
        /* Тяжёлый низкий прыжок: корпус почти горизонтально не разворачивается. */
        const rotation = -8 + progress * 14;
        const scaleX = 1.08 - lift * 0.13;
        const scaleY = 0.92 + lift * 0.18;
        const bodyLift = -lift * 7;
        setJumpVisualTransform(
          `translateY(${bodyLift.toFixed(2)}%) rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`
        );
      } else {
        /* Человек заметно вытягивается в воздухе и сильнее меняет наклон. */
        const rotation = -14 + progress * 24;
        const scaleX = 1.06 - lift * 0.14;
        const scaleY = 0.94 + lift * 0.22;
        const bodyLift = -lift * 10;
        setJumpVisualTransform(
          `translateY(${bodyLift.toFixed(2)}%) rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`
        );
      }
    }
  } else if (jumpVisualLastJump) {
    if (!jumpVisualLanding) {
      jumpVisualLanding = {
        startedAt: now,
        form: jumpVisualLastJump.form,
        duration: jumpVisualLastJump.form === "bear" ? 230 : 170
      };
    }

    const p = Math.min((now - jumpVisualLanding.startedAt) / jumpVisualLanding.duration, 1);
    const impact = Math.sin(Math.PI * p);

    if (jumpVisualLanding.form === "bear") {
      /* Сильное тяжёлое приземление. */
      const scaleX = 1 + impact * 0.16;
      const scaleY = 1 - impact * 0.20;
      const rotation = 5 * (1 - p);
      const drop = impact * 7;
      setJumpVisualTransform(
        `translateY(${drop.toFixed(2)}%) rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`
      );
    } else {
      /* Более лёгкая, но заметная амортизация человека. */
      const scaleX = 1 + impact * 0.10;
      const scaleY = 1 - impact * 0.13;
      const rotation = 3 * (1 - p);
      const drop = impact * 4;
      setJumpVisualTransform(
        `translateY(${drop.toFixed(2)}%) rotate(${rotation.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`
      );
    }

    if (p >= 1) resetJumpVisual();
  } else if (heroImage.style.transform) {
    heroImage.style.transform = "";
  }

  requestAnimationFrame(animateJumpVisual);
}

requestAnimationFrame(animateJumpVisual);
