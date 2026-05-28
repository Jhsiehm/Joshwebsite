const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const source = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Expected ${name} to exist in page source`);

  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `Expected ${name} to have a function body`);

  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const char = source[i];
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth === 0) return source.slice(start, i + 1);
  }

  throw new Error(`Could not find end of ${name}`);
}

const context = {
  module: { exports: {} },
};

vm.runInNewContext(`
const NOISE_SIZE = 256;
const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, i) => (i + 1) / NOISE_SIZE);
${extractFunction('smoothstep')}
${extractFunction('noiseAt')}
${extractFunction('noise2D')}
module.exports = { noiseAt, noise2D };
`, context);

const { noiseAt, noise2D } = context.module.exports;

for (let xi = 0; xi < 256; xi++) {
  for (let yi = 0; yi < 256; yi++) {
    assert.notEqual(noiseAt(xi, yi), undefined, `noiseAt(${xi}, ${yi}) returned undefined`);
  }
}

const realisticRouteCoordinates = [
  // Micro-noise input for a large desktop route canvas.
  [1000 * 0.012 * 8 + 50, 400 * 0.012 * 8 + 50],
  // Micro-noise input that previously read index 372 from a 256-cell grid.
  [700 * 0.012 * 8 + 50, 350 * 0.012 * 8 + 50],
  // Macro-noise input used by the same flow-field composition.
  [700 * 0.003 * 8, 350 * 0.003 * 8],
];

for (const [x, y] of realisticRouteCoordinates) {
  const value = noise2D(x, y);
  assert.equal(Number.isFinite(value), true, `noise2D(${x}, ${y}) returned ${value}`);
}

console.log('route noise indexes stay bounded');
