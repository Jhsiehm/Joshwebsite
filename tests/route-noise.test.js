const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '(function setupRouteComposition() {';
const start = html.indexOf(startMarker);
assert.notStrictEqual(start, -1, 'route composition script not found');

const end = html.indexOf('\n})();', start);
assert.notStrictEqual(end, -1, 'route composition script end not found');

const routeScript = html.slice(start, end + '\n})();'.length);

const drawOps = [];
const ctx = {
  setTransform() {},
  fillRect(x, y, width, height) {
    assert(Number.isFinite(x), `fillRect x is not finite: ${x}`);
    assert(Number.isFinite(y), `fillRect y is not finite: ${y}`);
    assert(Number.isFinite(width), `fillRect width is not finite: ${width}`);
    assert(Number.isFinite(height), `fillRect height is not finite: ${height}`);
  },
  beginPath() {},
  moveTo(x, y) {
    assert(Number.isFinite(x), `moveTo x is not finite: ${x}`);
    assert(Number.isFinite(y), `moveTo y is not finite: ${y}`);
  },
  lineTo(x, y) {
    assert(Number.isFinite(x), `lineTo x is not finite: ${x}`);
    assert(Number.isFinite(y), `lineTo y is not finite: ${y}`);
    drawOps.push([x, y]);
  },
  stroke() {},
  set fillStyle(value) {},
  set lineCap(value) {},
  set globalCompositeOperation(value) {},
  set strokeStyle(value) {},
  set globalAlpha(value) {},
  set lineWidth(value) {}
};

const canvas = {
  style: {},
  getContext() {
    return ctx;
  }
};

const frame = {
  getBoundingClientRect() {
    return { width: 960, height: 540, top: 0, bottom: 540 };
  }
};

const document = {
  body: {
    getAttribute() {
      return 'dawn';
    }
  },
  addEventListener() {}
};

class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback([{ isIntersecting: false }]);
  }
}

class MutationObserver {
  observe() {}
}

const context = {
  console,
  document,
  window: {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    location: { search: '?seed=12345' },
    matchMedia() {
      return { matches: false };
    },
    addEventListener() {}
  },
  performance: {
    now() {
      return 0;
    }
  },
  URLSearchParams,
  getComputedStyle() {
    return {
      getPropertyValue(name) {
        return name === '--silk' ? '#f1e9d8' : '';
      }
    };
  },
  qs(selector) {
    if (selector === '#routeCanvas') return canvas;
    if (selector === '.route-frame') return frame;
    return null;
  },
  requestAnimationFrame() {
    return 1;
  },
  cancelAnimationFrame() {},
  IntersectionObserver,
  MutationObserver
};

vm.runInNewContext(routeScript, context, { filename: htmlPath });

assert(drawOps.length > 0, 'route composition did not draw any particle segments');
