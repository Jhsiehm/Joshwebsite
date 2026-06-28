const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const noiseStart = html.indexOf('function smoothstep');
const noiseEnd = html.indexOf('  // ---- Canvas sizing', noiseStart);

assert.notStrictEqual(noiseStart, -1, 'Could not find route noise functions');
assert.notStrictEqual(noiseEnd, -1, 'Could not find end of route noise block');

const noiseSource = html.slice(noiseStart, noiseEnd);
const buildNoise = new Function(
  'noiseGrid',
  'NOISE_SIZE',
  `${noiseSource}; return { noiseAt, noise2D };`
);

const backingGrid = Array.from({ length: 256 }, (_, i) => (i + 1) / 257);
const noiseGrid = new Proxy(backingGrid, {
  get(target, prop, receiver) {
    if (/^(?:0|[1-9]\d*)$/.test(String(prop))) {
      const index = Number(prop);
      assert(
        index >= 0 && index < target.length,
        `noiseGrid read escaped 0..255 bounds at index ${index}`
      );
    }
    return Reflect.get(target, prop, receiver);
  }
});

const { noise2D } = buildNoise(noiseGrid, backingGrid.length);

const SCALE_MACRO = 0.003;
const SCALE_MICRO = 0.012;
const TIME_STEP = 0.00015;

function flowAngle(x, y, t) {
  const n1 = noise2D(x * SCALE_MACRO * 8, y * SCALE_MACRO * 8 + t * TIME_STEP * 1000);
  const n2 = noise2D(x * SCALE_MICRO * 8 + 50, y * SCALE_MICRO * 8 + 50);
  return (n1 * 0.75 + n2 * 0.35) * Math.PI * 2.2;
}

for (const [x, y] of [
  [50, 54.8],
  [255, 255],
  [306, 54.8],
  [-1, -1],
]) {
  assert(Number.isFinite(noise2D(x, y)), `noise2D(${x}, ${y}) should be finite`);
}

// A real route particle at x=0,y=50 reaches noise2D(50,54.8) in the
// micro octave; the old hash read indexes 256+ and turned the particle NaN.
const angle = flowAngle(0, 50, 0);
assert(Number.isFinite(angle), 'flowAngle should stay finite for route particles');
