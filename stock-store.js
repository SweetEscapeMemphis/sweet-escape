(function () {
  const stockUrl = "data/stock.json";
  const fallbackStock = { updatedAt: null, scoops: "*", yogurt: "*" };
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

  window.SweetEscapeStock = { load, idsFor };
})();
