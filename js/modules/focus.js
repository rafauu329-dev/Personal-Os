import { appState, saveState } from "../state.js";
import { openModal, showToast, saveStateDebounced } from "../utils.js";
import { GoalSystem } from "../services/goalLogic.js";

// --- Local State ---
export let timerState = {
  time: 25 * 60,
  isRunning: false,
  interval: null,
  mode: "focus",
  sessions: 0,
};

let currentAudio = null;

// --- Render Logic ---

export function renderToday(container) {
  if (!appState.today) {
    appState.today = {
      focus: null,
      mustDo: [],
      niceToDo: [],
      notes: "",
      brainDump: "",
      atmosphere: "silence",
    };
  }
  const data = appState.today;

  // --- 1. คำนวณ Progress Bar (Must Do) ---
  const totalTasks = data.mustDo.length + data.niceToDo.length;
  const completedTasks = [...data.mustDo, ...data.niceToDo].filter(
    (t) => t.completed
  ).length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // --- 2. Helper เรนเดอร์ List ---
  const renderList = (list, type) =>
    (list || [])
      .map(
        (task) => `
        <div class="u-flex-align-center u-py-sm" style="border-bottom:1px dashed #eee; transition:0.2s;">
            <label class="u-cursor-pointer u-flex-align-center" style="flex:1;">
                <div style="position:relative; width:20px; height:20px; margin-right:12px;">
                    <input type="checkbox" style="opacity:0; position:absolute; width:100%; height:100%; cursor:pointer;"
                        ${
                          task.completed ? "checked" : ""
                        } onchange="App.toggleTodayTask('${type}', '${
          task.id
        }')">
                    <div style="width:20px; height:20px; border:2px solid ${
                      task.completed ? "var(--color-pink)" : "#ddd"
                    }; border-radius:6px; background:${
          task.completed ? "var(--color-pink)" : "#fff"
        }; display:flex; align-items:center; justify-content:center; transition:0.2s;">
                        ${
                          task.completed
                            ? '<span style="color:#fff; font-size:12px;">✓</span>'
                            : ""
                        }
                    </div>
                </div>
                <span style="font-weight:600; font-size:0.95rem; color:${
                  task.completed ? "#aaa" : "var(--text-main)"
                }; text-decoration:${
          task.completed ? "line-through" : "none"
        }; transition:0.2s;">
                    ${task.title}
                </span>
            </label>
            <button onclick="App.deleteTodayTask('${type}', '${
          task.id
        }')" class="u-no-border u-bg-transparent u-text-muted u-cursor-pointer hover-danger" style="padding:4px;">&times;</button>
        </div>`
      )
      .join("");

  // --- 3. ส่วน HTML หลัก ---
  container.innerHTML = `
        <div class="focus-layout">

            <div class="focus-header-grid">

                <div class="paper-card quote-manifesto" style="border-width: 3px; display:flex; flex-direction:column;">
                    <div class="manifesto-tape-today"></div>
                    <div class="manifesto-header">
                        <span class="manifesto-tag section-tag" style="background:var(--color-pink);"> MISSION CONTROL</span>
                        <div class="manifesto-hole"></div>
                    </div>
                    <div class="manifesto-body u-text-center" style="flex:1; display:flex; flex-direction:column; justify-content:center;">
                        ${
                          data.focus
                            ? `
                           <div class="manifesto-quote" style="font-size:1.8rem; line-height:1.4; border-color:var(--color-pink); box-shadow: 6px 6px 0 var(--color-pink); transform: rotate(-1deg);">
                                "${data.focus}"
                           </div>
                           <div class="u-mt-md">
                               <button class="btn-action u-text-success u-font-bold" onclick="App.handleClearFocus()">✔ MISSION COMPLETE</button>
                           </div>`
                            : `
                           <div class="u-p-md" style="border:3px dashed #e0e0e0; border-radius:12px; background:rgba(0,0,0,0.02); width:100%;">
                               <div class="u-text-muted u-font-bold u-mb-sm u-uppercase" style="font-size:0.8rem; letter-spacing:1px;">กำหนดเป้าหมายเดียวของวันนี้</div>
                               <input type="text" class="input-std u-text-center u-text-xl u-font-black"
                                      placeholder="พิมพ์เป้าหมาย... (Enter)"
                                      style="border:none; border-bottom:4px solid var(--color-pink); background:transparent; border-radius:0;"
                                      onkeypress="if(event.key==='Enter') App.handleSetFocus(this.value)">
                           </div>`
                        }
                    </div>
                </div>

                <div class="u-flex-col u-gap-md">
                    <div class="timer-box" style="flex:1; justify-content:space-between; border-top:6px solid var(--color-yellow);">
                        <div class="u-flex-between u-w-full u-mb-sm">
                            <div class="u-text-xs u-font-bold u-text-muted">FOCUS TIMER</div>
                            <div class="u-text-xs u-font-bold" style="background:#000; color:#fff; padding:2px 6px; border-radius:4px;">SESSIONS: ${
                              timerState.sessions || 0
                            }</div>
                        </div>
                        <div id="timer-display" class="timer-digits">
                            ${Math.floor(timerState.time / 60)
                              .toString()
                              .padStart(2, "0")}:${(timerState.time % 60)
    .toString()
    .padStart(2, "0")}
                        </div>
                        <button id="btn-timer-toggle" class="btn-action u-w-full" onclick="App.toggleTimer()">
                            ${timerState.isRunning ? "⏸ PAUSE" : "▶ START"}
                        </button>
                        <div class="u-flex-center u-gap-xs u-mt-sm">
                            <button class="btn-sm btn-action" onclick="App.setTimer(25)">25</button>
                            <button class="btn-sm btn-action" onclick="App.setTimer(50)">50</button>
                            <button class="btn-sm btn-action" onclick="App.setTimer(5)">Break</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="paper-card u-mb-lg" style="padding:15px; background:#fff; border-left:6px solid var(--color-pink);">
                <div class="u-flex-between u-mb-xs">
                    <span class="u-text-xs u-font-bold u-text-muted">DAILY PROGRESS</span>
                    <span class="u-text-xs u-font-black u-text-main">${progressPercent}% COMPLETED</span>
                </div>
                <div class="p-bar" style="height:10px; border:none; background:#f0f0f0; border:1px solid black;">
                    <div class="p-fill" style="width:${progressPercent}%; background:var(--color-pink); border-radius:10px; border:1px solid black;"></div>
                </div>
            </div>

            <div class="focus-workspace-grid">

                <div class="u-flex-col u-gap-lg">
                    <div class="paper-card">
                        <div class="u-flex-between u-flex-align-center u-mb-md">
                            <div class="section-tag bg-danger" style="margin:0;"> MUST DO</div>
                            <span class="u-text-xs u-text-muted">${
                              data.mustDo.length
                            } Tasks</span>
                        </div>
                        <div class="u-mb-sm" style="display:flex;">
                            <input type="text" class="input-line" placeholder="+ เพิ่มงานด่วน..." onkeypress="if(event.key==='Enter') App.addTodayTask('mustDo', this)">
                        </div>
                        <div id="list-mustdo" class="u-flex-col u-gap-xs">${renderList(
                          data.mustDo,
                          "mustDo"
                        )}</div>
                    </div>

                    <div class="paper-card">
                        <div class="u-flex-between u-flex-align-center u-mb-md">
                            <div class="section-tag bg-success" style="margin:0;"> NICE TO DO</div>
                            <span class="u-text-xs u-text-muted">${
                              data.niceToDo.length
                            } Tasks</span>
                        </div>
                        <div class="u-mb-sm" style="display:flex;">
                            <input type="text" class="input-line" placeholder="+ เพิ่มงานรอง..." onkeypress="if(event.key==='Enter') App.addTodayTask('niceToDo', this)">
                        </div>
                        <div id="list-nicedo" class="u-flex-col u-gap-xs">${renderList(
                          data.niceToDo,
                          "niceToDo"
                        )}</div>
                    </div>
                </div>

                <div class="paper-card bg-yellow" style="flex:1; display:flex; flex-direction:column;">
                        <div class="section-tag bg-dark" style="align-self:flex-start;">🧠 BRAIN DUMP</div>
                        <textarea class="jor-textarea-clean u-bg-transparent"
                            style="flex:1; border:none; padding:10px 0; font-size:0.95rem; background-image:linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px); background-size:100% 1.8rem;"
                            placeholder="มีอะไรในหัวพิมพ์ทิ้งไว้เลย..." oninput="App.saveBrainDump(this.value)">${
                              data.brainDump || ""
                            }</textarea>
                    </div>

                <div class="u-flex-col u-gap-lg">
                    <div class="paper-card" style="padding:15px; border-top: 5px solid var(--color-blue);">
                        <div class="u-flex-between u-flex-align-center u-mb-sm">
                            <span class="section-tag bg-blue" style="margin:0; font-size:0.7rem;">🎧 MOOD & TONE</span>
                            <div class="u-text-xs u-font-bold u-text-muted">
                                ${
                                  data.atmosphere === "silence"
                                    ? "OFF"
                                    : "PLAYING..."
                                }
                            </div>
                        </div>

                        <div class="atmosphere-grid">

                            <div class="sound-card ${
                              data.atmosphere === "silence" ? "active" : ""
                            }" onclick="App.playAtmosphere('silence')">
                                <div style="width:100%; height:100%; background:#333; display:flex; align-items:center; justify-content:center;">
                                    <span style="font-size:2rem;">🔇</span>
                                </div>
                                <div class="sound-info"><span class="sound-name">Silence</span></div>
                            </div>

                            <div class="sound-card ${
                              data.atmosphere === "rain" ? "active" : ""
                            }" onclick="App.playAtmosphere('rain')">
                                <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=200&q=80" class="sound-bg">
                                <div class="sound-info"><span class="sound-name">Rainy</span><span class="playing-icon">🎵</span></div>
                            </div>

                            <div class="sound-card ${
                              data.atmosphere === "cafe" ? "active" : ""
                            }" onclick="App.playAtmosphere('cafe')">
                                <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&q=80" class="sound-bg">
                                <div class="sound-info"><span class="sound-name">Cafe</span><span class="playing-icon">🎵</span></div>
                            </div>

                            <div class="sound-card ${
                              data.atmosphere === "nature" ? "active" : ""
                            }" onclick="App.playAtmosphere('nature')">
                                <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80" class="sound-bg">
                                <div class="sound-info"><span class="sound-name">Forest</span><span class="playing-icon">🎵</span></div>
                            </div>

                            <div class="sound-card ${
                              data.atmosphere === "ocean" ? "active" : ""
                            }" onclick="App.playAtmosphere('ocean')">
                                <img src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=200&q=80" class="sound-bg">
                                <div class="sound-info"><span class="sound-name">Ocean</span><span class="playing-icon">🎵</span></div>
                            </div>

                            <div class="sound-card ${
                              data.atmosphere === "fire" ? "active" : ""
                            }" onclick="App.playAtmosphere('fire')">
                                <img src="https://images.unsplash.com/photo-1510137600163-2729bc6999a3?auto=format&fit=crop&w=200&q=80" class="sound-bg">
                                <div class="sound-info"><span class="sound-name">Fire</span><span class="playing-icon">🎵</span></div>
                            </div>

                        </div>
                    </div>


                </div>


            </div>

        </div>
        <style>
            .hover-danger:hover { color: var(--danger) !important; transform: scale(1.2); }
        </style>
    `;
  updateTimerBtnState();
}

// --- Focus & Tasks Logic ---

export function handleSetFocus(val) {
  if (!val.trim()) return;
  appState.today.focus = val;
  saveState();
  renderToday(document.getElementById("content-area"));
  showToast("ตั้งเป้าหมายเรียบร้อย! ลุยเลย", "success");
}

export function handleClearFocus() {
  openModal("สำเร็จแล้ว?", "คุณทำภารกิจหลักเสร็จแล้วใช่ไหม?", () => {
    appState.today.focus = null;
    saveState();
    renderToday(document.getElementById("content-area"));
    showToast("เยี่ยมมาก! ภารกิจสำเร็จ 🎉", "success");
    return true;
  });
}

export function addTodayTask(type, inputEl) {
  const val = inputEl ? inputEl.value.trim() : "";
  if (!val) return;
  if (type === "mustDo" && appState.today.mustDo.length >= 3)
    return showToast("งานด่วนทำแค่ 3 อย่างพอนะ!", "error");

  appState.today[type].push({
    id: GoalSystem.generateId(),
    title: val,
    completed: false,
  });
  saveState();
  inputEl.value = "";
  renderToday(document.getElementById("content-area"));
}

export function toggleTodayTask(type, id) {
  const task = appState.today[type].find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderToday(document.getElementById("content-area"));
  }
}

export function deleteTodayTask(type, id) {
  appState.today[type] = appState.today[type].filter((t) => t.id !== id);
  saveState();
  renderToday(document.getElementById("content-area"));
}

export function saveBrainDump(val) {
  appState.today.brainDump = val;
  saveStateDebounced();
}

export function saveTodayNote(val) {
  appState.today.notes = val;
  saveStateDebounced();
}

// --- Timer Logic ---

export function toggleTimer() {
  if (timerState.isRunning) {
    clearInterval(timerState.interval);
    timerState.isRunning = false;
  } else {
    timerState.isRunning = true;
    timerState.interval = setInterval(() => {
      if (timerState.time > 0) {
        timerState.time--;
        updateTimerDisplay();
      } else {
        playAlarmSound();
        clearInterval(timerState.interval);
        timerState.isRunning = false;

        openModal(
          "หมดเวลาแล้ว! ⏰",
          "<div class='u-text-center u-text-lg'>เก่งมาก! ได้เวลาพักผ่อนสายตาแล้ว</div>",
          () => true
        );
      }
      updateTimerBtnState();
    }, 1000);
  }
  updateTimerBtnState();
}

export function setTimer(minutes) {
  if (timerState.interval) clearInterval(timerState.interval);
  timerState.isRunning = false;
  timerState.time = minutes === 0 ? 25 * 60 : minutes * 60;
  updateTimerDisplay();
  updateTimerBtnState();
}

function updateTimerDisplay() {
  const el = document.getElementById("timer-display");
  if (el) {
    const m = Math.floor(timerState.time / 60)
      .toString()
      .padStart(2, "0");
    const s = (timerState.time % 60).toString().padStart(2, "0");
    el.textContent = `${m}:${s}`;
  }
}

function updateTimerBtnState() {
  const btn = document.getElementById("btn-timer-toggle");
  if (btn) {
    btn.textContent = timerState.isRunning ? "⏸ PAUSE" : "▶ START FOCUS";
    if (timerState.isRunning) {
      btn.classList.add("running");
      btn.style.background = "var(--color-yellow)";
      btn.style.color = "#000";
    } else {
      btn.classList.remove("running");
      btn.style.background = "";
      btn.style.color = "";
    }
  }
}

function playAlarmSound() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = "sine";
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.1;
  oscillator.start();
  setTimeout(() => oscillator.stop(), 500);
}

// --- Atmosphere (Audio) Logic ---

export function playAtmosphere(type) {
  // 1. ถ้ามีเสียงเดิมเล่นอยู่ ให้ปิดก่อน
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // 2. Logic เปิด/ปิด (ถ้ากดปุ่มเดิม หรือกดปุ่ม Silence)
  if (
    type === "silence" ||
    (appState.today.atmosphere === type && type !== "silence")
  ) {
    if (appState.today.atmosphere === type) {
      appState.today.atmosphere = "silence"; // ถ้ากดซ้ำ = ปิด
    } else {
      appState.today.atmosphere = type; // ถ้ากด Silence = ปิด
    }
    saveState();
    renderToday(document.getElementById("content-area"));
    return;
  }

  // 3. อัปเดต State
  appState.today.atmosphere = type;
  saveState();

  // 4. กำหนด Path ไฟล์เสียง
  let url = "";
  switch (type) {
    case "rain":
      url = "assets/audio/rain.mp3";
      break;
    case "cafe":
      url = "assets/audio/cafe.mp3";
      break;
    case "nature":
      url = "assets/audio/nature.mp3";
      break;
    case "ocean":
      url = "assets/audio/ocean.mp3";
      break;
    case "fire":
      url = "assets/audio/fire.mp3";
      break;
    case "night":
      url = "assets/audio/night.mp3";
      break;
  }

  // 5. สั่งเล่นและตั้งค่า Loop
  if (url) {
    currentAudio = new Audio(url);
    currentAudio.loop = true;
    currentAudio.volume = 0.5;

    var playPromise = currentAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          // เล่นสำเร็จ
        })
        .catch((error) => {
          console.error("Audio Load Error:", error);
          showToast(`หาไฟล์ ${url} ไม่เจอ! ตรวจสอบชื่อไฟล์ดีๆ นะ`, "error");
        });
    }
  }

  // 6. รีเฟรชหน้าจอ
  renderToday(document.getElementById("content-area"));
}

// Global Event Listener for Visibility Change (Stop Audio when tab hidden)
document.addEventListener("visibilitychange", () => {
  if (document.hidden && currentAudio) {
    currentAudio.pause();
    // Note: We don't clear currentAudio here to potentially resume,
    // or just let the user restart it. Current logic in app.js was to kill it completely.
    // Let's stick to the original behavior roughly but safest is to just pause.
    // The original code removed elements, but here we use Audio object.
  }
});
