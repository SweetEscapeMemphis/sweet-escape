(async function () {
  const payload = window.SWEET_ESCAPE_FLAVORS;
  const flavors = payload.flavors;
  const list = document.querySelector("#flavors");
  const searchInput = document.querySelector("#search-input");
  const categoryFilters = document.querySelector("#category-filters");
  const allergenFilter = document.querySelector("#allergen-filter");
  const countLabel = document.querySelector("#flavor-count");
  const heroCanvas = document.querySelector("#hero-canvas");
  const imageEditToggle = document.querySelector("#image-edit-toggle");
  const imageEditorStatus = document.querySelector("#image-editor-status");
  const categories = ["All", "Ice Cream", "Sherbet", "Sorbet", "Yogurt", "No Sugar Added"];
  const requestedCategory = new URLSearchParams(window.location.search).get("category");
  const state = {
    query: "",
    category: categories.includes(requestedCategory) ? requestedCategory : "All",
    allergen: "All",
  };
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pngScoopIds = new Set(["udderly-chocolate", "rocky-road"]);
  const customImageUrls = new Map();
  let visibleCards = [];
  let scrollFrame = 0;
  let imageEditing = false;
  let imageDatabasePromise = null;

  countLabel.textContent = String(flavors.length);
  buildCategoryButtons();
  render();
  scrollToRequestedFlavor();
  renderHero();
  initializeImageEditor();
  requestAnimationFrame(() => {
    renderHero();
    scheduleScrollUpdate();
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  allergenFilter.addEventListener("change", () => {
    state.allergen = allergenFilter.value;
    render();
  });

  window.addEventListener("resize", () => {
    renderHero();
    scheduleScrollUpdate();
  });
  window.addEventListener("load", () => {
    renderHero();
    scheduleScrollUpdate();
  });
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });

  if (imageEditToggle) {
    imageEditToggle.addEventListener("click", () => {
      imageEditing = !imageEditing;
      document.body.classList.toggle("image-editing", imageEditing);
      imageEditToggle.setAttribute("aria-pressed", String(imageEditing));
      imageEditToggle.textContent = imageEditing ? "Done editing" : "Edit images";
      setImageEditorStatus(imageEditing ? "Image editing is on." : "");
    });
  }

  list.addEventListener("change", (event) => {
    const input = event.target.closest(".scoop-image-input");
    const file = input?.files?.[0];
    if (!input || !file) return;
    updateFlavorImage(input.dataset.flavorId, file);
    input.value = "";
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".image-restore-button");
    if (!button) return;
    restoreFlavorImage(button.dataset.flavorId);
  });

  list.addEventListener("dragover", (event) => {
    if (!imageEditing || !hasImageFile(event.dataTransfer)) return;
    const panel = event.target.closest(".scoop-panel");
    if (!panel) return;
    event.preventDefault();
    panel.classList.add("is-dragging");
  });

  list.addEventListener("dragleave", (event) => {
    const panel = event.target.closest(".scoop-panel");
    if (panel && !panel.contains(event.relatedTarget)) panel.classList.remove("is-dragging");
  });

  list.addEventListener("drop", (event) => {
    if (!imageEditing) return;
    const panel = event.target.closest(".scoop-panel");
    const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
    if (!panel || !file) return;
    event.preventDefault();
    panel.classList.remove("is-dragging");
    updateFlavorImage(panel.dataset.flavorId, file);
  });

  function buildCategoryButtons() {
    categoryFilters.innerHTML = "";
    for (const category of categories) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "segment-button";
      button.textContent = category;
      button.setAttribute("aria-pressed", category === state.category ? "true" : "false");
      button.addEventListener("click", () => {
        state.category = category;
        for (const control of categoryFilters.querySelectorAll("button")) {
          control.setAttribute("aria-pressed", control.textContent === category ? "true" : "false");
        }
        render();
      });
      categoryFilters.append(button);
    }
  }

  function render() {
    const filtered = flavors.filter((flavor) => {
      const haystack = `${flavor.name} ${flavor.category} ${flavor.allergens.contains}`.toLowerCase();
      const matchesQuery = !state.query || haystack.includes(state.query);
      const matchesCategory = state.category === "All" || flavor.category === state.category;
      const matchesAllergen =
        state.allergen === "All" || flavor.allergens.containsFlags.includes(state.allergen);
      return matchesQuery && matchesCategory && matchesAllergen;
    });

    list.innerHTML = "";
    visibleCards = [];

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No in-stock flavors match those filters.";
      list.append(empty);
      return;
    }

    filtered.forEach((flavor, index) => {
      const profile = profileFor(flavor);
      const card = document.createElement("article");
      card.className = "flavor-card";
      card.id = flavor.id;
      card.dataset.flavorId = flavor.id;
      card.style.setProperty("--accent", profile.accent);
      card.style.setProperty("--accent-2", profile.accent2);
      card.innerHTML = cardTemplate(flavor, index);
      list.append(card);
      applyCustomImage(card, flavor.id);
    });

    attachRevealObserver();
    scheduleScrollUpdate();
  }

  function cardTemplate(flavor, index) {
    const nutrition = flavor.nutrition;
    const contains = escapeHTML(flavor.allergens.contains);
    const equipment = escapeHTML(flavor.allergens.equipment || "Not listed");
    const sourceDetails = [`Serving: ${nutrition.servingSize}`];
    if (nutrition.sodiumMg) sourceDetails.push(`Sodium ${nutrition.sodiumMg}mg`);
    if (nutrition.addedSugarsG) sourceDetails.push(`Added sugars ${nutrition.addedSugarsG}g`);
    const pagePill = flavor.pdfPage
      ? `<span class="page-pill">PDF p. ${escapeHTML(flavor.pdfPage)}</span>`
      : "";
    const scoopExtension = pngScoopIds.has(flavor.id) ? "png" : "webp";
    return `
      <div class="scoop-panel" data-flavor-id="${escapeHTML(flavor.id)}">
        <img
          class="scoop-image"
          src="assets/scoops/responsive/${escapeHTML(flavor.id)}-300.${scoopExtension}"
          srcset="assets/scoops/responsive/${escapeHTML(flavor.id)}-300.${scoopExtension} 300w, assets/scoops/responsive/${escapeHTML(flavor.id)}-600.${scoopExtension} 600w"
          sizes="(max-width: 720px) 78vw, 38vw"
          width="600"
          height="600"
          alt="Photo realistic scoop of ${escapeHTML(flavor.name)} ice cream"
          loading="lazy"
          decoding="async"
        >
        <div class="image-edit-controls">
          <label class="image-upload-button">
            <span>Choose image</span>
            <input
              class="scoop-image-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              data-flavor-id="${escapeHTML(flavor.id)}"
              aria-label="Choose image for ${escapeHTML(flavor.name)}"
            >
          </label>
          <button
            class="image-restore-button"
            type="button"
            data-flavor-id="${escapeHTML(flavor.id)}"
          >
            Restore original
          </button>
        </div>
      </div>
      <div class="flavor-copy">
        <div class="flavor-topline">
          <span class="flavor-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="category-pill">${escapeHTML(flavor.category)}</span>
          ${pagePill}
        </div>
        <h3>${escapeHTML(flavor.name)}</h3>
        <div class="nutrition-grid" aria-label="Nutrition facts">
          ${nutritionItem(nutrition.calories, "Calories")}
          ${nutritionItem(`${nutrition.totalFatG}g`, "Fat")}
          ${nutritionItem(`${nutrition.totalCarbsG}g`, "Carbs")}
          ${nutritionItem(`${nutrition.totalSugarsG}g`, "Sugars")}
          ${nutritionItem(`${nutrition.proteinG}g`, "Protein")}
        </div>
        <div class="allergen-layout">
          <div class="allergen-box">
            <strong>Contains</strong>
            <span>${contains}</span>
          </div>
          <div class="allergen-box">
            <strong>Allergens</strong>
            <span>${equipment}</span>
          </div>
        </div>
        <p class="source-line">${escapeHTML(sourceDetails.join(" | "))}</p>
      </div>
    `;
  }

  function nutritionItem(value, label) {
    return `<div class="nutrition-item"><strong>${escapeHTML(value)}</strong><span>${escapeHTML(label)}</span></div>`;
  }

  function scrollToRequestedFlavor() {
    const flavorId = decodeURIComponent(window.location.hash.slice(1));
    if (!flavors.some((flavor) => flavor.id === flavorId)) return;

    requestAnimationFrame(() => {
      document.getElementById(flavorId)?.scrollIntoView({ block: "start" });
    });
  }

  async function initializeImageEditor() {
    if (!("indexedDB" in window)) return;
    try {
      imageDatabasePromise = openImageDatabase();
      const database = await imageDatabasePromise;
      const records = await readStoredImages(database);
      for (const record of records) {
        replaceCustomImageUrl(record.id, record.blob);
      }
      applyAllCustomImages();
    } catch (error) {
      imageDatabasePromise = null;
    }
  }

  async function updateFlavorImage(flavorId, file) {
    if (!flavorId || !file.type.startsWith("image/")) {
      setImageEditorStatus("Please choose a PNG, JPEG, or WebP image.");
      return;
    }

    let persisted = false;
    try {
      const database = imageDatabasePromise ? await imageDatabasePromise : null;
      if (database) {
        await writeStoredImage(database, flavorId, file);
        persisted = true;
      }
    } catch (error) {
      persisted = false;
    }

    replaceCustomImageUrl(flavorId, file);
    applyAllCustomImages(flavorId);
    const flavor = flavors.find((item) => item.id === flavorId);
    const suffix = persisted ? "" : " for this session";
    setImageEditorStatus(`${flavor?.name || "Flavor"} image updated${suffix}.`);
  }

  async function restoreFlavorImage(flavorId) {
    try {
      const database = imageDatabasePromise ? await imageDatabasePromise : null;
      if (database) await deleteStoredImage(database, flavorId);
    } catch (error) {
      setImageEditorStatus("The saved image could not be removed.");
      return;
    }

    const currentUrl = customImageUrls.get(flavorId);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    customImageUrls.delete(flavorId);
    applyAllCustomImages(flavorId);
    const flavor = flavors.find((item) => item.id === flavorId);
    setImageEditorStatus(`${flavor?.name || "Flavor"} restored.`);
  }

  function applyAllCustomImages(flavorId) {
    const selector = flavorId
      ? `.flavor-card[data-flavor-id="${CSS.escape(flavorId)}"]`
      : ".flavor-card";
    for (const card of list.querySelectorAll(selector)) {
      applyCustomImage(card, card.dataset.flavorId);
    }
  }

  function applyCustomImage(card, flavorId) {
    const customUrl = customImageUrls.get(flavorId);
    const image = card.querySelector(".scoop-image");
    if (!image) return;
    if (customUrl) {
      image.src = customUrl;
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
    } else {
      const extension = pngScoopIds.has(flavorId) ? "png" : "webp";
      image.src = `assets/scoops/responsive/${flavorId}-300.${extension}`;
      image.srcset = `assets/scoops/responsive/${flavorId}-300.${extension} 300w, assets/scoops/responsive/${flavorId}-600.${extension} 600w`;
      image.sizes = "(max-width: 720px) 78vw, 38vw";
    }
    card.classList.toggle("has-custom-image", Boolean(customUrl));
  }

  function replaceCustomImageUrl(flavorId, blob) {
    const currentUrl = customImageUrls.get(flavorId);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    customImageUrls.set(flavorId, URL.createObjectURL(blob));
  }

  function setImageEditorStatus(message) {
    imageEditorStatus.textContent = message;
  }

  function hasImageFile(dataTransfer) {
    return Array.from(dataTransfer?.items || []).some(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    );
  }

  function openImageDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("sweet-escape-images", 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains("images")) {
          request.result.createObjectStore("images", { keyPath: "id" });
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function readStoredImages(database) {
    return new Promise((resolve, reject) => {
      const request = database.transaction("images", "readonly").objectStore("images").getAll();
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function writeStoredImage(database, id, blob) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").put({ id, blob });
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
      transaction.addEventListener("abort", () => reject(transaction.error));
    });
  }

  function deleteStoredImage(database, id) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").delete(id);
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
      transaction.addEventListener("abort", () => reject(transaction.error));
    });
  }

  function attachRevealObserver() {
    const cards = Array.from(list.querySelectorAll(".flavor-card"));
    if (!motionOK) {
      cards.forEach((card) => card.classList.add("is-visible"));
      visibleCards = cards;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (!visibleCards.includes(entry.target)) visibleCards.push(entry.target);
          } else {
            visibleCards = visibleCards.filter((card) => card !== entry.target);
          }
        }
        scheduleScrollUpdate();
      },
      { rootMargin: "12% 0px 12% 0px", threshold: 0.14 }
    );

    cards.forEach((card) => observer.observe(card));
  }

  function scheduleScrollUpdate() {
    if (!motionOK || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateScrollVars();
    });
  }

  function updateScrollVars() {
    const height = window.innerHeight || 1;
    for (const card of visibleCards) {
      const rect = card.getBoundingClientRect();
      const progress = clamp((height - rect.top) / (height + rect.height), 0, 1);
      const lift = (0.5 - progress) * 54;
      const tilt = (progress - 0.5) * 7;
      const image = card.querySelector(".scoop-image");
      if (image) {
        image.style.setProperty("--scroll-y", `${lift.toFixed(1)}px`);
        image.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
      }
    }
  }

  function profileFor(flavor) {
    const text = `${flavor.name} ${flavor.sourceName}`.toLowerCase();
    let base = ["#f4dfb7", "#fff2ce"];
    let accent = "#ff66c4";
    let accent2 = "#38b6ff";

    if (has(text, ["chocolate", "fudge", "brownie", "malt", "moose", "pothole", "pot hole"])) {
      base = ["#6a3827", "#2f1713"];
      accent = "#b66b45";
      accent2 = "#ffd761";
    }
    if (has(text, ["vanilla", "cake", "cheesecake", "cookie dough", "oreo", "pudding"])) {
      base = ["#fff3d2", "#f0d59e"];
      accent = "#ff66c4";
      accent2 = "#38b6ff";
    }
    if (has(text, ["strawberry", "raspberry", "cherry", "blackberry", "berry"])) {
      base = ["#ff8fb7", "#8d224d"];
      accent = "#ff66c4";
      accent2 = "#612b76";
    }
    if (has(text, ["mint", "pistachio", "lime"])) {
      base = ["#b9f3c5", "#4ba66f"];
      accent = "#64d8b6";
      accent2 = "#38b6ff";
    }
    if (has(text, ["orange", "peach", "lemon", "banana", "apple", "carrot"])) {
      base = ["#ffd86a", "#f08f43"];
      accent = "#ffd761";
      accent2 = "#ff66c4";
    }
    if (has(text, ["coffee", "mocha", "toffee", "caramel", "praline", "pecan", "walnut", "almond"])) {
      base = ["#d29b61", "#7b4428"];
      accent = "#d98a42";
      accent2 = "#64d8b6";
    }
    if (has(text, ["blue moon", "cotton", "superman", "play dough", "unicorn", "traffic", "rainbow"])) {
      base = ["#38b6ff", "#ff66c4", "#ffd761"];
      accent = "#38b6ff";
      accent2 = "#ff66c4";
    }
    if (flavor.category === "Sorbet") {
      accent = "#64d8b6";
      accent2 = "#ff66c4";
    }

    const mixins = [];
    if (has(text, ["chip", "chocolate", "fudge", "oreo", "cookie", "brownie", "malt"])) mixins.push("chips");
    if (has(text, ["pecan", "almond", "walnut", "cashew", "nut", "praline"])) mixins.push("nuts");
    if (has(text, ["cherry", "berry", "strawberry", "raspberry", "blackberry", "peach", "apple"])) mixins.push("fruit");
    if (has(text, ["cake", "anniversary", "unicorn", "play dough", "superman", "cotton", "traffic"])) mixins.push("sprinkles");
    if (has(text, ["caramel", "toffee", "turtle", "moose", "bullseye", "peanut", "fudge", "cheesecake"])) mixins.push("ribbon");

    return { base, accent, accent2, mixins };
  }

  function renderScoop(canvas, flavor, profile) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const rand = seededRandom(hashCode(flavor.id));
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 16);
    ctx.rotate((rand() - 0.5) * 0.1);

    ctx.fillStyle = "rgba(38, 22, 34, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 148, 134, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    const path = new Path2D();
    const points = 34;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = 1 + (rand() - 0.5) * 0.17 + Math.sin(angle * 3 + rand()) * 0.025;
      const radiusX = 148 * wobble;
      const radiusY = 136 * (1 + (rand() - 0.5) * 0.14);
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY - 22;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.closePath();

    ctx.save();
    ctx.shadowColor = "rgba(38, 22, 34, 0.26)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = profile.base[0];
    ctx.fill(path);
    ctx.restore();

    ctx.save();
    ctx.clip(path);
    const gradient = ctx.createRadialGradient(-58, -92, 8, 8, 4, 220);
    gradient.addColorStop(0, lighten(profile.base[0], 0.48));
    gradient.addColorStop(0.42, profile.base[0]);
    gradient.addColorStop(1, darken(profile.base[1] || profile.base[0], 0.32));
    ctx.fillStyle = gradient;
    ctx.fillRect(-220, -220, 440, 440);

    if (profile.base.length > 2) {
      drawMulticolorRibbons(ctx, rand, profile.base);
    }
    if (profile.mixins.includes("ribbon")) drawSauceRibbons(ctx, rand, profile);
    drawTexture(ctx, rand, profile);
    if (profile.mixins.includes("chips")) drawChips(ctx, rand, 42);
    if (profile.mixins.includes("nuts")) drawNuts(ctx, rand, 28);
    if (profile.mixins.includes("fruit")) drawFruit(ctx, rand, profile, 28);
    if (profile.mixins.includes("sprinkles")) drawSprinkles(ctx, rand, 46);

    ctx.globalCompositeOperation = "screen";
    const shine = ctx.createRadialGradient(-78, -90, 0, -78, -90, 92);
    shine.addColorStop(0, "rgba(255,255,255,0.46)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(-220, -220, 440, 440);
    ctx.restore();

    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.44)";
    ctx.stroke(path);
    ctx.restore();
  }

  function drawTexture(ctx, rand, profile) {
    for (let i = 0; i < 110; i++) {
      const x = randBetween(rand, -136, 136);
      const y = randBetween(rand, -140, 104);
      const r = randBetween(rand, 1.2, 6.6);
      ctx.globalAlpha = randBetween(rand, 0.05, 0.16);
      ctx.fillStyle = rand() > 0.5 ? lighten(profile.base[0], 0.42) : darken(profile.base[0], 0.28);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.55, r, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMulticolorRibbons(ctx, rand, colors) {
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.lineWidth = randBetween(rand, 20, 34);
      ctx.strokeStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.72;
      const startY = randBetween(rand, -132, 80);
      ctx.moveTo(-184, startY);
      ctx.bezierCurveTo(-88, startY + randBetween(rand, -64, 64), 62, startY + randBetween(rand, -64, 64), 184, startY + randBetween(rand, -32, 44));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawSauceRibbons(ctx, rand, profile) {
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.lineWidth = randBetween(rand, 9, 17);
      ctx.strokeStyle = i % 2 ? darken(profile.accent, 0.25) : "rgba(93, 42, 23, 0.72)";
      const startY = randBetween(rand, -118, 84);
      ctx.moveTo(-170, startY);
      ctx.bezierCurveTo(-82, startY - randBetween(rand, 15, 55), 72, startY + randBetween(rand, 12, 52), 168, startY - randBetween(rand, 5, 38));
      ctx.stroke();
    }
  }

  function drawChips(ctx, rand, count) {
    ctx.fillStyle = "rgba(39, 20, 17, 0.86)";
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.translate(randBetween(rand, -128, 128), randBetween(rand, -132, 96));
      ctx.rotate(rand() * Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, -randBetween(rand, 3, 8));
      ctx.lineTo(randBetween(rand, 4, 9), randBetween(rand, 2, 7));
      ctx.lineTo(-randBetween(rand, 4, 9), randBetween(rand, 2, 7));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawNuts(ctx, rand, count) {
    ctx.fillStyle = "#d6a260";
    ctx.strokeStyle = "rgba(88, 48, 20, 0.35)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.translate(randBetween(rand, -126, 126), randBetween(rand, -128, 100));
      ctx.rotate(rand() * Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, randBetween(rand, 4, 10), randBetween(rand, 2, 5), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFruit(ctx, rand, profile, count) {
    const colors = [profile.accent, "#c62861", "#75226c", "#ff4c6f"];
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.globalAlpha = randBetween(rand, 0.72, 0.95);
      ctx.beginPath();
      ctx.ellipse(
        randBetween(rand, -126, 126),
        randBetween(rand, -128, 96),
        randBetween(rand, 4, 11),
        randBetween(rand, 3, 8),
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSprinkles(ctx, rand, count) {
    const colors = ["#ff66c4", "#38b6ff", "#ffd761", "#64d8b6", "#7b5cff", "#ffffff"];
    ctx.lineCap = "round";
    for (let i = 0; i < count; i++) {
      ctx.strokeStyle = colors[Math.floor(rand() * colors.length)];
      ctx.lineWidth = randBetween(rand, 2.2, 4);
      const x = randBetween(rand, -130, 130);
      const y = randBetween(rand, -134, 102);
      const angle = rand() * Math.PI;
      const len = randBetween(rand, 8, 16);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * len * 0.5, y - Math.sin(angle) * len * 0.5);
      ctx.lineTo(x + Math.cos(angle) * len * 0.5, y + Math.sin(angle) * len * 0.5);
      ctx.stroke();
    }
  }

  function renderHero() {
    if (!heroCanvas) return;
    const rect = heroCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    heroCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    heroCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = heroCanvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "rgba(255, 102, 196, 0.22)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.18)");
    gradient.addColorStop(1, "rgba(56, 182, 255, 0.2)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const rand = seededRandom(42);
    const colors = ["#ff66c4", "#38b6ff", "#ffd761", "#64d8b6", "#ff9b62"];
    for (let i = 0; i < 38; i++) {
      const x = randBetween(rand, -80, rect.width + 80);
      const y = randBetween(rand, -50, rect.height + 60);
      const radius = randBetween(rand, 18, 68);
      ctx.globalAlpha = randBetween(rand, 0.12, 0.28);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function has(text, words) {
    return words.some((word) => text.includes(word));
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hashCode(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) + 1;
  }

  function seededRandom(seed) {
    let value = seed % 2147483647;
    return function () {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function randBetween(rand, min, max) {
    return min + rand() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lighten(hex, amount) {
    return mix(hex, "#ffffff", amount);
  }

  function darken(hex, amount) {
    return mix(hex, "#000000", amount);
  }

  function mix(hexA, hexB, amount) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const t = clamp(amount, 0, 1);
    return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`;
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }
})();
