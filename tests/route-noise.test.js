const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunctionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `expected to find ${name} in page source`);

  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const NOISE_SIZE = 256;
const rawGrid = Array.from({ length: NOISE_SIZE }, (_, i) => i / NOISE_SIZE);
const noiseGrid = new Proxy(rawGrid, {
  get(target, prop, receiver) {
    if (/^\d+$/.test(String(prop))) {
      const index = Number(prop);
      assert(
        index >= 0 && index < target.length,
        `noiseGrid index ${index} is outside 0..${target.length - 1}`,
      );
    }
    return Reflect.get(target, prop, receiver);
  },
});

const context = {
  NOISE_SIZE,
  noiseGrid,
  assertFinite(value, label) {
    assert.equal(Number.isFinite(value), true, `${label} should be finite`);
  },
};
vm.createContext(context);
vm.runInContext(
  [
    extractFunctionSource('smoothstep'),
    extractFunctionSource('noiseAt'),
    extractFunctionSource('noise2D'),
    `
      const points = [
        [6.5, 120.25],
        [25.75, 200.5],
        [255.9, 255.9],
        [410.125, 73.875],
        [-2.4, -91.6],
      ];
      for (const [x, y] of points) {
        assertFinite(noise2D(x, y), 'noise2D(' + x + ', ' + y + ')');
      }
    `,
  ].join('\n'),
  context,
);

console.log('route noise lookup stays within bounds');
