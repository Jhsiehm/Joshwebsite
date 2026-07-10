const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const source = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}`);
  assert.notStrictEqual(start, -1, `Expected to find function ${name}`);

  const bodyStart = source.indexOf('{', start);
  assert.notStrictEqual(bodyStart, -1, `Expected ${name} to have a body`);

  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error(`Could not find end of function ${name}`);
}

const smoothstepSource = extractFunction('smoothstep');
const noiseAtSource = extractFunction('noiseAt');
const noise2DSource = extractFunction('noise2D');

const readIndexes = [];
const backingGrid = Array.from({ length: 256 }, (_, index) => index / 255);
const guardedNoiseGrid = new Proxy(backingGrid, {
  get(target, property, receiver) {
    if (/^\d+$/.test(property)) {
      const index = Number(property);
      readIndexes.push(index);
      assert(
        index >= 0 && index < target.length,
        `noise2D attempted to read noiseGrid[${index}]`
      );
    }
    return Reflect.get(target, property, receiver);
  }
});

const runNoise2D = new Function(
  'noiseGrid',
  'NOISE_SIZE',
  `${smoothstepSource}\n${noiseAtSource}\n${noise2DSource}\nreturn noise2D;`
)(guardedNoiseGrid, backingGrid.length);

const oldBugTrigger = runNoise2D(50, 54.8);
assert(Number.isFinite(oldBugTrigger), 'noise2D should return a finite value for route particle coordinates');
assert.deepStrictEqual(readIndexes, [256 % 256, 257 % 256, 293 % 256, 294 % 256]);

for (let x = 0; x < 600; x += 17.25) {
  for (let y = 0; y < 360; y += 13.75) {
    const value = runNoise2D(x * 0.012 * 8 + 50, y * 0.012 * 8 + 50);
    assert(Number.isFinite(value), `noise2D should remain finite at x=${x}, y=${y}`);
  }
}

console.log('route noise lookup stays within bounds');
