(function () {
  const menuDestinations = new Set([
    "/stock.html",
    "/flavors.html",
    "/yogurt.html",
    "/gelato.html",
  ]);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const eventName = link.dataset.analyticsEvent || eventNameFor(link);
    if (!eventName || typeof window.gtag !== "function") return;

    const destination = new URL(link.href, window.location.href);
    window.gtag("event", eventName, {
      link_text: link.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
      link_url: `${destination.origin}${destination.pathname}${destination.hash}`,
      page_path: window.location.pathname,
      transport_type: "beacon",
    });
  });

  function eventNameFor(link) {
    const destination = new URL(link.href, window.location.href);

    if (destination.protocol === "tel:") return "phone_click";
    if (
      destination.hostname === "share.google" ||
      destination.hostname === "maps.google.com" ||
      (destination.hostname === "www.google.com" && destination.pathname.startsWith("/maps"))
    ) {
      return "directions_click";
    }

    if (
      destination.origin === window.location.origin &&
      (menuDestinations.has(destination.pathname) || /^#(?:flavors|nutrition|stock-list|yogurt-flavors|gelato-flavors)$/.test(destination.hash))
    ) {
      return "menu_view";
    }

    return "";
  }
})();
