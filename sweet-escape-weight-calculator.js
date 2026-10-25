import { track } from './ice-cream-party-events.js?v=20261025-1';
import { WEIGHT_DEFAULTS, validateWeighted, calculateWeighted, weightedAssumptions, weightedPortion, weightedText, loadWeightedPlan, weightedShareURL, volume, weightVolume, usd } from './ice-cream-calculator-core.js?v=20261014-1';
const el = id => document.getElementById(id), form = el('weight-form'), fields = Object.keys(WEIGHT_DEFAULTS);
let timer, current;
const read = () => Object.fromEntries(fields.map(key => [key, el(key).value.trim()]));
const write = raw => fields.forEach(key => { el(key).value = raw[key]; });
function update(announce = true) {
  clearTimeout(timer);
  const raw = read(), errors = validateWeighted(raw), valid = !Object.keys(errors).length;
  fields.forEach(key => { el(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false'); el(`${key}-error`).textContent = errors[key] || ''; });
  el('weight-validation').textContent = valid ? '' : 'Correct the highlighted inputs to update your by-weight estimate.';
  el('weight-results').hidden = !valid;
  document.querySelectorAll('[data-weight-action]').forEach(button => { button.disabled = !valid; });
  el('weight-copy-fallback').hidden = true; el('weight-share-output').hidden = true;
  current = valid ? raw : null;
  if (!valid) { if (announce) track('calculator_use', 'weight');
  if (announce) el('weight-result-status').textContent = Object.values(errors).join(' '); return false; }
  const r = calculateWeighted(raw);
  el('weight-total-oz').textContent = `${weightVolume(r.totalOz)} oz`;
  el('weight-total-cost').textContent = usd(r.totalCents / 100);
  el('weight-per-guest').textContent = `${usd(r.perGuest)} per guest`;
  el('weight-assumptions').textContent = weightedAssumptions(raw);
  el('weight-portion').textContent = weightedPortion(raw);
  if (announce) track('calculator_use', 'weight');
  if (announce) el('weight-result-status').textContent = `Updated Sweet Escape estimate: ${weightVolume(r.totalOz)} weight ounces, ${usd(r.totalCents / 100)} total, ${usd(r.perGuest)} per guest.`;
  return true;
}
form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { el('weight-action-status').textContent = ''; update(); }, 500); });
form.addEventListener('change', () => { el('weight-action-status').textContent = ''; update(); });
form.addEventListener('submit', event => { event.preventDefault(); if (!update()) form.querySelector('[aria-invalid="true"]').focus(); });
async function copy(text, success, event = 'calculator_results_copied') {
  try { await navigator.clipboard.writeText(text); el('weight-action-status').textContent = success; track(event, 'weight'); }
  catch {
    el('weight-copy-fallback').hidden = false; el('weight-copy-text').value = text;
    el('weight-copy-text').focus(); el('weight-copy-text').select();
    el('weight-action-status').textContent = 'Automatic copying is unavailable. Select or copy the text below using your device’s copy command.';
  }
}
el('weight-copy').addEventListener('click', () => { if (update(false)) copy(weightedText(current), 'Sweet Escape weight estimate copied.'); });
el('weight-share').addEventListener('click', async () => {
  if (!update(false)) return;
  const url = weightedShareURL(current, window.location.href);
  track('calculator_share_generated', 'weight');
  await copy(url, 'Sweet Escape weight estimate link copied.', 'calculator_share_copied');
  el('weight-share-link').href = url; el('weight-share-output').hidden = false;
});
el('weight-print').addEventListener('click', () => { if (update(false)) { document.body.dataset.printPlan = 'weights'; track('calculator_print', 'weight'); window.print(); } });
el('weight-reset').addEventListener('click', () => {
  write(WEIGHT_DEFAULTS); update(); el('weight-url-warning').textContent = '';
  const url = new URL(window.location.href); fields.forEach(key => url.searchParams.delete(key)); url.searchParams.delete('weightOz');
  window.history.replaceState(null, '', url);
  el('weight-action-status').textContent = 'Weight estimate reset to 20 guests, one 5 oz scoop each, no base, and 10% extra.';
});
const loaded = loadWeightedPlan(window.location.search); write(loaded.raw); update(false);
el('weight-reset').disabled = false;
if (loaded.warnings.length) el('weight-url-warning').textContent = 'Some shared inputs were invalid, repeated, or used an older ounce portion that does not match 5 oz scoops. Defaults were used for those inputs; review the scoop and base selections.';
window.addEventListener('beforeprint', () => update(false));
window.addEventListener('afterprint', () => { delete document.body.dataset.printPlan; });
