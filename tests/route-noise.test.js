const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'joshua-metters-silk-road (9) (1).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const routeScriptMatch = html.match(/\(function setupRouteComposition\(\) \{[\s\S]*?\n\}\)\(\);/);
assert(routeScriptMatch, 'route composition script should be present');

const routeScript = routeScriptMatch[0];
const noiseBlockMatch = routeScript.match(
  /const noiseGrid = \[\];[\s\S]*?function flowAngle\(x, y, t\) \{[\s\S]*?\n  \}/
);
assert(noiseBlockMatch, 'route noise implementation should be present');

const context = {
  srand: (() => {
    let seed = 0;
    return () => {
      seed = (seed + 1) % 256;
      return seed / 256;
    };
  })(),
  Math
};

vm.createContext(context);
vm.runInContext(`${noiseBlockMatch[0]}; this.noise2D = noise2D; this.flowAngle = flowAngle;`, context);

function assertFiniteFlowForParticle(x, y) {
  const SCALE_MICRO = 0.012;
  const noiseX = x * SCALE_MICRO * 8 + 50;
  const noiseY = y * SCALE_MICRO * 8 + 50;

  assert(
    Number.isFinite(context.noise2D(noiseX, noiseY)),
    `noise2D should stay finite for route particle (${x}, ${y})`
  );
  assert(
    Number.isFinite(context.flowAngle(x, y, 0)),
    `flowAngle should stay finite for route particle (${x}, ${y})`
  );
}

// This ordinary on-canvas coordinate used to read indexes [256, 257, 293, 294]
// from the 256-entry grid, which poisoned the particle with NaN velocity.
assertFiniteFlowForParticle(5, 45);

for (let x = -20; x <= 820; x += 20) {
  for (let y = -20; y <= 520; y += 20) {
    assertFiniteFlowForParticle(x, y);
  }
}
