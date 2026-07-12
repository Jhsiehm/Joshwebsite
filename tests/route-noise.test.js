const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('  function smoothstep(t)');
const end = html.indexOf('  // ---- Canvas sizing', start);

assert.notStrictEqual(start, -1, 'Could not find smoothstep/noise2D source');
assert.notStrictEqual(end, -1, 'Could not find end of noise2D source');

const source = html.slice(start, end);
const context = {
  result: null,
  nonFiniteInputs: [],
};

vm.createContext(context);
vm.runInContext(`
  const NOISE_SIZE = 256;
  const noiseGrid = Array.from({ length: NOISE_SIZE }, (_, i) => i / NOISE_SIZE);
${source}

  const SCALE_MICRO = 0.012;
  const particle = { x: 0, y: 50 };
  const x = particle.x * SCALE_MICRO * 8 + 50;
  const y = particle.y * SCALE_MICRO * 8 + 50;

  result = noise2D(x, y);
`, context);

assert.strictEqual(Number.isFinite(context.result), true, 'route noise returned a non-finite value');
