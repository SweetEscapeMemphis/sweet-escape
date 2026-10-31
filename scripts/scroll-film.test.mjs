import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const home = fs.readFileSync(new URL('../home.js', import.meta.url), 'utf8');
const source = home.slice(home.indexOf('  function createScrollFilm('), home.indexOf('  function createReviewCarousel('));

function film({ reduced = false, saveData = false } = {}) {
  let progress = 0, width = 250, clock = 0, nextId = 0;
  const requests = [], pending = [], callbacks = new Map(), classes = new Set();
  const paint = { fillRect() {}, drawImage() {}, save() {}, restore() {}, translate() {}, scale() {}, createRadialGradient: () => ({ addColorStop() {} }) };
  const canvas = { width: 1080, height: 1440, dataset: {}, getContext: () => paint, getAttribute: key => key === 'width' ? 1080 : 1440, getBoundingClientRect: () => ({ width, height: 400 }) };
  const stage = { offsetHeight: 700 };
  const root = {
    id: 'cookie-dough-story', offsetHeight: 1800,
    dataset: { frameCount: '110', frameStart: '24', framePath: 'frames/frame-' },
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    style: { setProperty() {} }, getBoundingClientRect: () => ({ top: -progress * 1100 }),
    querySelector: selector => selector === 'canvas' ? canvas : selector === '.scroll-film-stage' ? stage : { setAttribute() {} },
  };
  class Image {
    set src(value) { this.index = Number(value.match(/frame-(\d+)/)[1]); requests.push(this.index); pending.push(this); }
    decode() { return Promise.resolve(); }
  }
  const sandbox = {
    root, Image, navigator: { connection: { saveData } },
    window: { devicePixelRatio: 2, getComputedStyle: () => ({ top: '0' }) },
    document: { hidden: false, addEventListener() {}, createElement: () => ({ getContext: () => paint }) },
    requestAnimationFrame: callback => { callbacks.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: id => callbacks.delete(id),
  };
  vm.createContext(sandbox);
  const controller = vm.runInContext(`${source}\ncreateScrollFilm(root, ${reduced})`, sandbox);
  function tick(ms = 1000 / 60) {
    clock += ms;
    const batch = [...callbacks.values()]; callbacks.clear(); batch.forEach(callback => callback(clock));
  }
  async function decode() {
    // Loading completes independently of display refresh.
    for (let i = 0; i < 80 && pending.length; i++) {
      const batch = pending.splice(0);
      await Promise.all(batch.map(image => image.onload()));
    }
  }
  async function settle(hz = 60) {
    for (let i = 0; i < hz * 2; i++) { await decode(); tick(1000 / hz); }
  }
  return { canvas, classes, requests, pending, callbacks, tick, decode, settle,
    scroll: value => { progress = value; controller.update(); },
    resize: value => { width = value; controller.resize(); },
  };
}

test('reduced motion and data saving load only the completed dessert', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = film(options); await f.settle();
    assert.deepEqual(f.requests, [109]);
    assert.equal(f.canvas.dataset.renderedFrame, '109.000');
    assert.ok(f.classes.has('is-ready'));
    assert.equal(f.callbacks.size, 0);
  }
});

test('forward and reverse scrubbing reach the requested frame and stop rendering', async () => {
  const f = film(); await f.settle();
  assert.equal(f.canvas.dataset.renderedFrame, '24.000');
  f.scroll(1); await f.settle();
  assert.equal(f.canvas.dataset.renderedFrame, '109.000');
  f.scroll(0); await f.settle();
  assert.equal(f.canvas.dataset.renderedFrame, '24.000');
  assert.equal(f.callbacks.size, 0);
});

test('missing frames hold the last picture, then recover when decoding completes', async () => {
  const f = film(); await f.settle();
  f.scroll(0.8);
  for (let i = 0; i < 120; i++) f.tick();
  const held = f.canvas.dataset.renderedFrame;
  assert.ok(Number(held) < 50, 'must not invent a distant substitute frame');
  assert.equal(f.callbacks.size, 0, 'no busy loop waiting on the network');
  await f.settle();
  assert.ok(Number(f.canvas.dataset.renderedFrame) > 98);
});

test('resize while the only requested still is in flight recovers', async () => {
  const f = film({ reduced: true });
  f.resize(310); await f.settle();
  assert.ok(f.classes.has('is-ready'));
  assert.equal(f.canvas.dataset.renderedFrame, '109.000');
  assert.equal(f.canvas.width, 620);
});

test('failed still keeps the poster visible without a retry loop', async () => {
  const f = film({ reduced: true });
  f.pending.shift().onerror();
  for (let i = 0; i < 20; i++) f.tick();
  assert.equal(f.classes.has('is-ready'), false);
  assert.deepEqual(f.requests, [109]);
  assert.equal(f.callbacks.size, 0);
});

test('60 Hz and 120 Hz both settle at the same scroll position', async () => {
  const a = film(), b = film();
  await a.settle(60); await b.settle(120);
  a.scroll(0.65); b.scroll(0.65);
  await a.settle(60); await b.settle(120);
  assert.equal(a.canvas.dataset.renderedFrame, b.canvas.dataset.renderedFrame);
});
