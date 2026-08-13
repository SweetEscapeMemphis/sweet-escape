(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const driftItems = Array.from(document.querySelectorAll("[data-drift]"));
  const logo = document.querySelector("[data-logo-scroll]");
  const hero = document.querySelector(".home-hero");
  const filmControllers = Array.from(document.querySelectorAll("[data-scroll-film]"))
    .map((root) => createScrollFilm(root, reduceMotion))
    .filter(Boolean);
  let scrollFrame = 0;

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px", threshold: 0.01 }
  );

  revealItems.forEach((item) => observer.observe(item));
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", handleResize);
  scheduleScrollUpdate();

  function handleResize() {
    filmControllers.forEach((controller) => controller.resize());
    scheduleScrollUpdate();
  }

  function scheduleScrollUpdate() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const scrollY = window.scrollY;

      for (const item of driftItems) {
        const amount = Number(item.dataset.drift || 0.1);
        item.style.setProperty("--scroll-shift", `${(scrollY * amount).toFixed(1)}px`);
      }

      if (logo && hero) {
        const progress = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight * 0.8)));
        logo.style.setProperty("--logo-scroll-y", `${(-36 * progress).toFixed(1)}px`);
        logo.style.setProperty("--logo-scroll-tilt", `${(-2.4 * progress).toFixed(2)}deg`);
        logo.style.setProperty("--logo-scroll-scale", (1 - 0.08 * progress).toFixed(3));
      }

      filmControllers.forEach((controller) => controller.update());
    });
  }

  function createScrollFilm(root, prefersReducedMotion) {
    if (!root) return null;

    const canvas = root.querySelector("canvas");
    const stage = root.querySelector(".scroll-film-stage");
    const loader = root.querySelector(".scroll-film-loader");
    const context = canvas?.getContext("2d", { alpha: false });
    const frameCount = Number(root.dataset.frameCount || 0);
    const framePath = root.dataset.framePath || "assets/media/cookie-dough-frames/frame-";
    const frameVersion = root.dataset.frameVersion || "1";

    if (!canvas || !stage || !context || frameCount < 2) return null;

    const frames = new Array(frameCount);
    const lastFrame = frameCount - 1;
    let currentFrame = prefersReducedMotion ? lastFrame : 0;
    let targetFrame = currentFrame;
    let renderedFrame = -1;
    let pixelRatio = 1;
    let animationFrame = 0;
    let ready = false;

    if (prefersReducedMotion) {
      root.classList.add("is-reduced-motion");
    }

    resizeCanvas();
    preloadFrames();

    return {
      resize: resizeCanvas,
      update: updateFromScroll,
    };

    async function preloadFrames() {
      if (prefersReducedMotion) {
        await loadFrame(lastFrame);
        ready = true;
        currentFrame = lastFrame;
        targetFrame = lastFrame;
        renderFrame(lastFrame);
        root.classList.add("is-ready");
        return;
      }

      await Promise.all([loadFrame(0), loadFrame(lastFrame)]);
      renderFrame(0);

      const queue = Array.from({ length: Math.max(0, frameCount - 2) }, (_, index) => index + 1);
      const workerCount = Math.min(8, queue.length);

      await Promise.all(
        Array.from({ length: workerCount }, async () => {
          while (queue.length) {
            const index = queue.shift();
            await loadFrame(index);
          }
        })
      );

      ready = true;
      root.classList.add("is-ready");
      if (loader) loader.setAttribute("aria-hidden", "true");
      updateFromScroll();
    }

    function loadFrame(index) {
      return new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          frames[index] = image;
          resolve();
        };
        image.onerror = resolve;
        image.src = `${framePath}${String(index).padStart(3, "0")}.webp?v=${frameVersion}`;
      });
    }

    function updateFromScroll() {
      if (prefersReducedMotion) return;

      const bounds = root.getBoundingClientRect();
      const stickyTop = Number.parseFloat(window.getComputedStyle(stage).top) || 0;
      const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
      const progress = Math.min(1, Math.max(0, (stickyTop - bounds.top) / travel));

      root.style.setProperty("--film-progress", progress.toFixed(4));
      targetFrame = progress * lastFrame;
      requestFilmUpdate();
    }

    function requestFilmUpdate() {
      if (!ready || animationFrame) return;
      animationFrame = requestAnimationFrame(animateToTarget);
    }

    function animateToTarget() {
      animationFrame = 0;
      const distance = targetFrame - currentFrame;

      if (Math.abs(distance) < 0.08) {
        currentFrame = targetFrame;
      } else {
        currentFrame += distance * 0.24;
      }

      renderFrame(Math.round(currentFrame));

      if (Math.abs(targetFrame - currentFrame) >= 0.08) {
        requestFilmUpdate();
      }
    }

    function resizeCanvas() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const nextWidth = Math.round(bounds.width * pixelRatio);
      const nextHeight = Math.round(bounds.height * pixelRatio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        renderedFrame = -1;
      }

      renderFrame(Math.round(currentFrame));
    }

    function renderFrame(index) {
      const safeIndex = Math.min(lastFrame, Math.max(0, index));
      const image = findNearestLoadedFrame(safeIndex);
      if (!image || renderedFrame === safeIndex) return;

      const width = canvas.width / pixelRatio;
      const height = canvas.height / pixelRatio;
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, x, y, drawWidth, drawHeight);
      renderedFrame = safeIndex;
      canvas.dataset.renderedFrame = String(safeIndex);
    }

    function findNearestLoadedFrame(index) {
      if (frames[index]) return frames[index];

      for (let offset = 1; offset < frameCount; offset += 1) {
        if (frames[index - offset]) return frames[index - offset];
        if (frames[index + offset]) return frames[index + offset];
      }

      return null;
    }
  }
})();
