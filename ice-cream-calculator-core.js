// Integer sixth-cups preserve exact thirds, halves, and container boundaries.
export const DEFAULTS = Object.freeze({ guests: '20', serving: 'standard', extra: '10', container: 'quart', price: '', supplies: '', toppings: '0', grams: '15' });
export const SERVINGS = Object.freeze({ light: { sixths: 2, label: 'Light treat', portion: '⅓ cup' }, standard: { sixths: 3, label: 'Standard dessert', portion: '½ cup' }, generous: { sixths: 4, label: 'Generous dessert', portion: '⅔ cup' } });
export const CONTAINERS = Object.freeze({ pint: { cups: 2, label: 'pint', plural: 'pints' }, quart: { cups: 4, label: 'quart', plural: 'quarts' }, 'half-gallon': { cups: 8, label: 'half gallon', plural: 'half gallons' }, gallon: { cups: 16, label: 'gallon', plural: 'gallons' } });
const integer = (value, min, max) => /^\d+$/.test(String(value)) && Number(value) >= min && Number(value) <= max;
const money = value => value === '' || (/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(String(value)) && Number(value) <= 1000000);
const own = (object, key) => Object.hasOwn(object, key);
export function validate(raw) {
  const errors = {};
  if (!integer(raw.guests, 1, 1000)) errors.guests = 'Enter a whole guest count from 1 to 1,000.';
  if (!own(SERVINGS, raw.serving)) errors.serving = 'Choose light, standard, or generous.';
  if (!integer(raw.extra, 0, 30)) errors.extra = 'Enter a whole percentage from 0 to 30.';
  if (!own(CONTAINERS, raw.container)) errors.container = 'Choose pint, quart, half gallon, or gallon.';
  for (const key of ['price', 'supplies']) if (!money(raw[key])) errors[key] = 'Enter a USD amount from 0 to 1,000,000, with up to two decimal places, or leave blank.';
  if (!['0', '1'].includes(raw.toppings)) errors.toppings = 'Choose whether to include the topping estimate.';
  if (!integer(raw.grams, 0, 100)) errors.grams = 'Enter whole grams from 0 to 100 per guest.';
  return errors;
}
const cents = value => {
  const [whole, decimal = ''] = String(value || '0').split('.');
  return Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
};
export function calculate(raw) {
  const errors = validate(raw);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
  const guests = Number(raw.guests), extra = Number(raw.extra);
  const serving = SERVINGS[raw.serving], container = CONTAINERS[raw.container];
  const numerator = guests * serving.sixths * (100 + extra);
  const count = Math.ceil(numerator / (600 * container.cups));
  const purchased = count * container.cups;
  const totalCents = raw.price === '' ? null : count * cents(raw.price) + cents(raw.supplies);
  return { guests, extra, serving, container, required: numerator / 600, count, purchased, servings: Math.floor(purchased * 6 / serving.sixths), supplyCount: Math.ceil(guests * (100 + extra) / 100), toppingGrams: raw.toppings === '1' ? Math.ceil(guests * Number(raw.grams) * (100 + extra) / 100) : null, totalCents, perGuest: totalCents === null ? null : totalCents / 100 / guests };
}
export const volume = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
export const usd = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function assumptions(raw) {
  const r = calculate(raw);
  return `${r.guests} guests · ${r.serving.label}, ${r.serving.portion} per guest · ${r.extra}% extra · ${r.container.label} containers. Editable planning assumptions, not verified Sweet Escape portions.`;
}
export function costNote(raw) {
  if (raw.price === '') return 'Enter a container price to estimate the complete cost. Prices are your own planning inputs.';
  return `${usd(Number(raw.price))} per container. ${raw.supplies === '' ? 'Toppings and supplies budget omitted; $0 added, so those expenses are excluded.' : `${usd(Number(raw.supplies))} total toppings and supplies budget included.`}`;
}
export function checklist(raw) {
  const r = calculate(raw), count = volume(r.supplyCount);
  return [
    `Ice cream: ${volume(r.count)} ${r.count === 1 ? r.container.label : r.container.plural} (${volume(r.purchased)} cups total). Divide among your chosen flavors.`,
    r.toppingGrams === null ? 'Toppings: choose sprinkles, crushed cookies, or other favorites; add quantities to suit your guests.' : `Dry toppings: about ${volume(r.toppingGrams)} g total, using ${raw.grams} g per guest plus ${r.extra}% extra. Split across your topping choices.`,
    'Sauces: choose chocolate, caramel, or fruit sauce; quantities are not estimated.',
    `Bowls or cones: ${count} total (one per guest plus ${r.extra}% extra, rounded up).`,
    `Spoons: ${count}; napkins: at least ${count}. Add more for messy treats.`,
    'Serving utensils: an ice cream scoop and separate spoons or tongs for each topping.',
    'Cold storage: arrange freezer space and insulated coolers for transport; keep ice cream frozen until serving.'
  ];
}
export function shoppingText(raw) {
  const r = calculate(raw);
  return ['ICE CREAM PARTY PLAN — Sweet Escape', assumptions(raw), `Required: about ${volume(r.required)} cups. Buy ${volume(r.count)} ${r.count === 1 ? r.container.label : r.container.plural}: ${volume(r.purchased)} cups, about ${volume(r.servings)} full servings at ${r.serving.portion} each.`, 'Whole containers may create extra leftovers beyond the allowance.', r.totalCents === null ? 'Cost not estimated.' : `Estimated cost: ${usd(r.totalCents / 100)} total; ${usd(r.perGuest)} per guest.`, costNote(raw), ...(raw.toppings === '1' ? [`Topping assumption: ${raw.grams} g of dry toppings per guest plus ${r.extra}% extra; weights are separate from ice cream volume.`] : ['Optional topping estimate off.']), '', 'SHOPPING CHECKLIST', ...checklist(raw).map(item => `□ ${item}`), '', 'https://www.sweetescapememphis.com/ice-cream-party-calculator/'].join('\n');
}
export function loadPlan(search) {
  const params = new URLSearchParams(search), raw = { ...DEFAULTS }, warnings = [];
  for (const key of Object.keys(DEFAULTS)) {
    if (!params.has(key)) continue;
    const values = params.getAll(key), candidate = { ...DEFAULTS, [key]: values[0] };
    if (values.length !== 1 || validate(candidate)[key]) warnings.push(key);
    else raw[key] = values[0];
  }
  return { raw, warnings };
}
export function shareURL(raw, base) {
  calculate(raw);
  const url = new URL(base);
  url.search = ''; url.hash = '';
  for (const key of Object.keys(DEFAULTS)) url.searchParams.set(key, raw[key]);
  return url.href;
}

// Store planning weights are independent of the cups/container calculator.
export const WEIGHT_RATE_CENTS = 80;
export const SCOOP_WEIGHT_OZ = 5;
export const BASE_WEIGHT_OZ = 4;
export const WEIGHT_BASES = Object.freeze({ none: 'No base', 'cookie-dough': 'Cookie Dough Base', brownie: 'Brownie Base' });
export const weightVolume = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value);
export const WEIGHT_DEFAULTS = Object.freeze({ weightGuests: '20', weightScoops: '1', weightBase: 'none', weightExtra: '10' });
export function validateWeighted(raw) {
  const errors = {};
  if (!integer(raw.weightGuests, 1, 1000)) errors.weightGuests = 'Enter a whole guest count from 1 to 1,000.';
  if (!integer(raw.weightScoops, 1, 12)) errors.weightScoops = 'Enter 1 to 12 whole scoops per guest. Each scoop weighs 5 oz for this plan.';
  if (!own(WEIGHT_BASES, raw.weightBase)) errors.weightBase = 'Choose no base, Cookie Dough Base, or Brownie Base.';
  if (!integer(raw.weightExtra, 0, 30)) errors.weightExtra = 'Enter a whole percentage from 0 to 30.';
  return errors;
}
export function calculateWeighted(raw) {
  const errors = validateWeighted(raw);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
  const guests = Number(raw.weightGuests), extra = Number(raw.weightExtra), scoops = Number(raw.weightScoops);
  const scoopOzPerGuest = scoops * SCOOP_WEIGHT_OZ;
  const baseOzPerGuest = raw.weightBase === 'none' ? 0 : BASE_WEIGHT_OZ;
  const ozPerGuest = scoopOzPerGuest + baseOzPerGuest;
  const numerator = guests * ozPerGuest * (100 + extra);
  const totalOz = numerator / 100;
  const totalCents = Math.round(numerator * WEIGHT_RATE_CENTS / 100);
  return { guests, extra, scoops, scoopOzPerGuest, baseOzPerGuest, baseLabel: WEIGHT_BASES[raw.weightBase], ozPerGuest, totalOz, totalCents, perGuest: totalCents / (100 * guests) };
}
export function weightedPortion(raw) {
  const r = calculateWeighted(raw);
  const iceCream = `${volume(r.scoops)} ${r.scoops === 1 ? 'scoop' : 'scoops'} × 5 oz = ${volume(r.scoopOzPerGuest)} oz`;
  return `${iceCream}${r.baseOzPerGuest ? ` + ${r.baseLabel} (4 oz)` : ', no base'}: ${volume(r.ozPerGuest)} oz per guest before the extra allowance.`;
}
export function weightedAssumptions(raw) {
  const r = calculateWeighted(raw);
  return `${volume(r.guests)} guests × ${volume(r.ozPerGuest)} oz per guest × ${volume(1 + r.extra / 100)} = ${weightVolume(r.totalOz)} oz planned. ${r.extra}% extra included. Plan uses 5 oz per scoop and 4 oz for the selected base per guest; actual serving weights can vary.`;
}
export function weightedText(raw) {
  const r = calculateWeighted(raw);
  return ['SWEET ESCAPE — BY-WEIGHT ESTIMATE', weightedPortion(raw), weightedAssumptions(raw), 'Rate: $0.80 per weight ounce (80 cents/oz).', `Planned weight: ${weightVolume(r.totalOz)} oz.`, `Estimated cost: ${usd(r.totalCents / 100)} total; ${usd(r.perGuest)} per guest, including the extra allowance.`, 'Estimate is before tax and other expenses. Actual cost depends on the purchased weight. Weight ounces are separate from fluid ounces and the container plan.', 'https://www.sweetescapememphis.com/ice-cream-party-calculator/#sweet-escape-weight-calculator'].join('\n');
}
export function loadWeightedPlan(search) {
  const params = new URLSearchParams(search), raw = { ...WEIGHT_DEFAULTS }, warnings = [];
  for (const key of Object.keys(WEIGHT_DEFAULTS)) {
    if (!params.has(key)) continue;
    const values = params.getAll(key);
    if (values.length !== 1 || validateWeighted({ ...WEIGHT_DEFAULTS, [key]: values[0] })[key]) warnings.push(key);
    else raw[key] = values[0];
  }
  // Preserve older shared plans when their ounce portion is an exact scoop count.
  if (params.has('weightOz') && !params.has('weightScoops')) {
    const old = params.getAll('weightOz');
    const scoops = Number(old[0]) / SCOOP_WEIGHT_OZ;
    if (old.length === 1 && /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(old[0]) && Number.isInteger(scoops) && scoops >= 1 && scoops <= 12) raw.weightScoops = String(scoops);
    else warnings.push('weightOz');
  }
  return { raw, warnings };
}
export function weightedShareURL(raw, base) {
  calculateWeighted(raw);
  const url = new URL(base); url.search = ''; url.hash = 'sweet-escape-weight-calculator';
  for (const key of Object.keys(WEIGHT_DEFAULTS)) url.searchParams.set(key, raw[key]);
  return url.href;
}
