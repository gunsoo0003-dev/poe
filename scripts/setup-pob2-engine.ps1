$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnginePath = Join-Path $ProjectRoot ".pob2-engine"
$Repo = "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2.git"
$BridgeSource = Join-Path $ProjectRoot "engine\pob2\FIXLGS_RuntimeSmoke.lua"
$BridgeTarget = Join-Path $EnginePath "src\FIXLGS_RuntimeSmoke.lua"

Write-Host "[FIXLGS] PoB2 official-runtime engine setup"
Write-Host "[FIXLGS] Engine: $EnginePath"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required. Install Git for Windows first."
}

if (-not (Test-Path (Join-Path $EnginePath ".git"))) {
  Write-Host "[FIXLGS] Cloning official PathOfBuilding-PoE2 dev branch..."
  git clone --depth 1 --branch dev $Repo $EnginePath
  if ($LASTEXITCODE -ne 0) { throw "PoB2 clone failed with exit code $LASTEXITCODE" }
} else {
  Write-Host "[FIXLGS] Updating existing PoB2 engine..."
  git -C $EnginePath fetch origin dev --depth 1
  if ($LASTEXITCODE -ne 0) { throw "PoB2 fetch failed with exit code $LASTEXITCODE" }
  git -C $EnginePath checkout dev
  if ($LASTEXITCODE -ne 0) { throw "PoB2 checkout failed with exit code $LASTEXITCODE" }
  git -C $EnginePath reset --hard origin/dev
  if ($LASTEXITCODE -ne 0) { throw "PoB2 reset failed with exit code $LASTEXITCODE" }
}

# Clean obsolete FIXLGS runtime artifacts from earlier experiments.
Remove-Item (Join-Path $EnginePath "src\FIXLGS_Smoke.lua") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $ProjectRoot ".pob2-runtime") -Recurse -Force -ErrorAction SilentlyContinue

# The official repository ships the Windows SimpleGraphic runtime as
# runtime-win32.zip. A fresh source checkout may not have the executable
# expanded yet, so extract it once when needed.
$RuntimeExe = Get-ChildItem -Path $EnginePath -Recurse -File -Filter "*.exe" -ErrorAction SilentlyContinue | Where-Object { $_.Name -in @("Path{space}of{space}Building-PoE2.exe", "Path of Building-PoE2.exe") } | Select-Object -First 1
if (-not $RuntimeExe) {
  $RuntimeZip = Join-Path $EnginePath "runtime-win32.zip"
  if (-not (Test-Path $RuntimeZip)) {
    throw "Official PoB2 Windows runtime archive was not found at '$RuntimeZip'. The PoB2 checkout is incomplete."
  }

  Write-Host "[FIXLGS] Extracting official PoB2 Windows runtime..."
  Expand-Archive -LiteralPath $RuntimeZip -DestinationPath $EnginePath -Force

  $RuntimeExe = Get-ChildItem -Path $EnginePath -Recurse -File -Filter "*.exe" -ErrorAction SilentlyContinue | Where-Object { $_.Name -in @("Path{space}of{space}Building-PoE2.exe", "Path of Building-PoE2.exe") } | Select-Object -First 1
  if (-not $RuntimeExe) {
    throw "runtime-win32.zip was extracted, but neither official executable name was found. Check archive contents under .pob2-engine\runtime."
  }
}

Write-Host "[FIXLGS] Runtime ready: $($RuntimeExe.FullName)"

Copy-Item $BridgeSource $BridgeTarget -Force
Write-Host "[FIXLGS] Installed FIXLGS_RuntimeSmoke.lua"
Write-Host "[FIXLGS] No Scoop / winget / standalone LuaJIT is required."
Write-Host "[FIXLGS] Running staged Launch.OnInit diagnostic smoke test..."
& (Join-Path $PSScriptRoot "test-pob2-engine.ps1")
