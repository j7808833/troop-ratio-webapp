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

  // 最後一種兵直接用剩餘量，避免百分比乘法的四捨五入誤差。
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

  const remainingInfAfterMain = totalInf - main.infantry;
  const remainingLanAfterMain = totalLan - main.lancer;
  const remainingMarAfterMain = totalMar - main.marksman;

  // 原 Excel 的核心思想：剩餘射手平均分配給所有 Joiner。
  const marksmanPerJoiner = Math.floor(Math.max(0, remainingMarAfterMain) / count);

  const joinerInfantry = Math.floor(limit * num("joinerInfRatio") / 100);

  // 每隊先放盾兵，再放平均射手，最後用矛兵補滿。
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
    remaining -= marksman;

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
        <td>${fmt(row.infantry)}</td>
        <td>${fmt(row.lancer)}</td>
        <td>${fmt(row.marksman)}</td>
        <td>${fmt(row.total)}</td>
        <td class="${css}">${label}</td>
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
            <th>Remaining Allocatable</th>
            <th>數量</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Infantry 盾兵</td><td class="${cls(data.infantry)}">${fmt(data.infantry)}</td></tr>
          <tr><td>Lancer 矛兵</td><td class="${cls(data.lancer)}">${fmt(data.lancer)}</td></tr>
          <tr><td>Marksman 射手</td><td class="${cls(data.marksman)}">${fmt(data.marksman)}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function render() {
  const total = num("infantry") + num("lancer") + num("marksman");
  document.getElementById("totalTroops").textContent =
    `總兵力：${fmt(total)}`;

  const ratioTotal =
    num("mainInfRatio") +
    num("mainLanRatio") +
    num("mainMarRatio");

  document.getElementById("mainRatioWarning").textContent =
    ratioTotal === 100 ? "" : `主隊比例目前合計 ${ratioTotal}%，應為 100%。`;

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
  document.getElementById("bearResult").innerHTML =
    teamTable("Bear Trap", [
      {
        name: document.getElementById("playerName").value || "主隊",
        ...bear.main
      },
      ...bear.teams
    ], num("joinerLimit"));

  document.getElementById("bearRemaining").innerHTML =
    remainingTable(bear.remaining);

  const cj = calculateCJ();
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

ids.forEach(id => {
  document.getElementById(id).addEventListener("input", render);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  save();
  alert("已儲存到此瀏覽器。");
});

document.getElementById("resetBtn").addEventListener("click", reset);

load();
render();
