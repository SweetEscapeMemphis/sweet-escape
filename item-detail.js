(function () {
  const status = document.querySelector("[data-item-status]");
  if (!status) return;

  const group = status.dataset.group;
  const itemId = status.dataset.itemId;
  if (!group || !itemId || group === "specialties") {
    status.textContent = "Availability may change throughout the day";
    return;
  }

  fetch("/data/stock.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Stock unavailable");
      return response.json();
    })
    .then((stock) => {
      const groupStock = stock[group];
      const available = groupStock === "*" || (Array.isArray(groupStock) && groupStock.includes(itemId));
      status.textContent = available
        ? "Listed on today’s published menu"
        : "Not listed on today’s published menu";
      status.classList.add(available ? "is-available" : "is-unavailable");
    })
    .catch(() => {
      status.textContent = "Check today’s menu for current availability";
    });
})();
