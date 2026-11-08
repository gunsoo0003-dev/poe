"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.join(__dirname, "..");
const load = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const pkg = load("package.json");
const wrangler = load("wrangler.jsonc");
assert.equal(pkg.name, "fixlgs-poe2");
assert.equal(pkg.dependencies.next, "16.4.5");
assert.equal(pkg.devDependencies["eslint-config-next"], "16.4.5");
assert.equal(pkg.devDependencies["@opennextjs/cloudflare"], "1.20.16");
assert.equal(pkg.devDependencies.wrangler, "4.157.0");
assert.equal(pkg.scripts.build, "next build");
assert.equal(pkg.scripts["build:cloudflare"], "node scripts/build-cloudflare.cjs");
assert.equal(pkg.scripts["build:cloudflare:adapter"], "opennextjs-cloudflare build");
const pipeline = fs.readFileSync(path.join(root, "scripts/build-cloudflare.cjs"), "utf8");
assert.match(pipeline, /finally\s*\{/);
assert.match(pipeline, /--restore/);
assert.equal(pkg.scripts["deploy:cloudflare"], "opennextjs-cloudflare deploy");
assert.equal(wrangler.name, pkg.name);
assert.equal(wrangler.main, ".open-next/worker.js");
assert.equal(wrangler.assets.directory, ".open-next/assets");
assert.equal(wrangler.assets.binding, "ASSETS");
assert.ok(wrangler.compatibility_flags.includes("nodejs_compat"));
assert.deepEqual(wrangler.services, [{binding:"WORKER_SELF_REFERENCE",service:pkg.name}]);
assert.ok(!wrangler.r2_buckets, "R2 must not be silently enabled");
const openNext = fs.readFileSync(path.join(root, "open-next.config.ts"), "utf8");
assert.match(openNext, /defineCloudflareConfig\(\)/);
assert.ok(!openNext.includes("r2IncrementalCache"));
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
assert.match(gitignore, /^\/\.open-next\/$/m);
assert.ok(fs.statSync(path.join(root,"public/data/pob-lua.json")).size > 25 * 1024 * 1024);
// CI must regenerate a lockfile before npm ci. With --lock, ensure exact root consistency.
if (process.argv.includes("--lock")) {
  const lock = load("package-lock.json");
  for (const [name, version] of Object.entries({...pkg.dependencies, ...pkg.devDependencies})) {
    assert.equal(lock.packages[""].dependencies?.[name] ?? lock.packages[""].devDependencies?.[name], version, `lock root mismatch: ${name}`);
  }
  for (const name of ["@opennextjs/cloudflare", "wrangler", "next"])
    assert.ok(lock.packages[`node_modules/${name}`], `missing lock package ${name}`);
}
console.log(`PASS V236: explicit Worker/OpenNext configuration, one build, protected assets${process.argv.includes("--lock") ? ", lock sync" : ""}.`);
