import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";

// --- Helper for Back Button (Optional use) ---
function renderBackBtn() {
  return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.navigateTo('tools')">⬅ Tools</button>`;
}

/* =========================================
   HABIT TRACKER (Fixed Validation)
   ========================================= */

export function renderHabitTracker(container) {
  if (!appState.tools.habits) appState.tools.habits = [];

  // 1. Empty State HTML
  const emptyStateHTML = `
    <div class="paper-card u-text-center" style="padding:40px; border:3px dashed #ccc; background:rgba(0,0,0,0.02);">
        <div style="font-size:3rem; margin-bottom:10px;">🌱</div>
        <div class="u-text-lg u-font-bold u-mb-sm">ยังไม่มีนิสัยที่ติดตาม</div>
        <div class="u-text-muted u-mb-lg">สร้างวินัยเล็กๆ เริ่มต้นวันนี้เลย</div>
        <button class="btn-action" onclick="App.handleAddHabitModal()">+ สร้างนิสัยใหม่</button>
    </div>
    `;

  // 2. Helper Logic สำหรับคำนวณ Streak
  const checkStreakStatus = (lastDone, currentStreak) => {
    if (!lastDone) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = lastDone.split("/");
    // Note: logic assumes parts[2] is roughly usable.
    const lastDate = new Date(parts[2] - 543, parts[1] - 1, parts[0]);
    if (isNaN(lastDate.getTime())) {
      const d = new Date(lastDone);
      d.setHours(0, 0, 0, 0);
      const diff = Math.ceil(Math.abs(today - d) / (1000 * 60 * 60 * 24));
      return diff > 1 ? 0 : currentStreak;
    }

    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      Math.abs(today - lastDate) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 1 ? 0 : currentStreak;
  };

  // 3. Render HTML
  container.innerHTML = `
        <div class="u-flex-between u-flex-align-center u-mb-lg">
             <div class="u-flex-align-center">${renderBackBtn()}<div class="section-tag section-tag-habits u-text-main" style="margin:0;">Habit Tracker</div></div>
             <button class="btn-action" onclick="App.handleAddHabitModal()" style="font-size:0.85rem; font-weight:600;">+ สร้างนิสัยใหม่</button>
        </div>
        <div class="habit-grid" style="grid-template-columns: 1fr;">
            ${appState.tools.habits
              .map((h) => {
                const todayStr = new Date().toLocaleDateString("th-TH");
                const isDone = h.lastDone === todayStr;

                let displayStreak = h.streak;
                if (!isDone) {
                  displayStreak = checkStreakStatus(h.lastDone, h.streak);
                }

                const cardColor = h.color || "var(--text-main)";

                return `
                <div class="habit-card" style="border-left: 4px solid ${cardColor}; ${
                  isDone ? "opacity: 0.7;" : ""
                }">
                    <div class="u-flex-col">
                        <span style="font-weight: 700; font-size: 1rem; color: var(--text-main); ${
                          isDone
                            ? "text-decoration: line-through; color: var(--text-muted);"
                            : ""
                        }">${h.name}</span>
                        <span class="u-text-sm u-text-muted u-mt-xs"> ความต่อเนื่อง: <b style="color:${cardColor}">${displayStreak}</b> วัน</span>
                    </div>
                    <div class="u-flex-align-center u-gap-md">
                        <button onclick="App.toggleHabit('${
                          h.id
                        }')" style="padding: 8px 16px; border: 1px solid ${
                  isDone ? cardColor : "#e0e0e0"
                }; background: ${isDone ? cardColor : "transparent"}; color: ${
                  isDone ? "#fff" : "var(--text-muted)"
                }; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                            ${isDone ? "อย่างเจ๋งงง!" : "เช็คชื่อ"}
                        </button>
                        <button onclick="App.deleteHabit('${
                          h.id
                        }')" class="u-no-border u-bg-transparent u-text-xl u-cursor-pointer" style="color: #ccc; line-height: 1; padding: 0 5px;">&times;</button>
                    </div>
                </div>`;
              })
              .join("")}
        </div>

        ${appState.tools.habits.length === 0 ? emptyStateHTML : ""}
    `;
}

// --- Interactive Functions ---

export function handleAddHabitModal() {
  const html = `
        <div class="u-mb-md"><label class="u-font-bold">ชื่อนิสัย</label><input type="text" id="h-name" class="input-std" placeholder="เช่น ดื่มน้ำ"></div>
        <div><label class="u-font-bold">สีประจำตัว</label><select id="h-color" class="input-std"><option value="var(--text-main)">⚫️ ดำ</option><option value="var(--color-orange)">🟠 ส้ม</option><option value="var(--color-blue)">🔵 ฟ้า</option><option value="var(--color-green)">🟢 เขียว</option></select></div>`;

  openModal("สร้างนิสัยใหม่", html, () => {
    const name = document.getElementById("h-name").value;
    const color = document.getElementById("h-color").value;

    // ✅ เพิ่มการเช็คและแจ้งเตือนตรงนี้ครับ
    if (!name) {
      showToast("กรุณาระบุนิสัยที่จะทำทุกวันด้วยครับ", "error");
      return false;
    }

    appState.tools.habits.push({
      id: Date.now().toString(),
      name: name,
      color: color,
      streak: 0,
      lastDone: null,
    });
    saveState();
    renderHabitTracker(document.getElementById("content-area"));
    showToast("สร้างนิสัยใหม่สำเร็จ!", "success"); // เพิ่มแจ้งเตือนตอนสำเร็จด้วย
    return true;
  });
}

export function toggleHabit(id) {
  const h = appState.tools.habits.find((x) => x.id === id);
  if (!h) return;

  const parseDate = (str) => {
    if (!str) return null;
    if (str === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }
    const parts = str.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[2]);
      const finalYear = year > 2400 ? year - 543 : year;
      return new Date(finalYear, parts[1] - 1, parts[0]);
    }
    return new Date(str);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString("th-TH");

  const lastDoneDate = parseDate(h.lastDone);

  if (h.lastDone === todayStr) {
    h.lastDone = null;
    h.streak = Math.max(0, h.streak - 1);
  } else {
    let isConsecutive = false;

    if (lastDoneDate) {
      lastDoneDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastDoneDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) isConsecutive = true;
    } else {
      isConsecutive = false;
    }

    if (isConsecutive) {
      h.streak++;
      showToast(`สุดยอด! รักษา Streak วันที่ ${h.streak} แล้ว 🔥`, "success");
    } else {
      h.streak = 1;
      showToast(`เริ่มนับ Streak ใหม่! สู้ๆ ✌️`, "info");
    }

    h.lastDone = todayStr;
  }

  saveState();
  if (window.App && window.App.currentPage === "home") {
    // ถ้าอยู่หน้า Home (Dashboard) ให้ส่งสัญญาณไปบอก main.js
    document.dispatchEvent(new CustomEvent("habit-updated"));
  } else {
    // ถ้าอยู่หน้า Habit Tracker ให้รีเฟรชหน้านี้ปกติ
    renderHabitTracker(document.getElementById("content-area"));
  }
}

export function deleteHabit(id) {
  openModal("ลบนิสัย?", "ต้องการเลิกติดตามนิสัยนี้แล้วใช่ไหม?", () => {
    appState.tools.habits = appState.tools.habits.filter((x) => x.id !== id);
    saveState();
    renderHabitTracker(document.getElementById("content-area"));
    showToast("ลบนิสัยเรียบร้อย", "info");
    return true;
  });
}
