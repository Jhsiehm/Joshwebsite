const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('  function smoothstep');
const end = html.indexOf('\n\n  // ---- Canvas sizing', start);

assert.notStrictEqual(start, -1, 'noise function block start not found');
assert.notStrictEqual(end, -1, 'noise function block end not found');

const noiseFunctions = html.slice(start, end);
const context = {
  NOISE_SIZE: 256,
  noiseGrid: Array.from({ length: 256 }, (_, i) => (i + 1) / 257),
};

vm.createContext(context);
vm.runInContext(`${noiseFunctions}\nthis.noise2D = noise2D;`, context);

for (let xi = 0; xi < 256; xi++) {
  for (let yi = 0; yi < 256; yi++) {
    const sample = context.noise2D(xi + 0.5, yi + 0.5);
    assert(
      Number.isFinite(sample),
      `noise2D returned ${sample} at wrapped grid coordinate (${xi}, ${yi})`,
    );
    assert(sample > 0 && sample < 1, `noise2D returned out-of-grid value ${sample}`);
  }
}

assert(Number.isFinite(context.noise2D(234.5, 136.5)), 'route-scale viewport coordinate must be finite');

console.log('route noise wrapping regression passed');
