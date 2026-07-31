# Personal Clash Rule Sets

Files in this directory are published by GitHub Actions to the `release` branch.

Use these URLs in Clash rule providers:

```text
https://raw.githubusercontent.com/Yuanjimengmengda/clash-rules/release/usa.txt
https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release/usa.txt
```

Each file must be a Clash rule-provider payload:

```yaml
payload:
  - '+.example.com'
  - 'api.example.net'
```

For `behavior: domain`, use:

- `'+.example.com'` for the domain and all subdomains.
- `'example.com'` for the exact domain only.

For `behavior: classical`, use complete Clash rules:

```yaml
payload:
  - DOMAIN-SUFFIX,example.com
  - DOMAIN,api.example.com
  - DOMAIN-KEYWORD,example
```

`keyword-proxy.txt` is wired as `behavior: classical` and is the right place for keyword rules such as:

```yaml
payload:
  - DOMAIN-KEYWORD,ssrdog
```

`usa-keyword.txt` is also wired as `behavior: classical`, but routes to `PROXY-USA`.

`singapore-keyword.txt` is wired as `behavior: classical`, but routes to `PROXY-SG`.

For `behavior: ipcidr`, use CIDR entries:

```yaml
payload:
  - 203.0.113.10/32
```

`direct-ip.txt` is wired as `behavior: ipcidr` and routes listed IP ranges to `DIRECT`.
