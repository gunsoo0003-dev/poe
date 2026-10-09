param([switch]$Character)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnginePath = if ($env:POB2_ENGINE_PATH) { $env:POB2_ENGINE_PATH } else { Join-Path $ProjectRoot ".pob2-engine" }
$Src = Join-Path $EnginePath "src"
$Launch = Join-Path $Src "Launch.lua"
$BridgeSource = Join-Path $ProjectRoot $(if ($Character) { "engine\pob2\FIXLGS_CharacterSmoke.lua" } else { "engine\pob2\FIXLGS_RuntimeSmoke.lua" })
$CharacterStaged = Join-Path $Src "FIXLGS_Character.xml"
if ($Character) {
  $CharacterOriginal = Join-Path $EnginePath "FIXLGS_Character.xml"
  if (-not (Test-Path $CharacterOriginal)) { throw "Character XML missing. Run npm run pob2:character -- path-to-export.txt first." }
  Copy-Item -LiteralPath $CharacterOriginal -Destination $CharacterStaged -Force
}
$BridgeTarget = Join-Path $Src "FIXLGS_RuntimeSmoke.lua"
$ResultFile = Join-Path $Src "FIXLGS_RuntimeSmoke.result.txt"
$RunMarker = Join-Path $Src "FIXLGS_RuntimeSmoke.entered.txt"
$RuntimeExe = Get-ChildItem -Path $EnginePath -Recurse -File -Filter '*.exe' -ErrorAction SilentlyContinue | Where-Object { $_.Name -in @('Path{space}of{space}Building-PoE2.exe','Path of Building-PoE2.exe') } | Select-Object -First 1
if (-not $RuntimeExe) { throw "Official PoB2 runtime not found. Run npm run pob2:setup." }
if (-not (Test-Path $Launch)) { throw "PoB2 src/Launch.lua not found." }
Copy-Item -LiteralPath $BridgeSource -Destination $BridgeTarget -Force
Remove-Item $ResultFile,$RunMarker -ErrorAction SilentlyContinue

# Inject ONLY for this test. Restore the original Launch.lua in finally even on errors.
$originalBytes = [System.IO.File]::ReadAllBytes($Launch)
$original = [System.Text.UTF8Encoding]::new($false).GetString($originalBytes)
$anchor = 'function launch:OnInit()'
if (-not $original.Contains($anchor)) { throw "Launch.OnInit anchor missing; official source layout changed." }
$markerLua = @'
-- FIXLGS temporary diagnostic entry marker
local _fixMarker = io.open((GetScriptPath and GetScriptPath() or ".") .. "/FIXLGS_RuntimeSmoke.entered.txt", "w")
if _fixMarker then _fixMarker:write("Launch.OnInit reached\n"); _fixMarker:close() end
'@
$patched = $original.Replace($anchor, $anchor + "`n" + $markerLua)
# Inject after main.OnFrame returns, allowing BUILD to initialize on frame one.
$tailAnchor = 'self.devModeAlt = self.devMode and IsKeyDown("ALT")'
$insertion = @'
-- FIXLGS V182 test hook: after main frame calculations
local _fixOK, _fixErr = pcall(dofile, "FIXLGS_RuntimeSmoke.lua")
if not _fixOK then
  local _file = io.open((GetScriptPath and GetScriptPath() or ".") .. "/FIXLGS_RuntimeSmoke.result.txt", "w")
  if _file then _file:write("FIXLGS_POB2_ERROR\nStage=dofile\nMessage=" .. tostring(_fixErr) .. "\n"); _file:close() end
  Exit()
end
'@
if (-not $patched.Contains($tailAnchor)) { throw "Launch.OnFrame anchor missing; official source layout changed." }
$patched = $patched.Replace($tailAnchor, $insertion + "`n" + $tailAnchor)
$encoding = New-Object System.Text.UTF8Encoding($false)
$process = $null
try {
  [System.IO.File]::WriteAllText($Launch, $patched, $encoding)
  Write-Host "[FIXLGS] Official runtime: $($RuntimeExe.FullName)"
  Write-Host "[FIXLGS] Temporary Launch.OnInit hook enabled (automatically restored after test)."
  # Running without an explicit Lua argument ensures the official app loads src/Launch.lua.
  $process = Start-Process -FilePath $RuntimeExe.FullName -WorkingDirectory $EnginePath -PassThru
  if (-not $process.WaitForExit(60000)) {
    try { $process.Kill() } catch {}
    throw "Runtime exceeded 60 seconds; process terminated. Check whether the PoB2 GUI was shown."
  }
} finally {
  [System.IO.File]::WriteAllBytes($Launch, $originalBytes)
  Write-Host "[FIXLGS] Restored original src/Launch.lua."
  if ($Character) { Remove-Item -LiteralPath $CharacterStaged -Force -ErrorAction SilentlyContinue }
}
if (-not (Test-Path $RunMarker)) {
  throw "Launch.OnInit marker missing. Runtime never reached injected code; verify runtime working directory and Lua source path."
}
Write-Host "[FIXLGS] Launch.OnInit marker confirmed."
if (-not (Test-Path $ResultFile)) { throw "Launch.OnInit was entered but calculation result missing (runtime exit $($process.ExitCode))." }
$result = Get-Content -Path $ResultFile -Raw -Encoding UTF8
Write-Host $result.TrimEnd()
if ($result -notmatch '^FIXLGS_POB2_READY') { throw "PoB2 computation not ready. See Stage/Message above." }
Write-Host "[FIXLGS] Official PoB2 calculation smoke test PASSED."
