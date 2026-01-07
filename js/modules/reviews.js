import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";
import { TimeSystem } from "../services/time.js";

/* =========================================
   WEEKLY REVIEW
   ========================================= */

export function renderReviews(container) {
  if (!appState.reviews) appState.reviews = [];

  container.innerHTML = `
    <div class="paper-card u-mb-lg">
      <div class="section-tag">Weekly Review</div>

      <div class="u-mb-md">
        <label class="u-font-bold">1. สัปดาห์นี้ทำอะไรสำเร็จบ้าง?</label>
        <textarea id="rv-q1" class="input-std" style="height:80px;"></textarea>
      </div>

      <div class="u-mb-md">
        <label class="u-font-bold">2. สิ่งที่ต้องปรับปรุง?</label>
        <textarea id="rv-q2" class="input-std" style="height:80px;"></textarea>
      </div>

      <div class="u-mb-md">
        <label class="u-font-bold">3. โฟกัสสัปดาห์หน้า?</label>
        <textarea id="rv-q3" class="input-std" style="height:80px;"></textarea>
      </div>

      <button id="save-review-btn" class="btn-main u-w-full">
        บันทึกทบทวน
      </button>
    </div>

    <div class="paper-card">
      <div class="section-tag">History</div>

      ${appState.reviews
        .slice()
        .reverse()
        .map(
          (r, i) => `
          <div
            class="u-p-sm u-cursor-pointer"
            style="border-bottom:1px solid var(--border-soft);"
            data-index="${i}"
          >
            <div class="u-font-bold">Week ${r.week} / ${r.year}</div>
            <div class="u-text-sm u-text-muted">
              ${new Date(r.date).toLocaleDateString("th-TH")}
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  // --- Bind Events ---
  document.getElementById("save-review-btn").addEventListener("click", saveRev);

  container.querySelectorAll("[data-index]").forEach((el) => {
    el.addEventListener("click", () => showRev(Number(el.dataset.index)));
  });
}

/* =========================================
   Actions
   ========================================= */

export function saveRev() {
  const q1 = document.getElementById("rv-q1")?.value || "";
  const q2 = document.getElementById("rv-q2")?.value || "";
  const q3 = document.getElementById("rv-q3")?.value || "";

  if (!q1 && !q2) {
    showToast("เขียนหน่อยน่า", "error");
    return;
  }

  const currentWeek = TimeSystem?.current?.weekNumber ?? 0;

  appState.reviews.push({
    id: Date.now(),
    date: new Date().toISOString(),
    week: currentWeek,
    year: new Date().getFullYear(),
    action: { q1, q2, q3 },
  });

  saveState();
  renderReviews(document.getElementById("content-area"));
  showToast("บันทึกแล้ว", "success");
}

export function showRev(i) {
  const r = appState.reviews[appState.reviews.length - 1 - i];

  if (!r) return;

  openModal(
    `Week ${r.week} / ${r.year}`,
    `
      <b>สัปดาห์นี้ทำอะไรสำเร็จบ้าง:</b><br>${r.action.q1}<br><br>
      <b>สิ่งที่ต้องปรับปรุง :</b><br>${r.action.q2}<br><br>
      <b> โฟกัสสัปดาห์หน้า:</b><br>${r.action.q3}
    `,
    () => true
  );
}
