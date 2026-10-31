(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const driftItems = Array.from(document.querySelectorAll("[data-drift]"));
  const logo = document.querySelector("[data-logo-scroll]");
  const hero = document.querySelector(".home-hero");
  const reviewCarousel = document.querySelector("[data-review-carousel]");
  const filmControllers = Array.from(document.querySelectorAll("[data-scroll-film]"))
    .map((root) => createScrollFilm(root, reduceMotion))
    .filter(Boolean);
  let scrollFrame = 0;

  // Wrapped navigation and browser zoom can change the sticky header height.
  const filmHeader = document.querySelector(".home-topbar");
  function updateFilmViewport() {
    const headerHeight = filmHeader && getComputedStyle(filmHeader).position === "sticky"
      ? filmHeader.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--film-header-height", `${headerHeight}px`);
    filmControllers.forEach((controller) => controller.resize());
  }
  updateFilmViewport();
  if ("ResizeObserver" in window) {
    const filmResizeObserver = new ResizeObserver(updateFilmViewport);
    if (filmHeader) filmResizeObserver.observe(filmHeader);
    document.querySelectorAll(".scroll-film-visual").forEach((visual) => filmResizeObserver.observe(visual));
  }
  window.addEventListener("resize", updateFilmViewport);

  initializeHomeStock();
  createReviewCarousel(reviewCarousel, reduceMotion);

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

  async function initializeHomeStock() {
    if (!window.SweetEscapeStock) return;
    const scoopFlavors = window.SWEET_ESCAPE_FLAVORS?.flavors || [];
    const yogurtFlavors = window.SWEET_ESCAPE_YOGURT_FLAVORS?.flavors || [];
    const gelatoFlavors = window.SWEET_ESCAPE_GELATO_FLAVORS?.flavors || [];
    const stock = await window.SweetEscapeStock.load();
    const scoopIds = window.SweetEscapeStock.idsFor(
      stock,
      "scoops",
      scoopFlavors.map((flavor) => flavor.id)
    );
    const yogurtIds = window.SweetEscapeStock.idsFor(
      stock,
      "yogurt",
      yogurtFlavors.map((flavor) => flavor.id)
    );
    const gelatoIds = window.SweetEscapeStock.idsFor(
      stock,
      "gelato",
      gelatoFlavors.map((flavor) => flavor.id)
    );
    const total = scoopIds.size + yogurtIds.size + gelatoIds.size;
    const stockCount = document.querySelector("#home-stock-count");
    const stockCta = document.querySelector("[data-stock-cta]");
    const favoritesSection = document.querySelector(".favorites-section");

    if (stockCount) stockCount.textContent = String(total);
    if (stockCta) stockCta.textContent = `See ${total} treats in stock`;

    let visibleFavorites = 0;
    for (const card of document.querySelectorAll(".favorite-card[data-flavor-id]")) {
      const isAvailable = scoopIds.has(card.dataset.flavorId);
      card.hidden = !isAvailable;
      if (isAvailable) visibleFavorites += 1;
    }
    if (favoritesSection) favoritesSection.hidden = visibleFavorites === 0;
  }

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
    const canvas = root.querySelector("canvas");
    const stage = root.querySelector(".scroll-film-stage");
    const loader = root.querySelector(".scroll-film-loader");
    const context = canvas?.getContext("2d", { alpha: false });
    const frameCount = Number(root.dataset.frameCount || 0);
    if (!canvas || !stage || !context || frameCount < 2) return null;

    const framePath = root.dataset.framePath;
    const frameVersion = root.dataset.frameVersion || "1";
    const lastFrame = frameCount - 1;
    const firstFrame = Number(root.dataset.frameStart || 0);
    const sourceWidth = Number(canvas.getAttribute("width"));
    const sourceHeight = Number(canvas.getAttribute("height"));
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const still = prefersReducedMotion || Boolean(connection?.saveData) || /(?:^|-)2g$/.test(connection?.effectiveType || "");
    const frames = new Map();
    const loading = new Set();
    const failures = new Set();
    const cacheLimit = 36;
    let queue = [];
    let currentFrame = still ? lastFrame : firstFrame;
    let targetFrame = currentFrame;
    let renderedFrame = -1;
    let animationFrame = 0;
    let previousTime = 0;
    let started = false;
    let nearby = false;
    let direction = 1;
    let decodeWidth = 0;
    let generation = 0;

    if (still) root.classList.add("is-reduced-motion");
    resizeCanvas();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        nearby = entries.some((entry) => entry.isIntersecting);
        if (nearby) {
          started = true;
          updateFromScroll();
        } else {
          queue = [];
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
          previousTime = 0;
        }
      }, { rootMargin: "75% 0px" });
      observer.observe(stage);
    } else {
      nearby = started = true;
      updateFromScroll();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        previousTime = 0;
      } else if (nearby) updateFromScroll();
    });

    return { resize: resizeCanvas, update: updateFromScroll };

    function planFrames() {
      // Always decode the actual playhead first. A sparse, nearest-frame cache
      // caused visible jumps and could even display motion in reverse.
      const wanted = [];
      const addPair = (value) => wanted.push(Math.floor(value), Math.ceil(value));
      addPair(currentFrame);
      addPair(targetFrame);
      if (!still) {
        for (let offset = 1; offset <= 14; offset += 1) {
          wanted.push(Math.round(currentFrame) + direction * offset);
          wanted.push(Math.round(targetFrame) + direction * offset);
          if (offset <= 5) wanted.push(Math.round(targetFrame) - direction * offset);
        }
      }
      queue = [...new Set(wanted)].filter((index) => index >= firstFrame && index <= lastFrame
        && !frames.has(index) && !loading.has(index) && !failures.has(index));
      pumpQueue();
    }

    function pumpQueue() {
      if (!nearby || document.hidden) return;
      while (loading.size < 4 && queue.length) loadFrame(queue.shift());
    }

    function loadFrame(index) {
      loading.add(index);
      const version = generation;
      const width = decodeWidth;
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try {
          // Decode outside the animation callback; cache display-sized surfaces
          // instead of hundreds of full-resolution photographs.
          if (image.decode) await image.decode();
          if (version !== generation) return;
          const surface = document.createElement("canvas");
          surface.width = width;
          surface.height = Math.round(width * sourceHeight / sourceWidth);
          const paint = surface.getContext("2d", { alpha: false });
          paint.fillStyle = "#fffdfb";
          paint.fillRect(0, 0, surface.width, surface.height);
          if (root.id === "cookie-dough-story") {
            // A restrained contact shadow keeps the cup on a surface.
            paint.save();
            paint.translate(width * 0.5, surface.height * 0.947);
            paint.scale(width * 0.31, surface.height * 0.025);
            const shadow = paint.createRadialGradient(0, 0, 0, 0, 0, 1);
            shadow.addColorStop(0, "rgba(77, 48, 30, 0.13)");
            shadow.addColorStop(1, "rgba(77, 48, 30, 0)");
            paint.fillStyle = shadow;
            paint.fillRect(-1, -1, 2, 2);
            paint.restore();
          }
          paint.imageSmoothingEnabled = true;
          paint.imageSmoothingQuality = "high";
          paint.drawImage(image, 0, 0, surface.width, surface.height);
          frames.set(index, surface);
          trimCache();
          requestFilmUpdate();
        } catch {
          if (version === generation) failures.add(index);
        } finally {
          finish();
        }
      };
      image.onerror = () => {
        if (version === generation) failures.add(index);
        finish();
      };
      image.src = `${framePath}${String(index).padStart(3, "0")}.webp?v=${frameVersion}`;

      function finish() {
        image.onload = image.onerror = null;
        loading.delete(index);
        if (version !== generation) planFrames();
        else pumpQueue();
        // A failed frame leaves the last good picture/poster in place.
        if (failures.size && loader) loader.textContent = "";
      }
    }

    function trimCache() {
      const protectedFrames = new Set([
        Math.floor(currentFrame), Math.ceil(currentFrame),
        Math.floor(targetFrame), Math.ceil(targetFrame),
      ]);
      const candidates = [...frames.keys()].filter((index) => !protectedFrames.has(index))
        .sort((a, b) => Math.abs(b - targetFrame) - Math.abs(a - targetFrame));
      while (frames.size > cacheLimit && candidates.length) frames.delete(candidates.shift());
    }

    function updateFromScroll() {
      if (!started || !nearby) return;
      if (!still) {
        const bounds = root.getBoundingClientRect();
        const stickyTop = Number.parseFloat(window.getComputedStyle(stage).top) || 0;
        const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
        const progress = Math.min(1, Math.max(0, (stickyTop - bounds.top) / travel));
        // Reserve a brief finish so the completed dessert can be appreciated.
        const assembly = Math.min(1, Math.max(0, (progress - 0.025) / 0.88));
        const next = firstFrame + assembly * (lastFrame - firstFrame);
        direction = next >= targetFrame ? 1 : -1;
        targetFrame = next;
        root.style.setProperty("--film-progress", progress.toFixed(4));
      }
      planFrames();
      requestFilmUpdate();
    }

    function requestFilmUpdate() {
      if (animationFrame || !nearby || document.hidden) return;
      animationFrame = requestAnimationFrame(animateToTarget);
    }

    function animateToTarget(time) {
      animationFrame = 0;
      const elapsed = previousTime ? Math.min(50, time - previousTime) : 1000 / 60;
      previousTime = time;
      const distance = targetFrame - currentFrame;
      // Time-based damping behaves the same on 60 Hz and 120 Hz screens.
      currentFrame = Math.abs(distance) < 0.015 ? targetFrame
        : currentFrame + distance * (1 - Math.exp(-elapsed / 90));
      if (Math.abs(targetFrame - currentFrame) < 0.015) currentFrame = targetFrame;
      renderFrame(currentFrame);
      planFrames();
      if (Math.abs(targetFrame - currentFrame) >= 0.015) requestFilmUpdate();
      else previousTime = 0;
    }

    function resizeCanvas() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(bounds.width * pixelRatio);
      const height = Math.round(bounds.height * pixelRatio);
      if (canvas.width === width && canvas.height === height && decodeWidth) return;
      canvas.width = width;
      canvas.height = height;
      renderedFrame = -1;
      const nextDecodeWidth = Math.max(1, Math.min(720, Math.ceil(Math.min(width, height * sourceWidth / sourceHeight))));
      if (nextDecodeWidth !== decodeWidth) {
        decodeWidth = nextDecodeWidth;
        generation += 1;
        frames.clear();
        failures.clear();
        root.classList.remove("is-ready");
      }
      renderFrame(currentFrame);
      if (started) updateFromScroll();
    }

    function renderFrame(value) {
      const lower = Math.floor(value);
      const upper = Math.ceil(value);
      const first = frames.get(lower);
      const second = frames.get(upper);
      // Never substitute a distant frame: hold the picture until the correct
      // adjacent pair arrives. Blend opaque surfaces to avoid alpha halos.
      if (!first || (!second && upper !== lower) || renderedFrame === value) return;
      const scale = Math.min(canvas.width / first.width, canvas.height / first.height);
      const width = first.width * scale;
      const height = first.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) * 0.28;
      context.globalAlpha = 1;
      context.fillStyle = "#fffdfb";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(first, x, y, width, height);
      if (upper !== lower) {
        context.globalAlpha = value - lower;
        context.drawImage(second, x, y, width, height);
        context.globalAlpha = 1;
      }
      renderedFrame = value;
      canvas.dataset.renderedFrame = value.toFixed(3);
      root.classList.add("is-ready");
      if (loader) loader.setAttribute("aria-hidden", "true");
    }
  }

  function createReviewCarousel(root, prefersReducedMotion) {
    if (!root) return;

    const track = root.querySelector("[data-review-track]");
    const previousButton = root.querySelector("[data-review-prev]");
    const nextButton = root.querySelector("[data-review-next]");
    const currentLabel = root.querySelector("[data-review-current]");
    const cards = Array.from(root.querySelectorAll(".google-review-card"));

    if (!track || !previousButton || !nextButton || !currentLabel || !cards.length) return;

    let activeIndex = 0;
    let carouselFrame = 0;

    previousButton.addEventListener("click", () => moveTo(activeIndex - 1));
    nextButton.addEventListener("click", () => moveTo(activeIndex + 1));
    track.addEventListener("scroll", scheduleCarouselUpdate, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveTo(activeIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveTo(activeIndex + 1);
      }
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(scheduleCarouselUpdate);
      resizeObserver.observe(track);
    } else {
      window.addEventListener("resize", scheduleCarouselUpdate);
    }

    updateControls();

    function moveTo(index) {
      activeIndex = Math.min(cards.length - 1, Math.max(0, index));
      const firstOffset = cards[0].offsetLeft;
      const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const destination = Math.min(maximumScroll, cards[activeIndex].offsetLeft - firstOffset);

      track.scrollTo({
        left: destination,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      updateControls();
    }

    function scheduleCarouselUpdate() {
      if (carouselFrame) return;
      carouselFrame = requestAnimationFrame(() => {
        carouselFrame = 0;
        updateActiveIndex();
        updateControls();
      });
    }

    function updateActiveIndex() {
      const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);

      if (maximumScroll - track.scrollLeft <= 3) {
        activeIndex = cards.length - 1;
        return;
      }

      const firstOffset = cards[0].offsetLeft;
      let nearestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - firstOffset - track.scrollLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          activeIndex = index;
        }
      });
    }

    function updateControls() {
      currentLabel.textContent = String(activeIndex + 1);
      previousButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex === cards.length - 1;
    }
  }

})();
