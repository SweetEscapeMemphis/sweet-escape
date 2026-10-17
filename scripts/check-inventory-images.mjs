// Run with Node.js: verifies images selected by the actual inventory renderer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
for (const all of [false, true]) {
  const nodes = new Map();
  const element = () => ({ children: [], innerHTML: '', append(child) { this.children.push(child); }, addEventListener() {}, setAttribute() {} });
  const window = {};
  const context = vm.createContext({ window, document: {
    querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); },
    createElement: element,
  }, Intl, Date });
  for (const file of ['flavors', 'yogurt-flavors', 'gelato-flavors']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'data', `${file}.js`), 'utf8'), context);
  }
  const stock = JSON.parse(fs.readFileSync(path.join(root, 'data/stock.json'), 'utf8'));
  window.SweetEscapeStock = {
    load: async () => stock,
    idsFor: (value, key, ids) => new Set(ids.filter(id => all || value[key] === '*' || value[key].includes(id))),
  };
  await vm.runInContext(fs.readFileSync(path.join(root, 'stock-page.js'), 'utf8'), context);
  const cards = nodes.get('#stock-grid').children.filter(node => node.className === 'stock-card');
  const expected = ['scoops', 'yogurt', 'gelato'].reduce((count, key, index) => {
    const catalog = Object.values(window).filter(value => value.flavors)[index].flavors;
    return count + catalog.filter(item => all || stock[key] === '*' || stock[key].includes(item.id)).length;
  }, 0);
  assert.equal(cards.length, expected);
  let checked = 0;
  for (const card of cards) {
    const image = card.innerHTML.match(/<img src="([^"]+)"/)[1];
    const srcset = card.innerHTML.match(/srcset="([^"]+)"/)?.[1];
    for (const url of [image, ...(srcset ? srcset.split(',').map(entry => entry.trim().split(' ')[0]) : [])]) {
      assert.ok(!/^https?:/.test(url), `Inventory should use local pictures: ${url}`);
      assert.ok(fs.statSync(path.join(root, url)).size > 0, `Missing image: ${url}`);
      checked++;
    }
    if (image.includes('/generated/')) assert.equal(srcset, undefined, 'A responsive srcset would override the generated image');
  }
  console.log(`PASS ${all ? 'Complete catalog' : 'Current stock'}: ${cards.length} pictures, ${checked} image sources exist.`);
}
