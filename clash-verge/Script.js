function main(config, profileName) {
  const normalizedGroupNames = [
    "GLOBAL-PROXY",
    "AUTO-PROXY",
    "USA-PROXY",
    "AUTO-USA",
    "HK-PROXY",
    "AUTO-HK",
    "JP-PROXY",
    "AUTO-JP",
    "SG-PROXY",
    "AUTO-SG",
    "TW-PROXY",
    "AUTO-TW",
    "KR-PROXY",
    "AUTO-KR",
  ];

  const proxies = Array.isArray(config.proxies) ? config.proxies : [];
  const proxyGroups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  const proxyNames = unique(
    proxies
      .map((proxy) => proxy && proxy.name)
      .filter((name) => name && !isInformationalProxyName(name)),
  );
  const mainGroup = detectMainGroup(proxyGroups, proxyNames);

  config["proxy-groups"] = proxyGroups.filter(
    (group) => group && !normalizedGroupNames.includes(group.name),
  );

  const allCandidates = proxyNames.length ? proxyNames : [mainGroup, "DIRECT"].filter(Boolean);
  const regionNodes = {
    "USA-PROXY": pickByName(proxyNames, [
      /\b(USA|US|United States|America)\b/i,
      /\u7f8e\u56fd|\u7f8e\u570b/u,
      /\u{1F1FA}\u{1F1F8}/u,
    ]),
    "HK-PROXY": pickByName(proxyNames, [
      /\b(HK|Hong Kong)\b/i,
      /\u9999\u6e2f/u,
      /\u{1F1ED}\u{1F1F0}/u,
    ]),
    "JP-PROXY": pickByName(proxyNames, [
      /\b(JP|Japan)\b/i,
      /\u65e5\u672c/u,
      /\u{1F1EF}\u{1F1F5}/u,
    ]),
    "SG-PROXY": pickByName(proxyNames, [
      /\b(SG|Singapore)\b/i,
      /\u65b0\u52a0\u5761/u,
      /\u{1F1F8}\u{1F1EC}/u,
    ]),
    "TW-PROXY": pickByName(proxyNames, [
      /\b(TW|Taiwan)\b/i,
      /\u53f0\u6e7e|\u53f0\u7063/u,
      /\u{1F1F9}\u{1F1FC}/u,
    ]),
    "KR-PROXY": pickByName(proxyNames, [
      /\b(KR|Korea|South Korea)\b/i,
      /\u97e9\u56fd|\u97d3\u570b/u,
      /\u{1F1F0}\u{1F1F7}/u,
    ]),
  };

  const normalizedGroups = [
    {
      name: "AUTO-PROXY",
      type: "url-test",
      proxies: allCandidates,
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 80,
    },
    {
      name: "GLOBAL-PROXY",
      type: "select",
      proxies: unique(["AUTO-PROXY", mainGroup, "DIRECT", ...proxyNames].filter(Boolean)),
    },
  ];

  addRegionGroups(normalizedGroups, "USA-PROXY", "AUTO-USA", regionNodes["USA-PROXY"]);
  addRegionGroups(normalizedGroups, "HK-PROXY", "AUTO-HK", regionNodes["HK-PROXY"]);
  addRegionGroups(normalizedGroups, "JP-PROXY", "AUTO-JP", regionNodes["JP-PROXY"]);
  addRegionGroups(normalizedGroups, "SG-PROXY", "AUTO-SG", regionNodes["SG-PROXY"]);
  addRegionGroups(normalizedGroups, "TW-PROXY", "AUTO-TW", regionNodes["TW-PROXY"]);
  addRegionGroups(normalizedGroups, "KR-PROXY", "AUTO-KR", regionNodes["KR-PROXY"]);

  config["proxy-groups"].unshift(...normalizedGroups);

  config["rule-providers"] = {
    ...(config["rule-providers"] || {}),
    ...customProviders(),
    ...loyalsoldierProviders(),
  };

  config.rules = [
    "RULE-SET,custom-direct,DIRECT",
    "RULE-SET,custom-reject,REJECT",
    "RULE-SET,custom-usa,USA-PROXY",
    "RULE-SET,custom-global-proxy,GLOBAL-PROXY",
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,lancidr,DIRECT,no-resolve",
    "RULE-SET,reject,REJECT",
    "RULE-SET,tld-not-cn,GLOBAL-PROXY",
    "RULE-SET,gfw,GLOBAL-PROXY",
    "RULE-SET,telegramcidr,GLOBAL-PROXY,no-resolve",
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT,no-resolve",
    "MATCH,DIRECT",
  ];

  return config;
}

function detectMainGroup(groups, proxyNames) {
  const usableGroups = groups.filter((group) => {
    if (!group || !group.name || !Array.isArray(group.proxies)) return false;
    const nonDirect = group.proxies.filter((name) => name !== "DIRECT" && name !== "REJECT");
    return nonDirect.length >= 2;
  });

  const selectGroup = usableGroups.find((group) => group.type === "select");
  const fallbackGroup = usableGroups.find((group) => ["url-test", "fallback", "load-balance"].includes(group.type));
  const detected = (selectGroup || fallbackGroup || usableGroups[0] || {}).name;

  return detected || proxyNames[0] || "DIRECT";
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
    proxies: unique([...(nodes.length ? [autoName, ...nodes] : []), "GLOBAL-PROXY", "DIRECT"]),
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
  const provider = (file) => ({
    type: "http",
    behavior: "domain",
    url: `${base}/${file}.txt`,
    path: `./ruleset/custom/${file}.yaml`,
    interval: 86400,
  });

  return {
    "custom-direct": provider("direct"),
    "custom-reject": provider("reject"),
    "custom-usa": provider("usa"),
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
