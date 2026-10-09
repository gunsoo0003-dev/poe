function Resolve-FIXLGSLuaJit {
  param([string]$ProjectRoot)

  if ($env:LUAJIT_PATH -and (Test-Path $env:LUAJIT_PATH)) {
    return (Resolve-Path $env:LUAJIT_PATH).Path
  }

  $projectCandidates = @(
    (Join-Path $ProjectRoot "tools\luajit\luajit.exe"),
    (Join-Path $ProjectRoot ".pob2-runtime\luajit.exe")
  )
  foreach ($candidate in $projectCandidates) {
    if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
  }

  $cmd = Get-Command luajit -ErrorAction SilentlyContinue
  if ($cmd -and $cmd.Source -and (Test-Path $cmd.Source)) { return $cmd.Source }

  $roots = @()
  if ($env:ProgramFiles) { $roots += $env:ProgramFiles }
  if (${env:ProgramFiles(x86)}) { $roots += ${env:ProgramFiles(x86)} }
  if ($env:LOCALAPPDATA) { $roots += (Join-Path $env:LOCALAPPDATA "Programs") }

  foreach ($root in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path $root)) { continue }
    $directCandidates = @(
      (Join-Path $root "LuaJIT\luajit.exe"),
      (Join-Path $root "LuaJIT 2.1\luajit.exe"),
      (Join-Path $root "DEVCOM\LuaJIT\luajit.exe")
    )
    foreach ($candidate in $directCandidates) {
      if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
    }

    try {
      $found = Get-ChildItem -Path $root -Filter luajit.exe -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "LuaJIT|luajit" } |
        Select-Object -First 1
      if ($found) { return $found.FullName }
    } catch {}
  }

  return $null
}

function Install-FIXLGSLuaJit {
  param([string]$ProjectRoot)

  $existing = Resolve-FIXLGSLuaJit -ProjectRoot $ProjectRoot
  if ($existing) { return $existing }

  # Download the publisher's signed MSI directly; no package manager is required.
  $version = "2.1.19907"
  $url = "https://github.com/DevelopersCommunity/cmake-luajit/releases/download/v$version/LuaJIT-$version-win64.msi"
  $runtimeDir = Join-Path $ProjectRoot ".pob2-runtime"
  $msi = Join-Path $runtimeDir "LuaJIT-$version-win64.msi"

  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

  Write-Host "[FIXLGS] LuaJIT is missing. Downloading the DEVCOM LuaJIT Windows package directly..."
  try {
    Invoke-WebRequest -Uri $url -OutFile $msi -UseBasicParsing
  } catch {
    throw "LuaJIT download failed. GitHub access is required for the first setup. $($_.Exception.Message)"
  }

  if (-not (Test-Path $msi) -or (Get-Item $msi).Length -lt 100000) {
    throw "LuaJIT download did not produce a valid MSI file."
  }

  Write-Host "[FIXLGS] Installing LuaJIT silently..."
  $proc = Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", ('"' + $msi + '"'), "/quiet", "/norestart") -Wait -PassThru
  if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne 3010) {
    throw "LuaJIT MSI installation failed (exit code $($proc.ExitCode))."
  }

  # Installer is only a setup artifact; remove it immediately.
  Remove-Item $msi -Force -ErrorAction SilentlyContinue

  $installed = Resolve-FIXLGSLuaJit -ProjectRoot $ProjectRoot
  if (-not $installed) {
    # MSI PATH changes are not guaranteed to reach the current process. Search likely install roots once more.
    $searchRoots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ -and (Test-Path $_) }
    foreach ($root in $searchRoots) {
      try {
        $found = Get-ChildItem -Path $root -Filter luajit.exe -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $installed = $found.FullName; break }
      } catch {}
    }
  }

  if (-not $installed) {
    throw "LuaJIT was installed but luajit.exe could not be located. Restart PowerShell and rerun npm run pob2:setup."
  }

  return $installed
}
