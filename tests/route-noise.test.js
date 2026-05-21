const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const noiseBlockMatch = html.match(/  function smoothstep\(t\) \{[\s\S]*?\n  \}\n\n  \/\/ ---- Canvas sizing/);
assert.ok(noiseBlockMatch, 'route noise helpers should be present in the HTML source');

const noiseSource = noiseBlockMatch[0].replace(/\n\n  \/\/ ---- Canvas sizing$/, '');
const context = { sampleNoise: null };
vm.createContext(context);
vm.runInContext(`
const noiseGrid = Array.from({ length: 256 }, (_, i) => i / 255);
const NOISE_SIZE = 256;
${noiseSource}
sampleNoise = (x, y) => noise2D(x, y);
`, context);

// Regression for the old indexing expression: xi=1, yi=83 addressed
// noiseGrid[256], which returned undefined and propagated NaN into particles.
assert.equal(Number.isFinite(context.sampleNoise(1.25, 83.25)), true);

for (let xi = 0; xi < 256; xi++) {
  for (let yi = 0; yi < 256; yi++) {
    const value = context.sampleNoise(xi + 0.25, yi + 0.75);
    assert.equal(Number.isFinite(value), true, `noise2D(${xi}, ${yi}) should stay finite`);
    assert.ok(value >= 0 && value <= 1, `noise2D(${xi}, ${yi}) should interpolate grid values`);
  }
}
