import { DEFAULTS, calculate, volume, usd, validate, assumptions, costNote, checklist, shoppingText, loadPlan, shareURL } from './ice-cream-calculator-core.js?v=20261014-1';
const byId = id => document.getElementById(id);
const form = byId('party-form');
const fields = Object.keys(DEFAULTS);
let timer, current;
const read = () => Object.fromEntries(fields.map(key => [key, key === 'toppings' ? (byId(key).checked ? '1' : '0') : byId(key).value.trim()]));
const write = raw => fields.forEach(key => { if (key === 'toppings') byId(key).checked = raw[key] === '1'; else byId(key).value = raw[key]; });
const announce = message => { byId('action-status').textContent = message; };
function update(shouldAnnounce = true) {
  clearTimeout(timer);
  const raw = read(), errors = validate(raw), valid = !Object.keys(errors).length;
  fields.forEach(key => {
    byId(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    byId(`${key}-error`).textContent = errors[key] || '';
  });
  byId('grams-field').hidden = raw.toppings !== '1' && !errors.grams;
  byId('validation-summary').textContent = valid ? '' : 'Please correct the highlighted inputs to update your plan.';
  byId('plan-results').hidden = !valid;
  byId('shopping-plan').hidden = !valid;
  document.querySelectorAll('[data-plan-action]').forEach(button => { button.disabled = !valid; });
  byId('share-output').hidden = true; byId('copy-fallback').hidden = true;
  if (!valid) { current = null; if (shouldAnnounce) byId('result-status').textContent = 'Plan needs correction. ' + Object.values(errors).join(' '); return false; }
  current = raw;
  const r = calculate(raw);
  byId('result-count').textContent = volume(r.count);
  byId('result-container').textContent = r.count === 1 ? r.container.label : r.container.plural;
  byId('result-required').textContent = `${volume(r.required)} cups`;
  byId('result-purchased').textContent = `${volume(r.purchased)} cups`;
  byId('result-servings').textContent = `≈ ${volume(r.servings)} servings`;
  byId('result-portion').textContent = `at ${r.serving.portion} each`;
  byId('plan-assumptions').textContent = assumptions(raw);
  byId('result-formula').textContent = `${r.guests} × ${r.serving.portion} × ${volume(1 + r.extra / 100)} = about ${volume(r.required)} cups.`;
  byId('cost-values').hidden = r.totalCents === null;
  byId('cost-total').textContent = r.totalCents === null ? '' : usd(r.totalCents / 100);
  byId('cost-per-guest').textContent = r.totalCents === null ? '' : `${usd(r.perGuest)} per guest`;
  byId('cost-note').textContent = costNote(raw);
  byId('topping-assumption').textContent = r.toppingGrams === null ? 'Optional topping estimate off. Choose your own quantities.' : `Dry toppings: ${raw.grams} g per guest × ${r.guests} guests × ${volume(1 + r.extra / 100)} = about ${volume(r.toppingGrams)} g. This editable assumption is separate from ice cream volume and excludes sauces.`;
  checklist(raw).forEach((item, i) => { byId(`shopping-${i}`).textContent = item; });
  if (shouldAnnounce) byId('result-status').textContent = `Updated plan: buy ${r.count} ${r.count === 1 ? r.container.label : r.container.plural}, ${r.purchased} cups total.${r.totalCents === null ? '' : ` Estimated cost ${usd(r.totalCents / 100)}.`}`;
  return true;
}
form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { announce(''); update(); }, 500); });
form.addEventListener('change', () => { announce(''); update(); });
form.addEventListener('submit', event => { event.preventDefault(); if (!update()) form.querySelector('[aria-invalid="true"]').focus(); });
async function copy(text, success) {
  try { await navigator.clipboard.writeText(text); announce(success); }
  catch {
    byId('copy-fallback').hidden = false;
    byId('copy-text').value = text; byId('copy-text').focus(); byId('copy-text').select();
    announce('Automatic copying is unavailable. Your text is selected below; use your device’s copy command.');
  }
}
byId('copy-plan').addEventListener('click', () => { if (update(false)) copy(shoppingText(current), 'Shopping list copied. It includes your quantities, costs, and assumptions.'); });
byId('share-plan').addEventListener('click', async () => {
  if (!update(false)) return;
  const url = shareURL(current, window.location.href);
  await copy(url, 'Plan link copied. Anyone with this link can load your inputs.');
  byId('share-link').href = url; byId('share-output').hidden = false;
});
byId('print-plan').addEventListener('click', () => { if (update(false)) { document.body.dataset.printPlan = 'containers'; window.print(); } });
byId('reset-plan').addEventListener('click', () => {
  write(DEFAULTS); update();
  document.querySelectorAll('.shopping-list input').forEach(input => { input.checked = false; });
  byId('url-warning').textContent = '';
  const cleanURL = new URL(window.location.href); cleanURL.search = ''; cleanURL.hash = '';
  window.history.replaceState(null, '', cleanURL);
  announce('Plan reset to 20 guests, standard servings, 10% extra, and quarts.');
});
const loaded = loadPlan(window.location.search);
write(loaded.raw); update(false);
byId('reset-plan').disabled = false;
if (loaded.warnings.length) byId('url-warning').textContent = `Some shared inputs were invalid or repeated (${loaded.warnings.join(', ')}). Default values were used for those fields; review the plan before shopping.`;
window.addEventListener('beforeprint', () => update(false));
