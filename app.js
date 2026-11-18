const DEFAULTS = {
  playerName: "心碎小狗",
  withHeroesCap: 147810,
  withoutHeroesCap: 107400,
  cyrilleBonus: 0,
  petBonus: 0,
  cyrilleRallyBonus: 0,
  petRallyBonus: 0,
  ministerBonus: 0,
  deploymentBoost: 0,
  marchQueueCount: 6,
  joinerLimit: 97000,
  joinerCount: 5,
  infantry: 278686,
  lancer: 230332,
  marksman: 314377,
  mainInfRatio: 50,
  mainLanRatio: 20,
  mainMarRatio: 30,
  joinerInfRatio: 10,
  heroLessJoinerCount: 1
};

const page = document.body.dataset.page || "settings";
const language = localStorage.getItem("troopRatioLanguage") || "en";

const T = {
  en: {
    player: "Player",
    settings: "Settings",
    bear: "Bear Hunt",
    cj: "Crazy Joe",
    detail: "Detailed Configuration",
    remainingTitle: "Remaining Troops",
    bearHint: "The main team uses troops first. Remaining Marksmen are divided among Joiners; each Joiner receives the specified Infantry first, then Lancers fill the remaining capacity.",
    cjHint: "Divide each troop type by the selected March Queue count, then fill each team in the order Infantry → Lancer → Marksman.",
    mainCapacity: "Main Team Capacity",
    joiner: "Joiner",
    teamLimit: "Team Limit",
    cjTeams: "Crazy Joe Teams",
    teamCapacity: "Team Capacity",
    totalTroops: "Total Troops",
    team: "Team",
    infantry: "Infantry",
    lancer: "Lancer",
    marksman: "Marksman",
    total: "Total",
    status: "Status",
    remaining: "Remaining",
    exact: "Exact",
    under: "Under",
    over: "Over",
    mainTeam: "Main Team",
    marchQueue: "March Queue",
    heroLess: "Hero-less Teams",
    heroJoiner: "Hero Joiner",
    heroLessJoiner: "Hero-less Joiner"
  },
  zh: {
    player: "玩家",
    settings: "設定",
    bear: "獵熊行動",
    cj: "瘋狂的喬伊",
    detail: "詳細配置",
    remainingTitle: "剩餘可分配兵力",
    bearHint: "主隊先使用兵力；剩餘射手平均分配給 Joiner；每隊先放指定盾兵，再以矛兵補滿。",
    cjHint: "依所選出征隊數平均分配三種兵，再依「盾 → 矛 → 射」填入單隊容量。",
    mainCapacity: "主隊容量",
    joiner: "Joiner",
    teamLimit: "單隊上限",
    cjTeams: "瘋狂的喬伊隊伍",
    teamCapacity: "單隊容量",
    totalTroops: "總兵力",
    team: "隊伍",
    infantry: "盾兵",
    lancer: "矛兵",
    marksman: "射手",
    total: "總數",
    status: "狀態",
    remaining: "剩餘",
    exact: "剛好",
    under: "不足",
    over: "超出",
    mainTeam: "主隊",
    marchQueue: "出征隊數",
    heroLess: "無英雄隊數",
    heroJoiner: "有英雄 Joiner",
    heroLessJoiner: "無英雄 Joiner"
  }
}[language];

document.documentElement.lang = language === "en" ? "en" : "zh-Hant";

function savedData() {
  const raw = localStorage.getItem("troopRatioSettings");
  const data = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  if (data.playerName === "心碎") {
    data.playerName = "心碎小狗";
    localStorage.setItem("troopRatioSettings", JSON.stringify(data));
  }
  return data;
}

function getValue(id) {
  const el = document.getElementById(id);
  if (el) return el.type === "number" ? Number(el.value) || 0 : el.value;
  const data = savedData();
  const v = data[id] ?? DEFAULTS[id];
  return typeof DEFAULTS[id] === "number" ? Number(v) || 0 : v;
}

function fmt(value) {
  return Math.round(value).toLocaleString("en-US");
}

function marchCapacity(withHeroes = true) {
  const base = withHeroes
    ? getValue("withHeroesCap") + getValue("cyrilleBonus")
    : getValue("withoutHeroesCap");

  const fixedCap =
    base +
    getValue("petBonus") +
    getValue("ministerBonus");

  return Math.floor(fixedCap * (1 + getValue("deploymentBoost") / 100));
}

function totalRallyCap() {
  return marchCapacity(true);
}

function mainTeam() {
  const cap = marchCapacity(true);
  const inf = Math.floor(cap * getValue("mainInfRatio") / 100);
  const lan = Math.floor(cap * getValue("mainLanRatio") / 100);
  const mar = Math.max(0, cap - inf - lan);
  return { infantry: inf, lancer: lan, marksman: mar, total: inf + lan + mar };
}

function calculateBear() {
  const queueCount = Math.max(0, Math.min(6, Math.floor(getValue("marchQueueCount"))));

  if (queueCount === 0) {
    return {
      main: null,
      teams: [],
      remaining: {
        infantry: getValue("infantry"),
        lancer: getValue("lancer"),
        marksman: getValue("marksman")
      }
    };
  }

  const main = mainTeam();
  const count = Math.max(0, queueCount - 1);
  const heroLessCount = Math.min(count, Math.max(0, Math.floor(getValue("heroLessJoinerCount"))));
  const heroCount = count - heroLessCount;
  const remainingMar = getValue("marksman") - main.marksman;
  const marksmanPerJoiner = count > 0
    ? Math.floor(Math.max(0, remainingMar) / count)
    : 0;

  const teams = Array.from({ length: count }, (_, i) => {
    const heroLess = i >= heroCount;
    const personalCap = marchCapacity(!heroLess);
    const limit = Math.min(getValue("joinerLimit"), personalCap);
    const infantry = Math.floor(limit * getValue("joinerInfRatio") / 100);
    const marksman = Math.min(marksmanPerJoiner, Math.max(0, limit - infantry));
    const lancer = Math.max(0, limit - infantry - marksman);

    return {
      name: heroLess
        ? `${T.heroLessJoiner} ${i - heroCount + 1}`
        : `${T.heroJoiner} ${i + 1}`,
      infantry,
      lancer,
      marksman,
      total: infantry + lancer + marksman,
      heroLess
    };
  });

  return {
    main,
    teams,
    remaining: {
      infantry: getValue("infantry") - main.infantry - teams.reduce((sum, t) => sum + t.infantry, 0),
      lancer: getValue("lancer") - main.lancer - teams.reduce((sum, t) => sum + t.lancer, 0),
      marksman: getValue("marksman") - main.marksman - teams.reduce((sum, t) => sum + t.marksman, 0)
    }
  };
}

function calculateCJ() {
  const count = Math.max(0, Math.min(6, Math.floor(getValue("marchQueueCount"))));
  const heroLessCount = Math.min(count, Math.max(0, Math.floor(getValue("heroLessJoinerCount"))));
  const heroCount = count - heroLessCount;

  const perInf = count > 0 ? Math.floor(getValue("infantry") / count) : 0;
  const perLan = count > 0 ? Math.floor(getValue("lancer") / count) : 0;
  const perMar = count > 0 ? Math.floor(getValue("marksman") / count) : 0;

  const teams = Array.from({ length: count }, (_, i) => {
    const heroLess = i >= heroCount;
    const cap = marchCapacity(!heroLess);
    let remaining = cap;
    const infantry = Math.min(remaining, perInf);
    remaining -= infantry;
    const lancer = Math.min(remaining, perLan);
    remaining -= lancer;
    const marksman = Math.min(remaining, perMar);

    return {
      name: `${T.team} ${i + 1}`,
      infantry,
      lancer,
      marksman,
      total: infantry + lancer + marksman,
      heroLess
    };
  });

  return {
    teams,
    remaining: {
      infantry: getValue("infantry") - teams.reduce((sum, t) => sum + t.infantry, 0),
      lancer: getValue("lancer") - teams.reduce((sum, t) => sum + t.lancer, 0),
      marksman: getValue("marksman") - teams.reduce((sum, t) => sum + t.marksman, 0)
    }
  };
}

function status(total, target) {
  if (total === target) return [T.exact, "status-exact"];
  if (total < target) return [T.under, "status-under"];
  return [T.over, "status-over"];
}

function teamTable(title, rows, target) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${title}</th><th>${T.infantry}</th><th>${T.lancer}</th><th>${T.marksman}</th><th>${T.total}</th><th>${T.status}</th></tr></thead>
        <tbody>
          ${rows.map(row => {
            const [label, css] = status(row.total, target);
            return `<tr>
              <td>${row.name}</td>
              <td data-label="${T.infantry}">${fmt(row.infantry)}</td>
              <td data-label="${T.lancer}">${fmt(row.lancer)}</td>
              <td data-label="${T.marksman}">${fmt(row.marksman)}</td>
              <td data-label="${T.total}">${fmt(row.total)}</td>
              <td data-label="${T.status}" class="${css}">${label}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function remainingTable(data) {
  const row = (name, value) => `<tr><td>${name}</td><td data-label="${T.remaining}" class="${value < 0 ? "negative" : ""}">${fmt(value)}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr><th>${language === "en" ? "Troop Type" : "兵種"}</th><th>${T.remaining}</th></tr></thead><tbody>
    ${row(T.infantry, data.infantry)}
    ${row(T.lancer, data.lancer)}
    ${row(T.marksman, data.marksman)}
  </tbody></table></div>`;
}

function stackBar(team, label) {
  const total = Math.max(1, team.total);
  const inf = team.infantry / total * 100;
  const lan = team.lancer / total * 100;
  const mar = team.marksman / total * 100;

  return `<div class="team-chart">
    <div class="name"><span>${label}</span><small>${fmt(team.total)}</small></div>
    <div class="stackbar">
      <span class="seg inf" style="width:${inf}%"></span>
      <span class="seg lan" style="width:${lan}%"></span>
      <span class="seg mar" style="width:${mar}%"></span>
    </div>
    <div class="legend">
      <span class="legend-item"><i class="dot inf"></i>${language === "en" ? "Inf" : "盾"} ${Math.round(inf)}%</span>
      <span class="legend-item"><i class="dot lan"></i>${language === "en" ? "Lan" : "矛"} ${Math.round(lan)}%</span>
      <span class="legend-item"><i class="dot mar"></i>${language === "en" ? "Mar" : "射"} ${Math.round(mar)}%</span>
    </div>
  </div>`;
}

function renderSummary(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(x => `<div class="summary-tile"><span>${x.label}</span><strong>${x.value}</strong></div>`).join("");
}

function fillSettingsFromStorage() {
  const data = savedData();

  Object.keys(DEFAULTS).forEach(id => {
    const el = document.getElementById(id);
    if (el && data[id] !== undefined) {
      el.value = data[id];
    }
  });
}

function renderSettings() {
  const total = getValue("infantry") + getValue("lancer") + getValue("marksman");
  document.getElementById("totalTroops").textContent = `總兵力 ${fmt(total)}`;
  document.getElementById("playerDisplay").textContent = getValue("playerName") || "未命名";

  const inf = getValue("infantry");
  const lan = getValue("lancer");
  const mar = getValue("marksman");
  const all = inf + lan + mar || 1;

  document.getElementById("totalChart").innerHTML = `
    <div class="chart-title"><span>總兵力構成</span><span>${fmt(all)}</span></div>
    <div class="stackbar">
      <span class="seg inf" style="width:${inf / all * 100}%"></span>
      <span class="seg lan" style="width:${lan / all * 100}%"></span>
      <span class="seg mar" style="width:${mar / all * 100}%"></span>
    </div>
    <div class="legend">
      <span class="legend-item"><i class="dot inf"></i>盾 ${fmt(inf)}</span>
      <span class="legend-item"><i class="dot lan"></i>矛 ${fmt(lan)}</span>
      <span class="legend-item"><i class="dot mar"></i>射 ${fmt(mar)}</span>
    </div>`;

  const ratio =
    getValue("mainInfRatio") +
    getValue("mainLanRatio") +
    getValue("mainMarRatio");

  document.getElementById("mainRatioWarning").textContent =
    ratio === 100 ? "" : `主隊比例目前合計 ${ratio}%，應為 100%。`;

  const main = mainTeam();
  document.getElementById("mainResult").innerHTML =
    teamTable(
      getValue("playerName") || "主隊",
      [{ name: getValue("playerName") || "主隊", ...main }],
      totalRallyCap()
    );
}

function saveCurrentSettings() {
  const data = {};

  Object.keys(DEFAULTS).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      data[id] = el.type === "number" ? Number(el.value) : el.value;
    }
  });

  localStorage.setItem("troopRatioSettings", JSON.stringify(data));
}

function setupSettingsEvents() {
  document.querySelectorAll("input").forEach(el => {
    el.addEventListener("input", () => {
      saveCurrentSettings();
      renderSettings();
    });
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    saveCurrentSettings();
    renderSettings();
    alert("設定已儲存。");
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem("troopRatioSettings");
    fillSettingsFromStorage();
    renderSettings();
  });
}

function applyActivityLanguage() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("playerLabel", T.player);
  set("navSettings", T.settings);
  set("navBear", T.bear);
  set("navCj", T.cj);
  set("detailTitle", T.detail);
  set("remainingTitle", T.remainingTitle);

  if (page === "bear") {
    document.title = language === "en" ? "Troop Ratio | Bear Hunt" : "Troop Ratio｜獵熊行動";
    set("bannerActivityTitle", language === "en" ? "Bear Hunt" : "獵熊行動（Bear Hunt）");
    set("bearHint", T.bearHint);
  }

  if (page === "cj") {
    document.title = language === "en" ? "Troop Ratio | Crazy Joe" : "Troop Ratio｜瘋狂的喬伊";
    set("bannerActivityTitle", language === "en" ? "Crazy Joe" : "瘋狂的喬伊（Crazy Joe）");
    set("cjHint", T.cjHint);
  }
}

function renderBear() {
  document.getElementById("playerDisplay").textContent = getValue("playerName");
  const bear = calculateBear();
  const rows = bear.main
    ? [{ name:getValue("playerName"), ...bear.main }, ...bear.teams]
    : [];

  renderSummary("bearSummary", [
    { label:T.marchQueue, value:String(getValue("marchQueueCount")) },
    { label:T.heroLess, value:String(Math.min(bear.teams.length, getValue("heroLessJoinerCount"))) },
    { label:T.mainCapacity, value:bear.main ? fmt(bear.main.total) : "0" },
    { label:T.joiner, value:language === "en" ? `${bear.teams.length} teams` : `${bear.teams.length} 隊` }
  ]);

  document.getElementById("bearChart").innerHTML = rows.map(r => stackBar(r, r.name)).join("");
  document.getElementById("bearResult").innerHTML = rows.length
    ? teamTable(T.bear, rows, getValue("joinerLimit"))
    : "";
  document.getElementById("bearRemaining").innerHTML = remainingTable(bear.remaining);
}

function renderCJ() {
  document.getElementById("playerDisplay").textContent = getValue("playerName");
  const cj = calculateCJ();
  const total = getValue("infantry") + getValue("lancer") + getValue("marksman");

  renderSummary("cjSummary", [
    { label:T.marchQueue, value:String(getValue("marchQueueCount")) },
    { label:T.heroLess, value:String(Math.min(cj.teams.length, getValue("heroLessJoinerCount"))) },
    { label:T.cjTeams, value:language === "en" ? `${cj.teams.length} teams` : `${cj.teams.length} 隊` },
    { label:T.totalTroops, value:fmt(total) }
  ]);

  document.getElementById("cjChart").innerHTML = cj.teams.map(r => stackBar(r, r.name)).join("");
  document.getElementById("cjResult").innerHTML = teamTable(T.cj, cj.teams, totalRallyCap());
  document.getElementById("cjRemaining").innerHTML = remainingTable(cj.remaining);
}

if (page === "settings") {
  fillSettingsFromStorage();
  setupSettingsEvents();
  renderSettings();
}
if (page === "bear") {
  applyActivityLanguage();
  renderBear();
}
if (page === "cj") {
  applyActivityLanguage();
  renderCJ();
}
