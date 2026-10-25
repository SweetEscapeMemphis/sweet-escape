export const DEFAULTS = Object.freeze({ guests: '16', serving: 'medium' });
// US fluid ounces measure volume: 16 per pint and 128 per gallon.
export const SERVINGS = Object.freeze({ small: 4, medium: 8, large: 12 });

export function validate({ guests, serving }) {
  const errors = {};
  if (!/^\d+$/.test(String(guests)) || Number(guests) < 1 || Number(guests) > 1000) {
    errors.guests = 'Enter a whole number from 1 to 1,000.';
  }
  if (!Object.hasOwn(SERVINGS, serving)) errors.serving = 'Choose a serving size.';
  return errors;
}

export function calculate(raw) {
  const errors = validate(raw);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
  const ounces = Number(raw.guests) * SERVINGS[raw.serving];
  return { pints: Math.ceil(ounces / 16), gallons: Math.ceil(ounces / 128) };
}

export function containerText(count, unit) {
  return `${count.toLocaleString('en-US')} ${unit}${count === 1 ? '' : 's'}`;
}

// Separate names keep legacy cup-based planner links working without ambiguity.
const URL_FIELDS = { guests: 'simpleGuests', serving: 'simpleServing' };
export function loadSimplePlan(search) {
  const params = new URLSearchParams(search), raw = { ...DEFAULTS }, warnings = [];
  for (const [key, param] of Object.entries(URL_FIELDS)) {
    if (!params.has(param)) continue;
    const values = params.getAll(param);
    if (values.length !== 1 || validate({ ...DEFAULTS, [key]: values[0] })[key]) warnings.push(key);
    else raw[key] = values[0];
  }
  return { raw, warnings };
}

export function simpleShareURL(raw, base) {
  calculate(raw);
  const url = new URL('/ice-cream-party-calculator/', base);
  for (const [key, param] of Object.entries(URL_FIELDS)) url.searchParams.set(param, raw[key]);
  return url.href;
}

export function simpleSummary(raw) {
  const plan = calculate(raw), scoops = SERVINGS[raw.serving] / 4;
  return `ICE CREAM PARTY PLAN\n${raw.guests} guests × ${scoops} planned scoop${scoops === 1 ? '' : 's'} (${SERVINGS[raw.serving]} US fl oz per guest).\nBuy ${containerText(plan.pints, 'pint')} OR ${containerText(plan.gallons, 'gallon')}; alternative purchases rounded up independently.\nOne planned scoop = ½ cup (4 fl oz); no extra allowance. Actual scoops vary.\nBring bowls or cones, spoons, napkins, a scoop, and separate topping utensils.\nToppings and costs: use the optional detailed planner for quantities and a budget.\nhttps://www.sweetescapememphis.com/ice-cream-party-calculator/`;
}
