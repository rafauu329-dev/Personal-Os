import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";

// --- Local UI State ---
export const scheduleState = {
  view: "daily",
  selectedDate: new Date(),
  viewMonth: new Date(),
  draggedItem: null,
  selectedSticker: null,
};

// --- Schedule Logic ---

export function renderSchedule(container) {
  if (!appState.schedule) appState.schedule = [];

  const selected = scheduleState.selectedDate;
  const viewMonth = scheduleState.viewMonth;

  const year = selected.getFullYear();
  const month = String(selected.getMonth() + 1).padStart(2, "0");
  const day = String(selected.getDate()).padStart(2, "0");
  const isoDate = `${year}-${month}-${day}`;

  const dateStr = selected.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Header
  const headerHTML = `
      <div class="u-flex-between u-flex-align-center u-mb-lg sched-header-responsive">
          <div class="u-flex-align-center">
             <div class="section-tag bg-main" style="margin:0; font-size:1rem; padding:8px 12px;"> PLANNER </div>

          </div>
          <div class="sched-date-control">
             <button class="sched-nav-btn prev" onclick="App.changeScheduleDate(-1)">◀</button>
             <div class="sched-current-date">${dateStr}</div>
             <button class="sched-nav-btn next" onclick="App.changeScheduleDate(1)">▶</button>
          </div>
      </div>
    `;

  // Calendar logic
  const renderFullCalendar = () => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0
    );
    const prevLastDay = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth(),
      0
    );
    const monthYearStr = viewMonth.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    });
    let daysHtml = "";
    for (let x = firstDay.getDay(); x > 0; x--)
      daysHtml += `<div class="cal-day prev-month">${
        prevLastDay.getDate() - x + 1
      }</div>`;
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dKey = `${viewMonth.getFullYear()}-${String(
        viewMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const isSelected = dKey === isoDate;
      const hasEvent = appState.schedule.some((e) => e.date === dKey);
      const isToday = dKey === new Date().toLocaleDateString("en-CA");
      daysHtml += `<div class="cal-day ${isSelected ? "active" : ""} ${
        hasEvent ? "has-event" : ""
      } ${isToday ? "is-today" : ""}" onclick="App.setScheduleDate('${new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth(),
        i
      ).toISOString()}')">${i}</div>`;
    }
    return `<div class="paper-card full-calendar">
            <div class="u-flex-between u-mb-md u-flex-align-center"><div class="u-font-black u-text-lg">${monthYearStr}</div><div class="u-flex u-gap-xs"><button class="btn-action btn-sm" onclick="App.changeViewMonth(-1)">◀</button><button class="btn-action btn-sm" onclick="App.changeViewMonth(1)">▶</button></div></div>
            <div class="cal-grid-header"><div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div></div>
            <div class="cal-grid-body">${daysHtml}</div></div>`;
  };

  // Timeline Logic
  const timeBlocks = [
    {
      id: "morning",
      label: "MORNING",
      sub: "05:00 - 12:00",
      color: "var(--color-yellow)",
    },
    {
      id: "afternoon",
      label: "AFTERNOON",
      sub: "12:00 - 17:00",
      color: "var(--color-orange)",
    },
    {
      id: "evening",
      label: "EVENING",
      sub: "17:00 - 22:00",
      color: "var(--color-blue)",
    },
    {
      id: "night",
      label: "NIGHT",
      sub: "22:00 - 05:00",
      color: "var(--color-purple)",
    },
  ];

  const currentEvents = appState.schedule.filter((e) => e.date === isoDate);
  const timelineHTML = timeBlocks
    .map((block) => {
      const evts = currentEvents
        .filter((e) => e.period === block.id)
        .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

      return `
        <div class="sched-block-zone"
             ondrop="App.handleDrop(event, '${block.id}', '${isoDate}')"
             ondragover="App.allowDrop(event)"
             onclick="App.handleZoneTap('${block.id}', '${isoDate}')">

            <div class="sched-block-header" style="background:${block.color}">
                <span>${block.label}</span>
                <span style="font-size:0.7rem; opacity:0.8;">${block.sub}</span>
            </div>
            <div class="sched-block-body">
                ${
                  evts.length
                    ? evts
                        .map(
                          (evt) => `
                    <div class="sched-event-card" draggable="true" ondragstart="App.handleDragStart(event, '${
                      evt.id
                    }')"
                         style="border-left-color: ${
                           evt.important
                             ? "var(--color-red)"
                             : "var(--color-blue)"
                         }">
                        <div class="u-flex-between u-mb-xs">
                            <span class="sched-time-badge">${evt.timeStart} - ${
                            evt.timeEnd
                          }</span>
                        </div>
                        <div class="sched-title">${evt.title}</div>

                        <button class="sched-edit-btn" onclick="event.stopPropagation(); App.handleEditEventModal('${
                          evt.id
                        }')">✎</button>
                        <button class="sched-del-btn" onclick="event.stopPropagation(); App.deleteEvent('${
                          evt.id
                        }')">&times;</button>
                    </div>
                `
                        )
                        .join("")
                    : '<div class="sched-placeholder">แตะสติกเกอร์แล้วแตะที่นี่เพื่อวาง</div>'
                }
            </div>
        </div>`;
    })
    .join("");

  // Stickers Logic
  const stickersHTML = `
        <div class="sched-dock">
            <div class="u-font-black u-mb-sm u-text-center">STICKERS (แตะเพื่อเลือก)</div>
            <div class="sched-stickers-row">
                ${[
                  { title: "ประชุม", type: "work", icon: "" },
                  { title: "Coding", type: "work", icon: "" },
                  { title: "ออกกำลัง", type: "health", icon: "" },
                  { title: "อ่านหนังสือ", type: "life", icon: "" },
                ]
                  .map(
                    (p) => `
                    <div class="sched-sticker ${
                      scheduleState.selectedSticker?.title === p.title
                        ? "is-selected"
                        : ""
                    }"
                         draggable="true"
                         ondragstart="App.handleStickerDragStart(event, '${
                           p.title
                         }', '${p.type}')"
                         onclick="App.handleStickerTap('${p.title}', '${
                      p.type
                    }')">
                        <span>${p.icon}</span> <span>${p.title}</span>
                    </div>
                `
                  )
                  .join("")}

            </div>
            <button class="btn-action add-task" style="align-items: flex-end;" onclick="App.handleAddEventModal('${isoDate}')">+ พิมพ์เพิ่มเอง</button>
        </div>
    `;

  container.innerHTML = `
        ${headerHTML}
        <div class="sched-new-layout">
            <div class="sched-calendar-area">
                ${renderFullCalendar()}
                ${stickersHTML}
            </div>
            <div class="sched-timeline-area">
                ${timelineHTML}
            </div>
        </div>
    `;
}

// --- Helper Functions ---

export function changeViewMonth(val) {
  scheduleState.viewMonth.setMonth(scheduleState.viewMonth.getMonth() + val);
  renderSchedule(document.getElementById("content-area"));
}

export function changeScheduleDate(days) {
  scheduleState.selectedDate.setDate(
    scheduleState.selectedDate.getDate() + days
  );
  // อัปเดต viewMonth ให้ตรงกับวันที่เลือกเผื่อข้ามเดือน
  scheduleState.viewMonth = new Date(
    scheduleState.selectedDate.getFullYear(),
    scheduleState.selectedDate.getMonth(),
    1
  );
  renderSchedule(document.getElementById("content-area"));
}

export function setScheduleDate(isoString) {
  scheduleState.selectedDate = new Date(isoString);
  renderSchedule(document.getElementById("content-area"));
}

// --- Task Management (Add / Edit / Delete) ---

export function handleAddEventModal(
  dateStr,
  presetTitle = "",
  presetType = "work"
) {
  const html = `
        <div class="u-flex-col u-gap-md">
            <div><label class="u-font-bold u-text-sm">ชื่อกิจกรรม</label><input type="text" id="evt-title" class="input-std" value="${presetTitle}" autocomplete="off"></div>
            <div class="u-flex u-gap-sm">
                <div style="flex:1"><label class="u-text-sm">เริ่ม</label><input type="time" id="evt-start" class="input-std" value="09:00"></div>
                <div style="flex:1"><label class="u-text-sm">ถึง</label><input type="time" id="evt-end" class="input-std" value="10:00"></div>
            </div>
            <div>
                <label class="u-font-bold u-text-sm">ประเภท</label>
                <select id="evt-type" class="input-std">
                    <option value="work" ${
                      presetType === "work" ? "selected" : ""
                    }>Work (งาน)</option>
                    <option value="health" ${
                      presetType === "health" ? "selected" : ""
                    }>Health (สุขภาพ)</option>
                    <option value="deen" ${
                      presetType === "deen" ? "selected" : ""
                    }>Deen (ศาสนา)</option>
                    <option value="life" ${
                      presetType === "life" ? "selected" : ""
                    }>Life (ชีวิต)</option>
                </select>
            </div>
             <div class="u-mt-sm">
                <label class="u-flex-align-center u-cursor-pointer">
                    <input type="checkbox" id="evt-imp" style="width:18px; height:18px; accent-color:var(--color-red);">
                    <span class="u-ml-xs u-font-bold u-text-danger">🔥 สำคัญมาก</span>
                </label>
            </div>
        </div>`;

  openModal("เพิ่มกิจกรรม", html, () => {
    const title = document.getElementById("evt-title").value;
    if (!title) {
      showToast("กรุณากรอกชื่อกิจกรรม", "error");
      return false;
    }

    const start = document.getElementById("evt-start").value;
    const hour = parseInt(start.split(":")[0]);
    let period = "morning";
    if (hour >= 12) period = "afternoon";
    if (hour >= 17) period = "evening";
    if (hour >= 22 || hour < 5) period = "night";

    appState.schedule.push({
      id: Date.now().toString(),
      date: dateStr,
      title,
      timeStart: start,
      timeEnd: document.getElementById("evt-end").value,
      type: document.getElementById("evt-type").value,
      period: period,
      important: document.getElementById("evt-imp").checked,
    });
    saveState();
    renderSchedule(document.getElementById("content-area"));
    return true;
  });
}

export function handleEditEventModal(id) {
  const evt = appState.schedule.find((e) => e.id === id);
  if (!evt) return;

  const html = `
      <div class="u-flex-col u-gap-md">
          <div><label class="u-font-bold u-text-sm">ชื่อกิจกรรม</label><input type="text" id="edit-evt-title" class="input-std" value="${
            evt.title
          }"></div>
          <div class="u-flex u-gap-sm">
              <div style="flex:1"><label class="u-text-sm">เริ่ม</label><input type="time" id="edit-evt-start" class="input-std" value="${
                evt.timeStart
              }"></div>
              <div style="flex:1"><label class="u-text-sm">ถึง</label><input type="time" id="edit-evt-end" class="input-std" value="${
                evt.timeEnd
              }"></div>
          </div>
          <div>
              <label class="u-font-bold u-text-sm">ประเภท</label>
              <select id="edit-evt-type" class="input-std">
                  <option value="work" ${
                    evt.type === "work" ? "selected" : ""
                  }>Work</option>
                  <option value="health" ${
                    evt.type === "health" ? "selected" : ""
                  }>Health</option>
                  <option value="deen" ${
                    evt.type === "deen" ? "selected" : ""
                  }>Deen</option>
                  <option value="life" ${
                    evt.type === "life" ? "selected" : ""
                  }>Life</option>
              </select>
          </div>
          <div class="u-mt-sm">
              <label class="u-flex-align-center u-cursor-pointer">
                  <input type="checkbox" id="edit-evt-imp" style="width:18px; height:18px;" ${
                    evt.important ? "checked" : ""
                  }>
                  <span class="u-ml-xs u-font-bold u-text-danger">🔥 สำคัญมาก</span>
              </label>
          </div>
      </div>`;

  openModal("แก้ไขกิจกรรม", html, () => {
    const title = document.getElementById("edit-evt-title").value;
    if (!title) return false;

    const start = document.getElementById("edit-evt-start").value;
    const hour = parseInt(start.split(":")[0]);
    let period = "morning";
    if (hour >= 12) period = "afternoon";
    if (hour >= 17) period = "evening";
    if (hour >= 22 || hour < 5) period = "night";

    evt.title = title;
    evt.timeStart = start;
    evt.timeEnd = document.getElementById("edit-evt-end").value;
    evt.type = document.getElementById("edit-evt-type").value;
    evt.period = period;
    evt.important = document.getElementById("edit-evt-imp").checked;

    saveState();
    renderSchedule(document.getElementById("content-area"));
    showToast("แก้ไขงานเรียบร้อย", "success");
    return true;
  });
}

export function deleteEvent(id) {
  openModal("ลบรายการ?", "คุณต้องการลบกิจกรรมนี้ใช่ไหม?", () => {
    appState.schedule = appState.schedule.filter((e) => e.id !== id);
    saveState();
    renderSchedule(document.getElementById("content-area"));
    showToast("ลบเรียบร้อย", "info");
    return true;
  });
}

// --- Drag & Drop System ---

export function allowDrop(ev) {
  ev.preventDefault();
}

export function handleDragStart(ev, id) {
  ev.dataTransfer.setData(
    "text/plain",
    JSON.stringify({
      type: "move",
      id,
    })
  );
}

export function handleStickerDragStart(ev, title, type) {
  ev.dataTransfer.setData(
    "text/plain",
    JSON.stringify({
      type: "new",
      title,
      category: type,
    })
  );
}

export function handleDrop(ev, periodId, dateStr) {
  ev.preventDefault();
  try {
    const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
    if (data.type === "new") {
      handleAddEventModal(dateStr, data.title, data.category);
    } else if (data.type === "move") {
      const item = appState.schedule.find((e) => e.id === data.id);
      if (item) {
        item.period = periodId;
        item.date = dateStr;
        saveState();
        renderSchedule(document.getElementById("content-area"));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// --- Touch Support ---

export function handleStickerTap(title, type) {
  if (scheduleState.selectedSticker?.title === title) {
    scheduleState.selectedSticker = null;
  } else {
    scheduleState.selectedSticker = {
      title,
      type,
    };
    showToast(`เลือก: ${title} (แตะที่ช่องเวลาเพื่อวาง)`);
  }
  renderSchedule(document.getElementById("content-area"));
}

export function handleZoneTap(periodId, dateStr) {
  if (scheduleState.selectedSticker) {
    const sticker = scheduleState.selectedSticker;
    handleAddEventModal(dateStr, sticker.title, sticker.type);
    scheduleState.selectedSticker = null;
    renderSchedule(document.getElementById("content-area"));
  }
}
