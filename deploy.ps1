# Lightweight Aliyun deploy using Next.js standalone (fits 1.6GB VPS)
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Stop"
$Server = "root@114.55.110.19"
$LocalRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $LocalRoot

$Stamp = Get-Date -Format "yyyyMMddHHmmss"
$Archive = "ai-ops-standalone-$Stamp.tar.gz"

Write-Host "==> Local standalone build"
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
if (-not (Test-Path ".next\standalone")) { throw "standalone output missing" }

Write-Host "==> Assemble standalone package"
New-Item -ItemType Directory -Force -Path ".next\standalone\.next" | Out-Null
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\static"
if (Test-Path "public") {
  Copy-Item -Recurse -Force "public" ".next\standalone\public"
}

if (Test-Path $Archive) { Remove-Item $Archive -Force }
& tar -czf $Archive -C ".next\standalone" .
if ($LASTEXITCODE -ne 0) { throw "tar failed" }

Write-Host "==> Upload"
$scriptPath = Join-Path $LocalRoot "scripts\remote-deploy-standalone.sh"
$content = [System.IO.File]::ReadAllText($scriptPath) -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($scriptPath, $content)

scp $Archive "${Server}:/tmp/$Archive"
scp $scriptPath "${Server}:/tmp/remote-deploy-standalone.sh"

Write-Host "==> Remote switch"
ssh -o ServerAliveInterval=15 $Server "sed -i 's/\r$//' /tmp/remote-deploy-standalone.sh; bash /tmp/remote-deploy-standalone.sh /tmp/$Archive $Stamp"
if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }

Remove-Item $Archive -Force -ErrorAction SilentlyContinue
Write-Host "Done: http://114.55.110.19/ops/  |  http://114.55.110.19:3002"
