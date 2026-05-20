param(
  [string[]]$Domains = @("zhengrenquant.com"),
  [string]$PacPath = "$env:APPDATA\SecoClient\seco_proxy.pac",
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

function Notify-ProxySettingsChanged {
  Add-Type @'
using System;
using System.Runtime.InteropServices;
public class WinInetNotify {
  [DllImport("wininet.dll", SetLastError=true)]
  public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
}
'@ -ErrorAction SilentlyContinue

  [WinInetNotify]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0) | Out-Null
  [WinInetNotify]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0) | Out-Null
}

function Build-DirectBlock {
  param([string[]]$DomainList)

  $conditions = foreach ($domain in $DomainList) {
    "dnsDomainIs(host, `"$domain`") || shExpMatch(host, `"*.$domain`")"
  }

  @"
  // BEGIN local company DIRECT rules
  if ($($conditions -join " || ")) {
    return "DIRECT";
  }
  // END local company DIRECT rules
"@
}

function Update-SecoClientPac {
  param(
    [string]$Path,
    [string[]]$DomainList
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    if (-not $Quiet) { Write-Host "PAC not found yet: $Path" }
    return $false
  }

  $content = Get-Content -LiteralPath $Path -Raw
  $block = Build-DirectBlock -DomainList $DomainList
  $pattern = '(?s)\s*// BEGIN local company DIRECT rules.*?// END local company DIRECT rules\s*'

  if ($content -match $pattern) {
    $updated = [regex]::Replace($content, $pattern, "`r`n$block`r`n", 1)
  } else {
    $updated = $content -replace '(function\s+FindProxyForURL\s*\(\s*url\s*,\s*host\s*\)\s*\{\s*)', "`$1`r`n$block`r`n"
  }

  if ($updated -ne $content) {
    Set-Content -LiteralPath $Path -Value $updated -NoNewline -Encoding UTF8
    if (-not $Quiet) { Write-Host "Patched PAC: $Path" }
    return $true
  }

  if (-not $Quiet) { Write-Host "PAC already patched: $Path" }
  return $false
}

function Update-WindowsProxyBypass {
  param([string[]]$DomainList)

  $key = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
  $current = (Get-ItemProperty -Path $key -ErrorAction SilentlyContinue).ProxyOverride
  $items = @()

  if ($current) {
    $items += $current -split ";" | Where-Object { $_ }
  }

  foreach ($domain in $DomainList) {
    $items += $domain
    $items += "*.$domain"
  }

  $newValue = ($items | Select-Object -Unique) -join ";"
  if ($newValue -ne $current) {
    Set-ItemProperty -Path $key -Name ProxyOverride -Value $newValue
    if (-not $Quiet) { Write-Host "Updated Windows proxy bypass list." }
    return $true
  }

  if (-not $Quiet) { Write-Host "Windows proxy bypass list already patched." }
  return $false
}

$pacChanged = Update-SecoClientPac -Path $PacPath -DomainList $Domains
$bypassChanged = Update-WindowsProxyBypass -DomainList $Domains

if ($pacChanged -or $bypassChanged) {
  Notify-ProxySettingsChanged
}

if ($pacChanged -and -not $Quiet) {
  Write-Host "Restart Chrome or flush chrome://net-internals/#sockets if an old connection is cached."
}
