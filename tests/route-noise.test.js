const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const noiseAtSource = html.match(/  function noiseAt\(xi, yi\) \{[\s\S]*?\n  \}/);
const noise2DSource = html.match(/  function noise2D\(x, y\) \{[\s\S]*?\n  \}/);

assert.ok(noiseAtSource, 'route composition should define noiseAt helper');
assert.ok(noise2DSource, 'route composition should define noise2D');

function oldIndexesForMicroOctave(px, py) {
  const NOISE_SIZE = 256;
  const x = px * 0.012 * 8 + 50;
  const y = py * 0.012 * 8 + 50;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  return [
    (xi & 255) + ((yi & 255) * 37) % NOISE_SIZE,
    ((xi + 1) & 255) + ((yi & 255) * 37) % NOISE_SIZE,
    (xi & 255) + (((yi + 1) & 255) * 37) % NOISE_SIZE,
    ((xi + 1) & 255) + (((yi + 1) & 255) * 37) % NOISE_SIZE,
  ];
}

const routePoints = [
  { x: 0, y: 50 },
  { x: 700, y: 250 },
  { x: 1200, y: 400 },
];

assert.ok(
  routePoints.some(point => oldIndexesForMicroOctave(point.x, point.y).some(index => index >= 256)),
  'test points must cover coordinates that previously read beyond noiseGrid'
);

const context = {
  routePoints,
  results: null,
};

vm.runInNewContext(`
const NOISE_SIZE = 256;
const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, i) => (i + 1) / NOISE_SIZE);
function smoothstep(t) { return t * t * (3 - 2 * t); }
${noiseAtSource[0]}
${noise2DSource[0]}

const SCALE_MACRO = 0.003;
const SCALE_MICRO = 0.012;
const TIME_STEP = 0.00015;

function flowAngle(x, y, t) {
  const n1 = noise2D(x * SCALE_MACRO * 8, y * SCALE_MACRO * 8 + t * TIME_STEP * 1000);
  const n2 = noise2D(x * SCALE_MICRO * 8 + 50, y * SCALE_MICRO * 8 + 50);
  return (n1 * 0.75 + n2 * 0.35) * Math.PI * 2.2;
}

globalThis.results = routePoints.map(point => flowAngle(point.x, point.y, 0));
`, context);

assert.deepEqual(
  context.results.map(Number.isFinite),
  routePoints.map(() => true),
  'route flow angles should stay finite for ordinary particle coordinates'
);
