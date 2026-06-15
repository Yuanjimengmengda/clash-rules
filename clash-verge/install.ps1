param(
  [string]$TargetDir = "$env:APPDATA\io.github.clash-verge-rev.clash-verge-rev"
)

$ErrorActionPreference = "Stop"

$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfileDir = Join-Path $TargetDir "profiles"

New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null

$files = @(
  @{ Source = "config.yaml"; Target = "config.yaml" },
  @{ Source = "dns_config.yaml"; Target = "dns_config.yaml" },
  @{ Source = "verge.yaml"; Target = "verge.yaml" },
  @{ Source = "Merge.yaml"; Target = "profiles\Merge.yaml" },
  @{ Source = "Script.js"; Target = "profiles\Script.js" }
)

foreach ($file in $files) {
  $source = Join-Path $SourceDir $file.Source
  $target = Join-Path $TargetDir $file.Target

  if (!(Test-Path -LiteralPath $source)) {
    throw "Missing source file: $source"
  }

  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "Installed $($file.Source) -> $target"
}

Write-Host "Done. Restart Clash Verge Rev or reload the active profile for changes to take effect."
