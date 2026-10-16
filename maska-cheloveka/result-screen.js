/* Экран результата показывается при проигрыше до ведьмы и после финальной сцены.
   После активированного чекпоинта у ведьмы поражение сразу возвращает игрока к чекпоинту. */
(() => {
  const STORY_URL = "https://stroki.mts.ru/collection/pesni-zemli-2856";
  const ROUTE_METERS = 1000;

  const overlay = document.createElement("div");
  overlay.id = "result-screen";
  overlay.setAttribute("aria-hidden", "true");

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "120",
    background: "#000",
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
    transition: "opacity 420ms ease, visibility 420ms ease",
    overflow: "hidden"
  });

  /* Весь экран собирается в системе координат макета 16:9. */
  const stage = document.createElement("div");
  Object.assign(stage.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    height: "100%",
    transform: "translate(-50%, -50%)"
  });

  const background = document.createElement("img");
  background.src = "assets/UI/эеран успеха.png";
  background.alt = "Экран результата";
  Object.assign(background.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
    webkitUserDrag: "none",
    pointerEvents: "none"
  });
  stage.appendChild(background);

  const distance = document.createElement("div");
  distance.id = "result-distance";
  Object.assign(distance.style, {
    position: "absolute",
    left: "4.7%",
    top: "72.5%",
    width: "31%",
    color: "#fff",
    fontFamily: '"Balkara Condensed", Georgia, "Times New Roman", serif',
    fontSize: "clamp(62px, 8.6vw, 158px)",
    lineHeight: "0.9",
    whiteSpace: "nowrap",
    textAlign: "left",
    letterSpacing: "0.015em",
    textShadow: "0 2px 2px rgba(0,0,0,0.28)",
    pointerEvents: "none"
  });
  stage.appendChild(distance);

  function createImageButton(src, alt, box, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", alt);
    Object.assign(button.style, {
      position: "absolute",
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      padding: "0",
      border: "0",
      background: "transparent",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      zIndex: "3"
    });

    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    Object.assign(img.style, {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain",
      pointerEvents: "none",
      userSelect: "none",
      webkitUserDrag: "none",
      transition: "transform 120ms ease"
    });

    button.appendChild(img);
    button.addEventListener("pointerdown", () => { img.style.transform = "scale(0.97)"; });
    button.addEventListener("pointerup", () => { img.style.transform = "scale(1)"; });
    button.addEventListener("pointercancel", () => { img.style.transform = "scale(1)"; });
    button.addEventListener("click", onClick);
    stage.appendChild(button);
    return button;
  }

  function currentDistanceMeters(result) {
    if (result === "win") return ROUTE_METERS;
    const maxScroll = Math.max(1, world.scrollWidth - game.clientWidth);
    const progress = Math.max(0, Math.min(1, worldX / maxScroll));
    return Math.round(progress * ROUTE_METERS);
  }

  function currentGameUrl() {
    return window.location.href.split("#")[0];
  }

  async function sharePayload(payload) {
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }

    const fallbackText = [payload.text, payload.url].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(fallbackText);
    } catch (_) {
      window.prompt("Скопируйте ссылку:", payload.url || fallbackText);
    }
  }

  function hideResultScreen() {
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
    overlay.style.pointerEvents = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function restartFromBeginning({ infinite = false } = {}) {
    hideResultScreen();
    window.finalSequenceActive = false;
    window.infiniteMode = infinite;
    tutorialShown = false;
    resetRun();
    running = true;
    lastFrameAt = performance.now();
  }

  createImageButton(
    "assets/UI/ПЗ_Поделиться Рекордом.png",
    "Поделиться рекордом",
    { left: "55.9%", top: "33.5%", width: "39.2%", height: "15.0%" },
    () => {
      const meters = Number(distance.dataset.meters || 0);
      sharePayload({
        title: "Маска человека",
        text: `Я пробежал ${meters} м в игре «Маска человека».`,
        url: currentGameUrl()
      });
    }
  );

  createImageButton(
    "assets/UI/ПЗ_Поделиться Игрой.png",
    "Поделиться игрой",
    { left: "55.9%", top: "49.7%", width: "39.2%", height: "15.0%" },
    () => sharePayload({
      title: "Маска человека",
      text: "Попробуй пройти игру «Маска человека».",
      url: currentGameUrl()
    })
  );

  createImageButton(
    "assets/UI/ПЗ_ПрочестьИсторию.png",
    "Прочесть историю",
    { left: "55.9%", top: "66.0%", width: "39.2%", height: "15.0%" },
    () => { window.location.href = STORY_URL; }
  );

  createImageButton(
    "assets/UI/ПЗ_Сначала.png",
    "Начать сначала",
    { left: "55.9%", top: "83.7%", width: "7.5%", height: "11.6%" },
    () => restartFromBeginning({ infinite: false })
  );

  createImageButton(
    "assets/UI/ПЗ_Беск_режим.png",
    "Бесконечный режим",
    { left: "65.5%", top: "83.7%", width: "7.5%", height: "11.6%" },
    () => restartFromBeginning({ infinite: true })
  );

  createImageButton(
    "assets/UI/ПЗ_Выход.png",
    "Выход",
    { left: "74.8%", top: "83.7%", width: "20.4%", height: "11.6%" },
    () => {
      window.close();
      window.setTimeout(() => {
        if (!window.closed) {
          if (window.history.length > 1) window.history.back();
          else window.location.replace("about:blank");
        }
      }, 120);
    }
  );

  overlay.appendChild(stage);
  game.appendChild(overlay);

  function fitStage() {
    const viewportAspect = innerWidth / innerHeight;
    const designAspect = 1654 / 927;
    if (viewportAspect > designAspect) {
      stage.style.height = "100%";
      stage.style.width = `${designAspect * innerHeight}px`;
    } else {
      stage.style.width = "100%";
      stage.style.height = `${innerWidth / designAspect}px`;
    }
  }

  fitStage();
  window.addEventListener("resize", fitStage);

  window.showResultScreen = function showResultScreen(result = "loss") {
    const meters = currentDistanceMeters(result);
    distance.dataset.meters = String(meters);
    distance.textContent = `${meters} М`;
    overlay.dataset.result = result;
    overlay.style.visibility = "visible";
    overlay.style.pointerEvents = "auto";
    overlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });
  };

  /* До ведьмы поражение показывает экран результата.
     После ведьмы — короткое падение и мгновенный рестарт от чекпоинта. */
  failRun = function failRunWithCheckpointAwareResult() {
    if (!running || window.finalSequenceActive) return;

    running = false;
    jump = null;
    wading = null;
    hero.classList.remove("wading");
    hero.style.transform = "";
    hero.classList.remove("running", "jumping");
    hero.classList.add("falling");

    window.setTimeout(() => {
      if (window.hasWitchCheckpoint?.()) {
        resetRun();
        return;
      }

      window.showResultScreen("loss");
    }, 520);
  };
})();
