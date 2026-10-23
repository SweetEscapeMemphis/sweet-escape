import { calculate, validate, containerText } from './ice-cream-party-core.js?v=20261023-2';

const form = document.getElementById('party-form');
const guests = document.getElementById('guests');
const results = document.getElementById('plan-results');
const guestError = document.getElementById('guests-error');
const status = document.getElementById('result-status');

function update() {
  const raw = { guests: guests.value, serving: new FormData(form).get('serving') };
  const errors = validate(raw);
  guestError.textContent = errors.guests || '';
  guests.setAttribute('aria-invalid', String(Boolean(errors.guests)));
  results.hidden = Object.keys(errors).length > 0;
  if (results.hidden) {
    status.textContent = errors.guests || errors.serving;
    return;
  }
  const plan = calculate(raw);
  const pints = containerText(plan.pints, 'pint');
  const gallons = containerText(plan.gallons, 'gallon');
  document.getElementById('result-pints').textContent = pints;
  document.getElementById('result-gallons').textContent = gallons;
  status.textContent = `You'll need ${pints} or ${gallons}. Rounded up to whole containers.`;
}

form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('submit', event => {
  event.preventDefault();
  update();
  if (results.hidden) guests.focus();
});
update();
