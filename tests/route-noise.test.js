const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const noiseBlock = html.match(/const noiseGrid = \[\];[\s\S]*?function noise2D\(x, y\) \{[\s\S]*?\n  \}/);
assert.ok(noiseBlock, 'expected to find the route composition noise2D implementation');

const context = {
  srand: () => 0.5
};
vm.createContext(context);
vm.runInContext(`${noiseBlock[0]}\nthis.noise2D = noise2D;`, context);

const SCALE_MICRO = 0.012;
const pageX = 0;
const pageY = 50;
const noiseX = pageX * SCALE_MICRO * 8 + 50;
const noiseY = pageY * SCALE_MICRO * 8 + 50;

const preFixIndex =
  (Math.floor(noiseX) & 255) +
  (((Math.floor(noiseY) & 255) * 37) % 256);
assert.equal(preFixIndex, 256, 'test coordinate must exercise the previous out-of-bounds lookup');

const value = context.noise2D(noiseX, noiseY);
assert.ok(Number.isFinite(value), 'route noise must stay finite for visible canvas coordinates');
