# Personal Clash Rules

This repository stores reusable Clash Verge Rev rule configuration.

It has two jobs:

- Publish personal rule-provider files from `rulesets/*.txt` to the `release` branch.
- Store a reusable Clash Verge Rev global script at `clash-verge/Script.js`.

## Repository Layout

```text
.
|-- clash-verge/
|   `-- Script.js
|-- rulesets/
|   |-- direct.txt
|   |-- global-proxy.txt
|   |-- reject.txt
|   |-- usa.txt
|   `-- README.md
`-- .github/workflows/run.yml
```

## Published Rule URLs

GitHub Actions copies `rulesets/*.txt` to the `release` branch. Clash should consume the `release` branch, not `master`.

Preferred CDN URLs:

```text
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/direct.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/reject.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/global-proxy.txt
```

Raw GitHub fallback URLs:

```text
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/direct.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/reject.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/usa.txt
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/global-proxy.txt
```

## Clash Verge Script

`clash-verge/Script.js` is a global profile enhancement script for Clash Verge Rev.

It creates stable normalized proxy groups so rules do not break when switching subscriptions:

```text
GLOBAL-PROXY
AUTO-PROXY
USA-PROXY
HK-PROXY
JP-PROXY
SG-PROXY
TW-PROXY
KR-PROXY
```

It also installs rule providers:

```text
custom-direct         -> DIRECT
custom-reject         -> REJECT
custom-usa            -> USA-PROXY
custom-global-proxy   -> GLOBAL-PROXY
Loyalsoldier baseline -> blacklist mode
```

Rules are ordered intentionally. Clash uses the first matching rule, so custom rules run before upstream Loyalsoldier rules.

## Install On Another Windows PC

Install Clash Verge Rev, then run:

```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/master/clash-verge/Script.js" `
  -OutFile "$env:APPDATA\io.github.clash-verge-rev.clash-verge-rev\profiles\Script.js"
```

Then in Clash Verge Rev:

1. Enable profile script/global enhancement.
2. Refresh the active subscription.
3. Check that normalized groups like `GLOBAL-PROXY` and `USA-PROXY` appear.

## Editing Rules

Edit the files under `rulesets/`:

- `usa.txt`: domains that must use `USA-PROXY`.
- `global-proxy.txt`: domains that must use `GLOBAL-PROXY`.
- `direct.txt`: domains that must use `DIRECT`.
- `reject.txt`: domains that must use `REJECT`.

Each file is a Clash rule-provider payload:

```yaml
payload:
  - '+.example.com'
  - 'exact.example.net'
```

Use `'+.example.com'` for a domain and all subdomains.

## Publish Changes

```powershell
git add .github/workflows/run.yml README.md clash-verge rulesets
git commit -m "Update personal Clash rules"
git push origin master
```

After pushing, GitHub Actions publishes the files to the `release` branch. jsDelivr may cache for a short time, but the workflow attempts to purge changed files.

## Notes For Agents

- Keep `clash-verge/Script.js` and the locally installed Clash Verge script in sync when changing script behavior.
- Do not edit the generated `release` branch by hand.
- Add personal domains to `rulesets/*.txt`, not directly inside `Script.js`, unless they need special routing logic.
- Preserve rule order in `Script.js`: direct/reject/region-specific custom rules should stay before broad global proxy and Loyalsoldier rules.
- Use domain rules for CDN-backed services. IP lists are brittle for OpenAI, Google, Meta, streaming, and similar providers.
