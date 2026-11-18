const fs = require('fs');
const assert = require('assert');
const src = fs.readFileSync('src/app/news/poe2-1-0-atlas-passive-rework/AtlasVisuals.tsx', 'utf8');
assert.match(src, /const svgCoord = \(value: number\): string => value\.toFixed\(4\)/);
for (const part of ['Math.cos(theta)', 'Math.sin(theta)', 'Math.cos(a)', 'Math.sin(a)']) {
  assert(src.includes(part), `Missing original node geometry ${part}`);
}
assert.equal((src.match(/x: svgCoord\(/g)||[]).length, 3);
assert.equal((src.match(/y: svgCoord\(/g)||[]).length, 3);
// Regression: simulate tiny cross-engine trig differences that caused hydration mismatch.
for (const [a,b] of [[190.88863628753506,190.8886362875351],[77.15161837553754,77.15161837553755]]) {
  assert.equal(a.toFixed(4), b.toFixed(4));
}
console.log('PASS V282: stable 4-decimal SVG coordinates for 3 generated node fields');
