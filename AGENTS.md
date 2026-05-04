# Agent Guide

This repo is a personal Clash Verge Rev rules repository.

## What To Edit

- Edit `rulesets/*.txt` for domain routing changes.
- Edit `clash-verge/Script.js` only for routing logic, normalized groups, or provider wiring.
- Keep the installed script at `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\profiles\Script.js` in sync with `clash-verge/Script.js` when working on this PC.

## Rule Files

All `rulesets/*.txt` files must start with:

```yaml
payload:
```

Current files:

- `direct.txt`: always route to `DIRECT`.
- `reject.txt`: always route to `REJECT`.
- `usa.txt`: always route to `PROXY-USA`.
- `global-proxy.txt`: always route to `PROXY-GLOBAL`.

For domain behavior, entries look like:

```yaml
  - '+.example.com'
```

## Publishing Model

The `master` branch is the source of truth. GitHub Actions publishes `rulesets/*.txt` to the `release` branch.

Clash uses URLs like:

```text
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
```

Do not hand-edit the `release` branch.

## Clash Rule Order

Clash uses first-match-wins. The script intentionally orders custom rules before Loyalsoldier rules:

```text
custom-direct
custom-reject
custom-usa
custom-global-proxy
Loyalsoldier baseline
MATCH,DIRECT
```

If there is a conflict, the earlier provider wins.

## Safety

- Prefer domain rules over IP rules for CDN-backed services.
- Keep generated URLs stable; changing provider names in `Script.js` also requires changing matching `RULE-SET` lines.
- Do not add subscription-specific policy names to rules. Use only normalized groups such as `PROXY-GLOBAL`, `PROXY-USA`, or built-ins like `DIRECT` and `REJECT`.
