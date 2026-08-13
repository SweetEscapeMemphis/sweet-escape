(function () {
  const payload = window.SWEET_ESCAPE_YOGURT_FLAVORS;
  const flavors = payload?.flavors || [];
  const grid = document.querySelector("#yogurt-grid");
  const searchInput = document.querySelector("#yogurt-search");
  const categoryFilters = document.querySelector("#yogurt-category-filters");
  const allergenFilter = document.querySelector("#yogurt-allergen-filter");
  const countLabel = document.querySelector("#yogurt-count");
  const imageEditToggle = document.querySelector("#yogurt-image-edit-toggle");
  const editorStatus = document.querySelector("#yogurt-editor-status");
  const categories = ["All", "Nonfat", "No Sugar Added", "Yogurt", "Sorbet", "Seasonal"];
  const state = { query: "", category: "All", allergen: "All" };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const customImageUrls = new Map();
  let visibleCards = [];
  let revealObserver = null;
  let scrollFrame = 0;
  let imageEditing = false;
  let imageDatabasePromise = null;

  if (!grid || !payload) return;

  buildCategoryButtons();
  render();
  initializeImageEditor();

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  allergenFilter.addEventListener("change", () => {
    state.allergen = allergenFilter.value;
    render();
  });

  imageEditToggle.addEventListener("click", () => {
    imageEditing = !imageEditing;
    document.body.classList.toggle("yogurt-image-editing", imageEditing);
    imageEditToggle.setAttribute("aria-pressed", String(imageEditing));
    imageEditToggle.textContent = imageEditing ? "Done editing" : "Edit images";
    setEditorStatus(imageEditing ? "Image editing is on." : "");
  });

  grid.addEventListener("change", (event) => {
    const input = event.target.closest(".yogurt-image-input");
    const file = input?.files?.[0];
    if (!input || !file) return;
    updateFlavorImage(input.dataset.flavorId, file);
    input.value = "";
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".yogurt-image-restore");
    if (button) restoreFlavorImage(button.dataset.flavorId);
  });

  grid.addEventListener("toggle", scheduleScrollUpdate, true);

  grid.addEventListener("dragover", (event) => {
    if (!imageEditing || !hasImageFile(event.dataTransfer)) return;
    const panel = event.target.closest(".yogurt-image-panel");
    if (!panel) return;
    event.preventDefault();
    panel.classList.add("is-dragging");
  });

  grid.addEventListener("dragleave", (event) => {
    const panel = event.target.closest(".yogurt-image-panel");
    if (panel && !panel.contains(event.relatedTarget)) panel.classList.remove("is-dragging");
  });

  grid.addEventListener("drop", (event) => {
    if (!imageEditing) return;
    const panel = event.target.closest(".yogurt-image-panel");
    const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
    if (!panel || !file) return;
    event.preventDefault();
    panel.classList.remove("is-dragging");
    updateFlavorImage(panel.dataset.flavorId, file);
  });

  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", scheduleScrollUpdate);

  function buildCategoryButtons() {
    categoryFilters.innerHTML = "";
    for (const category of categories) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "yogurt-segment";
      button.textContent = category;
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => {
        state.category = category;
        for (const control of categoryFilters.querySelectorAll("button")) {
          control.setAttribute("aria-pressed", String(control.textContent === category));
        }
        render();
      });
      categoryFilters.append(button);
    }
  }

  function render() {
    const filtered = flavors.filter((flavor) => {
      const haystack = `${flavor.name} ${flavor.category} ${flavor.description}`.toLowerCase();
      const matchesQuery = !state.query || haystack.includes(state.query);
      const matchesCategory =
        state.category === "All" ||
        (state.category === "Seasonal" ? flavor.seasonal : flavor.category === state.category);
      const matchesAllergen =
        state.allergen === "All" || flavor.allergenStatus[state.allergen] === "Yes";
      return matchesQuery && matchesCategory && matchesAllergen;
    });

    countLabel.textContent = String(filtered.length);
    grid.innerHTML = "";
    visibleCards = [];
    revealObserver?.disconnect();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "yogurt-empty";
      empty.textContent = "No yogurt flavors match those filters.";
      grid.append(empty);
      return;
    }

    filtered.forEach((flavor, index) => {
      const card = document.createElement("article");
      card.className = "yogurt-card";
      card.id = `yogurt-${flavor.id}`;
      card.dataset.flavorId = flavor.id;
      card.innerHTML = cardTemplate(flavor, index);
      grid.append(card);
      applyCustomImage(card, flavor.id);
    });

    attachRevealObserver();
    scheduleScrollUpdate();
  }

  function cardTemplate(flavor, index) {
    const declared = Object.entries(flavor.allergenStatus)
      .filter(([, value]) => value === "Yes")
      .map(([name]) => name);
    const declaredMarkup = declared.length
      ? declared.map((name) => `<span>${escapeHTML(name)}</span>`).join("")
      : "<span class=\"is-clear\">No declared major allergens</span>";
    const allergenRows = ["Milk", "Egg", "Wheat", "Soy", "Tree nut", "Peanut", "Sesame"]
      .map((name) => {
        const status = flavor.allergenStatus[name] || "Not listed";
        const statusClass = status === "Yes" ? "is-yes" : status === "No" ? "is-no" : "is-unknown";
        return `
          <div>
            <strong>${escapeHTML(name)}</strong>
            <span class="${statusClass}">${escapeHTML(status)}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div class="yogurt-image-panel" data-flavor-id="${escapeHTML(flavor.id)}">
        <img
          class="yogurt-flavor-image"
          src="${escapeHTML(flavor.image)}"
          data-default-src="${escapeHTML(flavor.image)}"
          alt="Flavor image for ${escapeHTML(flavor.name)} yogurt"
          loading="lazy"
          decoding="async"
        >
        <span class="yogurt-number">${String(index + 1).padStart(2, "0")}</span>
        ${flavor.seasonal ? '<span class="yogurt-seasonal">Seasonal</span>' : ""}
        <div class="yogurt-image-controls">
          <label class="yogurt-image-upload">
            <span>Choose image</span>
            <input
              class="yogurt-image-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              data-flavor-id="${escapeHTML(flavor.id)}"
              aria-label="Choose image for ${escapeHTML(flavor.name)}"
            >
          </label>
          <button class="yogurt-image-restore" type="button" data-flavor-id="${escapeHTML(flavor.id)}">
            Restore original
          </button>
        </div>
      </div>

      <div class="yogurt-card-copy">
        <span class="yogurt-category">${escapeHTML(flavor.category)}</span>
        <h3>${escapeHTML(flavor.name)}</h3>
        <p class="yogurt-description">${escapeHTML(flavor.description)}</p>

        <div class="yogurt-declared" aria-label="Declared allergens">
          <strong>Allergens</strong>
          <div>${declaredMarkup}</div>
        </div>

        <details class="yogurt-details">
          <summary>
            <span>Nutrition facts</span>
            <span class="yogurt-summary-icon" aria-hidden="true">+</span>
          </summary>
          <div class="yogurt-details-body yogurt-nutrition-body">
            <img src="${escapeHTML(flavor.nutritionImage)}" alt="Nutrition Facts for ${escapeHTML(flavor.name)}" loading="lazy">
            <a href="${escapeHTML(flavor.nutritionPdf)}" target="_blank" rel="noreferrer">Open official nutrition PDF</a>
          </div>
        </details>

        <details class="yogurt-details">
          <summary>
            <span>Ingredients and allergens</span>
            <span class="yogurt-summary-icon" aria-hidden="true">+</span>
          </summary>
          <div class="yogurt-details-body">
            <div class="yogurt-allergen-table">${allergenRows}</div>
            <h4>Ingredients</h4>
            <p>${escapeHTML(flavor.ingredients)}</p>
            <p class="yogurt-facility-note">${escapeHTML(flavor.facilityNote)}</p>
          </div>
        </details>
      </div>
    `;
  }

  async function initializeImageEditor() {
    if (!("indexedDB" in window)) return;
    try {
      imageDatabasePromise = openImageDatabase();
      const database = await imageDatabasePromise;
      const records = await readStoredImages(database);
      for (const record of records) replaceCustomImageUrl(record.id, record.blob);
      applyAllCustomImages();
    } catch (error) {
      imageDatabasePromise = null;
    }
  }

  async function updateFlavorImage(flavorId, file) {
    if (!flavorId || !file.type.startsWith("image/")) {
      setEditorStatus("Please choose a PNG, JPEG, or WebP image.");
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
    setEditorStatus(`${flavor?.name || "Flavor"} image updated${persisted ? "" : " for this session"}.`);
  }

  async function restoreFlavorImage(flavorId) {
    try {
      const database = imageDatabasePromise ? await imageDatabasePromise : null;
      if (database) await deleteStoredImage(database, flavorId);
    } catch (error) {
      setEditorStatus("The saved image could not be removed.");
      return;
    }

    const currentUrl = customImageUrls.get(flavorId);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    customImageUrls.delete(flavorId);
    applyAllCustomImages(flavorId);
    const flavor = flavors.find((item) => item.id === flavorId);
    setEditorStatus(`${flavor?.name || "Flavor"} restored.`);
  }

  function applyAllCustomImages(flavorId) {
    const selector = flavorId
      ? `.yogurt-card[data-flavor-id="${CSS.escape(flavorId)}"]`
      : ".yogurt-card";
    for (const card of grid.querySelectorAll(selector)) applyCustomImage(card, card.dataset.flavorId);
  }

  function applyCustomImage(card, flavorId) {
    const image = card.querySelector(".yogurt-flavor-image");
    if (!image) return;
    const customUrl = customImageUrls.get(flavorId);
    image.src = customUrl || image.dataset.defaultSrc;
    card.classList.toggle("has-custom-image", Boolean(customUrl));
  }

  function replaceCustomImageUrl(flavorId, blob) {
    const currentUrl = customImageUrls.get(flavorId);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    customImageUrls.set(flavorId, URL.createObjectURL(blob));
  }

  function setEditorStatus(message) {
    editorStatus.textContent = message;
  }

  function hasImageFile(dataTransfer) {
    return Array.from(dataTransfer?.items || []).some(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    );
  }

  function openImageDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("sweet-escape-yogurt-images", 1);
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
    return databaseRequest(database.transaction("images", "readonly").objectStore("images").getAll());
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

  function databaseRequest(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function attachRevealObserver() {
    const cards = Array.from(grid.querySelectorAll(".yogurt-card"));
    if (reducedMotion) {
      cards.forEach((card) => card.classList.add("is-visible"));
      visibleCards = cards;
      return;
    }

    revealObserver = new IntersectionObserver(
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
      { rootMargin: "12% 0px 12% 0px", threshold: 0.12 }
    );

    cards.forEach((card) => revealObserver.observe(card));
  }

  function scheduleScrollUpdate() {
    if (reducedMotion || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const height = window.innerHeight || 1;
      for (const card of visibleCards) {
        const image = card.querySelector(".yogurt-flavor-image");
        if (!image) continue;
        const rect = card.getBoundingClientRect();
        const progress = clamp((height - rect.top) / (height + rect.height), 0, 1);
        image.style.setProperty("--yogurt-scroll-y", `${((0.5 - progress) * 34).toFixed(1)}px`);
        image.style.setProperty("--yogurt-tilt", `${((progress - 0.5) * 2.5).toFixed(2)}deg`);
      }
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
      return entities[character];
    });
  }
})();
