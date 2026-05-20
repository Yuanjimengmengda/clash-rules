$ErrorActionPreference = "Stop"

$wrapperPath = Join-Path $PSScriptRoot "start-secoclient-with-patch.ps1"
$sysConfigPath = "$env:APPDATA\SecoClient\sysconfig.ini"

if (-not (Test-Path -LiteralPath $wrapperPath)) {
  throw "Wrapper script not found: $wrapperPath"
}

if (Test-Path -LiteralPath $sysConfigPath) {
  $content = Get-Content -LiteralPath $sysConfigPath -Raw
  $updated = $content -replace '(?m)^ClientAutoBoot\s*=\s*1\s*$', 'ClientAutoBoot = 0'

  if ($updated -ne $content) {
    Copy-Item -LiteralPath $sysConfigPath -Destination "$sysConfigPath.bak" -Force
    Set-Content -LiteralPath $sysConfigPath -Value $updated -NoNewline -Encoding UTF8
    Write-Host "Disabled SecoClient built-in auto boot."
  }
}

$startup = [Environment]::GetFolderPath("Startup")
$desktop = [Environment]::GetFolderPath("Desktop")
$target = "powershell.exe"
$arguments = "-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`""

$shell = New-Object -ComObject WScript.Shell
foreach ($path in @(
  (Join-Path $startup "SecoClient patched.lnk"),
  (Join-Path $desktop "SecoClient patched.lnk")
)) {
  $shortcut = $shell.CreateShortcut($path)
  $shortcut.TargetPath = $target
  $shortcut.Arguments = $arguments
  $shortcut.WorkingDirectory = Split-Path -Parent $wrapperPath
  $shortcut.IconLocation = "C:\Program Files (x86)\SecoClient\SecoClient.exe,0"
  $shortcut.Save()
  Write-Host "Created shortcut: $path"
}

& $wrapperPath
