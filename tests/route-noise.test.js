const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const routeNoiseMatch = html.match(
  /const noiseGrid = \[\];[\s\S]*?function noise2D\(x, y\) \{[\s\S]*?\n  \}/
);

assert(routeNoiseMatch, 'route noise source should be present in the HTML');

const lookupIndexes = [];
const context = {
  srand: () => 0.5,
  lookupIndexes
};

vm.createContext(context);
vm.runInContext(`
  ${routeNoiseMatch[0]}
  function flowAngle(x, y, t) {
    const SCALE_MACRO = 0.003;
    const SCALE_MICRO = 0.012;
    const TIME_STEP = 0.00015;
    const n1 = noise2D(x * SCALE_MACRO * 8, y * SCALE_MACRO * 8 + t * TIME_STEP * 1000);
    const n2 = noise2D(x * SCALE_MICRO * 8 + 50, y * SCALE_MICRO * 8 + 50);
    return (n1 * 0.75 + n2 * 0.35) * Math.PI * 2.2;
  }
  const originalNoiseAt = noiseAt;
  noiseAt = function(x, y) {
    const index = ((x & 255) + ((y & 255) * 37)) % NOISE_SIZE;
    lookupIndexes.push(index);
    return originalNoiseAt(x, y);
  };
`, context);

const angle = vm.runInContext('flowAngle(0, 50, 0)', context);

assert(Number.isFinite(angle), 'route flow angle should stay finite for y=50 particles');
assert(
  lookupIndexes.every(index => Number.isInteger(index) && index >= 0 && index < 256),
  `noise lookups must stay within the 256-entry grid, got ${lookupIndexes.join(', ')}`
);

console.log('route noise lookup remains bounded for y=50 particles');
