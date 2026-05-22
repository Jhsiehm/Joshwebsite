const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '(function setupRouteComposition() {';
const endMarker = '// ═══════════════════════════════════════════════════════════════\n// FEATURE 3: CITY DETAIL CARDS';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notEqual(start, -1, 'route composition script should be present');
assert.notEqual(end, -1, 'city-card feature marker should follow route composition');

const routeScript = html.slice(start, end);
const drawCalls = [];

const ctx = {
  setTransform() {},
  fillRect() {},
  beginPath() {},
  stroke() {},
  moveTo(x, y) {
    assert(Number.isFinite(x), `moveTo x must stay finite, got ${x}`);
    assert(Number.isFinite(y), `moveTo y must stay finite, got ${y}`);
  },
  lineTo(x, y) {
    assert(Number.isFinite(x), `lineTo x must stay finite, got ${x}`);
    assert(Number.isFinite(y), `lineTo y must stay finite, got ${y}`);
    drawCalls.push([x, y]);
  },
  set fillStyle(value) {},
  set lineCap(value) {},
  set globalCompositeOperation(value) {},
  set strokeStyle(value) {},
  set globalAlpha(value) {},
  set lineWidth(value) {}
};

const canvas = {
  style: {},
  width: 0,
  height: 0,
  getContext() {
    return ctx;
  }
};

const frame = {
  getBoundingClientRect() {
    return { width: 1200, height: 640, top: 0, bottom: 640 };
  }
};

const body = {
  getAttribute(name) {
    return name === 'data-hour' ? 'dawn' : null;
  }
};

class IntersectionObserver {
  observe() {}
}

class MutationObserver {
  observe() {}
}

const sandbox = {
  qs(selector) {
    if (selector === '#routeCanvas') return canvas;
    if (selector === '.route-frame') return frame;
    return null;
  },
  window: {
    location: { search: '?seed=1' },
    innerWidth: 1200,
    devicePixelRatio: 1,
    matchMedia(query) {
      return { matches: query === '(prefers-reduced-motion: reduce)' };
    },
    addEventListener() {}
  },
  document: {
    body,
    hidden: false,
    addEventListener() {}
  },
  getComputedStyle() {
    return {
      getPropertyValue(name) {
        return name === '--silk' ? '#f1e9d8' : '';
      }
    };
  },
  URLSearchParams,
  Date,
  Math,
  Number,
  parseInt,
  performance: { now: () => 0 },
  requestAnimationFrame() {
    throw new Error('reduced-motion route init should not start an animation loop');
  },
  cancelAnimationFrame() {},
  IntersectionObserver,
  MutationObserver
};

vm.runInNewContext(routeScript, sandbox, { filename: htmlPath });

assert(drawCalls.length > 0, 'route composition should draw regression-covered particle segments');
