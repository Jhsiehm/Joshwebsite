const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pagePath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(pagePath, 'utf8');

const startMarker = '  // ---- Lightweight 2D value-noise (plenty for a flow field) ------';
const endMarker = '  // ---- Canvas sizing with devicePixelRatio -----------------------';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notEqual(start, -1, 'route noise block should be present');
assert.notEqual(end, -1, 'route noise block should end before canvas sizing');

const noiseSource = html.slice(start, end);
let seed = 0x12345678;
const sandbox = {
  srand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  }
};

vm.runInNewContext(`${noiseSource}\nglobalThis.__noise2D = noise2D;`, sandbox);

assert.equal(typeof sandbox.__noise2D, 'function', 'noise2D should be extracted from page source');

for (let xi = 0; xi < 256; xi++) {
  for (let yi = 0; yi < 256; yi++) {
    const value = sandbox.__noise2D(xi + 0.25, yi + 0.75);
    assert.ok(Number.isFinite(value), `noise2D should be finite at ${xi}, ${yi}`);
    assert.ok(value >= 0 && value <= 1, `noise2D should stay normalized at ${xi}, ${yi}`);
  }
}

// Representative route-frame coordinates on a common desktop viewport.
const SCALE_MACRO = 0.003;
const SCALE_MICRO = 0.012;
const samples = [
  [0, 0],
  [644, 315],
  [1288, 630]
];

for (const [x, y] of samples) {
  const macro = sandbox.__noise2D(x * SCALE_MACRO * 8, y * SCALE_MACRO * 8);
  const micro = sandbox.__noise2D(x * SCALE_MICRO * 8 + 50, y * SCALE_MICRO * 8 + 50);
  assert.ok(Number.isFinite(macro), `macro route noise should be finite at ${x}, ${y}`);
  assert.ok(Number.isFinite(micro), `micro route noise should be finite at ${x}, ${y}`);
}
