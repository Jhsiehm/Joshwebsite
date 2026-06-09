const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const source = fs.readFileSync(htmlPath, 'utf8');

const start = source.indexOf('  function smoothstep(t)');
const end = source.indexOf('\n\n  // ---- Canvas sizing', start);
assert.notEqual(start, -1, 'Could not find route noise helpers');
assert.notEqual(end, -1, 'Could not find end of route noise helpers');

const noiseGridBacking = Array.from({ length: 256 }, (_, i) => (i + 1) / 257);
const noiseGrid = new Proxy(noiseGridBacking, {
  get(target, prop) {
    if (typeof prop === 'string' && /^\d+$/.test(prop)) {
      const index = Number(prop);
      assert(
        index >= 0 && index < target.length,
        `noiseGrid lookup escaped 256-entry table: ${index}`
      );
    }
    return target[prop];
  }
});

const context = {
  noiseGrid,
  NOISE_SIZE: noiseGridBacking.length
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context, { filename: path.basename(htmlPath) });

assert.equal(typeof context.noise2D, 'function', 'noise2D helper was not loaded');

const SCALE_MACRO = 0.003;
const SCALE_MICRO = 0.012;
const routeWidth = 1400;
const routeHeight = 680;

for (let px = 0; px <= routeWidth; px += 10) {
  for (let py = 0; py <= routeHeight; py += 10) {
    const macro = context.noise2D(px * SCALE_MACRO * 8, py * SCALE_MACRO * 8);
    const micro = context.noise2D(px * SCALE_MICRO * 8 + 50, py * SCALE_MICRO * 8 + 50);

    assert(Number.isFinite(macro), `macro noise became non-finite at ${px},${py}`);
    assert(Number.isFinite(micro), `micro noise became non-finite at ${px},${py}`);
  }
}

console.log('route noise lookup stays bounded and finite for route-scale coordinates');
