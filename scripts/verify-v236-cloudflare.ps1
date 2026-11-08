# Run in the existing fix-pob Git working tree after overlaying V236 ZIP.
# No git push and no Cloudflare production deployment occurs here.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$branch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -ne "cloudflare-poe2-assetfix-v233") {
    throw "Git branch must be cloudflare-poe2-assetfix-v233; actual: $branch"
}
$raw = "public/data/pob-lua.json"
if (!(Test-Path $raw)) { throw "PoB Lua canonical asset is missing; do not continue." }
$shaBefore = (Get-FileHash $raw -Algorithm SHA256).Hash

Write-Host "[1/5] Regenerating dependency lockfile (one-time)..."
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "package-lock generation failed" }

Write-Host "[2/5] Installing exact locked dependencies..."
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "[3/5] Validating worker identity, configuration and data..."
node scripts/test-v236-cloudflare-pipeline.cjs --lock
if ($LASTEXITCODE -ne 0) { throw "V236 configuration / lock test failed" }
node scripts/test-v235-poe2-domain.cjs
if ($LASTEXITCODE -ne 0) { throw "V235 domain test failed" }
node scripts/test-v234-worker-name.cjs
if ($LASTEXITCODE -ne 0) { throw "V234 worker name test failed" }
node scripts/test-v233-cloudflare-assets.cjs
if ($LASTEXITCODE -ne 0) { throw "V233 gzip asset test failed" }

Write-Host "[4/5] Building Next.js once with OpenNext..."
npm run build:cloudflare
if ($LASTEXITCODE -ne 0) { throw "OpenNext build failed. No GitHub deployment performed." }
if (!(Test-Path ".open-next/worker.js")) { throw "Cloudflare worker.js was not produced" }
if (!(Test-Path ".open-next/assets")) { throw "Cloudflare assets were not produced" }
if (!(Test-Path $raw)) { throw "PoB Lua source was not restored" }
$shaAfter = (Get-FileHash $raw -Algorithm SHA256).Hash
if ($shaBefore -ne $shaAfter) { throw "PoB Lua original was modified" }

Write-Host "[5/5] Git changes (deployment NOT executed):"
git status --short
Write-Host "V236 dependency install, configuration, build and data-integrity verification PASS."
Write-Host "Next step: commit changed package-lock.json and source to production branch, then check Cloudflare build."
