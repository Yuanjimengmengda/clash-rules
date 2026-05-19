function main(config, profileName) {
  const normalizedGroupNames = [
    "PROXY-GLOBAL",
    "AUTO-GLOBAL",
    "PROXY-USA",
    "AUTO-USA",
    "GLOBAL-PROXY",
    "AUTO-PROXY",
    "USA-PROXY",
  ];

  const proxies = Array.isArray(config.proxies) ? config.proxies : [];
  const proxyGroups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  const proxyNames = unique(
    proxies
      .map((proxy) => proxy && proxy.name)
      .filter((name) => name && !isInformationalProxyName(name)),
  );
  config["proxy-groups"] = [];

  const allCandidates = proxyNames.length ? proxyNames : ["DIRECT"];
  const regionNodes = {
    "PROXY-USA": pickByName(proxyNames, [
      /\b(USA|US|United States|America)\b/i,
      /\u7f8e\u56fd|\u7f8e\u570b/u,
      /\u{1F1FA}\u{1F1F8}/u,
    ]),
  };

  const normalizedGroups = [
    {
      name: "AUTO-GLOBAL",
      type: "url-test",
      proxies: allCandidates,
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 80,
    },
    {
      name: "PROXY-GLOBAL",
      type: "select",
      proxies: unique(["AUTO-GLOBAL", "DIRECT", ...proxyNames].filter(Boolean)),
    },
  ];

  addRegionGroups(normalizedGroups, "PROXY-USA", "AUTO-USA", regionNodes["PROXY-USA"]);

  config["proxy-groups"].unshift(...normalizedGroups);

  config["rule-providers"] = {
    ...(config["rule-providers"] || {}),
    ...customProviders(),
    ...loyalsoldierProviders(),
  };

  config.rules = [
    "DOMAIN-SUFFIX,zhengrenquant.com,DIRECT",
    "RULE-SET,custom-direct,DIRECT",
    "RULE-SET,custom-reject,REJECT",
    "RULE-SET,custom-usa,PROXY-USA",
    "RULE-SET,custom-usa-keyword,PROXY-USA",
    "RULE-SET,custom-keyword-proxy,PROXY-GLOBAL",
    "RULE-SET,custom-global-proxy,PROXY-GLOBAL",
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,lancidr,DIRECT,no-resolve",
    "RULE-SET,reject,REJECT",
    "RULE-SET,tld-not-cn,PROXY-GLOBAL",
    "RULE-SET,gfw,PROXY-GLOBAL",
    "RULE-SET,telegramcidr,PROXY-GLOBAL,no-resolve",
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT,no-resolve",
    "MATCH,DIRECT",
  ];

  return config;
}

function addRegionGroups(groups, regionName, autoName, nodes) {
  if (nodes.length) {
    groups.push({
      name: autoName,
      type: "url-test",
      proxies: nodes,
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 80,
    });
  }

  groups.push({
    name: regionName,
    type: "select",
    proxies: unique([...(nodes.length ? [autoName, ...nodes] : []), "PROXY-GLOBAL", "DIRECT"]),
  });
}

function pickByName(names, patterns) {
  return names.filter((name) => patterns.some((pattern) => pattern.test(name)));
}

function isInformationalProxyName(name) {
  return [
    /\b(\d+(\.\d+)?\s*(GB|MB|TB)|traffic|expire|reset|date|left)\b/i,
    /\u5957\u9910|\u8ba2\u9605|\u5230\u671f|\u91cd\u7f6e|\u6d41\u91cf|\u83b7\u53d6\u65f6\u95f4/u,
  ].some((pattern) => pattern.test(name));
}

function unique(items) {
  return [...new Set(items)];
}

function customProviders() {
  const base = "https://cdn.jsdelivr.net/gh/Yuanjimengmengda/clash-rules@release";
  const provider = (file, behavior = "domain") => ({
    type: "http",
    behavior,
    url: `${base}/${file}.txt`,
    path: `./ruleset/custom/${file}.yaml`,
    interval: 86400,
  });

  return {
    "custom-direct": provider("direct"),
    "custom-reject": provider("reject"),
    "custom-usa": provider("usa"),
    "custom-usa-keyword": provider("usa-keyword", "classical"),
    "custom-keyword-proxy": provider("keyword-proxy", "classical"),
    "custom-global-proxy": provider("global-proxy"),
  };
}

function loyalsoldierProviders() {
  const base = "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release";
  const provider = (name, behavior) => ({
    type: "http",
    behavior,
    url: `${base}/${name}.txt`,
    path: `./ruleset/loyalsoldier/${name}.yaml`,
    interval: 86400,
  });

  return {
    reject: provider("reject", "domain"),
    private: provider("private", "domain"),
    gfw: provider("gfw", "domain"),
    "tld-not-cn": provider("tld-not-cn", "domain"),
    telegramcidr: provider("telegramcidr", "ipcidr"),
    cncidr: provider("cncidr", "ipcidr"),
    lancidr: provider("lancidr", "ipcidr"),
    applications: provider("applications", "classical"),
  };
}
