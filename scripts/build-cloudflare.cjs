/**
 * Build Next.js for Cloudflare exactly once through OpenNext, preserving the
 * canonical PoB Lua JSON on both success and failure.
 * No npm installation, auto-migration or deployment happens inside this script.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function run(command, args, options = {}) {
  const p = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (p.error) {
    console.error(p.error);
    return 1;
  }
  return typeof p.status === "number" ? p.status : 1;
}

const staging = run(process.execPath, ["scripts/prepare-cloudflare-assets.cjs"]);
if (staging !== 0) process.exit(staging);
let result = 1;
try {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  result = run(npm, ["run", "build:cloudflare:adapter"], process.platform === "win32" ? { shell: true } : {});
} finally {
  const restoration = run(process.execPath, ["scripts/prepare-cloudflare-assets.cjs", "--restore"]);
  if (restoration !== 0) {
    console.error("ERROR: PoB Lua source restoration failed. Inspect the staging backup before proceeding.");
    result = restoration;
  }
}
process.exit(result);
