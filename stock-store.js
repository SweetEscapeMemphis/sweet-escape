(function () {
  const stockUrl = "data/stock.json";
  const fallbackStock = { updatedAt: null, scoops: "*", yogurt: "*", gelato: "*" };
  const yogurtPreviewKey = "sweetEscapeYogurtPreview";
  let stockPromise = null;

  function load(options = {}) {
    const fresh = Boolean(options.fresh);
    if (stockPromise && !fresh) return stockPromise;

    const separator = stockUrl.includes("?") ? "&" : "?";
    const url = `${stockUrl}${separator}v=${Date.now()}`;
    stockPromise = fetch(url, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Stock request failed with ${response.status}`);
        return response.json();
      })
      .then(normalize)
      .catch(() => fallbackStock);

    return stockPromise;
  }

  function normalize(value) {
    return {
      updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null,
      scoops: normalizeGroup(value?.scoops),
      yogurt: normalizeGroup(value?.yogurt),
      yogurtPairs: normalizeYogurtPairs(value?.yogurtPairs),
      gelato: value?.gelato === undefined ? "*" : normalizeGroup(value.gelato),
    };
  }

  function normalizeGroup(value) {
    if (value === "*") return "*";
    return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
  }

  function idsFor(stock, group, allIds) {
    const value = stock?.[group];
    return new Set(value === "*" ? allIds : Array.isArray(value) ? value : []);
  }

  function normalizeYogurtPairs(value) {
    const pairs = [];
    const seen = new Set();
    for (const pair of Array.isArray(value) ? value : []) {
      if (!Array.isArray(pair) || pair.length !== 2) continue;
      const [first, second] = pair;
      if (typeof first !== "string" || typeof second !== "string" || !first || !second || first === second) continue;
      const key = JSON.stringify([first, second].sort());
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([first, second]);
    }
    return pairs;
  }

  function saveYogurtPreview(yogurt, yogurtPairs) {
    localStorage.setItem(yogurtPreviewKey, JSON.stringify({ yogurt, yogurtPairs }));
  }

  function readYogurtPreview() {
    try {
      const draft = JSON.parse(localStorage.getItem(yogurtPreviewKey));
      if (Array.isArray(draft?.yogurt)) {
        return { yogurt: normalizeGroup(draft.yogurt), yogurtPairs: normalizeYogurtPairs(draft.yogurtPairs) };
      }
    } catch {
      // Storage may be disabled or contain an older draft format.
    }
    return null;
  }

  window.SweetEscapeStock = { load, idsFor, saveYogurtPreview, readYogurtPreview };
})();
