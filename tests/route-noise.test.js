const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '(function setupRouteComposition() {';
const endMarker = '// ═══════════════════════════════════════════════════════════════\n// FEATURE 3: CITY DETAIL CARDS';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notStrictEqual(start, -1, 'route composition script was not found');
assert.notStrictEqual(end, -1, 'city card marker after route composition was not found');

let routeScript = html.slice(start, end);
routeScript = routeScript.replace(
  '  function flowAngle(x, y, t) {',
  '  globalThis.__routeNoise2D = noise2D;\n  function flowAngle(x, y, t) {'
);

const nonFiniteDraws = [];
const ctx = {
  setTransform() {},
  fillRect(...args) {
    if (args.some((value) => !Number.isFinite(value))) nonFiniteDraws.push(['fillRect', args]);
  },
  beginPath() {},
  moveTo(...args) {
    if (args.some((value) => !Number.isFinite(value))) nonFiniteDraws.push(['moveTo', args]);
  },
  lineTo(...args) {
    if (args.some((value) => !Number.isFinite(value))) nonFiniteDraws.push(['lineTo', args]);
  },
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
  },
  setAttribute(name, value) {
    bodyAttributes.set(name, value);
  }
};

const context = {
  assert,
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
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
  },
  MutationObserver: class MutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
  }
};
context.globalThis = context;

vm.runInNewContext(routeScript, context, { filename: 'route-composition.js' });

assert.strictEqual(typeof context.__routeNoise2D, 'function', 'noise2D was not exposed by the route script');

const regressionValue = context.__routeNoise2D(50, 54.8);
assert.ok(
  Number.isFinite(regressionValue),
  'noise2D(50, 54.8) must stay finite; the old hash read indexes 256, 257, 293, and 294 from a 256-cell grid'
);

for (let x = -80; x <= 640; x += 13.25) {
  for (let y = -80; y <= 360; y += 17.5) {
    const value = context.__routeNoise2D(x, y);
    assert.ok(Number.isFinite(value), `noise2D(${x}, ${y}) returned ${value}`);
    assert.ok(value >= 0 && value <= 1, `noise2D(${x}, ${y}) returned out-of-range value ${value}`);
  }
}

assert.deepStrictEqual(nonFiniteDraws, [], 'route initialization made non-finite canvas draw calls');
console.log('route noise lookup stays bounded and finite');
