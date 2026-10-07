param(
  [string]$Version = "0.10.4",
  [string]$Commit = "f4b6b2d"
)
$ErrorActionPreference = "Stop"
$repo = "https://raw.githubusercontent.com/NeverSinkDev/NeverSink-Filter-for-PoE2/$Commit"
$out = Join-Path $PSScriptRoot "..\public\neversink\$Version"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$items = @(
  @{ Remote = "NeverSink's filter 2 - 0-SOFT.filter"; Local = "0-SOFT.filter" },
  @{ Remote = "NeverSink's filter 2 - 1-REGULAR.filter"; Local = "1-REGULAR.filter" },
  @{ Remote = "NeverSink's filter 2 - 2-SEMI-STRICT.filter"; Local = "2-SEMI-STRICT.filter" },
  @{ Remote = "NeverSink's filter 2 - 3-STRICT.filter"; Local = "3-STRICT.filter" },
  @{ Remote = "NeverSink's filter 2 - 4-VERY-STRICT.filter"; Local = "4-VERY-STRICT.filter" },
  @{ Remote = "NeverSink's filter 2 - 5-UBER-STRICT.filter"; Local = "5-UBER-STRICT.filter" },
  @{ Remote = "NeverSink's filter 2 - 6-UBER-PLUS-STRICT.filter"; Local = "6-UBER-PLUS-STRICT.filter" }
)
foreach ($item in $items) {
  $encoded = [uri]::EscapeDataString($item.Remote)
  $url = "$repo/$encoded"
  $target = Join-Path $out $item.Local
  Invoke-WebRequest -Uri $url -OutFile $target
  $head = Get-Content -Path $target -TotalCount 8 -Encoding UTF8
  if (-not ($head -match "# VERSION:\s+$Version")) { throw "VERSION validation failed: $($item.Local)" }
  if (-not ($head -match "# TYPE:\s+$([regex]::Escape($item.Local.Replace('.filter','')))")) { throw "TYPE validation failed: $($item.Local)" }
  Write-Host "OK $($item.Local)"
}
Write-Host "NeverSink $Version / $Commit synced to $out"
