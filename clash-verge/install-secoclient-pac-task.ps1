$ErrorActionPreference = "Stop"

$taskName = "Patch SecoClient PAC for company domains"
$scriptPath = Join-Path $PSScriptRoot "patch-secoclient-pac.ps1"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Patch script not found: $scriptPath"
}

$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
schtasks.exe /Create /TN $taskName /TR $taskCommand /SC MINUTE /MO 1 /F | Out-Null

& $scriptPath

Write-Host "Installed scheduled task: $taskName"
