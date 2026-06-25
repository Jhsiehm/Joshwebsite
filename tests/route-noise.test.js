const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const noiseBlock = html.match(
  /const noiseGrid = \[\];[\s\S]*?function noise2D\(x, y\) \{[\s\S]*?\n  \}/
);
assert(noiseBlock, 'route noise implementation should be present in the HTML');

const flowBlock = html.match(
  /const SCALE_MACRO = 0\.003;[\s\S]*?function flowAngle\(x, y, t\) \{[\s\S]*?\n  \}/
);
assert(flowBlock, 'route flow-angle implementation should be present in the HTML');

const sandbox = {
  srand: (() => {
    let seed = 0x12345678;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  })(),
  Math,
};

vm.runInNewContext(
  `${noiseBlock[0]}
${flowBlock[0]}
globalThis.routeNoise = {
  flowAngle,
  noise2D,
  hasBoundedLookup: typeof noiseAt === 'function',
};`,
  sandbox
);

const { flowAngle, noise2D, hasBoundedLookup } = sandbox.routeNoise;

assert.strictEqual(
  hasBoundedLookup,
  true,
  'noise samples should be read through a shared bounded lookup helper'
);

// A route particle at x=0, y=50 feeds the micro octave as noise2D(50, 54.8).
// The old index expression read noiseGrid[256] / [257] here, producing NaN.
const poisonSample = noise2D(50, 54.8);
assert(Number.isFinite(poisonSample), 'noise2D(50, 54.8) must stay finite');

const angle = flowAngle(0, 50, 0);
assert(Number.isFinite(angle), 'flowAngle for the poisoned particle coordinate must stay finite');

const particle = { x: 0, y: 50, vx: 0, vy: 0, speedCap: 1 };
particle.vx += Math.cos(angle) * 0.08;
particle.vy += Math.sin(angle) * 0.08;
const speed = Math.hypot(particle.vx, particle.vy);
if (speed > particle.speedCap) {
  particle.vx = (particle.vx / speed) * particle.speedCap;
  particle.vy = (particle.vy / speed) * particle.speedCap;
}
particle.x += particle.vx;
particle.y += particle.vy;

assert(Number.isFinite(particle.x), 'particle x must not become NaN');
assert(Number.isFinite(particle.y), 'particle y must not become NaN');

for (let y = 0; y < 128; y += 0.8) {
  for (let x = 0; x < 128; x += 0.8) {
    assert(Number.isFinite(noise2D(x, y)), `noise2D(${x}, ${y}) must stay finite`);
  }
}

console.log('route noise regression passed');
