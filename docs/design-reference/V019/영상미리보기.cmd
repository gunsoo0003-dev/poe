@echo off
setlocal
cd /d "%~dp0"
where.exe node >nul 2>nul
if errorlevel 1 goto windows_fallback
node "%~dp0scripts\preview-server.mjs"
if not errorlevel 1 exit /b 0
echo [FIXLGS] Node preview failed. Trying built-in Windows preview...
:windows_fallback
where.exe powershell.exe >nul 2>nul
if errorlevel 1 goto failed
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\preview-server.ps1"
if not errorlevel 1 exit /b 0
:failed
echo [FIXLGS] Could not start preview. See messages above.
echo Press any key to close...
pause >nul
exit /b 1
