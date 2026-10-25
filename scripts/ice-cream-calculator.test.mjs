import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, calculate, validate, containerText } from '../ice-cream-party-core.js';

test('approved example: 16 medium servings need 8 pints or 1 gallon', () => {
  assert.deepEqual(calculate(DEFAULTS), { pints: 8, gallons: 1 });
});

test('all three serving sizes and whole-container rounding', () => {
  for (const [guests, serving, pints, gallons] of [
    ['16', 'small', 4, 1], ['16', 'medium', 8, 1], ['16', 'large', 12, 2],
    ['1', 'small', 1, 1], ['1', 'medium', 1, 1], ['1', 'large', 1, 1],
    ['4', 'small', 1, 1], ['5', 'small', 2, 1],
    ['32', 'small', 8, 1], ['33', 'small', 9, 2],
    ['20', 'medium', 10, 2], ['1000', 'large', 750, 94]
  ]) {
    assert.deepEqual(calculate({ guests, serving }), { pints, gallons }, `${guests} ${serving} servings`);
  }
});

test('empty, fractional, negative, out-of-range, and malformed guests are rejected', () => {
  for (const guests of ['', '0', '-1', '1.5', '1001', 'Infinity', 'NaN', '1e2', ' 2', null, undefined]) {
    const raw = { ...DEFAULTS, guests };
    assert.ok(validate(raw).guests, String(guests));
    assert.throws(() => calculate(raw), RangeError);
  }
});

test('unknown serving choices cannot create a result', () => {
  for (const serving of ['', 'standard', '__proto__', 'toString', null, undefined]) {
    const raw = { ...DEFAULTS, serving };
    assert.ok(validate(raw).serving);
    assert.throws(() => calculate(raw), RangeError);
  }
});

test('results use singular and plural container labels', () => {
  assert.equal(containerText(1, 'pint'), '1 pint');
  assert.equal(containerText(8, 'pint'), '8 pints');
  assert.equal(containerText(1, 'gallon'), '1 gallon');
  assert.equal(containerText(2, 'gallon'), '2 gallons');
});

import fs from 'node:fs';
import { loadSimplePlan, simpleShareURL, simpleSummary, SERVINGS as QUICK_SERVINGS } from '../ice-cream-party-core.js';
import { DEFAULTS as DETAILED, calculate as detailed, loadPlan, shareURL, shoppingText, WEIGHT_DEFAULTS, calculateWeighted, loadWeightedPlan, weightedShareURL } from '../ice-cream-calculator-core.js';

test('quick share URLs round trip every size, strip unrelated parameters, and validate first', () => {
  for (const serving of Object.keys(QUICK_SERVINGS)) {
    const raw = { guests: '75', serving };
    const url = new URL(simpleShareURL(raw, 'https://example.test/ice-cream-party-calculator/embed.html?email=private#old'));
    assert.equal(url.pathname, '/ice-cream-party-calculator/');
    assert.equal(url.searchParams.size, 2);
    assert.equal(url.hash, '');
    assert.deepEqual(loadSimplePlan(url.search).raw, raw);
  }
  assert.throws(() => simpleShareURL({ guests: '0', serving: 'medium' }, 'https://example.test'), RangeError);
  assert.match(simpleSummary(DEFAULTS), /16 guests.*2 planned scoops/);
  assert.match(simpleSummary(DEFAULTS), /8 pints OR 1 gallon/);
});

test('quick URL input rejects duplicate, malformed and unsafe values while preserving valid fields', () => {
  for (const value of ['', '0', '1001', '1.5', '<script>', '1e2', 'Infinity']) {
    const plan = loadSimplePlan(`?simpleGuests=${encodeURIComponent(value)}&simpleServing=large`);
    assert.deepEqual(plan.raw, { guests: '16', serving: 'large' });
    assert.deepEqual(plan.warnings, ['guests']);
  }
  assert.deepEqual(loadSimplePlan('?simpleGuests=50&simpleGuests=100&simpleServing=__proto__').warnings, ['guests', 'serving']);
  assert.deepEqual(loadSimplePlan('?guests=20&serving=standard').raw, DEFAULTS);
});

test('restored detailed planner preserves portions, allowance, container rounding, toppings and exact cents', () => {
  assert.equal(detailed(DETAILED).required, 11);
  assert.equal(detailed(DETAILED).count, 3);
  for (const [container, count] of [['pint', 14], ['quart', 7], ['half-gallon', 4], ['gallon', 2]]) {
    const raw = { ...DETAILED, guests: '50', container, toppings: '1', price: '6.25', supplies: '10.50' };
    const r = detailed(raw);
    assert.equal(r.required, 27.5);
    assert.equal(r.count, count);
    assert.equal(r.toppingGrams, 825);
    assert.equal(r.supplyCount, 55);
    assert.equal(r.totalCents, count * 625 + 1050);
    assert.deepEqual(loadPlan(new URL(shareURL(raw, 'https://example.test')).search).raw, raw);
    assert.match(shoppingText(raw), /825 g total/);
  }
  for (const [serving, cups] of [['light', 1], ['standard', 1.5], ['generous', 2]]) {
    assert.equal(detailed({ ...DETAILED, guests: '3', serving, extra: '0' }).required, cups);
  }
  assert.equal(detailed(DETAILED).totalCents, null);
  assert.deepEqual(loadPlan('?guests=0&guests=20&serving=__proto__').warnings, ['guests', 'serving']);
});

test('weight formulas and legacy shared ounce portions stay unchanged', () => {
  assert.equal(calculateWeighted(WEIGHT_DEFAULTS).totalCents, 8800);
  for (const weightBase of ['cookie-dough', 'brownie']) {
    const raw = { weightGuests: '45', weightScoops: '2', weightBase, weightExtra: '20' };
    assert.equal(calculateWeighted(raw).totalCents, 60480);
    assert.deepEqual(loadWeightedPlan(new URL(weightedShareURL(raw, 'https://example.test')).search).raw, raw);
  }
  assert.equal(loadWeightedPlan('?weightOz=10').raw.weightScoops, '2');
  assert.deepEqual(loadWeightedPlan('?weightOz=8').warnings, ['weightOz']);
});

test('crawlable reference table exactly matches the quick calculator and unchanged canonical', () => {
  const html = fs.readFileSync(new URL('../ice-cream-party-calculator/index.html', import.meta.url), 'utf8');
  const rows = [...html.matchAll(/<tr><th scope="row">(\d+)<\/th><td>([\d.]+)<\/td><td>([\d.]+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)];
  assert.deepEqual(rows.map(row => Number(row[1])), [10, 25, 50, 75, 100, 150, 200]);
  for (const [, guests, cups, gallons, pints, wholeGallons] of rows) {
    const result = calculate({ guests, serving: 'medium' });
    assert.equal(Number(cups), Number(guests));
    assert.equal(Number(gallons), Number(guests) / 16);
    assert.equal(Number(pints), result.pints);
    assert.equal(Number(wholeGallons), result.gallons);
  }
  assert.match(html, /<link rel="canonical" href="https:\/\/www.sweetescapememphis.com\/ice-cream-party-calculator\/">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.deepEqual(graph.map(node => node['@type']), ['WebPage', 'WebApplication', 'BreadcrumbList', 'Organization']);
  assert.equal(graph[1].offers.price, '0');
  assert.equal(graph[1].isAccessibleForFree, true);
  assert.equal(graph[1].url, graph[0].url);
  assert.doesNotMatch(JSON.stringify(graph), /aggregateRating|review|FAQPage/);
  const embed = fs.readFileSync(new URL('../ice-cream-party-calculator/embed.html', import.meta.url), 'utf8');
  assert.doesNotMatch(embed, /googletagmanager|analytics\.js|chat\.js/);
  assert.match(embed, /noindex, follow/); // Intentional duplicate utility; main remains indexable.
});
