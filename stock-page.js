(async function () {
  const scoopFlavors = window.SWEET_ESCAPE_FLAVORS?.flavors || [];
  const yogurtFlavors = window.SWEET_ESCAPE_YOGURT_FLAVORS?.flavors || [];
  const gelatoFlavors = window.SWEET_ESCAPE_GELATO_FLAVORS?.flavors || [];
  const stockStore = window.SweetEscapeStock;
  const params = window.location?.search ? new URLSearchParams(window.location.search) : null;
  const draft = params?.get("preview") === "yogurt" ? stockStore.readYogurtPreview() : null;
  const stock = { ...await stockStore.load({ fresh: true }), ...draft };
  const pngScoopIds = new Set(["udderly-chocolate", "rocky-road"]);
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
  const items = [
    ...scoopFlavors
      .filter((flavor) => scoopIds.has(flavor.id))
      .map((flavor) => {
        const extension = pngScoopIds.has(flavor.id) ? "png" : "webp";
        return {
          id: flavor.id,
          name: flavor.name,
          category: flavor.category,
          type: "Scoops",
          image: flavor.nutritionSource ? `assets/scoops/generated/${flavor.id}.png` : flavor.imageUrl || `assets/scoops/responsive/${flavor.id}-300.${extension}`,
          srcset: flavor.nutritionSource || flavor.imageUrl ? "" : `assets/scoops/responsive/${flavor.id}-300.${extension} 300w, assets/scoops/responsive/${flavor.id}-600.${extension} 600w`,
          width: 600,
          height: 600,
          href: `/scoops/${flavor.id}/`,
        };
      }),
    ...yogurtFlavors
      .filter((flavor) => yogurtIds.has(flavor.id))
      .map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        category: flavor.category,
        type: "Yogurt",
        image: flavor.image,
        width: 600,
        height: 600,
        href: `/yogurt/${flavor.id}/`,
      })),
    ...gelatoFlavors
      .filter((flavor) => gelatoIds.has(flavor.id))
      .map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        category: flavor.category,
        type: "Gelato",
        image: flavor.image,
        width: 512,
        height: 512,
        href: `/gelato/${flavor.id}/`,
      })),
  ];
  const grid = document.querySelector("#stock-grid");
  const search = document.querySelector("#stock-search");
  const tabs = document.querySelector("#stock-tabs");
  const yogurtGuide = document.querySelector("#yogurt-machine-guide");
  const types = ["All", "Scoops", "Yogurt", "Gelato"];
  const requestedType = params?.get("type");
  const state = { query: "", type: types.find((type) => type.toLowerCase() === requestedType) || "All" };
  const availableYogurt = new Map(items.filter((item) => item.type === "Yogurt").map((item) => [item.id, item]));
  const yogurtPairs = (stock.yogurtPairs ?? [])
    .filter((pair) => pair.every((id) => availableYogurt.has(id)))
    .map((pair) => pair.map((id) => availableYogurt.get(id)));
  const twistPartners = new Map();
  for (const [first, second] of yogurtPairs) {
    if (!twistPartners.has(first.id)) twistPartners.set(first.id, []);
    if (!twistPartners.has(second.id)) twistPartners.set(second.id, []);
    twistPartners.get(first.id).push(second.name);
    twistPartners.get(second.id).push(first.name);
  }

  document.querySelector("#stock-total").textContent = String(items.length);
  document.querySelector("#stock-scoop-count").textContent = String(scoopIds.size);
  document.querySelector("#stock-yogurt-count").textContent = String(yogurtIds.size);
  document.querySelector("#stock-gelato-count").textContent = String(gelatoIds.size);
  document.querySelector("#stock-updated").textContent = draft ? "Stock Manager preview" : stock.updatedAt
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

    let lastType = "";
    for (const item of filtered) {
      if (item.type !== lastType) {
        const heading = document.createElement("h3");
        heading.className = "stock-group-heading";
        heading.textContent = item.type === "Yogurt"
          ? "Frozen yogurt & sorbet"
          : item.type === "Scoops" ? "Scoop flavors" : "Gelato flavors";
        grid.append(heading);
        if (item.type === "Yogurt" && yogurtGuide?.content && !state.query) {
          grid.append(buildYogurtGuide());
        }
        lastType = item.type;
      }

      const card = document.createElement("a");
      card.className = "stock-card";
      card.href = item.href;
      const partners = item.type === "Yogurt" ? twistPartners.get(item.id) : null;
      const pairing = partners?.length ? `Twist with ${partners.join(" or ")}` : "No twist listed";
      card.innerHTML = `
        <div class="stock-card-image">
          <img src="${escapeHTML(item.image)}"${item.srcset ? ` srcset="${escapeHTML(item.srcset)}" sizes="(max-width: 720px) 42vw, 210px"` : ""} alt="${escapeHTML(item.name)}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async">
        </div>
        <div class="stock-card-copy">
          <span class="stock-status"><i aria-hidden="true"></i>In stock</span>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${escapeHTML(item.type)} · ${escapeHTML(item.category)}</p>
          ${item.type === "Yogurt" ? `<p class="stock-card-pairing${partners ? " has-twist" : ""}">${escapeHTML(pairing)}</p>` : ""}
        </div>
      `;
      grid.append(card);
    }
  }

  function buildYogurtGuide() {
    const guide = yogurtGuide.content.cloneNode(true);
    const container = guide.querySelector(".yogurt-machine-pairs");
    if (draft) {
      const notice = document.createElement("p");
      notice.className = "yogurt-machine-example";
      notice.textContent = "Stock Manager preview";
      container.before(notice);
    }
    if (!yogurtPairs.length) {
      container.textContent = "No twist combinations listed today.";
      return guide;
    }

    for (const [first, second] of yogurtPairs) {
      const options = document.createElement("ul");
      options.className = "yogurt-machine-options";
      options.setAttribute("aria-label", `${first.name} and ${second.name} machine choices`);
      options.innerHTML = `
        <li><span class="yogurt-machine-label">Flavor 1</span><a href="${escapeHTML(first.href)}">${escapeHTML(first.name)}</a></li>
        <li class="yogurt-machine-twist"><span class="yogurt-machine-label">Twist (mix)</span><strong>${escapeHTML(first.name)} + ${escapeHTML(second.name)}</strong></li>
        <li><span class="yogurt-machine-label">Flavor 2</span><a href="${escapeHTML(second.href)}">${escapeHTML(second.name)}</a></li>
      `;
      container.append(options);
    }
    return guide;
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
