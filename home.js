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

  initializeHomeStock();
  createReviewCarousel(reviewCarousel, reduceMotion);
  trackStorefrontActions();

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
    const total = scoopIds.size + yogurtIds.size;
    const stockCount = document.querySelector("#home-stock-count");
    const stockCta = document.querySelector("[data-stock-cta]");
    const favoritesSection = document.querySelector(".favorites-section");

    if (stockCount) stockCount.textContent = String(total);
    if (stockCta) stockCta.textContent = `${scoopIds.size} scoop flavors in stock`;

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
    const loadingFrames = new Array(frameCount);
    const lastFrame = frameCount - 1;
    let currentFrame = prefersReducedMotion ? lastFrame : 0;
    let targetFrame = currentFrame;
    let renderedFrame = -1;
    let pixelRatio = 1;
    let animationFrame = 0;
    let ready = false;
    let started = false;
    let filmObserver = null;

    if (prefersReducedMotion) {
      root.classList.add("is-reduced-motion");
    }

    resizeCanvas();
    startWhenNearby();

    return {
      resize: resizeCanvas,
      update: updateFromScroll,
    };

    async function initializeFrames() {
      if (prefersReducedMotion) {
        await loadFrame(lastFrame);
        ready = true;
        currentFrame = lastFrame;
        targetFrame = lastFrame;
        renderFrame(lastFrame);
        root.classList.add("is-ready");
        return;
      }

      await loadFrame(0);
      ready = true;
      renderFrame(0);
      root.classList.add("is-ready");
      if (loader) loader.setAttribute("aria-hidden", "true");
      updateFromScroll();
      prefetchCoarseFrames();
    }

    function loadFrame(index) {
      if (index < 0 || index >= frameCount) return Promise.resolve(null);
      if (frames[index]) return Promise.resolve(frames[index]);
      if (loadingFrames[index]) return loadingFrames[index];

      loadingFrames[index] = new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          frames[index] = image;
          resolve(image);
        };
        image.onerror = () => resolve(null);
        image.src = `${framePath}${String(index).padStart(3, "0")}.webp?v=${frameVersion}`;
      }).finally(() => {
        loadingFrames[index] = null;
      });

      return loadingFrames[index];
    }

    function startWhenNearby() {
      if (started) return;
      if ("IntersectionObserver" in window) {
        filmObserver = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          filmObserver.disconnect();
          filmObserver = null;
          startFilm();
        }, { rootMargin: "120% 0px" });
        filmObserver.observe(root);
      } else {
        startFilm();
      }
    }

    function startFilm() {
      if (started) return;
      started = true;
      initializeFrames();
    }

    function prefetchCoarseFrames() {
      const step = Math.max(8, Math.ceil(frameCount / 14));
      const indices = [];
      for (let index = step; index < lastFrame; index += step) indices.push(index);
      indices.push(lastFrame);

      const loadNext = async () => {
        while (indices.length) await loadFrame(indices.shift());
      };

      Promise.all([loadNext(), loadNext()]).then(requestFilmUpdate);
    }

    function prefetchFrameWindow(center) {
      const nearby = [center, center + 1, center - 1, center + 2, center - 2, center + 3, center - 3];
      Promise.all(nearby.map(loadFrame)).then(requestFilmUpdate);
    }

    function updateFromScroll() {
      if (prefersReducedMotion) return;
      if (!started) return;

      const bounds = root.getBoundingClientRect();
      const stickyTop = Number.parseFloat(window.getComputedStyle(stage).top) || 0;
      const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
      const progress = Math.min(1, Math.max(0, (stickyTop - bounds.top) / travel));

      root.style.setProperty("--film-progress", progress.toFixed(4));
      targetFrame = progress * lastFrame;
      prefetchFrameWindow(Math.round(targetFrame));
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
      const loadedFrame = findNearestLoadedFrame(safeIndex);
      if (!loadedFrame || renderedFrame === loadedFrame.index) return;
      const image = loadedFrame.image;

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
      context.fillStyle = "#fffdfb";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, x, y, drawWidth, drawHeight);
      renderedFrame = loadedFrame.index;
      canvas.dataset.renderedFrame = String(loadedFrame.index);
    }

    function findNearestLoadedFrame(index) {
      if (frames[index]) return { image: frames[index], index };

      for (let offset = 1; offset < frameCount; offset += 1) {
        if (frames[index - offset]) return { image: frames[index - offset], index: index - offset };
        if (frames[index + offset]) return { image: frames[index + offset], index: index + offset };
      }

      return null;
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

  function trackStorefrontActions() {
    for (const link of document.querySelectorAll("[data-track]")) {
      link.addEventListener("click", () => {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", "storefront_action", {
          action_name: link.dataset.track,
          link_url: link.href,
        });
      });
    }
  }
})();
