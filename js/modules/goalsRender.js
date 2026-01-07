import { appState, saveState } from "../state.js";
import { openModal, showToast, escapeHtml } from "../utils.js";
import { GoalSystem } from "../services/goalLogic.js";

/* =========================================
   GOALS RENDERER (Fixed & Restore Original Logic)
   ========================================= */

export function renderGoals(container) {
  // 1. ส่วนหัว (Header)
  container.innerHTML = `
            <div class="u-flex-between u-flex-align-center u-mb-lg">
                <div>
                    <div class="section-tag" style="background:var(--color-purple);">Life Map</div>
                    <div class="u-text-sm u-text-muted u-mt-xs">แผนที่ชีวิตและการเดินทางของคุณ</div>
                </div>
                <button class="btn-action" onclick="App.handleAddGoal()">+ NEW GOAL</button>
            </div>
        `;

  // 2. กรณีไม่มีข้อมูล (Empty State)
  if (!appState.goals || appState.goals.length === 0) {
    container.innerHTML += `
                <div class="paper-card u-text-center" style="padding:50px; border:2px dashed var(--border-color);">
                    <div style="font-size:4rem; margin-bottom:20px;">🗺️</div>
                    <div class="u-text-lg u-font-bold u-mb-sm">NO ACTIVE GOALS</div>
                    <div class="u-text-muted u-mb-lg">เริ่มต้นวาดแผนที่ชีวิตของคุณได้เลย</div>
                    <button class="btn-action" onclick="App.handleAddGoal()">CREATE NOW</button>
                </div>`;
    return;
  }

  // 3. แสดงรายการ Goals
  const goalsContainer = document.createElement("div");
  goalsContainer.className = "goal-container";

  appState.goals.forEach((goal, index) => {
    // Safety Check: สร้าง topics รอไว้เลยถ้ายังไม่มี
    if (!goal.topics) goal.topics = [];

    const progress = GoalSystem.calculateProgress(goal);

    const colors = [
      "var(--color-blue)",
      "var(--color-green)",
      "var(--color-pink)",
      "var(--color-orange)",
      "var(--color-purple)",
    ];
    const themeColor = colors[index % colors.length];

    const goalCard = document.createElement("div");
    goalCard.className = "paper-card u-mb-lg";
    goalCard.style.borderTop = `8px solid ${themeColor}`;

    // Goal Header & Progress Bar
    goalCard.innerHTML = `
                <div class="u-flex-between u-cursor-pointer" style="align-items:start;" onclick="App.toggleExpand('${
                  goal.id
                }')">
                    <div class="u-flex-align-center u-gap-md">
                        <div class="u-flex-center" style="font-size:3rem; background:var(--bg-main); width:70px; height:70px; border:2px solid var(--border-color); border-radius:12px; box-shadow:4px 4px 0 rgba(0,0,0,0.1);">
                            ${goal.icon || "🎯"}
                        </div>
                        <div>
                            <div class="u-text-xl u-font-black u-mb-xs" style="line-height:1.2;">${escapeHtml(
                              goal.title
                            )}</div>
                            <div class="u-text-sm u-text-muted">Progress: ${progress}%</div>
                        </div>
                    </div>
                    <div class="u-text-right">
                        <button class="btn-action u-text-danger" style="padding:4px 8px; font-size:0.7rem; border-color:var(--danger);" onclick="event.stopPropagation(); App.handleDeleteGoal('${
                          goal.id
                        }')"> DELETE </button>
                        <div style="font-family:monospace; font-weight:900; font-size:1.2rem; letter-spacing:2px; margin-top: 12px;">
                            ${goal.expanded ? "[ - ]" : "[ + ]"}
                        </div>
                    </div>
                </div>
                <div class="p-bar bg-white" style="height:16px; margin-top:20px; border:2px solid var(--border-color);">
                    <div class="p-fill" style="width:${progress}%; background:${themeColor}; box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2);"></div>
                </div>

                <div style="display: ${
                  goal.expanded ? "block" : "none"
                }; margin-top:30px; padding-top:20px; border-top:2px dashed var(--border-color);">
                    <div id="topics-${goal.id}"></div>
                    <button class="btn-action u-w-full u-mt-lg bg-soft" style="border-style:dashed;" onclick="App.handleAddTopic('${
                      goal.id
                    }')">+ เพิ่มหัวข้อหลัก (Topic)</button>
                </div>
            `;
    goalsContainer.appendChild(goalCard);

    // Render Topics
    const topicContainer = goalCard.querySelector(`#topics-${goal.id}`);
    if (goal.topics) {
      goal.topics.forEach((topic) => {
        const topicEl = document.createElement("div");
        topicEl.className = "topic-item";
        topicEl.style.borderLeft = `4px solid ${themeColor}`;
        topicEl.innerHTML = `
                        <div class="u-flex-between u-flex-align-center u-mb-sm">
                            <div class="u-font-black u-text-main" style="font-size:1.1rem;">${escapeHtml(
                              topic.title
                            )}</div>
                            <div class="u-gap-xs u-flex">
                                <button class="btn-add btn-sm" onclick="App.handleAddSubtopic('${
                                  goal.id
                                }', '${topic.id}')">+ เรื่องย่อย</button>
                                <button class="btn-action btn-sm u-text-danger" onclick="App.handleDeleteTopic('${
                                  goal.id
                                }', '${topic.id}')">×</button>
                            </div>
                        </div>
                        <div id="sub-${topic.id}"></div>`;
        topicContainer.appendChild(topicEl);

        // Render Subtopics
        const subContainer = topicEl.querySelector(`#sub-${topic.id}`);
        // Safety Check: ถ้า subtopics เป็น undefined (ข้อมูลเก่า) ให้ถือเป็น array ว่าง
        if (topic.subtopics) {
          topic.subtopics.forEach((sub) => {
            const subEl = document.createElement("div");
            subEl.className = "subtopic-item";
            subEl.innerHTML = `
                                <div class="u-flex-between u-mb-sm u-pb-xs" style="border-bottom:1px solid var(--border-soft);">
                                    <div class="u-font-bold">${escapeHtml(
                                      sub.title
                                    )}</div>
                                    <div class="u-flex u-gap-xs">
                                        <button class="btn-add btn-sm" onclick="App.handleAddGoalTask('${
                                          goal.id
                                        }', '${topic.id}', '${
              sub.id
            }')">+ งาน</button>
                                        <button class="btn-action btn-sm u-text-muted" onclick="App.handleDeleteSubtopic('${
                                          goal.id
                                        }', '${topic.id}', '${
              sub.id
            }')">×</button>
                                    </div>
                                </div>
                                <div id="tasks-${
                                  sub.id
                                }" class="u-flex-col u-gap-xs"></div>`;
            subContainer.appendChild(subEl);

            // Render Tasks
            const taskContainer = subEl.querySelector(`#tasks-${sub.id}`);
            // Safety Check: ถ้า tasks เป็น undefined (ข้อมูลเก่า) ให้ถือเป็น array ว่าง
            if (sub.tasks) {
              sub.tasks.forEach((task) => {
                const taskEl = document.createElement("div");
                taskEl.innerHTML = `
                                        <label class="u-flex-align-center u-cursor-pointer u-py-xs" style="transition:0.2s;">
                                            <input type="checkbox" style="width:18px; height:18px; accent-color:${themeColor};"
                                                ${
                                                  task.isComplete
                                                    ? "checked"
                                                    : ""
                                                }
                                                onchange="App.toggleGoalTask('${
                                                  goal.id
                                                }', '${topic.id}', '${
                  sub.id
                }', '${task.id}')">
                                            <span class="${
                                              task.isComplete
                                                ? "u-text-muted"
                                                : ""
                                            }" style="font-size:0.95rem; margin-left:10px; ${
                  task.isComplete
                    ? "text-decoration:line-through; opacity:0.6;"
                    : ""
                }">${escapeHtml(task.title)}</span>
                                            <button onclick="event.preventDefault(); App.handleDeleteGoalTask('${
                                              goal.id
                                            }', '${topic.id}', '${sub.id}', '${
                  task.id
                }')"
                                                class="u-mt-auto u-no-border u-bg-transparent u-text-muted u-cursor-pointer u-font-bold" style="margin-left:auto; opacity:0.3;">×</button>
                                        </label>`;
                taskContainer.appendChild(taskEl);
              });
            }
          });
        }
      });
    }
  });
  container.appendChild(goalsContainer);
}

// --- Interactive Handlers ---

export function handleAddGoal() {
  const formHTML = `
            <div class="u-mb-md">
                <label class="u-font-bold u-text-sm">ชื่อเป้าหมาย</label>
                <input type="text" id="modal-input" class="input-std" placeholder="เช่น: อิสรภาพทางการเงิน">
            </div>
            <div>
                <label class="u-font-bold u-text-sm">เลือกไอคอน</label>
                <select id="modal-icon" class="input-std">
                    <option value="🎯">🎯 เป้าหมาย</option>
                    <option value="💰">💰 การเงิน</option>
                    <option value="💪">💪 สุขภาพ</option>
                    <option value="🧠">🧠 การเรียนรู้</option>
                    <option value="✈️">✈️ ท่องเที่ยว</option>
                    <option value="🏠">🏠 ครอบครัว</option>
                    <option value="💻">💻 การงาน</option>
                    <option value="🎨">🎨 งานอดิเรก</option>
                </select>
            </div>
        `;
  openModal("สร้างเป้าหมายใหม่", formHTML, () => {
    const val = document.getElementById("modal-input").value;
    const icon = document.getElementById("modal-icon").value;
    if (!val) {
      showToast("กรุณากรอกชื่อเป้าหมาย", "error");
      return false;
    }
    const newGoal = GoalSystem.createGoal(val);
    newGoal.icon = icon;
    appState.goals.push(newGoal);
    saveState();
    renderGoals(document.getElementById("content-area"));
    showToast(`สร้างเป้าหมาย "${val}" สำเร็จ!`, "success");
    return true;
  });
}

export function handleDeleteGoal(id) {
  openModal(
    "ลบเป้าหมาย?",
    "คุณแน่ใจไหม? ข้อมูลทั้งหมดในเป้าหมายนี้จะหายไป",
    () => {
      appState.goals = appState.goals.filter((g) => g.id !== id);
      saveState();
      renderGoals(document.getElementById("content-area"));
      showToast("ลบเป้าหมายแล้ว", "info");
      return true;
    }
  );
}

export function toggleExpand(id) {
  const goal = appState.goals.find((g) => g.id === id);
  if (goal) {
    goal.expanded = !goal.expanded;
    renderGoals(document.getElementById("content-area"));
  }
}

export function handleAddTopic(goalId) {
  openModal(
    "เพิ่มหัวข้อ (Topic)",
    `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: การลงทุน">`,
    () => {
      const val = document.getElementById("modal-input").value;
      if (!val) return false;
      const goal = appState.goals.find((g) => g.id === goalId);
      if (goal) {
        if (!goal.topics) goal.topics = []; // Safety check
        goal.topics.push(GoalSystem.createTopic(val));
        saveState();
        renderGoals(document.getElementById("content-area"));
        return true;
      }
      return false;
    }
  );
}

export function handleDeleteTopic(gId, tId) {
  openModal(
    "ลบหัวข้อ?",
    "ยืนยันการลบหัวข้อนี้ (ข้อมูลข้างในจะหายไปด้วยนะ)",
    () => {
      const goal = appState.goals.find((g) => g.id === gId);
      if (goal) {
        goal.topics = goal.topics.filter((t) => t.id !== tId);
        saveState();
        renderGoals(document.getElementById("content-area"));
        showToast("ลบหัวข้อเรียบร้อย", "info");
      }
      return true;
    }
  );
}

export function handleAddSubtopic(goalId, topicId) {
  openModal(
    "เพิ่มเรื่องย่อย (Subtopic)",
    `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: ศึกษาเรื่องกองทุน">`,
    () => {
      const val = document.getElementById("modal-input").value;
      if (!val) return false;

      const goal = appState.goals.find((g) => g.id === goalId);
      const topic = goal ? goal.topics.find((t) => t.id === topicId) : null;

      if (topic) {
        if (!topic.subtopics) topic.subtopics = []; // Safety Check
        topic.subtopics.push(GoalSystem.createSubtopic(val));
        saveState();
        renderGoals(document.getElementById("content-area"));
        return true;
      }
      return false;
    }
  );
}

export function handleDeleteSubtopic(gId, tId, sId) {
  openModal("ลบเรื่องย่อย?", "ต้องการลบเรื่องย่อยนี้ใช่ไหม?", () => {
    const goal = appState.goals.find((g) => g.id === gId);
    const topic = goal ? goal.topics.find((t) => t.id === tId) : null;
    if (topic && topic.subtopics) {
      topic.subtopics = topic.subtopics.filter((s) => s.id !== sId);
      saveState();
      renderGoals(document.getElementById("content-area"));
      showToast("ลบเรื่องย่อยแล้ว", "info");
    }
    return true;
  });
}

// ==========================================
// 📌 จุดที่แก้ BUG: ใช้ gId, tId, sId ให้ตรงกัน
// ==========================================
export function handleAddGoalTask(gId, tId, sId) {
  openModal(
    "เพิ่มงาน (Task)",
    `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: อ่านหนังสือ 1 บท">`,
    () => {
      const val = document.getElementById("modal-input").value;
      if (!val) return false;

      // แก้ชื่อตัวแปรให้ตรงกับ parameter (gId, tId, sId)
      const goal = appState.goals.find((g) => g.id === gId);
      const topic = goal ? goal.topics.find((t) => t.id === tId) : null;
      const sub = topic ? topic.subtopics.find((s) => s.id === sId) : null;

      if (sub) {
        if (!sub.tasks) sub.tasks = []; // กันเหนียวสำหรับข้อมูลเก่า
        sub.tasks.push(GoalSystem.createTask(val));
        saveState();
        renderGoals(document.getElementById("content-area"));
        return true;
      }
      return false;
    }
  );
}

export function handleDeleteGoalTask(gId, tId, sId, taskId) {
  const goal = appState.goals.find((g) => g.id === gId);
  const topic = goal ? goal.topics.find((t) => t.id === tId) : null;
  const sub = topic ? topic.subtopics.find((s) => s.id === sId) : null;

  if (sub && sub.tasks) {
    sub.tasks = sub.tasks.filter((t) => t.id !== taskId);
    saveState();
    renderGoals(document.getElementById("content-area"));
  }
}

export function toggleGoalTask(gId, tId, sId, taskId) {
  GoalSystem.toggleTask(gId, tId, sId, taskId);
  renderGoals(document.getElementById("content-area"));
}
