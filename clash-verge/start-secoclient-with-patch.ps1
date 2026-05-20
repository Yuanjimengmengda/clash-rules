param(
  [string]$SecoClientPath = "C:\Program Files (x86)\SecoClient\SecoClient.exe",
  [string]$PatchScript = "$PSScriptRoot\patch-secoclient-pac.ps1",
  [int]$WatchSeconds = 90,
  [int]$IntervalSeconds = 2
)

$ErrorActionPreference = "Stop"

if (-not (Get-Process -Name "SecoClient" -ErrorAction SilentlyContinue)) {
  if (-not (Test-Path -LiteralPath $SecoClientPath)) {
    throw "SecoClient executable not found: $SecoClientPath"
  }

  Start-Process -FilePath $SecoClientPath -WindowStyle Hidden
  Write-Host "Started SecoClient."
} else {
  Write-Host "SecoClient is already running."
}

$deadline = (Get-Date).AddSeconds($WatchSeconds)
do {
  try {
    & $PatchScript -Quiet
  } catch {
    Write-Host $_.Exception.Message
  }

  Start-Sleep -Seconds $IntervalSeconds
} while ((Get-Date) -lt $deadline)

Write-Host "Finished SecoClient startup patch window."
