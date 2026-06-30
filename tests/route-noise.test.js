const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '  function mulberry32(a) {';
const endMarker = '  // ---- Canvas sizing with devicePixelRatio';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notEqual(start, -1, 'route noise source block start should exist');
assert.notEqual(end, -1, 'route noise source block end should exist');

const source = `
let seedVal = 123456789;
${html.slice(start, end)}
globalThis.__routeNoise = { noise2D, noiseAt, NOISE_SIZE, noiseGrid };
`;

const context = {};
vm.runInNewContext(source, context, { filename: 'route-noise-source.js' });

const { noise2D, noiseAt, NOISE_SIZE, noiseGrid } = context.__routeNoise;

assert.equal(NOISE_SIZE, 256, 'test assumes the route noise grid size');
assert.equal(noiseGrid.length, NOISE_SIZE, 'noise grid should contain exactly NOISE_SIZE entries');

for (let yi = 0; yi < NOISE_SIZE; yi++) {
  for (let xi = 0; xi < NOISE_SIZE; xi++) {
    assert.notEqual(noiseAt(xi, yi), undefined, `noiseAt(${xi}, ${yi}) should stay in bounds`);
  }
}

const routeMicroOctaveSample = noise2D(50, 54.8);
assert.equal(Number.isFinite(routeMicroOctaveSample), true, 'route micro-octave sample should be finite');
assert.ok(routeMicroOctaveSample >= 0 && routeMicroOctaveSample <= 1, 'route noise should interpolate grid values');
