const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const source = fs.readFileSync(htmlPath, 'utf8');
const match = source.match(/const noiseAt = ([^\n]+);/);

assert.ok(match, 'route composition should define a bounded noiseAt helper');

const NOISE_SIZE = 256;
const rawGrid = Array.from({ length: NOISE_SIZE }, (_, index) => index / NOISE_SIZE);
const noiseGrid = new Proxy(rawGrid, {
  get(target, prop, receiver) {
    if (typeof prop === 'string' && /^\d+$/.test(prop)) {
      const index = Number(prop);
      assert.ok(index >= 0 && index < NOISE_SIZE, `noiseGrid index ${index} is out of bounds`);
    }
    return Reflect.get(target, prop, receiver);
  },
});

const makeNoiseAt = new Function('noiseGrid', 'NOISE_SIZE', `return ${match[1]};`);
const noiseAt = makeNoiseAt(noiseGrid, NOISE_SIZE);

function assertRouteCoordinatesStayBounded(width, height) {
  const samples = 64;
  for (let yi = 0; yi <= samples; yi++) {
    for (let xi = 0; xi <= samples; xi++) {
      const x = (width * xi) / samples;
      const y = (height * yi) / samples;

      for (const [sx, sy] of [
        [x * 0.003 * 8, y * 0.003 * 8],
        [x * 0.012 * 8 + 50, y * 0.012 * 8 + 50],
      ]) {
        const gx = Math.floor(sx);
        const gy = Math.floor(sy);
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const value = noiseAt(gx + dx, gy + dy);
          assert.equal(typeof value, 'number');
          assert.ok(Number.isFinite(value), 'noiseAt should never return undefined or NaN');
        }
      }
    }
  }
}

assertRouteCoordinatesStayBounded(390, 420);
assertRouteCoordinatesStayBounded(1200, 600);
assertRouteCoordinatesStayBounded(1600, 680);

console.log('route noise grid lookups remain bounded');
