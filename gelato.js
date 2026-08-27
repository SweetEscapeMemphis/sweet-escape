(async function () {
  const payload = window.SWEET_ESCAPE_GELATO_FLAVORS;
  const flavors = payload?.flavors || [];
  const grid = document.querySelector("#gelato-grid");
  const searchInput = document.querySelector("#gelato-search");
  const categoryFilters = document.querySelector("#gelato-category-filters");
  const allergenFilter = document.querySelector("#gelato-allergen-filter");
  const countLabel = document.querySelector("#gelato-count");
  const categories = ["All", "Gelato", "Sorbetto", "Vegan"];
  const state = { query: "", category: "All", allergen: "All" };

  if (!grid || !payload) return;

  buildCategoryButtons();
  render();

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  allergenFilter.addEventListener("change", () => {
    state.allergen = allergenFilter.value;
    render();
  });

  function buildCategoryButtons() {
    for (const category of categories) {
      const button = document.createElement("button");
      button.type = "button";
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
      const matchesCategory = state.category === "All" || flavor.category === state.category;
      const allergens = [...(flavor.allergens || []), ...(flavor.mayContain || [])].join(" ").toLowerCase();
      const matchesAllergen =
        state.allergen === "All" || allergens.includes(state.allergen.toLowerCase());
      return matchesQuery && matchesCategory && matchesAllergen;
    });

    countLabel.textContent = String(filtered.length);
    grid.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "gelato-empty";
      empty.textContent = "No in-stock gelato flavors match those filters.";
      grid.append(empty);
      return;
    }

    filtered.forEach((flavor, index) => {
      const card = document.createElement("article");
      card.className = "gelato-card";
      card.id = `gelato-${flavor.id}`;
      card.innerHTML = cardTemplate(flavor, index);
      grid.append(card);
    });
  }

  function cardTemplate(flavor, index) {
    const allergenChips = (flavor.allergens || []).length
      ? flavor.allergens.map((name) => `<span>${escapeHTML(name)}</span>`).join("")
      : '<span class="is-unverified">Check current label</span>';
    const mayContain = (flavor.mayContain || []).length
      ? `<p><strong>May contain:</strong> ${escapeHTML(flavor.mayContain.join(", "))}</p>`
      : "";
    const sourceLinks = [
      flavor.nutritionSource
        ? `<a href="${escapeHTML(flavor.nutritionSource)}" target="_blank" rel="noreferrer">Open nutrition source</a>`
        : "",
      flavor.allergenSource && flavor.allergenSource !== flavor.nutritionSource
        ? `<a href="${escapeHTML(flavor.allergenSource)}" target="_blank" rel="noreferrer">Open allergen source</a>`
        : "",
      `<a href="${escapeHTML(payload.sourceUrl)}" target="_blank" rel="noreferrer">View manufacturer flavor catalog</a>`,
    ].filter(Boolean).join("");

    return `
      <div class="gelato-image-panel">
        <img src="${escapeHTML(flavor.image)}" alt="${escapeHTML(flavor.name)} ${escapeHTML(flavor.category.toLowerCase())} scoop" loading="lazy" decoding="async">
        <span class="gelato-number">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="gelato-card-copy">
        <span class="gelato-category">${escapeHTML(flavor.category)}</span>
        <h3>${escapeHTML(flavor.name)}</h3>
        <p class="gelato-description">${escapeHTML(flavor.description)}</p>

        <div class="gelato-allergen-summary">
          <strong>Allergen guide</strong>
          <div>${allergenChips}</div>
        </div>

        <details class="gelato-details">
          <summary><span>Nutrition facts</span><span aria-hidden="true">+</span></summary>
          <div class="gelato-details-body">
            ${nutritionMarkup(flavor)}
          </div>
        </details>

        <details class="gelato-details">
          <summary><span>Allergen details</span><span aria-hidden="true">+</span></summary>
          <div class="gelato-details-body gelato-allergen-detail">
            <p><strong>Known allergens:</strong> ${flavor.allergens?.length ? escapeHTML(flavor.allergens.join(", ")) : "No complete statement published online"}</p>
            ${mayContain}
            ${flavor.allergenNote ? `<p>${escapeHTML(flavor.allergenNote)}</p>` : ""}
            <div class="gelato-source-links">${sourceLinks}</div>
          </div>
        </details>
      </div>
    `;
  }

  function nutritionMarkup(flavor) {
    if (!flavor.nutrition) {
      return `
        <p class="gelato-label-pending"><strong>Current numeric label not published online.</strong> Please ask staff to check the container for this flavor.</p>
        <a class="gelato-source-link" href="${escapeHTML(payload.sourceUrl)}" target="_blank" rel="noreferrer">View manufacturer flavor catalog</a>
      `;
    }

    const facts = [
      ["Calories", flavor.nutrition.calories],
      ["Fat", flavor.nutrition.fat],
      ["Carbs", flavor.nutrition.carbs],
      ["Sugars", flavor.nutrition.sugars],
      ["Protein", flavor.nutrition.protein],
      ["Sodium", flavor.nutrition.sodium],
    ];

    return `
      <p class="gelato-serving">Serving: ${escapeHTML(flavor.nutrition.serving)}</p>
      <div class="gelato-facts">
        ${facts.map(([label, value]) => `<div><strong>${escapeHTML(value)}</strong><span>${escapeHTML(label)}</span></div>`).join("")}
      </div>
      <a class="gelato-source-link" href="${escapeHTML(flavor.nutritionSource)}" target="_blank" rel="noreferrer">Open published label source</a>
    `;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
      return entities[character];
    });
  }
})();
