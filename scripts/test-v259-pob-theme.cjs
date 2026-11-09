#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root,rel), "utf8");
const page = read("src/app/pob/page.tsx");
const layout = read("src/app/pob/layout.tsx");
const css = read("src/app/pob/pob-v259-theme.css");
const rootHome = read("src/app/page.tsx");
const generic = ["poe-home/assets/poe2-character-boss.webp", "poe-home/assets/poe2-character-combat.webp"];
for (const file of generic) assert(fs.existsSync(path.join(root,"public",file)), `Missing existing artwork: ${file}`);
assert.match(page, /game-shell pob-v259-root/);
assert.match(page, /site-shell pob-v259-root/);
assert.match(layout, /import "\.\/pob-v259-theme\.css"/);
assert.match(layout, /export const metadata:Metadata/);
assert.match(layout, /poe.ninja Builds/);
assert.match(page, /poe2-character-boss\.webp/);
assert.match(page, /POE2 · BUILD ANALYSIS/);
assert(!page.includes('CURRENT SEASON') && !page.includes('/season-header.jpg'));
assert(!css.includes("url('/season-tree.jpg')"));
assert.match(css,/poe2-character-combat\.webp/);
for (const name of [".brand-panel",".hero-stage",".guide-panel",".character-panel",".game-shell",".game-main",".panel-card",".simulation-divider",".simulation-build",".equipment-slot-inner"]) {
  assert(css.includes(`.pob-v259-root ${name}`) || css.includes(`.pob-v259-root${name}`),`Missing scoped region ${name}`);
}
assert(!rootHome.includes('pob-v259-root'),"Homepage must remain outside the theme");
assert(!fs.existsSync(path.join(root,"src/app/robots.ts")) && !fs.existsSync(path.join(root,"src/app/sitemap.ts")));
console.log("PASS V259 PoB theme: assets, isolation, landing/game styles, no season content, SEO-file policy (24 checks)");
