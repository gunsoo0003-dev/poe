// V263: 통합 GA4 태그의 코드 수준 계약 검증 (배포/실제 데이터 수집은 확인하지 않음).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
const id = "G-EPCCGBTPH9";
const oldId = "G-SSC964HMHS";
assert.equal((layout.match(new RegExp(id, "g")) || []).length, 2, "GA4 loader and config must use Main ID exactly twice");
assert(!layout.includes(oldId), "Old POE2 GA4 ID must not remain in active root layout");
assert(layout.includes(`src="https://www.googletagmanager.com/gtag/js?id=${id}"`), "Google script URL is missing");
assert(layout.includes(`gtag('config', '${id}');`), "GA4 initialization is missing");
assert(layout.includes('strategy="afterInteractive"'), "Existing deferred script loading was changed");
assert(layout.includes('new URL("https://poe2.fixlgs.com")'), "POE2 canonical domain must be preserved");
for (const sub of ["filter/layout.tsx", "pob/layout.tsx", "guides/layout.tsx"]) {
  const file = fs.readFileSync(path.join(root, "src/app", sub), "utf8");
  assert(!file.includes("googletagmanager.com/gtag/js"), `Duplicate GA4 loader in ${sub}`);
}
console.log("PASS V263: Main GA4 ID in loader/config; old ID removed; no duplicate sublayout loaders; domain unchanged");
