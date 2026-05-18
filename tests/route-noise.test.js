const assert = require('node:assert/strict');

const NOISE_SIZE = 256;
const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, i) => i / (NOISE_SIZE - 1));

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function noiseAt(xi, yi) {
  return noiseGrid[((xi & 255) + (((yi & 255) * 37) % NOISE_SIZE)) % NOISE_SIZE];
}

function noise2D(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = smoothstep(xf), v = smoothstep(yf);
  const a = noiseAt(xi, yi);
  const b = noiseAt(xi + 1, yi);
  const c = noiseAt(xi, yi + 1);
  const d = noiseAt(xi + 1, yi + 1);
  return (a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v);
}

assert.equal(noiseAt(255, 1), noiseGrid[36], 'combined x/y hash should wrap into the grid');

for (let xi = 0; xi < 512; xi++) {
  for (let yi = 0; yi < 512; yi++) {
    const value = noise2D(xi + 0.375, yi + 0.625);
    assert.equal(Number.isFinite(value), true, `noise2D returned ${value} at ${xi},${yi}`);
  }
}

