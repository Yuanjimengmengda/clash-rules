# Personal Clash Rules

This repository stores reusable Clash Verge Rev rule configuration.

It has two jobs:

- Publish personal rule-provider files from `rulesets/*.txt` to the `release` branch.
- Store reusable Clash Verge Rev configuration under `clash-verge/`, including the global script, Clash base config, DNS config, and Verge app preferences.

## Repository Layout

```text
.
|-- clash-verge/
|   |-- Script.js
|   |-- config.yaml
|   |-- dns_config.yaml
|   |-- import-local.ps1
|   |-- install.ps1
|   `-- verge.yaml
|-- rulesets/
|   |-- direct.txt
|   |-- global-proxy.txt
|   |-- keyword-proxy.txt
|   |-- reject.txt
|   |-- usa.txt
|   `-- README.md
`-- .github/workflows/run.yml
```

## Published Rule URLs

GitHub Actions copies `rulesets/*.txt` to the `release` branch. Clash should consume the `release` branch, not `master`.

`cdn.jsdelivr.net` is jsDelivr, a public CDN that reads files from GitHub and caches them globally. It is not provided by GitHub automatically. GitHub is the source of truth; jsDelivr is only the cached delivery layer.

Preferred CDN URLs:

```text
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/direct.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/reject.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/keyword-proxy.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/global-proxy.txt
```

Raw GitHub fallback URLs:

```text
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/direct.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/reject.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/usa.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/keyword-proxy.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/global-proxy.txt
```

## Clash Verge Script

`clash-verge/Script.js` is a global profile enhancement script for Clash Verge Rev.

It removes subscription-provided proxy groups from the generated config and creates a small set of stable normalized groups so rules do not break when switching subscriptions:

```text
AUTO-GLOBAL
AUTO-USA
PROXY-GLOBAL
PROXY-USA
```

It also installs rule providers:

```text
custom-direct         -> DIRECT
custom-reject         -> REJECT
custom-usa            -> PROXY-USA
custom-keyword-proxy  -> PROXY-GLOBAL
custom-global-proxy   -> PROXY-GLOBAL
Loyalsoldier baseline -> blacklist mode
```

Rules are ordered intentionally. Clash uses the first matching rule, so custom rules run before upstream Loyalsoldier rules.

## Clash Verge Config Sync

`clash-verge/` also stores the Clash Verge Rev files that are useful to keep consistent across machines:

- `config.yaml`: Clash core base settings such as ports, TUN defaults, controller, mode, LAN, IPv6, and logging.
- `dns_config.yaml`: Clash DNS settings.
- `verge.yaml`: Verge application preferences such as startup, tray, system proxy, language, core choice, and UI options.
- `Script.js`: global profile enhancement script installed to the local `profiles/` directory.

These files intentionally do not include `profiles.yaml`, subscription profile YAML files, logs, caches, Geo databases, `window_state.json`, or task scheduler XML. Those files are machine-specific, frequently generated, or may contain subscription/private state.

To import the current local Clash Verge Rev settings into this repository:

```powershell
Set-Location "$env:USERPROFILE\clash-rules"
.\clash-verge\import-local.ps1
git diff -- clash-verge
```

To apply the repository version to the current Windows user:

```powershell
Set-Location "$env:USERPROFILE\clash-rules"
.\clash-verge\install.ps1
```

Restart Clash Verge Rev, or reload the active profile, after installing config changes.

## SecoClient VPN And Chrome

When SecoClient VPN is running together with Clash Verge system proxy or TUN mode, Chrome may follow SecoClient's PAC file before traffic reaches Clash rules. On this PC the PAC file is:

```text
%APPDATA%\SecoClient\seco_proxy.pac
```

If an internal company domain is reachable with direct tools but Chrome shows `ERR_CONNECTION_CLOSED`, check whether the PAC sends that domain to `PROXY 127.0.0.1:7890`. For example, `gitlab.zhengrenquant.com` resolves to a VPN-routed private IP and works with direct access, but fails when forced through Clash's local proxy.

Fix this in SecoClient's PAC first, before spending time on Clash rule providers:

```js
function FindProxyForURL(url, host) {
  if (dnsDomainIs(host, "zhengrenquant.com") || shExpMatch(host, "*.zhengrenquant.com")) {
    return "DIRECT";
  }

  // Existing SecoClient PAC rules...
}
```

It is still useful to keep the same domain in `rulesets/direct.txt`, but that alone may not affect Chrome if the active system PAC sends the request to Clash before Clash can make a direct/bypass decision. After editing the PAC, flush Chrome sockets at `chrome://net-internals/#sockets` or restart Chrome.

SecoClient rewrites `seco_proxy.pac` whenever it reconnects, so manual edits are not persistent. Prefer making Clash Verge's system proxy bypass persistent, then let SecoClient read that bypass when it generates PAC:

```yaml
use_default_bypass: true
system_proxy_bypass: zhengrenquant.com;*.zhengrenquant.com
```

After changing `verge.yaml`, restart Clash Verge Rev or toggle system proxy once so Windows receives the updated `ProxyOverride`. Then restart/reconnect SecoClient so its generated PAC includes the same bypass. Verify Windows proxy bypass contains:

```text
zhengrenquant.com;*.zhengrenquant.com
```

## Install On Another Windows PC

Install Clash Verge Rev, then run:

```powershell
git clone https://github.com/Yuanjimengmengda/clash-rules.git "$env:USERPROFILE\clash-rules"
Set-Location "$env:USERPROFILE\clash-rules"
.\clash-verge\install.ps1
```

Then in Clash Verge Rev:

1. Enable profile script/global enhancement.
2. Refresh the active subscription.
3. Check that normalized groups like `PROXY-GLOBAL` and `PROXY-USA` appear.

## Editing Rules

Edit the files under `rulesets/`:

- `usa.txt`: domains that must use `PROXY-USA`.
- `keyword-proxy.txt`: domain keyword rules that must use `PROXY-GLOBAL`.
- `global-proxy.txt`: domains that must use `PROXY-GLOBAL`.
- `direct.txt`: domains that must use `DIRECT`.
- `reject.txt`: domains that must use `REJECT`.

Each file is a Clash rule-provider payload:

```yaml
payload:
  - '+.example.com'
  - 'exact.example.net'
```

Use `'+.example.com'` for a domain and all subdomains.

`keyword-proxy.txt` is a `classical` Clash rule-provider payload, so it can use full rule syntax:

```yaml
payload:
  - DOMAIN-KEYWORD,example
```

## Publish Changes

Rule files are only useful to Clash after they exist on the `release` branch. After changing `rulesets/*.txt`, always make sure the `release` branch has been published and the URLs below return the new content.

```powershell
git add .github/workflows/run.yml README.md AGENTS.md clash-verge rulesets
git commit -m "Update personal Clash rules"
git push origin master
```

After pushing, GitHub Actions publishes the files to the `release` branch. jsDelivr may cache for a short time, but the workflow attempts to purge changed files.

Verify publication:

```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/usa.txt" `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt" `
  -UseBasicParsing
```

If GitHub Actions did not run or `release` is missing, publish manually from a clean temporary directory:

```powershell
$publish = "$env:USERPROFILE\clash-rules-release-publish"
Remove-Item -LiteralPath $publish -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $publish | Out-Null
Copy-Item "$env:USERPROFILE\clash-rules\rulesets\*.txt" $publish
Set-Location $publish
git init
git checkout -b release
git config user.name "yuehc"
git config user.email "peter_rdfx@126.com"
git add *.txt
git commit -m "Publish rule sets"
git remote add origin https://github.com/Yuanjimengmengda/clash-rules.git
git push -f origin release
```

After manual publication, verify both raw GitHub and jsDelivr URLs again. Clash can use the raw GitHub URL as a fallback if jsDelivr cache is stale.

## Notes For Agents

- Keep `clash-verge/Script.js` and the locally installed Clash Verge script in sync when changing script behavior.
- Do not edit the generated `release` branch by hand.
- Add personal domains to `rulesets/*.txt`, not directly inside `Script.js`, unless they need special routing logic.
- After changing any `rulesets/*.txt` file, verify that `https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/<file>.txt` and `https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/<file>.txt` both return the updated content.
- Preserve rule order in `Script.js`: direct/reject/region-specific custom rules should stay before broad global proxy and Loyalsoldier rules.
- Use domain rules for CDN-backed services. IP lists are brittle for OpenAI, Google, Meta, streaming, and similar providers.
