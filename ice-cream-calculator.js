import { calculate, validate, containerText, SERVINGS, loadSimplePlan, simpleShareURL, simpleSummary } from './ice-cream-party-core.js?v=20261025-1';
import { track } from './ice-cream-party-events.js?v=20261025-1';

const form = document.getElementById('party-form');
const guests = document.getElementById('guests');
const results = document.getElementById('plan-results');
const guestError = document.getElementById('guests-error');
const status = document.getElementById('result-status');
const el = id => document.getElementById(id);
let current, announcement;

function update(announce = true) {
  clearTimeout(announcement);
  const raw = { guests: guests.value, serving: new FormData(form).get('serving') };
  const errors = validate(raw);
  guestError.textContent = errors.guests || '';
  guests.setAttribute('aria-invalid', String(Boolean(errors.guests)));
  results.hidden = Object.keys(errors).length > 0;
  document.querySelectorAll('[data-simple-action]').forEach(button => { button.disabled = results.hidden; });
  el('simple-share-output').hidden = true;
  el('simple-copy-fallback').hidden = true;
  el('simple-action-status').textContent = '';
  current = results.hidden ? null : raw;
  if (results.hidden) {
    status.textContent = errors.guests || errors.serving;
    return;
  }
  const plan = calculate(raw);
  const pints = containerText(plan.pints, 'pint');
  const gallons = containerText(plan.gallons, 'gallon');
  document.getElementById('result-pints').textContent = pints;
  document.getElementById('result-gallons').textContent = gallons;
  el('simple-assumptions').textContent = `${raw.guests} guests × ${SERVINGS[raw.serving] / 4} planned scoop${raw.serving === 'small' ? '' : 's'} (${SERVINGS[raw.serving] / 8} cup${raw.serving === 'medium' ? '' : 's'} per guest); buy ${pints} or ${gallons}.`;
  const message = `You'll need ${pints} or ${gallons}. Rounded up to whole containers.`;
  if (announce) {
    announcement = setTimeout(() => { status.textContent = message; }, 350);
    track('calculator_use', 'quick');
  } else status.textContent = message;
}

form.addEventListener('input', () => update());
form.addEventListener('change', () => update());
form.addEventListener('submit', event => {
  event.preventDefault();
  update();
  if (results.hidden) guests.focus();
});
const loaded = loadSimplePlan(location.search);
guests.value = loaded.raw.guests;
form.querySelector(`input[value="${loaded.raw.serving}"]`).checked = true;
if (loaded.warnings.length) el('simple-url-warning').textContent = 'Some shared inputs were invalid or repeated. Defaults were used for those fields; review your plan.';
update(false);

async function copy(text, success, event) {
  try {
    await navigator.clipboard.writeText(text);
    el('simple-action-status').textContent = success;
    track(event, 'quick');
  } catch {
    el('simple-copy-fallback').hidden = false;
    el('simple-copy-text').value = text;
    el('simple-copy-text').focus(); el('simple-copy-text').select();
    el('simple-action-status').textContent = 'Automatic copying is unavailable. Use your device’s copy command on the selected text.';
  }
}
el('simple-copy').addEventListener('click', () => { update(false); if (current) copy(simpleSummary(current), 'Results copied.', 'calculator_results_copied'); });
el('simple-share').addEventListener('click', async () => {
  update(false); if (!current) return;
  const url = simpleShareURL(current, location.href);
  track('calculator_share_generated', 'quick');
  await copy(url, 'Results link copied.', 'calculator_share_copied');
  el('simple-share-link').href = url; el('simple-share-output').hidden = false;
});
el('simple-print').addEventListener('click', () => {
  update(false); if (!current) return;
  document.body.dataset.printPlan = 'quick';
  track('calculator_print', 'quick'); window.print();
});
window.addEventListener('beforeprint', () => {
  if (!document.body.dataset.printPlan) document.body.dataset.printPlan = 'quick';
  update(false);
});
window.addEventListener('afterprint', () => { delete document.body.dataset.printPlan; });

el('copy-embed')?.addEventListener('click', async () => {
  const code = el('embed-code');
  try {
    await navigator.clipboard.writeText(code.value);
    el('embed-status').textContent = 'Embed code copied.';
    track('calculator_embed_copied', 'quick');
  } catch {
    code.focus(); code.select();
    el('embed-status').textContent = 'Use your device’s copy command on the selected embed code.';
  }
});
