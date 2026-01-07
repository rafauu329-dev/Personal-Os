import { appState, saveState } from "../state.js";
import { openModal, showToast, saveStateDebounced } from "../utils.js";

// --- Helper for Back Button ---
function renderBackBtn() {
  return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.navigateTo('tools')">⬅ Tools</button>`;
}

/* =========================================
   EXERCISE LOGIC (Original UI from app.js)
   ========================================= */

export function renderExercise(container) {
  // --- INIT & MIGRATION ---
  // รองรับข้อมูลเก่าที่เป็น Array อย่างเดียว หรือข้อมูลใหม่ที่เป็น Object
  if (!appState.tools.exercise) {
    appState.tools.exercise = { logs: [], profile: {} };
  } else if (Array.isArray(appState.tools.exercise)) {
    appState.tools.exercise = {
      logs: [...appState.tools.exercise],
      profile: {},
    };
  }
  const exData = appState.tools.exercise;

  // ตั้งค่า Profile & Goals เริ่มต้น
  if (!exData.profile || Object.keys(exData.profile).length === 0) {
    exData.profile = {
      weight: "",
      height: "",
      age: "",
      gender: "m",
      activity: 1.2,
      goalMin: 150,
      goalCal: 2000,
    };
  }
  if (!exData.profile.goalMin) exData.profile.goalMin = 150;
  if (!exData.profile.goalCal) exData.profile.goalCal = 2000;

  const logs = exData.logs || [];
  const profile = exData.profile;

  // คำนวณ Stats (Weekly)
  const weeklyLogs = logs.filter(
    (l) =>
      new Date(l.date) >= new Date(new Date().setDate(new Date().getDate() - 7))
  );
  const totalMins = weeklyLogs.reduce(
    (acc, curr) => acc + parseInt(curr.duration || 0),
    0
  );
  const totalCals = weeklyLogs.reduce(
    (acc, curr) => acc + parseInt(curr.cals || 0),
    0
  );

  const minPercent = Math.min((totalMins / profile.goalMin) * 100, 100);
  const calPercent = Math.min((totalCals / profile.goalCal) * 100, 100);

  // คำนวณ Body Metrics
  let bmi = 0,
    bmr = 0,
    tdee = 0;
  if (profile.weight && profile.height && profile.age) {
    const w = parseFloat(profile.weight),
      h = parseFloat(profile.height),
      a = parseFloat(profile.age);
    bmi = w / (h / 100) ** 2;
    bmr = 10 * w + 6.25 * h - 5 * a + (profile.gender === "m" ? 5 : -161);
    tdee = bmr * parseFloat(profile.activity);
  }

  container.innerHTML = `
        <div class="ex-header">${renderBackBtn()}<div class="section-tag bg-red" style="margin:0;">Active Life</div></div>

        <div class="paper-card ex-dash-card" style="padding-bottom: 25px;">
             <div class="ex-dash-content" style="margin-bottom:5px;">
                <div><div class="ex-goal-label">TIME GOAL</div><div class="ex-big-stat"><span id="ex-val-min">${totalMins}</span> <span class="ex-sub-stat">/ <span id="ex-goal-min-display">${
    profile.goalMin
  }</span> min</span></div></div>
                <div class="u-text-right"><div id="ex-percent-min" class="u-text-xl u-font-black" style="color:var(--color-red);">${Math.round(
                  minPercent
                )}%</div></div>
            </div>
            <div class="p-bar" style="height:10px; background:#e0e0e0; margin-bottom:20px;">
                <div id="ex-bar-min" class="p-fill bg-red" style="width:${minPercent}%;"></div>
            </div>

            <div class="ex-dash-content" style="margin-bottom:5px;">
                <div><div class="ex-goal-label">BURN GOAL</div><div class="ex-big-stat"><span id="ex-val-cal">${totalCals.toLocaleString()}</span> <span class="ex-sub-stat">/ <span id="ex-goal-cal-display">${parseInt(
    profile.goalCal
  ).toLocaleString()}</span> kcal</span></div></div>
                <div class="u-text-right"><div id="ex-percent-cal" class="u-text-xl u-font-black" style="color:var(--color-orange);">🔥 ${Math.round(
                  calPercent
                )}%</div></div>
            </div>
            <div class="p-bar" style="height:10px; background:#e0e0e0;">
                <div id="ex-bar-cal" class="p-fill bg-orange" style="width:${calPercent}%;"></div>
            </div>
        </div>

        <div class="paper-card ex-metrics-card">
            <div class="ex-metrics-header"><span> Body & Goals </span><span class="u-text-sm u-text-muted" style="font-weight:normal;">(ตั้งค่าเป้าหมาย)</span></div>

            <div class="u-text-xs u-font-bold u-text-muted u-mb-xs">- สัดส่วนร่างกาย</div>
            <div class="ex-input-grid u-mb-lg">
                <input type="number" id="m-weight" class="input-std ex-input-metric" placeholder="กก." value="${
                  profile.weight
                }" oninput="App.saveExProfile()">
                <input type="number" id="m-height" class="input-std ex-input-metric" placeholder="สูง." value="${
                  profile.height
                }" oninput="App.saveExProfile()">
                <input type="number" id="m-age" class="input-std ex-input-metric" placeholder="ปี" value="${
                  profile.age
                }" oninput="App.saveExProfile()">
                <select id="m-gender" class="input-std ex-input-metric" onchange="App.saveExProfile()" style="padding:0;">
                    <option value="m" ${
                      profile.gender === "m" ? "selected" : ""
                    }>ชาย</option>
                    <option value="f" ${
                      profile.gender === "f" ? "selected" : ""
                    }>หญิง</option>
                </select>
            </div>

            <div class="u-text-xs u-font-bold u-text-muted u-mb-xs"> - เป้าหมายต่อสัปดาห์</div>
            <div class="ex-input-grid" style="grid-template-columns: 1fr 1fr;">
                <div>
                    <input type="number" id="m-goal-min" class="input-std u-text-center" placeholder="นาที" value="${
                      profile.goalMin
                    }" oninput="App.saveExProfile()">
                    <div class="u-text-center u-text-xs u-text-muted u-mt-xs">นาที / สัปดาห์</div>
                </div>
                <div>
                    <input type="number" id="m-goal-cal" class="input-std u-text-center" placeholder="แคล" value="${
                      profile.goalCal
                    }" oninput="App.saveExProfile()">
                     <div class="u-text-center u-text-xs u-text-muted u-mt-xs">Kcal / สัปดาห์</div>
                </div>
            </div>

            <div class="ex-results-container u-mt-lg" style="padding-top:15px; border-top:1px dashed #ccc;">
                <div class="ex-result-box"><div class="ex-result-label">BMI</div><div id="res-bmi" class="ex-result-value" style="color:${
                  bmi > 25 || bmi < 18.5 ? "var(--danger)" : "var(--success)"
                }">${bmi ? bmi.toFixed(1) : "-"}</div></div>
                <div class="ex-result-box"><div class="ex-result-label">BMR</div><div id="res-bmr" class="ex-result-value">${
                  bmr ? Math.round(bmr) : "-"
                }</div></div>
                <div class="ex-result-box"><div class="ex-result-label">TDEE</div><div id="res-tdee" class="ex-result-value" style="color:var(--color-red)">${
                  tdee ? Math.round(tdee) : "-"
                }</div></div>
            </div>
        </div>

        <div class="paper-card ex-form-card">
            <div class="u-font-black u-mb-sm"> Record Activity </div>
            <div class="ex-presets-area">
                ${[
                  ["วิ่ง", 30, 300],
                  ["เวท", 45, 200],
                  ["เดิน", 20, 80],
                  ["HIIT", 25, 300],
                  ["โยคะ", 60, 150],
                ]
                  .map(
                    (p) =>
                      `<button class="ex-preset-chip" onclick="document.getElementById('ex-type').value='${p[0]}'; document.getElementById('ex-dur').value=${p[1]}; document.getElementById('ex-cal').value=${p[2]};"> ${p[0]} </button>`
                  )
                  .join("")}
            </div>
            <div class="ex-entry-grid">
                <div class="input-group">
    <div class="field">
        <label for="ex-type">ประเภทกิจกรรม</label>
        <input type="text" id="ex-type" class="input-std" placeholder="เช่น เวท, วิ่ง, ว่ายน้ำ">
    </div>

    <div class="field">
        <label for="ex-dur">ระยะเวลา (นาที)</label>
        <input type="number" id="ex-dur" class="input-std" placeholder="นาที">
    </div>

    <div class="field">
        <label for="ex-cal">พลังงานที่เผาผลาญ (แคล)</label>
        <input type="number" id="ex-cal" class="input-std" placeholder="Cal">
    </div>
</div>
            </div>
            <button class="btn-action u-w-full bg-red" onclick="App.addEx()">บันทึกกิจกรรม</button>
        </div>

        <div class="ex-history-section">
            <div class="ex-history-title"> RECENT LOGS </div>
            <div class="ex-history-list">
                ${logs
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((l) => {
                    let icon = "💪";
                    const t = l.type || "";
                    if (t.includes("วิ่ง")) icon = "🏃🏻";
                    else if (t.includes("เดิน")) icon = "🚶🏻";
                    else if (t.includes("โยคะ")) icon = "🧘🏻";
                    else if (t.includes("น้ำ") || t.includes("ว่าย"))
                      icon = "🏊🏻";
                    else if (t.includes("เวท") || t.includes("weight"))
                      icon = "🏋🏻";
                    else if (t.includes("จักรยาน") || t.includes("ปั่น"))
                      icon = "🚴🏻";
                    else if (t.includes("HIIT") || t.includes("คาร์ดิโอ"))
                      icon = "💦";

                    return `
                    <div class="ex-log-item">
                        <div class="ex-log-icon">${icon}</div>
                        <div class="ex-log-details">
                            <div class="ex-log-title">${l.type}</div>
                            <div class="ex-log-meta">⏱ ${
                              l.duration
                            } นาที • 🔥 ${l.cals || 0} cal</div>
                        </div>
                        <div class="ex-log-actions">
                            <div class="ex-log-date">${new Date(
                              l.date
                            ).toLocaleDateString("th-TH")}</div>
                            <button class="ex-btn-delete" onclick="App.delEx('${
                              l.id
                            }')"> X </button>
                        </div>
                    </div>`;
                  })
                  .join("")}
                ${
                  !logs.length
                    ? `<div class="u-text-center u-p-lg" style="color:#ccc;"> ยังไม่มีประวัติ </div>`
                    : ""
                }
            </div>
        </div>
    `;
}

// --- Interactive Functions ---

export function saveExProfile() {
  // 1. เก็บค่าลง State
  const profile = {
    weight: document.getElementById("m-weight").value,
    height: document.getElementById("m-height").value,
    age: document.getElementById("m-age").value,
    gender: document.getElementById("m-gender").value,
    goalMin: document.getElementById("m-goal-min").value || 150,
    goalCal: document.getElementById("m-goal-cal").value || 2000,
    activity: 1.2,
  };
  appState.tools.exercise.profile = profile;
  saveStateDebounced(); // ใช้ตัวหน่วงเวลา

  // 2. คำนวณ BMI/BMR/TDEE สดๆ เพื่ออัปเดต UI ทันที
  let bmi = 0,
    bmr = 0,
    tdee = 0;
  if (profile.weight && profile.height && profile.age) {
    const w = parseFloat(profile.weight),
      h = parseFloat(profile.height),
      a = parseFloat(profile.age);
    bmi = w / (h / 100) ** 2;
    bmr = 10 * w + 6.25 * h - 5 * a + (profile.gender === "m" ? 5 : -161);
    tdee = bmr * parseFloat(profile.activity);
  }

  // 3. อัปเดตตัวเลข BMI บนจอ
  const elBMI = document.getElementById("res-bmi");
  if (elBMI) {
    elBMI.textContent = bmi ? bmi.toFixed(1) : "-";
    elBMI.style.color =
      bmi > 25 || bmi < 18.5 ? "var(--danger)" : "var(--success)";
  }
  if (document.getElementById("res-bmr"))
    document.getElementById("res-bmr").textContent = bmr
      ? Math.round(bmr)
      : "-";
  if (document.getElementById("res-tdee"))
    document.getElementById("res-tdee").textContent = tdee
      ? Math.round(tdee)
      : "-";

  // 4. คำนวณ Progress Bar สดๆ
  const logs = appState.tools.exercise.logs || [];
  const weeklyLogs = logs.filter(
    (l) =>
      new Date(l.date) >= new Date(new Date().setDate(new Date().getDate() - 7))
  );
  const totalMins = weeklyLogs.reduce(
    (acc, curr) => acc + parseInt(curr.duration || 0),
    0
  );
  const totalCals = weeklyLogs.reduce(
    (acc, curr) => acc + parseInt(curr.cals || 0),
    0
  );

  const minPercent = Math.min((totalMins / profile.goalMin) * 100, 100);
  const calPercent = Math.min((totalCals / profile.goalCal) * 100, 100);

  // 5. อัปเดตหลอดพลังและเป้าหมายบนจอ
  if (document.getElementById("ex-goal-min-display"))
    document.getElementById("ex-goal-min-display").textContent =
      profile.goalMin;
  if (document.getElementById("ex-percent-min"))
    document.getElementById("ex-percent-min").textContent =
      Math.round(minPercent) + "%";
  if (document.getElementById("ex-bar-min"))
    document.getElementById("ex-bar-min").style.width = minPercent + "%";

  if (document.getElementById("ex-goal-cal-display"))
    document.getElementById("ex-goal-cal-display").textContent = parseInt(
      profile.goalCal
    ).toLocaleString();
  if (document.getElementById("ex-percent-cal"))
    document.getElementById("ex-percent-cal").textContent =
      "🔥 " + Math.round(calPercent) + "%";
  if (document.getElementById("ex-bar-cal"))
    document.getElementById("ex-bar-cal").style.width = calPercent + "%";
}

export function addEx() {
  const type = document.getElementById("ex-type").value.trim();
  const dur = document.getElementById("ex-dur").value;
  const cal = document.getElementById("ex-cal").value;

  if (!type || !dur) {
    showToast("กรอกชื่อกิจกรรมและเวลาด้วยนะครับ", "error");
    return;
  }

  const newLog = {
    id: Date.now(),
    date: new Date(),
    type: type,
    duration: parseInt(dur),
    cals: parseInt(cal) || 0,
  };

  if (!appState.tools.exercise.logs) {
    appState.tools.exercise.logs = [];
  }
  appState.tools.exercise.logs.push(newLog);

  saveState();
  renderExercise(document.getElementById("content-area"));
  showToast("เยี่ยมมาก! บันทึกเรียบร้อย 💪", "success");
}

export function delEx(id) {
  openModal("ลบประวัติ?", "ต้องการลบประวัติการออกกำลังกายนี้ไหม?", () => {
    appState.tools.exercise.logs = appState.tools.exercise.logs.filter(
      (x) => x.id.toString() !== id.toString()
    );
    saveState();
    renderExercise(document.getElementById("content-area"));
    showToast("ลบประวัติเรียบร้อย", "info");
    return true;
  });
}
