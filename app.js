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

const ids = Object.keys(DEFAULTS);

function num(id) {
  return Number(document.getElementById(id).value) || 0;
}

function fmt(value) {
  return Math.round(value).toLocaleString("en-US");
}

function status(total, target) {
  if (total === target) return ["Exact", "status-exact"];
  if (total < target) return ["Under", "status-under"];
  return ["Over", "status-over"];
}

function totalRallyCap() {
  return num("withHeroesCap") + num("cyrilleBonus") + num("petBonus");
}

function mainTeam() {
  const cap = totalRallyCap();
  const inf = Math.floor(cap * num("mainInfRatio") / 100);
  const lan = Math.floor(cap * num("mainLanRatio") / 100);
  const mar = Math.max(0, cap - inf - lan);

  return {
    infantry: inf,
    lancer: lan,
    marksman: mar,
    total: inf + lan + mar
  };
}

function calculateBear() {
  const main = mainTeam();
  const totalInf = num("infantry");
  const totalLan = num("lancer");
  const totalMar = num("marksman");
  const count = Math.max(1, Math.min(6, Math.floor(num("joinerCount"))));
  const limit = num("joinerLimit");

  const remainingMarAfterMain = totalMar - main.marksman;
  const marksmanPerJoiner = Math.floor(Math.max(0, remainingMarAfterMain) / count);
  const joinerInfantry = Math.floor(limit * num("joinerInfRatio") / 100);
  const actualMarksman = Math.min(
    marksmanPerJoiner,
    Math.max(0, limit - joinerInfantry)
  );
  const joinerLancer = Math.max(
    0,
    limit - joinerInfantry - actualMarksman
  );

  const teams = [];

  for (let i = 0; i < count; i++) {
    teams.push({
      name: `Joiner ${i + 1}`,
      infantry: joinerInfantry,
      lancer: joinerLancer,
      marksman: actualMarksman,
      total: joinerInfantry + joinerLancer + actualMarksman
    });
  }

  const usedInf = main.infantry + joinerInfantry * count;
  const usedLan = main.lancer + joinerLancer * count;
  const usedMar = main.marksman + actualMarksman * count;

  return {
    main,
    teams,
    remaining: {
      infantry: totalInf - usedInf,
      lancer: totalLan - usedLan,
      marksman: totalMar - usedMar
    }
  };
}

function calculateCJ() {
  const teamCount = 6;
  const cap = totalRallyCap();
  const perInf = Math.floor(num("infantry") / teamCount);
  const perLan = Math.floor(num("lancer") / teamCount);
  const perMar = Math.floor(num("marksman") / teamCount);
  const teams = [];

  for (let i = 0; i < teamCount; i++) {
    let remaining = cap;

    const infantry = Math.min(remaining, perInf);
    remaining -= infantry;

    const lancer = Math.min(remaining, perLan);
    remaining -= lancer;

    const marksman = Math.min(remaining, perMar);

    teams.push({
      name: `CJ ${i + 1}`,
      infantry,
      lancer,
      marksman,
      total: infantry + lancer + marksman
    });
  }

  return {
    teams,
    remaining: {
      infantry: num("infantry") - teams.reduce((sum, t) => sum + t.infantry, 0),
      lancer: num("lancer") - teams.reduce((sum, t) => sum + t.lancer, 0),
      marksman: num("marksman") - teams.reduce((sum, t) => sum + t.marksman, 0)
    }
  };
}

function teamTable(title, rows, target) {
  const body = rows.map(row => {
    const [label, css] = status(row.total, target);
    return `
      <tr>
        <td>${row.name}</td>
        <td data-label="盾兵">${fmt(row.infantry)}</td>
        <td data-label="矛兵">${fmt(row.lancer)}</td>
        <td data-label="射手">${fmt(row.marksman)}</td>
        <td data-label="總數">${fmt(row.total)}</td>
        <td data-label="狀態" class="${css}">${label}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${title}</th>
            <th>盾兵</th>
            <th>矛兵</th>
            <th>射手</th>
            <th>總數</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function remainingTable(data) {
  function cls(v) {
    return v < 0 ? "negative" : "";
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>兵種</th>
            <th>剩餘</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Infantry 盾兵</td><td data-label="剩餘" class="${cls(data.infantry)}">${fmt(data.infantry)}</td></tr>
          <tr><td>Lancer 矛兵</td><td data-label="剩餘" class="${cls(data.lancer)}">${fmt(data.lancer)}</td></tr>
          <tr><td>Marksman 射手</td><td data-label="剩餘" class="${cls(data.marksman)}">${fmt(data.marksman)}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function stackBar(team, label) {
  const total = Math.max(1, team.total);
  const inf = team.infantry / total * 100;
  const lan = team.lancer / total * 100;
  const mar = team.marksman / total * 100;

  return `
    <div class="team-chart">
      <div class="name">
        <span>${label}</span>
        <small>${fmt(team.total)}</small>
      </div>
      <div class="stackbar" aria-label="${label} 兵種比例">
        <span class="seg inf" style="width:${inf}%"></span>
        <span class="seg lan" style="width:${lan}%"></span>
        <span class="seg mar" style="width:${mar}%"></span>
      </div>
      <div class="legend">
        <span class="legend-item"><i class="dot inf"></i>盾 ${Math.round(inf)}%</span>
        <span class="legend-item"><i class="dot lan"></i>矛 ${Math.round(lan)}%</span>
        <span class="legend-item"><i class="dot mar"></i>射 ${Math.round(mar)}%</span>
      </div>
    </div>
  `;
}

function renderTotalChart() {
  const inf = num("infantry");
  const lan = num("lancer");
  const mar = num("marksman");
  const total = inf + lan + mar || 1;

  document.getElementById("totalChart").innerHTML = `
    <div class="chart-title">
      <span>總兵力構成</span>
      <span>${fmt(total)}</span>
    </div>
    <div class="stackbar">
      <span class="seg inf" style="width:${inf / total * 100}%"></span>
      <span class="seg lan" style="width:${lan / total * 100}%"></span>
      <span class="seg mar" style="width:${mar / total * 100}%"></span>
    </div>
    <div class="legend">
      <span class="legend-item"><i class="dot inf"></i>盾 ${fmt(inf)}</span>
      <span class="legend-item"><i class="dot lan"></i>矛 ${fmt(lan)}</span>
      <span class="legend-item"><i class="dot mar"></i>射 ${fmt(mar)}</span>
    </div>
  `;
}

function renderSummary(targetId, items) {
  document.getElementById(targetId).innerHTML = items.map(item => `
    <div class="summary-tile">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </div>
  `).join("");
}

function render() {
  const total = num("infantry") + num("lancer") + num("marksman");
  document.getElementById("totalTroops").textContent = `總兵力 ${fmt(total)}`;
  document.getElementById("playerDisplay").textContent =
    document.getElementById("playerName").value || "未命名";

  const ratioTotal =
    num("mainInfRatio") +
    num("mainLanRatio") +
    num("mainMarRatio");

  document.getElementById("mainRatioWarning").textContent =
    ratioTotal === 100 ? "" : `主隊比例目前合計 ${ratioTotal}%，應為 100%。`;

  renderTotalChart();

  const main = mainTeam();
  document.getElementById("mainResult").innerHTML =
    teamTable(
      document.getElementById("playerName").value || "主隊",
      [{
        name: document.getElementById("playerName").value || "主隊",
        ...main
      }],
      totalRallyCap()
    );

  const bear = calculateBear();
  const bearRows = [
    {
      name: document.getElementById("playerName").value || "主隊",
      ...bear.main
    },
    ...bear.teams
  ];

  renderSummary("bearSummary", [
    { label: "主隊容量", value: fmt(bear.main.total) },
    { label: "Joiner", value: `${bear.teams.length} 隊` },
    { label: "單隊上限", value: fmt(num("joinerLimit")) }
  ]);

  document.getElementById("bearChart").innerHTML =
    bearRows.map(row => stackBar(row, row.name)).join("");

  document.getElementById("bearResult").innerHTML =
    teamTable("Bear Trap", bearRows, num("joinerLimit"));

  document.getElementById("bearRemaining").innerHTML =
    remainingTable(bear.remaining);

  const cj = calculateCJ();

  renderSummary("cjSummary", [
    { label: "CJ 隊伍", value: `${cj.teams.length} 隊` },
    { label: "單隊容量", value: fmt(totalRallyCap()) },
    { label: "總兵力", value: fmt(total) }
  ]);

  document.getElementById("cjChart").innerHTML =
    cj.teams.map(row => stackBar(row, row.name)).join("");

  document.getElementById("cjResult").innerHTML =
    teamTable("CJ", cj.teams, totalRallyCap());

  document.getElementById("cjRemaining").innerHTML =
    remainingTable(cj.remaining);
}

function save() {
  const data = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    data[id] = el.type === "number" ? Number(el.value) : el.value;
  });

  localStorage.setItem("troopRatioSettings", JSON.stringify(data));
}

function load() {
  const raw = localStorage.getItem("troopRatioSettings");
  const data = raw ? JSON.parse(raw) : DEFAULTS;

  ids.forEach(id => {
    if (data[id] !== undefined) {
      document.getElementById(id).value = data[id];
    }
  });
}

function reset() {
  localStorage.removeItem("troopRatioSettings");

  ids.forEach(id => {
    document.getElementById(id).value = DEFAULTS[id];
  });

  render();
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const pages = document.querySelectorAll(".tab-page");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(btn => btn.classList.remove("active"));
      pages.forEach(page => page.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(`tab-${button.dataset.tab}`).classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

ids.forEach(id => {
  document.getElementById(id).addEventListener("input", render);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  save();
  alert("已儲存到此瀏覽器。");
});

document.getElementById("resetBtn").addEventListener("click", reset);

setupTabs();
load();
render();
