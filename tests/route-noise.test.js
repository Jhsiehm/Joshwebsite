const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('function smoothstep(t)');
const end = html.indexOf('  // ---- Canvas sizing with devicePixelRatio', start);
assert.notEqual(start, -1, 'could not find route noise helpers');
assert.notEqual(end, -1, 'could not find end of route noise helpers');

const noiseSource = html.slice(start, end);
const context = {};

vm.runInNewContext(
  `
  const NOISE_SIZE = 256;
  const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, index) => index / NOISE_SIZE);
  ${noiseSource}
  globalThis.noise2D = noise2D;
  `,
  context
);

const samples = [
  [50, 54.8],
  [51, 54.8],
  [50, 55.8],
  [51, 55.8],
  [-10, 0],
  [255.9, 255.9]
];

for (const [x, y] of samples) {
  const value = context.noise2D(x, y);
  assert.ok(Number.isFinite(value), `noise2D(${x}, ${y}) returned ${value}`);
  assert.ok(value >= 0 && value < 1, `noise2D(${x}, ${y}) returned out-of-range value ${value}`);
}

console.log('route noise regression passed');
