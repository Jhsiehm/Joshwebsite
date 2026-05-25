const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('  function smoothstep(t)');
const end = html.indexOf('  // ---- Canvas sizing', start);

assert.notEqual(start, -1, 'route noise smoothstep function should exist');
assert.notEqual(end, -1, 'route noise block should end before canvas sizing');

const context = {
  NOISE_SIZE: 256,
  noiseGrid: Array.from({ length: 256 }, (_, i) => i / 255)
};

vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

assert.equal(typeof context.noise2D, 'function', 'noise2D should be defined');

for (let xi = 0; xi < 512; xi++) {
  for (let yi = 0; yi < 512; yi++) {
    const value = context.noise2D(xi + 0.37, yi + 0.61);
    assert.equal(Number.isFinite(value), true, `noise2D returned ${value} at ${xi},${yi}`);
    assert.ok(value >= 0 && value <= 1, `noise2D returned out-of-range value ${value} at ${xi},${yi}`);
  }
}

console.log('route noise lookup stays finite across wrapped grid coordinates');
