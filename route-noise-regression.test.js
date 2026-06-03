const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');
const start = html.indexOf('(function setupRouteComposition() {');
const end = html.indexOf('\n})();', start) + '\n})();'.length;

assert.notEqual(start, -1, 'route composition IIFE not found');
assert.ok(end > start, 'route composition IIFE end not found');

const source = html.slice(start, end);
let lineSegments = 0;

function assertFinitePoint(method, x, y) {
  if (method === 'lineTo') lineSegments++;
  assert.ok(
    Number.isFinite(x) && Number.isFinite(y),
    `${method} received non-finite point (${x}, ${y}) after ${lineSegments} line segments`,
  );
}

const ctx = {
  setTransform() {},
  fillRect(x, y, w, h) {
    [x, y, w, h].forEach((value, index) => {
      assert.ok(Number.isFinite(value), `fillRect arg ${index} was ${value}`);
    });
  },
  beginPath() {},
  moveTo(x, y) { assertFinitePoint('moveTo', x, y); },
  lineTo(x, y) { assertFinitePoint('lineTo', x, y); },
  stroke() {},
  lineCap: 'butt',
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  lineWidth: 1,
};

const frame = {
  getBoundingClientRect: () => ({ width: 1024, height: 520, top: 0, bottom: 520 }),
};
const canvas = { width: 0, height: 0, style: {}, getContext: () => ctx };

const context = {
  URLSearchParams,
  console,
  setTimeout,
  clearTimeout,
  performance: { now: () => 0 },
  window: {
    location: { search: '?seed=1234' },
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
  },
  document: {
    body: { getAttribute: () => 'dawn' },
    hidden: false,
    addEventListener() {},
  },
  getComputedStyle: () => ({
    getPropertyValue: (name) => (name === '--silk' ? '#f1e9d8' : ''),
  }),
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  IntersectionObserver: class { observe() {} },
  MutationObserver: class { observe() {} },
  qs: (selector) => {
    if (selector === '#routeCanvas') return canvas;
    if (selector === '.route-frame') return frame;
    return null;
  },
};

vm.runInNewContext(source, context, { filename: 'route-composition.js' });

assert.ok(lineSegments > 0, 'route composition did not render any warmup line segments');
console.log(`Route composition rendered ${lineSegments} finite warmup line segments.`);
