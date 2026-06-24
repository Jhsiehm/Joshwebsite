const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('  function smoothstep(t)');
const end = html.indexOf('  // ---- Canvas sizing with devicePixelRatio', start);

assert.notEqual(start, -1, 'noise helpers should exist in the route canvas script');
assert.notEqual(end, -1, 'noise helper block should end before canvas sizing');

const noiseHelpers = html.slice(start, end);
const context = { results: null };
vm.createContext(context);

vm.runInContext(`
  const NOISE_SIZE = 256;
  const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, i) => i + 0.25);

${noiseHelpers}

  function expectedNoise2D(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = smoothstep(xf), v = smoothstep(yf);
    const sample = (sx, sy) => noiseGrid[((sx & 255) + ((sy & 255) * 37)) % NOISE_SIZE];
    const a = sample(xi, yi);
    const b = sample(xi + 1, yi);
    const c = sample(xi, yi + 1);
    const d = sample(xi + 1, yi + 1);
    return (a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v);
  }

  results = [
    [50, 54.8],
    [51.2, 54.8],
    [50, 61.25],
    [305.5, 54.8]
  ].map(([x, y]) => ({
    x,
    y,
    actual: noise2D(x, y),
    expected: expectedNoise2D(x, y)
  }));
`, context);

for (const { x, y, actual, expected } of context.results) {
  assert.ok(Number.isFinite(actual), `noise2D(${x}, ${y}) should remain finite`);
  assert.equal(actual, expected, `noise2D(${x}, ${y}) should use bounded grid indexes`);
}
