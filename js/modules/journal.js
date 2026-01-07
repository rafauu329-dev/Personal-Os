import { appState, saveState } from "../state.js";
import {
  openModal,
  showToast,
  escapeHtml,
  saveStateDebounced,
} from "../utils.js";

// --- Local State for Editing/Temp Inputs ---
let journalState = {
  isEditing: false,
  editId: null,
  tempTags: [],
  tempText: null,
  tempGratitude: null,
  tempMood: null,
};

// --- Helper for Back Button ---
function renderBackBtn() {
  return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.navigateTo('tools')">⬅ Tools</button>`;
}

/* =========================================
   JOURNAL LOGIC (Original UI from app.js)
   ========================================= */

export function renderJournal(container) {
  if (!appState.tools.journal) appState.tools.journal = [];

  // เตรียมข้อมูลสำหรับ Editor (กรณีแก้ไข หรือ พิมพ์ค้างไว้)
  const editData = journalState.isEditing
    ? appState.tools.journal.find((j) => j.id === journalState.editId) || {}
    : {};

  // ถ้ากำลังแก้ไข และยังไม่มี Tags ใน Temp ให้ดึงจากข้อมูลเดิมมาใส่
  if (
    journalState.isEditing &&
    journalState.tempTags.length === 0 &&
    editData.tags
  ) {
    journalState.tempTags = [...editData.tags];
  }

  const displayMood = journalState.tempMood || editData.mood || "🙂";
  const displayText = journalState.tempText ?? editData.text ?? "";
  const displayGratitude =
    journalState.tempGratitude ?? editData.gratitude ?? "";

  // รวม Tags ทั้งหมด (Default + Custom)
  const allTagsDisplay = [
    ...new Set(["งาน", "ไอเดีย", "ความรู้สึก", ...journalState.tempTags]),
  ];

  const todayStr = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Helper: สร้าง HTML ของ Timeline
  const renderTimeline = (logs) =>
    logs
      .slice()
      .reverse()
      .map(
        (e) => `
        <div class="jor-card ${e.isFeatured ? "featured" : ""}">
            <div class="jor-card-side">
                <div class="jor-card-date">${new Date(
                  e.date
                ).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                })}</div>
                <div class="jor-card-mood">${e.mood}</div>
                <div class="jor-card-line"></div>
            </div>
            <div class="jor-card-main">
                <div class="jor-card-header">
                    <span class="u-text-xs u-text-muted u-font-bold">${new Date(
                      e.date
                    ).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>
                    <div class="jor-actions">
                        <button class="jor-action-btn pin ${
                          e.isFeatured ? "active" : ""
                        }" onclick="App.toggleJournalPin('${e.id}')">${
          e.isFeatured ? "📌 Pinned" : "📌"
        }</button>
                        <button class="jor-action-btn edit" onclick="App.startEditJournal('${
                          e.id
                        }')">✏️</button>
                        <button class="jor-action-btn del" onclick="App.deleteJournal('${
                          e.id
                        }')">🗑</button>
                    </div>
                </div>
                <div class="jor-card-text">${escapeHtml(e.text)}</div>
                ${
                  e.gratitude
                    ? `<div class="jor-card-gratitude"><span class="icon">✨</span> ${escapeHtml(
                        e.gratitude
                      )}</div>`
                    : ""
                }
                <div class="jor-card-tags">${(e.tags || [])
                  .map((t) => `<span>#${t}</span>`)
                  .join("")}</div>
            </div>
        </div>`
      )
      .join("");

  // Render HTML หลัก
  container.innerHTML = `
        <div class="u-flex-align-center u-mb-lg">${renderBackBtn()}<div class="section-tag bg-blue" style="margin:0;">Daily Log</div></div>
        <div class="journal-layout">
            <div class="paper-card jor-editor-wrapper">
                <div class="jor-editor-header">
                    <div><div class="u-text-sm u-font-bold u-text-muted"> TODAY'S DATE </div><div class="u-text-lg u-font-black u-text-main">${todayStr}</div></div>
                    ${
                      journalState.isEditing
                        ? `<button class="btn-action u-text-danger btn-sm" onclick="App.cancelEditJournal()">EXIT EDIT</button>`
                        : `<div class="jor-mode-badge"> WRITE</div>`
                    }
                </div>
                <div class="jor-divider"></div>
                <div class="u-mb-md">
                    <label class="u-text-xs u-font-bold u-text-muted u-mb-xs u-block">MOOD CHECK</label>
                    <input type="hidden" id="j-mood-val" value="${displayMood}">
                    <div class="jor-mood-row">
                        ${["🤩", "😊", "🙂", "😐", "😔", "😫", "😡"]
                          .map(
                            (m) =>
                              `<button class="mood-chk ${
                                m === displayMood ? "active" : ""
                              }" onclick="App.setJournalMood('${m}', this)">${m}</button>`
                          )
                          .join("")}
                    </div>
                </div>
                <textarea id="j-text" class="jor-textarea-clean" placeholder="เขียนเรื่องราวของคุณที่นี่..." oninput="App.saveTempInputs()">${displayText}</textarea>
                <div class="jor-extras-box">
                    <div class="u-mb-md"><label class="u-text-xs u-font-bold u-text-muted">✨ GRATITUDE / HIGHLIGHT</label><input type="text" id="j-gratitude" class="input-line" placeholder="เรื่องดีๆ วันนี้..." value="${displayGratitude}" oninput="App.saveTempInputs()"></div>
                    <div class="u-mb-md">
                        <label class="u-text-xs u-font-bold u-text-muted u-mb-xs u-block">🏷️ TAGS</label>
                        <div class="u-flex u-gap-xs u-flex-wrap">
                             ${allTagsDisplay
                               .map(
                                 (t) =>
                                   `<span class="tag-chip ${
                                     journalState.tempTags.includes(t)
                                       ? "active"
                                       : ""
                                   }" onclick="App.toggleJournalTag('${t}')">#${t}</span>`
                               )
                               .join("")}
                             <span class="tag-chip add" onclick="this.style.display='none'; document.getElementById('new-tag-input').style.display='inline-block'; document.getElementById('new-tag-input').focus();">+</span>
                             <input type="text" id="new-tag-input" class="tag-chip" style="display:none; width:60px; padding:0 5px;" placeholder="New..." onblur="App.handleAddCustomTag()" onkeypress="if(event.key==='Enter') this.blur()">
                        </div>
                    </div>
                    <label class="jor-pin-option"><input type="checkbox" id="j-featured" style="accent-color:var(--color-blue);" ${
                      editData.isFeatured ? "checked" : ""
                    }><span>📌 ปักหมุดหน้า Dashboard (Manifesto)</span></label>
                </div>
                <button class="btn-main u-w-full u-mt-md bg-black u-text-white" onclick="App.saveJournal()">${
                  journalState.isEditing ? "อัปเดต" : "บันทึก"
                }</button>
            </div>
            <div class="jor-timeline-area">
                <div class="section-tag u-mb-md bg-soft u-text-main" style="border:1px solid #ccc;">HISTORY LOGS</div>
                <div class="jor-list-container">${
                  appState.tools.journal.length > 0
                    ? renderTimeline(appState.tools.journal)
                    : `<div class="jor-empty">ยังไม่มีบันทึก</div>`
                }</div>
            </div>
        </div>`;
}

// --- Interactive Functions ---

export function saveTempInputs() {
  journalState.tempText = document.getElementById("j-text").value;
  journalState.tempGratitude = document.getElementById("j-gratitude").value;
  journalState.tempMood = document.getElementById("j-mood-val").value;
  saveStateDebounced();
}

export function setJournalMood(val, btnEl) {
  document.getElementById("j-mood-val").value = val;
  document
    .querySelectorAll(".mood-chk")
    .forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  journalState.tempMood = val;
}

export function toggleJournalTag(tag) {
  const idx = journalState.tempTags.indexOf(tag);
  if (idx > -1) journalState.tempTags.splice(idx, 1);
  else journalState.tempTags.push(tag);

  saveTempInputs(); // บันทึก state ชั่วคราว
  renderJournal(document.getElementById("content-area"));
}

export function handleAddCustomTag() {
  const val = document.getElementById("new-tag-input").value.trim();
  if (val && !journalState.tempTags.includes(val)) {
    journalState.tempTags.push(val);
    saveTempInputs();
    renderJournal(document.getElementById("content-area"));
  }
}

export function saveJournal() {
  const text = document.getElementById("j-text").value.trim();
  const gratitude = document.getElementById("j-gratitude").value.trim();
  const mood = document.getElementById("j-mood-val").value;
  const isFeatured = document.getElementById("j-featured").checked;

  if (!text && !gratitude) return showToast("เขียนอะไรสักหน่อยนะ...", "error");

  // ถ้าปักหมุดอันใหม่ ให้เอาอันเก่าออกก่อน (Only 1 featured allowed)
  if (isFeatured) appState.tools.journal.forEach((j) => (j.isFeatured = false));

  const entryData = {
    text,
    gratitude,
    mood,
    tags: [...journalState.tempTags],
    isFeatured,
  };

  if (journalState.isEditing) {
    const index = appState.tools.journal.findIndex(
      (j) => j.id === journalState.editId
    );
    if (index !== -1) {
      appState.tools.journal[index] = {
        ...appState.tools.journal[index],
        ...entryData,
      };
      showToast("แก้ไขเรียบร้อย", "success");
    }
  } else {
    appState.tools.journal.push({
      id: Date.now().toString(),
      date: new Date(),
      ...entryData,
    });
    showToast("บันทึกแล้ว", "success");
  }
  saveState();
  cancelEditJournal();
}

export function startEditJournal(id) {
  const item = appState.tools.journal.find((j) => j.id === id);
  if (item) {
    journalState = {
      isEditing: true,
      editId: id,
      tempTags: [...(item.tags || [])],
      tempText: null,
      tempGratitude: null,
    };
    renderJournal(document.getElementById("content-area"));
  }
}

export function cancelEditJournal() {
  journalState = {
    isEditing: false,
    editId: null,
    tempTags: [],
    tempText: null,
    tempGratitude: null,
  };
  renderJournal(document.getElementById("content-area"));
}

export function deleteJournal(id) {
  openModal("ลบบันทึก?", "ข้อความนี้จะหายไปตลอดกาลเลยนะ", () => {
    appState.tools.journal = appState.tools.journal.filter((x) => x.id !== id);
    saveState();

    // ถ้าลบตัวที่กำลัง Edit อยู่ ให้เคลียร์หน้าจอด้วย
    if (journalState.editId === id) cancelEditJournal();
    else renderJournal(document.getElementById("content-area"));

    showToast("ลบบันทึกแล้ว", "info");
    return true;
  });
}

export function toggleJournalPin(id) {
  const target = appState.tools.journal.find((j) => j.id === id);
  if (target) {
    const wasFeatured = target.isFeatured;
    // Clear others
    appState.tools.journal.forEach((j) => (j.isFeatured = false));
    // Toggle target
    target.isFeatured = !wasFeatured;

    saveState();
    renderJournal(document.getElementById("content-area"));
    showToast(target.isFeatured ? "ปักหมุดแล้ว" : "เอาหมุดออกแล้ว", "success");
  }
}
