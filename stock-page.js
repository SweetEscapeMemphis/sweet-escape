(async function () {
  const scoopFlavors = window.SWEET_ESCAPE_FLAVORS?.flavors || [];
  const yogurtFlavors = window.SWEET_ESCAPE_YOGURT_FLAVORS?.flavors || [];
  const stock = await window.SweetEscapeStock.load({ fresh: true });
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
  const items = [
    ...scoopFlavors
      .filter((flavor) => scoopIds.has(flavor.id))
      .map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        category: flavor.category,
        type: "Scoops",
        image: `assets/scoops/${flavor.id}.webp?v=20260814-1`,
        href: `flavors.html#${flavor.id}`,
      })),
    ...yogurtFlavors
      .filter((flavor) => yogurtIds.has(flavor.id))
      .map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        category: flavor.category,
        type: "Yogurt",
        image: flavor.image,
        href: `yogurt.html#yogurt-${flavor.id}`,
      })),
  ];
  const grid = document.querySelector("#stock-grid");
  const search = document.querySelector("#stock-search");
  const tabs = document.querySelector("#stock-tabs");
  const types = ["All", "Scoops", "Yogurt"];
  const state = { query: "", type: "All" };

  document.querySelector("#stock-total").textContent = String(items.length);
  document.querySelector("#stock-scoop-count").textContent = String(scoopIds.size);
  document.querySelector("#stock-yogurt-count").textContent = String(yogurtIds.size);
  document.querySelector("#stock-updated").textContent = stock.updatedAt
    ? `Availability updated ${formatDate(stock.updatedAt)}.`
    : "Availability is ready to browse.";

  buildTabs();
  render();

  search.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    render();
  });

  function buildTabs() {
    for (const type of types) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = type;
      button.setAttribute("aria-pressed", String(type === state.type));
      button.addEventListener("click", () => {
        state.type = type;
        for (const control of tabs.querySelectorAll("button")) {
          control.setAttribute("aria-pressed", String(control.textContent === type));
        }
        render();
      });
      tabs.append(button);
    }
  }

  function render() {
    const filtered = items.filter((item) => {
      const matchesType = state.type === "All" || item.type === state.type;
      const matchesQuery =
        !state.query || `${item.name} ${item.category} ${item.type}`.toLowerCase().includes(state.query);
      return matchesType && matchesQuery;
    });

    grid.innerHTML = "";
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "stock-empty";
      empty.textContent = items.length
        ? "No in-stock items match that search."
        : "No items are marked in stock right now. Please check back soon.";
      grid.append(empty);
      return;
    }

    for (const item of filtered) {
      const card = document.createElement("a");
      card.className = "stock-card";
      card.href = item.href;
      card.innerHTML = `
        <div class="stock-card-image">
          <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy" decoding="async">
        </div>
        <div class="stock-card-copy">
          <span class="stock-status"><i aria-hidden="true"></i>In stock</span>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${escapeHTML(item.type)} · ${escapeHTML(item.category)}</p>
        </div>
      `;
      grid.append(card);
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "recently";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
      return entities[character];
    });
  }
})();
