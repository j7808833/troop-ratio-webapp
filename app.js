const DEFAULTS = {
  playerName: "心碎小狗",
  withHeroesCap: 147810,
  withoutHeroesCap: 107400,
  cyrilleBonus: 0,
  petBonus: 0,
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

function savedData() {
  const raw = localStorage.getItem("troopRatioSettings");
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
}

function getValue(id) {
  const el = document.getElementById(id);
  if (el) return el.type === "number" ? Number(el.value) || 0 : el.value;
  const data = savedData();
  return data[id] ?? DEFAULTS[id];
}

function fmt(value) {
  return Math.round(value).toLocaleString("en-US");
}

function totalRallyCap() {
  return getValue("withHeroesCap") + getValue("cyrilleBonus") + getValue("petBonus");
}

function mainTeam() {
  const cap = totalRallyCap();
  const inf = Math.floor(cap * getValue("mainInfRatio") / 100);
  const lan = Math.floor(cap * getValue("mainLanRatio") / 100);
  const mar = Math.max(0, cap - inf - lan);
  return { infantry: inf, lancer: lan, marksman: mar, total: inf + lan + mar };
}

function calculateBear() {
  const main = mainTeam();
  const count = Math.max(1, Math.min(6, Math.floor(getValue("joinerCount"))));
  const limit = getValue("joinerLimit");
  const remainingMar = getValue("marksman") - main.marksman;
  const marksmanPerJoiner = Math.floor(Math.max(0, remainingMar) / count);
  const infantry = Math.floor(limit * getValue("joinerInfRatio") / 100);
  const marksman = Math.min(marksmanPerJoiner, Math.max(0, limit - infantry));
  const lancer = Math.max(0, limit - infantry - marksman);

  const teams = Array.from({ length: count }, (_, i) => ({
    name: `Joiner ${i + 1}`,
    infantry,
    lancer,
    marksman,
    total: infantry + lancer + marksman
  }));

  return {
    main,
    teams,
    remaining: {
      infantry: getValue("infantry") - main.infantry - infantry * count,
      lancer: getValue("lancer") - main.lancer - lancer * count,
      marksman: getValue("marksman") - main.marksman - marksman * count
    }
  };
}

function calculateCJ() {
  const count = 6;
  const cap = totalRallyCap();
  const perInf = Math.floor(getValue("infantry") / count);
  const perLan = Math.floor(getValue("lancer") / count);
  const perMar = Math.floor(getValue("marksman") / count);

  const teams = Array.from({ length: count }, (_, i) => {
    let remaining = cap;
    const infantry = Math.min(remaining, perInf);
    remaining -= infantry;
    const lancer = Math.min(remaining, perLan);
    remaining -= lancer;
    const marksman = Math.min(remaining, perMar);
    return { name: `隊伍 ${i + 1}`, infantry, lancer, marksman, total: infantry + lancer + marksman };
  });

  return {
    teams,
    remaining: {
      infantry: getValue("infantry") - teams.reduce((s, t) => s + t.infantry, 0),
      lancer: getValue("lancer") - teams.reduce((s, t) => s + t.lancer, 0),
      marksman: getValue("marksman") - teams.reduce((s, t) => s + t.marksman, 0)
    }
  };
}

function status(total, target) {
  if (total === target) return ["Exact", "status-exact"];
  if (total < target) return ["Under", "status-under"];
  return ["Over", "status-over"];
}

function teamTable(title, rows, target) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${title}</th><th>盾兵</th><th>矛兵</th><th>射手</th><th>總數</th><th>狀態</th></tr></thead>
        <tbody>
          ${rows.map(row => {
            const [label, css] = status(row.total, target);
            return `<tr>
              <td>${row.name}</td>
              <td data-label="盾兵">${fmt(row.infantry)}</td>
              <td data-label="矛兵">${fmt(row.lancer)}</td>
              <td data-label="射手">${fmt(row.marksman)}</td>
              <td data-label="總數">${fmt(row.total)}</td>
              <td data-label="狀態" class="${css}">${label}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function remainingTable(data) {
  const row = (name, value) => `<tr><td>${name}</td><td data-label="剩餘" class="${value < 0 ? "negative" : ""}">${fmt(value)}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr><th>兵種</th><th>剩餘</th></tr></thead><tbody>
    ${row("Infantry 盾兵", data.infantry)}
    ${row("Lancer 矛兵", data.lancer)}
    ${row("Marksman 射手", data.marksman)}
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
      <span class="legend-item"><i class="dot inf"></i>盾 ${Math.round(inf)}%</span>
      <span class="legend-item"><i class="dot lan"></i>矛 ${Math.round(lan)}%</span>
      <span class="legend-item"><i class="dot mar"></i>射 ${Math.round(mar)}%</span>
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

function renderBear() {
  document.getElementById("playerDisplay").textContent = getValue("playerName");
  const bear = calculateBear();
  const rows = [{ name:getValue("playerName"), ...bear.main }, ...bear.teams];

  renderSummary("bearSummary", [
    { label:"主隊容量", value:fmt(bear.main.total) },
    { label:"Joiner", value:`${bear.teams.length} 隊` },
    { label:"單隊上限", value:fmt(getValue("joinerLimit")) }
  ]);

  document.getElementById("bearChart").innerHTML = rows.map(r => stackBar(r, r.name)).join("");
  document.getElementById("bearResult").innerHTML = teamTable("獵熊行動", rows, getValue("joinerLimit"));
  document.getElementById("bearRemaining").innerHTML = remainingTable(bear.remaining);
}

function renderCJ() {
  document.getElementById("playerDisplay").textContent = getValue("playerName");
  const cj = calculateCJ();
  const total = getValue("infantry") + getValue("lancer") + getValue("marksman");

  renderSummary("cjSummary", [
    { label:"瘋狂的喬伊隊伍", value:"6 隊" },
    { label:"單隊容量", value:fmt(totalRallyCap()) },
    { label:"總兵力", value:fmt(total) }
  ]);

  document.getElementById("cjChart").innerHTML = cj.teams.map(r => stackBar(r, r.name)).join("");
  document.getElementById("cjResult").innerHTML = teamTable("瘋狂的喬伊", cj.teams, totalRallyCap());
  document.getElementById("cjRemaining").innerHTML = remainingTable(cj.remaining);
}

if (page === "settings") {
  fillSettingsFromStorage();
  setupSettingsEvents();
  renderSettings();
}
if (page === "bear") renderBear();
if (page === "cj") renderCJ();
