# Agent Guide

This repo is a personal Clash Verge Rev rules repository.

## What To Edit

- Edit `rulesets/*.txt` for domain routing changes.
- Edit `clash-verge/Script.js` only for routing logic, normalized groups, or provider wiring.
- Edit `clash-verge/config.yaml`, `clash-verge/dns_config.yaml`, and `clash-verge/verge.yaml` for shared Clash core, DNS, and Verge app settings.
- Keep the installed script at `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\profiles\Script.js` in sync with `clash-verge/Script.js` when working on this PC.
- Use `clash-verge/import-local.ps1` to import local Clash Verge config into the repo, and `clash-verge/install.ps1` to install repo config into `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev`.

## Synced Clash Verge Config

Keep these files under `clash-verge/` suitable for sharing across machines:

- `config.yaml`: Clash core base settings.
- `dns_config.yaml`: Clash DNS settings.
- `verge.yaml`: Clash Verge Rev app preferences.
- `Script.js`: global profile enhancement script.

Do not add generated or private state such as `profiles.yaml`, subscription YAML files under the local `profiles/` directory, `cache.db`, logs, `window_state.json`, `Country.mmdb`, `geoip.dat`, `geosite.dat`, or task scheduler XML.

## Rule Files

All `rulesets/*.txt` files must start with:

```yaml
payload:
```

Current files:

- `direct.txt`: always route to `DIRECT`.
- `reject.txt`: always route to `REJECT`.
- `usa.txt`: always route to `PROXY-USA`.
- `usa-keyword.txt`: always route keyword/classical matches to `PROXY-USA`.
- `keyword-proxy.txt`: always route keyword/classical matches to `PROXY-GLOBAL`.
- `global-proxy.txt`: always route to `PROXY-GLOBAL`.

For domain behavior, entries look like:

```yaml
  - '+.example.com'
```

`keyword-proxy.txt` uses `behavior: classical`; entries should be complete Clash rules, for example:

```yaml
  - DOMAIN-KEYWORD,example
```

## Publishing Model

The `master` branch is the source of truth. GitHub Actions publishes `rulesets/*.txt` to the `release` branch.

Clash uses URLs like:

```text
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
```

`cdn.jsdelivr.net` is jsDelivr. It reads files from GitHub and caches them on a CDN. GitHub is the source; jsDelivr is the delivery/cache layer. It is not a GitHub-provided automatic URL.

Critical rule for agents: after editing `rulesets/*.txt`, ensure the same files are published to the `release` branch. If `release` is missing or stale, Clash rule providers will fail or silently fall through to later rules.

Verify these URLs after publication:

```text
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/usa.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
```

Do not hand-edit the `release` branch in the main working tree. If GitHub Actions does not run, use a temporary directory and force-push only the generated `*.txt` files to `release`.

Manual release publication:

```powershell
$publish = "$env:USERPROFILE\clash-rules-release-publish"
Remove-Item -LiteralPath $publish -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $publish | Out-Null
Copy-Item "$env:USERPROFILE\clash-rules\rulesets\*.txt" $publish
Set-Location $publish
git init
git checkout -b release
git config user.name "peter"
git config user.email "peter@users.noreply.github.com"
git add *.txt
git commit -m "Publish rule sets"
git remote add origin https://github.com/Yuanjimengmengda/clash-rules.git
git push -f origin release
```

## Clash Rule Order

Clash uses first-match-wins. The script intentionally orders custom rules before Loyalsoldier rules:

```text
custom-direct
custom-reject
custom-usa
custom-usa-keyword
custom-keyword-proxy
custom-global-proxy
Loyalsoldier baseline
MATCH,DIRECT
```

If there is a conflict, the earlier provider wins.

## Safety

- Prefer domain rules over IP rules for CDN-backed services.
- Keep generated URLs stable; changing provider names in `Script.js` also requires changing matching `RULE-SET` lines.
- Do not add subscription-specific policy names to rules. Use only normalized groups such as `PROXY-GLOBAL`, `PROXY-USA`, or built-ins like `DIRECT` and `REJECT`.
