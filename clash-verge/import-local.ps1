param(
  [string]$SourceDir = "$env:APPDATA\io.github.clash-verge-rev.clash-verge-rev"
)

$ErrorActionPreference = "Stop"

$TargetDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfileDir = Join-Path $SourceDir "profiles"

$files = @(
  @{ Source = "config.yaml"; Target = "config.yaml" },
  @{ Source = "dns_config.yaml"; Target = "dns_config.yaml" },
  @{ Source = "verge.yaml"; Target = "verge.yaml" },
  @{ Source = "profiles\Script.js"; Target = "Script.js" }
)

foreach ($file in $files) {
  $source = Join-Path $SourceDir $file.Source
  $target = Join-Path $TargetDir $file.Target

  if (!(Test-Path -LiteralPath $source)) {
    throw "Missing local file: $source"
  }

  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "Imported $source -> $($file.Target)"
}

Write-Host "Done. Review the diff before committing, especially ports, proxy, TUN, DNS, and UI preferences."
