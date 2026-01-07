import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";
import { TimeSystem } from "../services/time.js";

/* =========================================
   WEEKLY REVIEW (Original UI from app.js)
   ========================================= */

export function renderReviews(container) {
  if (!appState.reviews) appState.reviews = [];

  container.innerHTML = `
            <div class="paper-card u-mb-lg">
              <div class="section-tag">Weekly Review</div>
              <div class="u-mb-md"><label class="u-font-bold">1. สัปดาห์นี้ทำอะไรสำเร็จบ้าง?</label><textarea id="rv-q1" class="input-std" style="height:80px;"></textarea></div>
              <div class="u-mb-md"><label class="u-font-bold">2. สิ่งที่ต้องปรับปรุง?</label><textarea id="rv-q2" class="input-std" style="height:80px;"></textarea></div>
              <div class="u-mb-md"><label class="u-font-bold">3. โฟกัสสัปดาห์หน้า?</label><textarea id="rv-q3" class="input-std" style="height:80px;"></textarea></div>
              <button class="btn-main u-w-full" onclick="App.saveRev()">บันทึกทบทวน</button>
            </div>
            <div class="paper-card"><div class="section-tag">History</div>
              ${appState.reviews
                .slice()
                .reverse()
                .map(
                  (r, i) =>
                    `<div class="u-p-sm u-cursor-pointer" style="border-bottom:1px solid var(--border-soft);" onclick="App.showRev(${i})">
                  <div class="u-font-bold">Week ${r.w} / ${
                      r.y
                    }</div><div class="u-text-sm u-text-muted">${new Date(
                      r.d
                    ).toLocaleDateString("th-TH")}</div>
                 </div>`
                )
                .join("")}
            </div>`;
}

// --- Interactive Functions ---

export function saveRev() {
  const q1 = document.getElementById("rv-q1").value;
  const q2 = document.getElementById("rv-q2").value;
  const q3 = document.getElementById("rv-q3").value;

  if (!q1 && !q2) return showToast("เขียนหน่อยน่า", "error");

  // ป้องกัน Error กรณี TimeSystem ยังไม่โหลด
  const currentWeek = TimeSystem.current ? TimeSystem.current.weekNumber : 0;

  appState.reviews.push({
    id: Date.now(),
    d: new Date(),
    w: currentWeek,
    y: new Date().getFullYear(),
    a: {
      q1,
      q2,
      q3,
    },
  });
  saveState();
  renderReviews(document.getElementById("content-area"));
  showToast("บันทึกแล้ว", "success");
}

export function showRev(i) {
  // Logic: คำนวณ index ย้อนกลับ (เพราะตอนโชว์เรา slice().reverse())
  const r = appState.reviews[appState.reviews.length - 1 - i];

  openModal(
    `Week ${r.w}/${r.y}`,
    `<b>Wins:</b><br>${r.a.q1}<br><br><b>Improve:</b><br>${r.a.q2}<br><br><b>Focus:</b><br>${r.a.q3}`,
    () => true
  );
}
