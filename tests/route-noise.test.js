const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '  const noiseGrid = [];';
const endMarker = '  // ---- Canvas sizing with devicePixelRatio';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

assert.notStrictEqual(start, -1, 'route noise block start marker should exist');
assert.notStrictEqual(end, -1, 'route noise block end marker should exist');

const noiseSource = html.slice(start, end);

vm.runInNewContext(`
  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(123456);
  const srand = () => rng();

${noiseSource}

  const probes = [
    [50, 54],
    [1, 83],
    [255, 83],
    [200, 250]
  ];

  for (const [x, y] of probes) {
    const value = noise2D(x, y);
    assert(Number.isFinite(value), 'noise2D(' + x + ', ' + y + ') should be finite');
  }

  for (let xi = 0; xi < 256; xi++) {
    for (let yi = 0; yi < 256; yi++) {
      assert.notStrictEqual(noiseAt(xi, yi), undefined, 'noiseAt should wrap xi=' + xi + ', yi=' + yi);
    }
  }
`, { assert });

console.log('route noise lookup remains bounded');
