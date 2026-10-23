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
