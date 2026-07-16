const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'docs', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const startMarker = '(function setupRouteComposition() {';
const endMarker = '// ═══════════════════════════════════════════════════════════════\n// FEATURE 3: CITY DETAIL CARDS';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notStrictEqual(start, -1, 'route composition script was not found');
assert.notStrictEqual(end, -1, 'route composition end marker was not found');

let routeScript = html.slice(start, end);
routeScript = routeScript.replace(
  '  function flowAngle(x, y, t) {',
  '  globalThis.__routeNoise2D = noise2D;\n  function flowAngle(x, y, t) {'
);

const nonFiniteDraws = [];
const recordDraw = (name, args) => {
  if (args.some((value) => !Number.isFinite(value))) nonFiniteDraws.push([name, args]);
};
const ctx = {
  setTransform() {},
  fillRect(...args) { recordDraw('fillRect', args); },
  beginPath() {},
  moveTo(...args) { recordDraw('moveTo', args); },
  lineTo(...args) { recordDraw('lineTo', args); },
  stroke() {},
  set fillStyle(value) {},
  set strokeStyle(value) {},
  set lineCap(value) {},
  set globalCompositeOperation(value) {},
  set globalAlpha(value) {},
  set lineWidth(value) {}
};
const frame = {
  getBoundingClientRect() {
    return { width: 640, height: 360, top: 0, bottom: 360 };
  }
};
const canvas = {
  style: {},
  getContext() {
    return ctx;
  }
};
const bodyAttributes = new Map([['data-hour', 'dawn']]);
const body = {
  getAttribute(name) {
    return bodyAttributes.get(name) || null;
  }
};
const context = {
  console,
  URLSearchParams,
  Math,
  Number,
  Date: class FixedDate extends Date {
    static now() {
      return 12345;
    }
  },
  performance: {
    now() {
      return 1000;
    }
  },
  requestAnimationFrame() {
    return 1;
  },
  cancelAnimationFrame() {},
  getComputedStyle() {
    return {
      getPropertyValue(name) {
        return name === '--silk' ? '#f1e9d8' : '';
      }
    };
  },
  window: {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    location: { search: '?seed=12345' },
    matchMedia() {
      return { matches: false };
    },
    addEventListener() {}
  },
  document: {
    body,
    hidden: false,
    addEventListener() {}
  },
  qs(selector) {
    if (selector === '#routeCanvas') return canvas;
    if (selector === '.route-frame') return frame;
    return null;
  },
  IntersectionObserver: class IntersectionObserver {
    observe() {}
  },
  MutationObserver: class MutationObserver {
    observe() {}
  }
};
context.globalThis = context;

vm.runInNewContext(routeScript, context, { filename: 'route-composition.js' });

assert.strictEqual(typeof context.__routeNoise2D, 'function', 'noise2D was not exposed');
const regressionValue = context.__routeNoise2D(50, 54.8);
assert.ok(
  Number.isFinite(regressionValue),
  'noise2D(50, 54.8) must remain finite; the old hash read beyond the 256-cell grid'
);

for (let x = -80; x <= 640; x += 13.25) {
  for (let y = -80; y <= 360; y += 17.5) {
    const value = context.__routeNoise2D(x, y);
    assert.ok(Number.isFinite(value), `noise2D(${x}, ${y}) returned ${value}`);
    assert.ok(value >= 0 && value <= 1, `noise2D(${x}, ${y}) returned ${value}`);
  }
}

assert.deepStrictEqual(nonFiniteDraws, [], 'route initialization made non-finite canvas calls');
console.log('route noise lookup stays bounded and finite');
