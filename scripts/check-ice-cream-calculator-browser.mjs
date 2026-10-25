// Serve dist/ first. Optional local runtime overrides are documented in README.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.CALCULATOR_PREVIEW_ORIGIN || 'http://127.0.0.1:8768';
const output = path.resolve('reports/party-calculator-seo-20261025/browser');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
await context.route('https://**/*', route => route.abort());
const page = await context.newPage(), checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = `${origin}/ice-cream-party-calculator/`;
const check = async (name, fn) => { await fn(); checks.push(name); console.log(`PASS ${name}`); };
const text = id => page.locator(`#${id}`).textContent();
try {
  await page.goto(base);
  await page.waitForFunction(() => document.getElementById('result-status').textContent.includes('8 pints'));
  await check('two quick questions, approved default result, and optional planning kept separate', async () => {
    assert.equal(await page.locator('#guests').inputValue(), '16');
    assert.equal(await page.locator('input[name="serving"]').count(), 3);
    assert.equal(await page.locator('#simple-party-calculator input').count(), 4);
    assert.equal(await text('result-pints'), '8 pints');
    assert.equal(await text('result-gallons'), '1 gallon');
    assert.equal(await page.locator('#simple-party-calculator input[type=number]').count(), 1);
    assert.equal(await page.locator('#simple-party-calculator select, #simple-party-calculator details').count(), 0);
    assert.equal(await page.locator('#simple-party-calculator button').count(), 3);
    assert.equal(await page.locator('#detailed-planner').getAttribute('open'), null);
  });
  await check('all serving sizes update immediately and round containers up', async () => {
    for (const [size, pints, gallons] of [['1 scoop', '4 pints', '1 gallon'], ['2 scoops', '8 pints', '1 gallon'], ['3 scoops', '12 pints', '2 gallons']]) {
      await page.getByLabel(new RegExp(`^${size}`, 'i')).check();
      assert.equal(await text('result-pints'), pints);
      assert.equal(await text('result-gallons'), gallons);
    }
    await page.getByLabel(/^2 scoops/i).check();
    await page.locator('#guests').fill('17');
    assert.equal(await text('result-pints'), '9 pints');
    assert.equal(await text('result-gallons'), '2 gallons');
    await page.waitForFunction(() => document.getElementById('result-status').textContent.includes('9 pints or 2 gallons'));
  });
  await check('invalid guest entries hide stale results and recover when corrected', async () => {
    for (const value of ['', '0', '-1', '1.5', '1001']) {
      await page.locator('#guests').fill(value);
      assert.equal(await page.locator('#guests').getAttribute('aria-invalid'), 'true');
      assert.ok(await page.locator('#plan-results').isHidden());
      assert.match(await text('guests-error'), /whole number from 1 to 1,000/);
    }
    await page.locator('#guests').fill('1000');
    await page.getByLabel(/^3 scoops/i).check();
    assert.ok(await page.locator('#plan-results').isVisible());
    assert.equal(await text('result-pints'), '750 pints');
    assert.equal(await text('result-gallons'), '94 gallons');
    await page.locator('#guests').fill('1');
    assert.equal(await text('result-pints'), '1 pint');
    assert.equal(await text('result-gallons'), '1 gallon');
  });
  await check('guest entry and serving choices work with the keyboard', async () => {
    await page.locator('#guests').fill('16');
    await page.locator('#guests').press('Enter');
    assert.equal(page.url(), base);
    await page.getByLabel(/^2 scoops/i).check();
    await page.locator('#guests').focus();
    await page.keyboard.press('Tab');
    assert.ok(await page.getByLabel(/^2 scoops/i).evaluate(el => el === document.activeElement));
    assert.notEqual(await page.getByLabel(/^2 scoops/i).evaluate(el => getComputedStyle(el.nextElementSibling).outlineStyle), 'none');
    await page.keyboard.press('ArrowRight');
    assert.ok(await page.getByLabel(/^3 scoops/i).isChecked());
    assert.equal(await text('result-pints'), '12 pints');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await text('result-pints'), '8 pints');
  });
  await check('desktop and mobile layouts fit without horizontal overflow', async () => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1050 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
      assert.ok(await page.locator('#plan-results').isVisible());
    }
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/mobile.png`, fullPage: true, animations: 'disabled' });
    await page.screenshot({ path: `${output}/mobile-top.png`, animations: 'disabled' });
  });
  await check('without JavaScript the default is labeled as an example and controls are hidden', async () => {
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await nojs.newPage();
    await staticPage.goto(base);
    assert.ok(await staticPage.locator('#party-form').isHidden());
    assert.match(await staticPage.locator('#simple-party-calculator noscript').innerText(), /example below is for 16 people/);
    assert.equal(await staticPage.locator('#result-pints').textContent(), '8 pints');
    await nojs.close();
  });
  await check('Sweet Escape defaults, bases, independent updates, sharing, reset, and printing are preserved', async () => {
    assert.equal(await text('weight-total-oz'), '110 oz');
    assert.equal(await text('weight-total-cost'), '$88.00');
    assert.equal(await page.locator('#weightScoops').inputValue(), '1');
    assert.equal(await page.locator('#weightExtra').inputValue(), '10');
    for (const baseChoice of ['cookie-dough', 'brownie']) {
      await page.locator('#weightBase').selectOption(baseChoice);
      assert.equal(await text('weight-total-oz'), '198 oz');
      assert.equal(await text('weight-total-cost'), '$158.40');
    }
    await page.locator('#guests').fill('32');
    await page.getByLabel(/^3 scoops/i).check();
    assert.equal(await text('result-pints'), '24 pints');
    assert.equal(await text('weight-total-cost'), '$158.40');
    await page.locator('#weightGuests').fill('45');
    await page.locator('#weightScoops').fill('2');
    await page.locator('#weightExtra').fill('20');
    await page.locator('#weightExtra').press('Tab');
    await page.waitForFunction(() => document.getElementById('weight-total-cost').textContent === '$604.80');
    assert.equal(await text('result-pints'), '24 pints');
    await page.locator('#weight-share').click();
    await page.waitForFunction(() => !document.getElementById('weight-share-output').hidden);
    const link = await page.locator('#weight-share-link').getAttribute('href');
    assert.equal(new URL(link).searchParams.get('weightScoops'), '2');
    assert.equal(new URL(link).searchParams.get('weightBase'), 'brownie');
    await page.goto(link);
    assert.equal(await text('weight-total-cost'), '$604.80');
    await page.evaluate(() => { window.print = () => {}; });
    await page.locator('#weight-print').click();
    await page.emulateMedia({ media: 'print' });
    assert.ok(await page.locator('#simple-party-calculator').isHidden());
    assert.ok(await page.locator('#weight-results').isVisible());
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.locator('#weight-reset').click();
    assert.equal(await text('weight-total-cost'), '$88.00');
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(base);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedText = value; } } });
  });
  await check('quick copy/share preserves state, canonical and clipboard fallback', async () => {
    await page.locator('#guests').fill('50');
    await page.getByLabel(/^1 scoop/i).check();
    await page.locator('#simple-copy').click();
    assert.match(await page.evaluate(() => window.copiedText), /50 guests.*1 planned scoop/);
    await page.locator('#simple-share').click();
    const link = await page.locator('#simple-share-link').getAttribute('href');
    assert.equal(new URL(link).searchParams.get('simpleGuests'), '50');
    await page.goto(link);
    assert.equal(await text('result-pints'), '13 pints');
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.sweetescapememphis.com/ice-cream-party-calculator/');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }); });
    await page.locator('#simple-copy').click();
    assert.ok(await page.locator('#simple-copy-fallback').isVisible());
    assert.match(await page.locator('#simple-copy-text').inputValue(), /13 pints OR 2 gallons/);
    await page.goto(`${base}?simpleGuests=50&simpleGuests=100&simpleServing=bad`);
    assert.equal(await page.locator('#guests').inputValue(), '16');
    assert.match(await text('simple-url-warning'), /invalid or repeated/);
  });
  await check('detailed planner costs, toppings, supplies, copy/share and validation', async () => {
    await page.locator('#detailed-planner > summary').click();
    await page.locator('#advanced-guests').fill('50');
    await page.locator('#advanced-toppings').check();
    await page.locator('#advanced-price').fill('6.25');
    await page.locator('#advanced-supplies').fill('10.50');
    await page.locator('#advanced-party-form button[type=submit]').click();
    assert.equal(await text('advanced-result-count'), '7');
    assert.equal(await text('advanced-cost-total'), '$54.25');
    assert.match(await text('advanced-shopping-1'), /825 g/);
    assert.match(await text('advanced-shopping-3'), /55 total/);
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedText = value; } } }); });
    await page.locator('#advanced-copy-plan').click();
    assert.match(await page.evaluate(() => window.copiedText), /50 guests.*Standard dessert/);
    assert.match(await page.evaluate(() => window.copiedText), /Estimated cost: \$54.25/);
    await page.locator('#advanced-share-plan').click();
    const link = await page.locator('#advanced-share-link').getAttribute('href');
    await page.goto(link);
    assert.ok(await page.locator('#advanced-party-form').isVisible());
    assert.equal(await text('advanced-cost-total'), '$54.25');
    assert.equal(await text('result-pints'), '8 pints');
    await page.locator('#advanced-guests').fill('0');
    await page.locator('#advanced-party-form button[type=submit]').click();
    assert.ok(await page.locator('#advanced-plan-results').isHidden());
    assert.ok(await page.locator('#advanced-share-plan').isDisabled());
    assert.equal(await page.locator('#advanced-guests').evaluate(el => el === document.activeElement), true);
    await page.locator('#advanced-reset-plan').click();
    assert.equal(await text('advanced-result-count'), '3');
    assert.ok(await page.locator('#advanced-cost-values').isHidden());
  });
  await check('print isolates quick, detailed shopping list, and weight estimates', async () => {
    await page.locator('#advanced-guests').fill('50');
    await page.locator('#advanced-toppings').check();
    await page.locator('#advanced-price').fill('6.25');
    await page.locator('#advanced-supplies').fill('10.50');
    await page.locator('#advanced-party-form button[type=submit]').click();
    await page.evaluate(() => { window.print = () => window.dispatchEvent(new Event('beforeprint')); });
    for (const [button, visible, hidden] of [
      ['simple-print', 'plan-results', 'sweet-escape-weight-calculator'],
      ['advanced-print-plan', 'advanced-shopping-plan', 'simple-party-calculator'],
      ['weight-print', 'weight-results', 'simple-party-calculator']
    ]) {
      await page.locator(`#${button}`).click();
      await page.emulateMedia({ media: 'print' });
      assert.ok(await page.locator(`#${visible}`).isVisible());
      assert.ok(await page.locator(`#${hidden}`).isHidden());
      await page.pdf({ path: `${output}/${button}.pdf`, format: 'Letter', printBackground: true });
      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    }
  });
  await check('all planner fields have labels and valid accessible descriptions', async () => {
    const problems = await page.locator('#main-content input:not([type=checkbox]), #main-content select, #main-content textarea').evaluateAll(fields => fields.flatMap(field => {
      const issues = [];
      if (!field.labels?.length) issues.push(`${field.id}: missing label`);
      for (const id of (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)) if (!document.getElementById(id)) issues.push(`${field.id}: missing ${id}`);
      return issues;
    }));
    assert.deepEqual(problems, []);
    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(el => el.id));
    assert.equal(new Set(ids).size, ids.length);
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(base);
    await page.screenshot({ path: `${output}/desktop-top.png`, animations: 'disabled' });
    await page.locator('#detailed-planner > summary').click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Expanded planner overflow at ${width}px`);
    }
    await page.locator('#detailed-planner').screenshot({ path: `${output}/detailed-desktop.png`, animations: 'disabled' });
  });
  await check('embed has no external requests, works at narrow widths, and code copies', async () => {
    await page.goto(base);
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedText = value; } } }); });
    await page.locator('#copy-embed').click();
    assert.match(await page.evaluate(() => window.copiedText), /<iframe.*title="Ice cream party calculator"/);
    const external = [];
    const embed = await context.newPage();
    embed.on('request', request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
    await embed.goto(`${base}embed.html?simpleGuests=100&simpleServing=large`);
    assert.equal(await embed.locator('#result-pints').textContent(), '75 pints');
    for (const width of [320, 390, 768]) {
      await embed.setViewportSize({ width, height: 1000 });
      assert.ok(await embed.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(external, []);
    await embed.screenshot({ path: `${output}/embed.png`, fullPage: true });
    await embed.close();
  });
  await check('analytics sends only fixed action names and planner identifiers', async () => {
    await page.goto(base);
    await page.locator('#guests').fill('75');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }); });
    await page.locator('#simple-copy').click();
    await page.locator('#simple-share').click();
    await page.locator('#copy-embed').click();
    const events = await page.evaluate(() => window.dataLayer.filter(item => item[0] === 'event').map(item => [item[1], item[2]]));
    for (const name of ['calculator_use', 'calculator_results_copied', 'calculator_share_generated', 'calculator_embed_copied']) assert.ok(events.some(([event]) => event === name), name);
    for (const [, params] of events) assert.deepEqual(Object.keys(params).sort(), ['page_path', 'planner', 'transport_type']);
  });
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${output}/browser-checks.json`, JSON.stringify({ checks, pageErrors: errors, viewports: [320, 390, 768, 1440], preview: base }, null, 2));
} finally { await browser.close(); }
