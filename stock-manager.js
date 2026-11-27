(async function () {
  const repository = "SweetEscapeMemphis/sweet-escape";
  const stockPath = "data/stock.json";
  const branch = "main";
  const tokenStorageKey = "sweetEscapeStockManagerToken";
  const scoopFlavors = window.SWEET_ESCAPE_FLAVORS?.flavors || [];
  const yogurtFlavors = window.SWEET_ESCAPE_YOGURT_FLAVORS?.flavors || [];
  const gelatoFlavors = window.SWEET_ESCAPE_GELATO_FLAVORS?.flavors || [];
  const pngScoopIds = new Set(["udderly-chocolate", "rocky-road"]);
  const stockStore = window.SweetEscapeStock;
  const isLocalPreview = ["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname);
  const publishedStock = await stockStore.load({ fresh: true });
  const draft = isLocalPreview ? stockStore.readYogurtPreview() : null;
  const currentStock = { ...publishedStock, ...draft };
  const yogurtById = new Map(yogurtFlavors.map((flavor) => [flavor.id, flavor]));
  const yogurtPairs = (currentStock.yogurtPairs ?? []).filter((pair) => pair.every((id) => yogurtById.has(id)));
  const selected = {
    scoops: window.SweetEscapeStock.idsFor(
      currentStock,
      "scoops",
      scoopFlavors.map((flavor) => flavor.id)
    ),
    yogurt: window.SweetEscapeStock.idsFor(
      currentStock,
      "yogurt",
      yogurtFlavors.map((flavor) => flavor.id)
    ),
    gelato: window.SweetEscapeStock.idsFor(
      currentStock,
      "gelato",
      gelatoFlavors.map((flavor) => flavor.id)
    ),
  };
  const searchInput = document.querySelector("#manager-search");
  const tokenInput = document.querySelector("#github-token");
  const rememberTokenInput = document.querySelector("#remember-token");
  const forgetTokenButton = document.querySelector("#forget-token");
  const publishButton = document.querySelector("#publish-stock");
  const status = document.querySelector("#manager-status");
  const scoopGrid = document.querySelector("#manager-scoop-grid");
  const yogurtGrid = document.querySelector("#manager-yogurt-grid");
  const gelatoGrid = document.querySelector("#manager-gelato-grid");
  const pairForm = document.querySelector("#yogurt-pair-form");
  const firstFlavor = document.querySelector("#yogurt-pair-first");
  const secondFlavor = document.querySelector("#yogurt-pair-second");
  const pairList = document.querySelector("#manager-yogurt-pair-list");
  const singlesList = document.querySelector("#manager-yogurt-singles");
  const pairStatus = document.querySelector("#manager-pair-status");
  let query = "";
  let tokenSaveTimer;

  if (isLocalPreview) {
    publishButton.closest(".manager-publish").hidden = true;
    document.querySelector(".manager-intro > p:last-child").textContent = "Local preview. Try your twist pairings and preview the customer menu here.";
  } else {
    restoreSavedToken();
  }
  renderAll();
  updateCounts();
  renderYogurtPairs();

  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    renderAll();
  });

  document.querySelector("#manager-list").addEventListener("change", (event) => {
    const input = event.target.closest(".manager-item input[type='checkbox']");
    if (!input) return;
    const group = input.dataset.group;
    if (input.checked) selected[group].add(input.value);
    else selected[group].delete(input.value);
    input.closest(".manager-item").classList.toggle("is-selected", input.checked);
    updateCounts();
    if (group === "yogurt") renderYogurtPairs();
  });

  document.querySelector("#manager-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-group][data-action]");
    if (!button) return;
    const group = button.dataset.group;
    const flavors = flavorsForGroup(group);
    selected[group].clear();
    if (button.dataset.action === "all") {
      for (const flavor of flavors) selected[group].add(flavor.id);
    }
    renderAll();
    updateCounts();
    if (group === "yogurt") renderYogurtPairs();
  });

  pairForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pair = [firstFlavor.value, secondFlavor.value];
    if (!pair.every((id) => selected.yogurt.has(id)) || pair[0] === pair[1]) {
      pairStatus.textContent = "Choose two different in-stock flavors.";
      return;
    }
    if (yogurtPairs.some((existing) => pair.every((id) => existing.includes(id)))) {
      pairStatus.textContent = "These flavors are already paired.";
      return;
    }
    yogurtPairs.push(pair);
    pairForm.reset();
    renderYogurtPairs();
    pairStatus.textContent = "Twist pairing added.";
  });

  pairList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-pair]");
    if (!button) return;
    yogurtPairs.splice(Number(button.dataset.removePair), 1);
    renderYogurtPairs();
    pairStatus.textContent = "Twist pairing removed.";
    firstFlavor.focus();
  });

  document.querySelector("#preview-yogurt-pairs").addEventListener("click", (event) => {
    try {
      stockStore.saveYogurtPreview([...selected.yogurt], yogurtPairs);
      pairStatus.textContent = "Preview saved on this browser.";
    } catch {
      event.preventDefault();
      pairStatus.textContent = "The browser couldn’t save a preview. Check that local storage is available.";
    }
  });

  publishButton.addEventListener("click", publishStock);
  forgetTokenButton.addEventListener("click", forgetSavedToken);
  tokenInput.addEventListener("input", () => {
    clearTimeout(tokenSaveTimer);
    tokenSaveTimer = setTimeout(saveTokenPreference, 250);
  });
  rememberTokenInput.addEventListener("change", () => {
    if (rememberTokenInput.checked) saveTokenPreference();
    else removeStoredToken();
  });

  function renderAll() {
    renderGroup(scoopGrid, scoopFlavors, "scoops");
    renderGroup(yogurtGrid, yogurtFlavors, "yogurt");
    renderGroup(gelatoGrid, gelatoFlavors, "gelato");
  }

  function renderYogurtPairs() {
    const available = yogurtFlavors.filter((flavor) => selected.yogurt.has(flavor.id));
    pairForm.querySelector("button").disabled = available.length < 2;
    for (const select of [firstFlavor, secondFlavor]) {
      const previous = select.value;
      select.replaceChildren(new Option("Choose a flavor", ""));
      for (const { id, name } of available) select.add(new Option(name, id));
      if (selected.yogurt.has(previous)) select.value = previous;
      select.disabled = available.length < 2;
    }

    const paired = new Set();
    pairList.replaceChildren();
    yogurtPairs.forEach((pair, index) => {
      const active = pair.every((id) => selected.yogurt.has(id));
      if (active) for (const id of pair) paired.add(id);
      const names = pair.map((id) => yogurtById.get(id).name).join(" + ");
      const row = document.createElement("li");
      const copy = document.createElement("span");
      copy.textContent = active ? `${names} twist` : `${names} — twist unavailable`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.removePair = String(index);
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${names} pairing`);
      row.append(copy, remove);
      pairList.append(row);
    });

    const singles = available.filter((flavor) => !paired.has(flavor.id)).map((flavor) => flavor.name);
    singlesList.textContent = singles.length ? `No twist listed: ${singles.join(", ")}` : "";
  }

  function renderGroup(container, flavors, group) {
    const filtered = flavors.filter((flavor) => {
      const description = flavor.description || flavor.sourceName || "";
      return !query || `${flavor.name} ${flavor.category} ${description}`.toLowerCase().includes(query);
    });

    container.innerHTML = "";
    for (const flavor of filtered) {
      const checked = selected[group].has(flavor.id);
      const image = group === "scoops"
        ? flavor.nutritionSource
          ? `assets/scoops/generated/${flavor.id}.png`
          : `assets/scoops/${flavor.id}.${pngScoopIds.has(flavor.id) ? "png" : "webp"}?v=20260905-1`
        : flavor.image;
      const label = document.createElement("label");
      label.className = `manager-item${checked ? " is-selected" : ""}`;
      label.innerHTML = `
        <img src="${escapeHTML(image)}" alt="" loading="lazy" decoding="async">
        <span class="manager-item-copy">
          <strong>${escapeHTML(flavor.name)}</strong>
          <small>${escapeHTML(flavor.category)}</small>
        </span>
        <input type="checkbox" value="${escapeHTML(flavor.id)}" data-group="${group}" ${checked ? "checked" : ""}>
      `;
      container.append(label);
    }
  }

  function updateCounts() {
    const total = selected.scoops.size + selected.yogurt.size + selected.gelato.size;
    document.querySelector("#manager-selected-count").textContent = String(total);
    document.querySelector("#manager-scoop-count").textContent = `${selected.scoops.size} selected`;
    document.querySelector("#manager-yogurt-count").textContent = `${selected.yogurt.size} selected`;
    document.querySelector("#manager-gelato-count").textContent = `${selected.gelato.size} selected`;
  }

  async function publishStock() {
    if (isLocalPreview) return;
    const token = tokenInput.value.trim();
    if (!token) {
      setStatus("Enter your GitHub access token before publishing.", "error");
      tokenInput.focus();
      return;
    }

    publishButton.disabled = true;
    setStatus("Publishing stock selection...", "working");

    try {
      const apiUrl = `https://api.github.com/repos/${repository}/contents/${stockPath}`;
      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      };
      const currentResponse = await fetch(`${apiUrl}?ref=${branch}&v=${Date.now()}`, {
        headers,
        cache: "no-store",
      });
      if (!currentResponse.ok) throw await githubError(currentResponse);
      const currentFile = await currentResponse.json();
      const nextStock = {
        updatedAt: new Date().toISOString(),
        scoops: scoopFlavors.map((flavor) => flavor.id).filter((id) => selected.scoops.has(id)),
        yogurt: yogurtFlavors.map((flavor) => flavor.id).filter((id) => selected.yogurt.has(id)),
        yogurtPairs,
        gelato: gelatoFlavors.map((flavor) => flavor.id).filter((id) => selected.gelato.has(id)),
      };
      const content = encodeBase64(`${JSON.stringify(nextStock, null, 2)}\n`);
      const updateResponse = await fetch(apiUrl, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Update in-stock flavors",
          content,
          sha: currentFile.sha,
          branch,
        }),
      });
      if (!updateResponse.ok) throw await githubError(updateResponse);

      saveTokenPreference(token);
      setStatus("Published. The customer menu will update in about one minute.", "success");
    } catch (error) {
      setStatus(error.message || "Stock could not be published.", "error");
    } finally {
      publishButton.disabled = false;
    }
  }

  function restoreSavedToken() {
    try {
      const savedToken = localStorage.getItem(tokenStorageKey);
      if (!savedToken) return;
      tokenInput.value = savedToken;
      rememberTokenInput.checked = true;
      forgetTokenButton.disabled = false;
    } catch (error) {
      rememberTokenInput.checked = false;
      rememberTokenInput.disabled = true;
    }
  }

  function saveTokenPreference(providedToken) {
    const hasProvidedToken = typeof providedToken === "string";
    const token = hasProvidedToken ? providedToken : tokenInput.value.trim();
    try {
      if (rememberTokenInput.checked && token) {
        localStorage.setItem(tokenStorageKey, token);
        tokenInput.value = token;
        forgetTokenButton.disabled = false;
      } else {
        removeStoredToken();
        if (hasProvidedToken) tokenInput.value = "";
      }
    } catch (error) {
      rememberTokenInput.checked = false;
      rememberTokenInput.disabled = true;
      forgetTokenButton.disabled = true;
    }
  }

  function removeStoredToken() {
    try {
      localStorage.removeItem(tokenStorageKey);
    } catch (error) {
      // The token remains available in the field for this page session.
    }
    forgetTokenButton.disabled = true;
  }

  function forgetSavedToken() {
    clearTimeout(tokenSaveTimer);
    removeStoredToken();
    tokenInput.value = "";
    rememberTokenInput.checked = false;
    forgetTokenButton.disabled = true;
    setStatus("Saved token removed from this browser.", "success");
    tokenInput.focus();
  }

  async function githubError(response) {
    let message = `GitHub returned ${response.status}.`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch (error) {
      // Keep the status-based message when GitHub does not return JSON.
    }
    if (response.status === 401 || response.status === 403) {
      message = "GitHub rejected the token. Check that it has Contents read and write access for this repository.";
    }
    return new Error(message);
  }

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
      return entities[character];
    });
  }

  function flavorsForGroup(group) {
    if (group === "scoops") return scoopFlavors;
    if (group === "yogurt") return yogurtFlavors;
    return gelatoFlavors;
  }
})();
