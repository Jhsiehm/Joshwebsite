const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');
const routeMatch = html.match(/\(function setupRouteComposition\(\) \{[\s\S]*?\n\}\)\(\);/);

assert(routeMatch, 'route composition script should be present');

let strokeCount = 0;
const drawingContext = {
  setTransform() {},
  fillRect(x, y, w, h) {
    assertFiniteArgs('fillRect', x, y, w, h);
  },
  beginPath() {},
  moveTo(x, y) {
    assertFiniteArgs('moveTo', x, y);
  },
  lineTo(x, y) {
    assertFiniteArgs('lineTo', x, y);
  },
  stroke() {
    strokeCount++;
  },
  set fillStyle(_value) {},
  set lineCap(_value) {},
  set globalCompositeOperation(_value) {},
  set strokeStyle(_value) {},
  set globalAlpha(_value) {},
  set lineWidth(_value) {}
};

function assertFiniteArgs(method, ...values) {
  for (const value of values) {
    assert(Number.isFinite(value), `${method} received a non-finite coordinate: ${value}`);
  }
}

const canvas = {
  width: 0,
  height: 0,
  style: {},
  getContext() {
    return drawingContext;
  }
};

const frame = {
  getBoundingClientRect() {
    return { width: 1920, height: 1080, top: 0, bottom: 1080 };
  }
};

const body = {
  getAttribute(name) {
    return name === 'data-hour' ? 'dawn' : null;
  }
};

class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    // Keep the regression focused on the synchronous warm-up frames in init().
  }
}

class MutationObserver {
  observe() {}
}

const context = {
  qs(selector) {
    if (selector === '#routeCanvas') return canvas;
    if (selector === '.route-frame') return frame;
    return null;
  },
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    location: { search: '?seed=1' },
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
  performance: {
    now() {
      return 0;
    }
  },
  URLSearchParams,
  Math,
  parseInt,
  getComputedStyle() {
    return {
      getPropertyValue(name) {
        return name === '--silk' ? '#f1e9d8' : '';
      }
    };
  },
  requestAnimationFrame() {
    return 1;
  },
  cancelAnimationFrame() {},
  IntersectionObserver,
  MutationObserver
};

vm.runInNewContext(routeMatch[0], context, { filename: 'route-composition.js' });

assert(strokeCount > 0, 'route composition should draw warm-up strokes');
