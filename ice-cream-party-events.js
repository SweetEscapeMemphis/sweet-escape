// Only fixed event/plan names are sent; no inputs, clipboard content, or shared URLs.
const lastUse = new Map();
export function track(event, planner) {
  if (event === 'calculator_use') {
    const now = Date.now();
    if (now - (lastUse.get(planner) || 0) < 1500) return;
    lastUse.set(planner, now);
  }
  if (typeof window.gtag === 'function') window.gtag('event', event, {
    planner, page_path: window.location.pathname, transport_type: 'beacon'
  });
}
