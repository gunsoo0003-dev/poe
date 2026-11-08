# Portable loopback-only static preview for Windows PowerShell 5.1+.
# No Node.js installation, administrator rights, external server, or paid API.
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$rootPrefix = $root
if (-not $rootPrefix.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $rootPrefix += [System.IO.Path]::DirectorySeparatorChar }
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webp' = 'image/webp'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
}
function Send-Response($stream, [int]$status, [string]$type, [byte[]]$data, [bool]$headOnly) {
  if ($status -eq 200) { $statusText = 'OK' }
  elseif ($status -eq 403) { $statusText = 'Forbidden' }
  elseif ($status -eq 405) { $statusText = 'Method Not Allowed' }
  else { $statusText = 'Not Found' }
  $headers = "HTTP/1.1 $status $statusText`r`nContent-Type: $type`r`nContent-Length: $($data.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nReferrer-Policy: strict-origin-when-cross-origin`r`nX-Content-Type-Options: nosniff`r`n`r`n"
  $head = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($head,0,$head.Length)
  if (-not $headOnly -and $data.Length -gt 0) { $stream.Write($data,0,$data.Length) }
  $stream.Flush()
}
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
try {
  $listener.Start()
  $port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
  $url = "http://127.0.0.1:$port/index.html"
  Write-Host "[FIXLGS] Preview running: $url"
  Write-Host '[FIXLGS] Close this window to stop the preview.'
  try { Start-Process $url } catch { Write-Host "[FIXLGS] Open the URL above in your browser." }
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $request = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($request)) { continue }
      for ($i=0; $i -lt 100; $i++) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }
      $parts = $request.Split(' ')
      $method = $parts[0]
      $headOnly = ($method -eq 'HEAD')
      if ($parts.Length -lt 2 -or ($method -ne 'GET' -and -not $headOnly)) {
        Send-Response $stream 405 'text/plain; charset=utf-8' ([System.Text.Encoding]::ASCII.GetBytes('Method Not Allowed')) $headOnly
        continue
      }
      $uri = [Uri]::new("http://127.0.0.1:$port" + $parts[1])
      $path = [Uri]::UnescapeDataString($uri.AbsolutePath).TrimStart('/')
      if (-not $path) { $path = 'index.html' }
      $path = $path.Replace('/',[System.IO.Path]::DirectorySeparatorChar)
      $target = [System.IO.Path]::GetFullPath((Join-Path $root $path))
      if (-not $target.StartsWith($rootPrefix,[System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Response $stream 403 'text/plain; charset=utf-8' ([System.Text.Encoding]::ASCII.GetBytes('Forbidden')) $headOnly
        continue
      }
      if (-not [System.IO.File]::Exists($target)) {
        Send-Response $stream 404 'text/plain; charset=utf-8' ([System.Text.Encoding]::ASCII.GetBytes('Not Found')) $headOnly
        continue
      }
      $ext = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $data = [System.IO.File]::ReadAllBytes($target)
      Send-Response $stream 200 $type $data $headOnly
    } catch {
      Write-Host "[FIXLGS] Request error: $($_.Exception.Message)"
    } finally {
      $client.Close()
    }
  }
} catch {
  Write-Host "[FIXLGS] Preview error: $($_.Exception.Message)"
  exit 1
} finally {
  $listener.Stop()
}
