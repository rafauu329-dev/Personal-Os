const App = {
  currentPage: "home",

  currentAudio: null, // เก็บสถานะตัวเล่นเพลง

  libraryFilter: "all",

  journalState: {
    isEditing: false,
    editId: null,
    tempTags: [], // เก็บ Tags ชั่วคราวตอนกำลังเขียน
  },

  timerState: {
    time: 25 * 60,
    isRunning: false,
    interval: null,
    mode: "focus",
  },

  // เพิ่มฟังก์ชันนี้ใน App Object
  bindSidebarEvents() {
    const toggleBtn = document.getElementById("sidebar-toggle");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.querySelector(".sidebar");
    const appLayout = document.getElementById("app-root");
    const navItems = document.querySelectorAll(".nav-item");

    if (!toggleBtn) return;

    const isMobileMode = () => window.innerWidth <= 1024;

    const toggleMenu = () => {
      if (isMobileMode()) {
        // Tablet/Mobile: แบบลอยทับ
        sidebar.classList.toggle("mobile-active");
        overlay.classList.toggle("active");
      } else {
        // PC: แบบหุบเมนู
        appLayout.classList.toggle("desktop-collapsed");
      }
    };

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggleMenu();
    };

    if (overlay) {
      overlay.onclick = () => {
        sidebar.classList.remove("mobile-active");
        overlay.classList.remove("active");
      };
    }

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (isMobileMode()) {
          sidebar.classList.remove("mobile-active");
          overlay.classList.remove("active");
        }
      });
    });
  },

  init() {
    console.log("Life OS v2 Ready...");
    loadState();
    TimeSystem.init();
    this.bindNavigation();
    this.bindSidebarEvents();

    document.addEventListener("time-updated", (e) => {
      this.renderTimeWidget(e.detail);
    });

    TimeSystem.update();
    // ย้าย Timer State มาไว้ที่นี่เพื่อความเป็นระเบียบ
    this.timerState = {
      time: 25 * 60,
      isRunning: false,
      interval: null,
      sessions: 0,
    };
    this.renderView("home");
  },

  // ============================================================
  // 1. UI HELPERS (SYSTEM)
  // ============================================================
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-item ${type}`;
    toast.textContent = message;

    toast.onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal(title, htmlContent, onConfirm) {
    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!overlay || !content) return;

    content.innerHTML = `
            <div class="modal-title">${title}</div>
            <div style="margin-bottom:20px;">${htmlContent}</div>
            <div class="modal-actions">
                <button class="btn-action" id="modal-cancel-btn">ยกเลิก</button>
                <button class="btn-main" id="modal-confirm-btn">ยืนยัน</button>
            </div>
        `;

    document.getElementById("modal-cancel-btn").onclick = () =>
      this.closeModal();

    document.getElementById("modal-confirm-btn").onclick = () => {
      if (onConfirm()) this.closeModal();
    };

    overlay.classList.add("active");

    const input = content.querySelector("input");
    if (input) input.focus();

    content.onkeyup = (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        document.getElementById("modal-confirm-btn").click();
      }
    };
  },

  closeModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.classList.remove("active");
  },

  // ============================================================
  // 2. NAVIGATION
  // ============================================================
  bindNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const pages = [
      "home",
      "goals",
      "today",
      "library",
      "tools",
      "reviews",
      "settings",
    ];

    navItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");
        this.navigateTo(pages[index]);
      });
    });
  },

  navigateTo(pageName) {
    this.currentPage = pageName;
    this.renderView(pageName);
  },

  renderView(pageName) {
    const contentArea = document.getElementById("content-area");
    const pageTitle = document.getElementById("page-title");
    contentArea.innerHTML = "";

    switch (pageName) {
      case "home":
        pageTitle.textContent = "Home";
        this.renderDashboard(contentArea);
        break;
      case "goals":
        pageTitle.textContent = "Goals";
        this.renderGoals(contentArea);
        break;
      case "today":
        pageTitle.textContent = "Focus";
        this.renderToday(contentArea);
        break;
      case "library":
        pageTitle.textContent = "Library";
        this.renderLibrary(contentArea);
        break;
      case "tools":
        pageTitle.textContent = "Tools";
        this.renderToolsHub(contentArea);
        break;
      case "reviews":
        pageTitle.textContent = "Review";
        this.renderReviews(contentArea);
        break;
      case "settings":
        pageTitle.textContent = "Settings";
        this.renderSettings(contentArea);
        break;
      default:
        pageTitle.textContent = pageName.toUpperCase();
        contentArea.innerHTML = `<p class="placeholder-text">กำลังก่อสร้าง...</p>`;
    }
  },

  // ============================================================
  // 3. DASHBOARD
  // ============================================================
  renderDashboard(container) {
    const timeData = TimeSystem.current || {
      weekNumber: 0,
      progress: { day: 0 },
      dayPart: "Day",
    };
    const todayData = appState.today || { focus: null };
    const now = new Date();
    const dateStr = now.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    // Active Goals
    const goalsHTML =
      appState.goals && appState.goals.length > 0
        ? appState.goals
            .slice(0, 3)
            .map((g) => {
              const prog = GoalSystem.calculateProgress(g);
              return `
                <div style="margin-bottom:12px; cursor:pointer;" onclick="App.navigateTo('goals')">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; font-weight:700;">
                        <span>${g.title}</span>
                        <span>${prog}%</span>
                    </div>
                    <div class="p-bar"><div class="p-fill" style="width:${prog}%"></div></div>
                </div>`;
            })
            .join("")
        : `<div style="text-align:center; color:var(--text-muted); font-size:0.9rem;">- ยังไม่มีเป้าหมาย -</div>`;

    // Habits Today
    const todayKey = now.toLocaleDateString("th-TH");
    const habitsHTML =
      appState.tools &&
      appState.tools.habits &&
      appState.tools.habits.length > 0
        ? appState.tools.habits
            .map((h) => {
              const isDone = h.lastDone === todayKey;
              return `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border-color);">
                    <span style="font-weight:600; font-size:0.9rem; ${
                      isDone
                        ? "text-decoration:line-through; color:var(--text-muted);"
                        : ""
                    }">${h.name}</span>
                    <div style="width:24px; height:24px; border:2px solid var(--border-color); border-radius:6px; background:${
                      isDone ? "var(--color-green)" : "white"
                    }; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:2px 2px 0 rgba(0,0,0,0.1);"
                         onclick="App.checkHabit('${
                           h.id
                         }'); setTimeout(()=>App.renderView('home'), 100);">
                         ${
                           isDone
                             ? '<span style="color:white; font-size:14px;">✓</span>'
                             : ""
                         }
                    </div>
                </div>`;
            })
            .join("")
        : `<div style="text-align:center; padding:10px; border:2px dashed var(--border-color); border-radius:8px;">ยังไม่มีนิสัย</div>`;

    // Money Today
    const moneyToday =
      appState.tools && appState.tools.money
        ? appState.tools.money.transactions
            .filter((t) => t.date === todayKey && t.type === "expense")
            .reduce((s, t) => s + t.amount, 0)
        : 0;

    // Render UI
    container.innerHTML = `
            <div class="dashboard-grid-v2">
        <div class="paper-card" style="background:var(--color-yellow); border:var(--border-std); box-shadow:var(--shadow-hard); display:flex; flex-direction:column; justify-content:space-between; min-height: 220px;">
            <div>
                <div class="section-tag" style="background:#000; color:#fff; border:var(--border-std);">SYSTEM STATUS</div>
                <div style="font-size:1.5rem; font-weight:900; line-height:1.2; color:var(--text-main); text-transform:uppercase;">Mission Progress</div>
                <div style="font-size:0.8rem; font-weight:700; color:rgba(0,0,0,0.6); margin-top:5px;">YEAR ${currentYear} // QUARTER ${currentQuarter}</div>
            </div>
            <div style="margin-top:20px;">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:800; margin-bottom:4px;">
                    <span>YEAR PROGRESS</span>
                    <span>${timeData.progress.year}%</span>
                </div>
                <div class="p-bar" style="height:12px; background:rgba(255,255,255,0.5); border:var(--border-std);">
                    <div class="p-fill" style="width:${
                      timeData.progress.year
                    }%; background:var(--text-main); border-right:var(--border-std);"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:800; margin-top:12px; margin-bottom:4px;">
                    <span>ACTIVE PHASE</span>
                    <span>${timeData.dayPart}</span>
                </div>
                <div style="font-size:0.9rem; font-weight:900; color:var(--text-main); letter-spacing:1px;">STAY FOCUSED, COMMANDER.</div>
            </div>
        </div>

        <div class="paper-card" style="background:var(--color-yellow); border:var(--border-std); box-shadow:var(--shadow-hard);">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <div style="font-size:3.5rem; font-weight:900; line-height:1; letter-spacing:-2px;">${timeStr}</div>
                    <div style="font-size:1rem; font-weight:700; margin-top:5px;">${dateStr}</div>
                </div>
                <div class="section-tag" style="background:#000; color:#fff; border:var(--border-std);">WEEK ${
                  timeData.weekNumber
                }</div>
            </div>
            <div style="margin-top:15px; padding-top:15px; border-top:2px dashed var(--border-color);">
                <div class="p-bar" style="height:12px; background:rgba(255,255,255,0.5); border:var(--border-std);">
                    <div class="p-fill" style="width:${
                      timeData.progress.day
                    }%; background:var(--text-main); border-right:var(--border-std);"></div>
                </div>
                <div style="text-align:right; font-size:0.7rem; font-weight:800; margin-top:4px;">DAY PROGRESS: ${
                  timeData.progress.day
                }%</div>
            </div>
        </div>

        <div class="paper-card" style="background:var(--text-main); color:#fff; border:var(--border-std); box-shadow:var(--shadow-hard);">
            <div class="section-tag" style="background:#fff; color:#000; border:var(--border-std);">Quote</div>
            <div style="font-family:serif; font-style:italic; font-size:1.1rem; line-height:1.6; margin-top:5px; opacity:0.9;">
                "The best way to predict the future is to create it."
            </div>
        </div>

        <div class="paper-card" style="grid-column: span 2; border:var(--border-std); border-left:12px solid var(--color-pink); box-shadow:var(--shadow-hard);">
            <div class="section-tag" style="background:var(--color-pink); color:#fff; border:var(--border-std);">ABSOLUTE FOCUS</div>
            <div style="padding:10px 0; text-align:center;">
                <div style="font-size:2rem; font-weight:900; line-height:1.3;">"${
                  todayData.focus || "ยังไม่มีเป้าหมายวันนี้..."
                }"</div>
                ${
                  !todayData.focus
                    ? `<button class="btn-action" style="margin-top:15px; border:var(--border-std);" onclick="App.navigateTo('today')">กำหนดงานสำคัญ</button>`
                    : ""
                }
            </div>
        </div>

        <div class="paper-card" style="border:var(--border-std); box-shadow:var(--shadow-hard);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <div class="section-tag" style="background:var(--color-green); color:#000; border:var(--border-std);">Habits</div>
                <button class="btn-action" style="padding:2px 8px; font-size:0.7rem; border:var(--border-std);" onclick="App.navigateTo('tools')">EDIT</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">${habitsHTML}</div>
        </div>

        <div class="paper-card" style="border:var(--border-std); border-top: 8px solid var(--color-purple); box-shadow:var(--shadow-hard);">
            <div class="section-tag" style="background:var(--color-purple); color:#fff; border:var(--border-std);">Goals Progress</div>
            <div style="margin-top:5px;">${goalsHTML}</div>
        </div>

        <div class="paper-card" style="grid-column: span 2; border:var(--border-std); border-top: 8px solid var(--text-muted); background: #fdfbf7; box-shadow:var(--shadow-hard); min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="section-tag" style="background:var(--text-muted); color:#fff; border:var(--border-std);">System Pulse</div>
                <div style="font-size:0.7rem; font-weight:800; font-family:monospace; color:var(--color-green);">● SYSTEM_STABLE // 100%</div>
            </div>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:10px;">
                <div style="padding:10px; border:2px dashed var(--border-color); border-radius:8px; background:#fff; text-align:center;">
                    <div style="font-size:0.6rem; font-weight:800; color:var(--text-muted);">KNOWLEDGE</div>
                    <div style="font-size:1.4rem; font-weight:900;">${
                      appState.library?.length || 0
                    }</div>
                </div>
                <div style="padding:10px; border:2px dashed var(--border-color); border-radius:8px; background:#fff; text-align:center;">
                    <div style="font-size:0.6rem; font-weight:800; color:var(--text-muted);">EXERCISE</div>
                    <div style="font-size:1.4rem; font-weight:900;">${
                      appState.tools.exercise?.length || 0
                    }</div>
                </div>
                <div style="padding:10px; border:2px dashed var(--border-color); border-radius:8px; background:#fff; text-align:center;">
                    <div style="font-size:0.6rem; font-weight:800; color:var(--text-muted);">JOURNAL</div>
                    <div style="font-size:1.4rem; font-weight:900;">${
                      appState.tools.journal?.length || 0
                    }</div>
                </div>
            </div>
        </div>

        <div class="paper-card" style="grid-column: span 1; border:var(--border-std); border-top: 8px solid var(--color-red); box-shadow:var(--shadow-hard);">
            <div class="section-tag" style="background:var(--color-red); color:#fff; border:var(--border-std);">Financial Status</div>
            <div style="margin: 10px 0;">
                <div style="font-size:0.65rem; font-weight:800; color:var(--text-muted);">USED TODAY</div>
                <div style="font-size:2.2rem; font-weight:900; color:var(--color-red); line-height:1;">${moneyToday.toLocaleString()} ฿</div>
            </div>
            <div style="padding:10px; background:var(--bg-soft); border:var(--border-std); border-radius:8px;">
                <div style="display:flex; justify-content:space-between; font-size:0.6rem; font-weight:800;">
                    <span>BUDGET</span>
                    <span>${(
                      appState.tools.money?.budget || 0
                    ).toLocaleString()} ฿</span>
                </div>
                ${(() => {
                  const budget = appState.tools.money?.budget || 0;
                  const monthExpense = (
                    appState.tools.money?.transactions || []
                  )
                    .filter(
                      (t) =>
                        new Date(t.rawDate || Date.now()).getMonth() ===
                          new Date().getMonth() && t.type === "expense"
                    )
                    .reduce((s, t) => s + t.amount, 0);
                  const percent =
                    budget > 0
                      ? Math.min((monthExpense / budget) * 100, 100)
                      : 0;
                  return `
                        <div class="p-bar" style="height:8px; border:1.5px solid var(--border-color);"><div class="p-fill" style="width:${percent}%; background:var(--color-red);"></div></div>
                        <div style="text-align:right; font-size:0.6rem; font-weight:800; margin-top:4px;">${percent.toFixed(
                          0
                        )}% SPENT</div>
                    `;
                })()}
            </div>
        </div>


    </div>





        `;
  },

  // ============================================================
  // 4. TODAY VIEW (UPDATED: NEW UI & LOGIC)
  // ============================================================
  renderToday(container) {
    // 1. Init State
    if (!appState.today) {
      appState.today = {
        focus: null,
        mustDo: [],
        niceToDo: [],
        notes: "",
        brainDump: "",
        atmosphere: "silence", // silence, rain, cafe
      };
    }
    const data = appState.today;

    // 2. Timer Init
    if (typeof this.timerState === "undefined") {
      this.timerState = {
        time: 25 * 60,
        isRunning: false,
        interval: null,
        sessions: 0,
      };
    }

    // Helper: Render Task List
    const renderList = (list, type) =>
      (list || [])
        .map(
          (task) => `
        <div style="display:flex; align-items:center; padding:8px 0; border-bottom:1px dashed #ccc;">
            <input type="checkbox" style="margin-right:10px; accent-color:var(--text-main); width:18px; height:18px; cursor:pointer;"
                ${task.completed ? "checked" : ""}
                onchange="App.toggleTodayTask('${type}', '${task.id}')">
            <span style="flex:1; font-weight:600; text-decoration:${
              task.completed ? "line-through" : "none"
            }; opacity:${task.completed ? 0.5 : 1};">
                ${task.title}
            </span>
            <button onclick="App.deleteTodayTask('${type}', '${
            task.id
          }')" style="border:none; background:none; color:var(--danger); cursor:pointer; font-weight:bold;">×</button>
        </div>
    `
        )
        .join("");

    // 3. UI RENDERING (NEW LAYOUT)
    container.innerHTML = `
        <div class="dashboard-grid-v2">

            <div style="grid-column: span 2; display:flex; flex-direction:column; gap:20px;">

                <div class="paper-card" style="border-left:8px solid var(--color-blue);">
                    <div class="section-tag" style="background:var(--color-blue); color:#fff;"> MAIN FOCUS</div>
                    ${
                      data.focus
                        ? `<div style="text-align:center; padding:15px;">
                             <div style="font-size:1.8rem; font-weight:800; margin-bottom:15px; line-height:1.3;">"${data.focus}"</div>
                             <button class="btn-action" style="background:var(--success); color:#fff;" onclick="App.handleClearFocus()">เสร็จแล้ว!</button>
                           </div>`
                        : `<div style="text-align:center; padding:15px;">
                            <input type="text" class="input-std" placeholder="งานสำคัญชิ้นเดียววันนี้... (Enter)"
                            style="text-align:center; font-size:1.2rem; border:none; border-bottom:2px solid #eee;"
                            onkeypress="if(event.key==='Enter') App.handleSetFocus(this.value)">
                           </div>`
                    }
                </div>

                <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:20px;">

                    <div class="timer-box">
                        <div style="font-size:0.8rem; font-weight:700; color:#888;">POMODORO TIMER</div>
                        <div id="timer-display" class="timer-digits">
                            ${Math.floor(this.timerState.time / 60)
                              .toString()
                              .padStart(2, "0")}:${(this.timerState.time % 60)
      .toString()
      .padStart(2, "0")}
                        </div>

                        <div class="timer-controls-grid">
                            <button class="btn-time-set" onclick="App.setTimer(25)">25m</button>
                            <button class="btn-time-set" onclick="App.setTimer(50)">50m</button>
                            <button class="btn-time-set" onclick="App.setTimer(110)">1h 50m</button>

                            <button class="btn-time-set" onclick="App.setTimer(5)">Break 5</button>
                            <button class="btn-time-set" onclick="App.setTimer(15)">Break 15</button>
                            <button class="btn-time-set" onclick="App.setTimer(0)">Reset</button>

                            <button id="btn-timer-toggle" class="btn-main-toggle" onclick="App.toggleTimer()">
                                ${
                                  this.timerState.isRunning
                                    ? "PAUSE"
                                    : "START FOCUS"
                                }
                            </button>
                        </div>
                    </div>

                    <div class="atmosphere-player">
                        <div>
                            <div style="font-weight:800; margin-bottom:10px;">🎧 ATMOSPHERE</div>
                            <div class="player-screen">
                                <div style="font-size:1.5rem;">🎵</div>
                                <div class="track-info">
                                    <span class="track-title">
                                        ${
                                          data.atmosphere === "rain"
                                            ? "Rainy Mood"
                                            : data.atmosphere === "cafe"
                                            ? "Coffee Shop"
                                            : "Silence"
                                        }
                                    </span>
                                    <span class="track-artist">Sound Station</span>
                                </div>
                                <div style="display:${
                                  data.atmosphere !== "silence"
                                    ? "flex"
                                    : "none"
                                }; gap:2px; height:15px; align-items:flex-end;">
                                    <div style="width:3px; height:100%; background:#fff; animation: eq 0.5s infinite;"></div>
                                    <div style="width:3px; height:60%; background:#fff; animation: eq 0.5s infinite 0.2s;"></div>
                                    <div style="width:3px; height:80%; background:#fff; animation: eq 0.5s infinite 0.4s;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="player-controls">
                            <button class="btn-sound ${
                              data.atmosphere === "silence" ? "active" : ""
                            }" onclick="App.playAtmosphere('silence')">🔇</button>
                            <button class="btn-sound ${
                              data.atmosphere === "rain" ? "active" : ""
                            }" onclick="App.playAtmosphere('rain')">🌧</button>
                            <button class="btn-sound ${
                              data.atmosphere === "cafe" ? "active" : ""
                            }" onclick="App.playAtmosphere('cafe')">☕️</button>
                        </div>
                    </div>

                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div class="paper-card" style="border-top:5px solid var(--danger);">
                        <div class="section-tag" style="background:var(--danger); color:#fff;"> Must Do</div>
                        <input type="text" class="input-std" placeholder="+ เพิ่มงาน (Enter)" style="margin-bottom:10px;"
                            onkeypress="if(event.key==='Enter') App.addTodayTask('mustDo', this)">
                        <div id="list-mustdo">${renderList(
                          data.mustDo,
                          "mustDo"
                        )}</div>
                    </div>
                    <div class="paper-card" style="border-top:5px solid var(--success);">
                        <div class="section-tag" style="background:var(--success); color:#fff;"> Nice to Do</div>
                        <input type="text" class="input-std" placeholder="+ เพิ่มงาน (Enter)" style="margin-bottom:10px;"
                            onkeypress="if(event.key==='Enter') App.addTodayTask('niceToDo', this)">
                        <div id="list-nicedo">${renderList(
                          data.niceToDo,
                          "niceToDo"
                        )}</div>
                    </div>
                </div>

            </div>

            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="paper-card" style="background:var(--color-yellow);">
                    <div class="section-tag" style="background:#000; color:#fff;"> Brain Dump</div>
                    <textarea style="width:100%; height:150px; border:none; background:transparent; resize:none; outline:none;"
                        placeholder="ฟุ้งซ่านอะไร พิมพ์ทิ้งไว้ตรงนี้..."
                        oninput="App.saveBrainDump(this.value)">${
                          data.brainDump || ""
                        }</textarea>
                </div>
                 <div class="paper-card" style="flex:1;">
                    <div class="section-tag"> Notes</div>
                    <textarea style="width:100%; height:100%; border:none; background:transparent; resize:none; outline:none;"
                        placeholder="จดบันทึก..."
                        oninput="App.saveTodayNote(this.value)">${
                          data.notes || ""
                        }</textarea>
                </div>
            </div>

        </div>
        <style>@keyframes eq { 0% {height:20%} 50% {height:100%} 100% {height:20%} }</style>
    `;

    this.updateTimerBtnState();
  },

  // ============================================================
  // 5. GOALS MODULE
  // ============================================================
  renderGoals(container) {
    // Header
    container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <div>
                    <div class="section-tag" style="background:var(--color-purple); color:#fff;">Life Map</div>
                    <div style="font-size:0.9rem; color:var(--text-muted); margin-top:5px;">แผนที่ชีวิตและการเดินทางของคุณ</div>
                </div>
                <button class="btn-main" onclick="App.handleAddGoal()">+ สร้างเป้าหมายใหญ่</button>
            </div>
        `;

    // Empty State
    if (!appState.goals || appState.goals.length === 0) {
      container.innerHTML += `
                <div class="paper-card" style="text-align:center; padding:50px; border:2px dashed var(--border-color);">
                    <div style="font-size:4rem; margin-bottom:20px;">+</div>
                    <div style="font-size:1.2rem; font-weight:700; margin-bottom:10px;">ยังไม่มีเป้าหมาย</div>
                    <div style="color:var(--text-muted); margin-bottom:20px;">เริ่มต้นวาดแผนที่ชีวิตของคุณได้เลย</div>
                    <button class="btn-action" onclick="App.handleAddGoal()">เริ่มต้นเดี๋ยวนี้</button>
                </div>`;
      return;
    }

    const goalsContainer = document.createElement("div");
    goalsContainer.className = "goal-container";

    appState.goals.forEach((goal, index) => {
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
      goalCard.className = "paper-card";
      goalCard.style.borderTop = `8px solid ${themeColor}`;
      goalCard.style.marginBottom = "30px";

      goalCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; cursor:pointer;" onclick="App.toggleExpand('${
                  goal.id
                }')">
                    <div style="display:flex; gap:15px; align-items:center;">
                        <div style="font-size:3rem; background:var(--bg-main); width:70px; height:70px; display:flex; align-items:center; justify-content:center; border:2px solid var(--border-color); border-radius:12px; box-shadow:4px 4px 0 rgba(0,0,0,0.1);">
                            ${goal.icon || "🎯"}
                        </div>
                        <div>
                            <div style="font-size:1.4rem; font-weight:900; line-height:1.2; margin-bottom:5px;">${
                              goal.title
                            }</div>
                            <div style="font-size:0.8rem; color:var(--text-muted);">Progress: ${progress}%</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <button class="btn-action" style="padding:4px 8px; font-size:0.7rem; color:var(--danger); border-color:var(--danger);" onclick="event.stopPropagation(); App.deleteGoal('${
                          goal.id
                        }')">LBU</button>
                        <div style="font-size:1.5rem; transform:${
                          goal.expanded ? "rotate(180deg)" : "rotate(0)"
                        }; transition:0.2s;">▼</div>
                    </div>
                </div>

                <div class="p-bar" style="height:16px; margin-top:20px; border:2px solid var(--border-color); background:#fff;">
                    <div class="p-fill" style="width:${progress}%; background:${themeColor}; box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2);"></div>
                </div>

                <div style="display: ${
                  goal.expanded ? "block" : "none"
                }; margin-top:30px; padding-top:20px; border-top:2px dashed var(--border-color);">
                    <div id="topics-${goal.id}"></div>
                    <button class="btn-action" style="width:100%; margin-top:20px; border-style:dashed; background:var(--bg-soft);" onclick="App.handleAddTopic('${
                      goal.id
                    }')">
                        + เพิ่มหัวข้อหลัก (Topic)
                    </button>
                </div>
            `;
      goalsContainer.appendChild(goalCard);

      // Render Topics
      const topicContainer = goalCard.querySelector(`#topics-${goal.id}`);
      goal.topics.forEach((topic) => {
        const topicEl = document.createElement("div");
        topicEl.className = "topic-item";
        topicEl.style.marginLeft = "20px";
        topicEl.style.marginTop = "20px";
        topicEl.style.paddingLeft = "20px";
        topicEl.style.borderLeft = `4px solid ${themeColor}`;

        topicEl.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="font-weight:800; font-size:1.1rem; color:var(--text-main);">${topic.title} <span style="font-weight:400; font-size:0.8rem; color:var(--text-muted);">(${topic.progress}%)</span></div>
                        <div style="display:flex; gap:5px;">
                            <button class="btn-add" style="padding:2px 8px; font-size:0.7rem;" onclick="App.handleAddSubtopic('${goal.id}', '${topic.id}')">+ เรื่องย่อย</button>
                            <button class="btn-action" style="padding:2px 6px; font-size:0.7rem; color:var(--danger);" onclick="App.deleteTopic('${goal.id}', '${topic.id}')">×</button>
                        </div>
                    </div>
                    <div id="sub-${topic.id}"></div>
                `;
        topicContainer.appendChild(topicEl);

        // Render Subtopics
        const subContainer = topicEl.querySelector(`#sub-${topic.id}`);
        topic.subtopics.forEach((sub) => {
          const subEl = document.createElement("div");
          subEl.className = "subtopic-item";
          subEl.style.background = "#fff";
          subEl.style.border = "1px solid var(--border-color)";
          subEl.style.borderRadius = "8px";
          subEl.style.padding = "15px";
          subEl.style.marginBottom = "10px";
          subEl.style.boxShadow = "3px 3px 0 rgba(0,0,0,0.05)";

          subEl.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid var(--border-soft);">
                            <div style="font-weight:700;">${sub.title}</div>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-add" style="padding:2px 6px; font-size:0.7rem;" onclick="App.handleAddTask('${goal.id}', '${topic.id}', '${sub.id}')">+ งาน</button>
                                <button class="btn-action" style="padding:2px 6px; font-size:0.7rem; color:var(--text-muted);" onclick="App.deleteSubtopic('${goal.id}', '${topic.id}', '${sub.id}')">×</button>
                            </div>
                        </div>
                        <div id="tasks-${sub.id}" style="display:flex; flex-direction:column; gap:8px;"></div>
                    `;
          subContainer.appendChild(subEl);

          // Render Tasks
          const taskContainer = subEl.querySelector(`#tasks-${sub.id}`);
          sub.tasks.forEach((task) => {
            const taskEl = document.createElement("div");
            taskEl.innerHTML = `
                            <label style="display:flex; align-items:center; cursor:pointer; padding:4px 0; transition:0.2s;">
                                <input type="checkbox" style="width:18px; height:18px; accent-color:${themeColor};"
                                    ${task.isComplete ? "checked" : ""}
                                    onchange="App.handleToggleTask('${
                                      goal.id
                                    }', '${topic.id}', '${sub.id}', '${
              task.id
            }')">
                                <span class="${
                                  task.isComplete ? "text-muted" : ""
                                }" style="font-size:0.95rem; margin-left:10px; ${
              task.isComplete
                ? "text-decoration:line-through; opacity:0.6;"
                : ""
            }">${task.title}</span>
                                <button onclick="event.preventDefault(); App.deleteTask('${
                                  goal.id
                                }', '${topic.id}', '${sub.id}', '${task.id}')"
                                    style="margin-left:auto; background:none; border:none; color:var(--border-color); opacity:0.3; cursor:pointer; font-weight:bold;">×</button>
                            </label>
                        `;
            taskContainer.appendChild(taskEl);
          });
        });
      });
    });
    container.appendChild(goalsContainer);
  },

  // --- GOAL ACTIONS ---

  handleAddGoal() {
    const formHTML = `
            <div style="margin-bottom:15px;">
                <label style="font-weight:700; font-size:0.9rem;">ชื่อเป้าหมาย</label>
                <input type="text" id="modal-input" class="input-std" placeholder="เช่น: อิสรภาพทางการเงิน">
            </div>
            <div>
                <label style="font-weight:700; font-size:0.9rem;">เลือกไอคอน</label>
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
    this.openModal("สร้างเป้าหมายใหม่", formHTML, () => {
      const val = document.getElementById("modal-input").value;
      const icon = document.getElementById("modal-icon").value;
      if (!val) {
        this.showToast("กรุณากรอกชื่อเป้าหมาย", "error");
        return false;
      }
      const newGoal = GoalSystem.createGoal(val);
      newGoal.icon = icon;
      appState.goals.push(newGoal);
      saveState();
      this.renderView("goals");
      this.showToast(`สร้างเป้าหมาย "${val}" สำเร็จ!`, "success");
      return true;
    });
  },

  handleAddTopic(goalId) {
    this.openModal(
      "เพิ่มหัวข้อ (Topic)",
      `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: การลงทุน">`,
      () => {
        const val = document.getElementById("modal-input").value;
        if (!val) return false;
        const goal = appState.goals.find((g) => g.id === goalId);
        goal.topics.push(GoalSystem.createTopic(val));
        saveState();
        this.renderView("goals");
        this.showToast("เพิ่มหัวข้อเรียบร้อย", "success");
        return true;
      }
    );
  },

  handleAddSubtopic(goalId, topicId) {
    this.openModal(
      "เพิ่มเรื่องย่อย (Subtopic)",
      `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: ศึกษาเรื่องกองทุน">`,
      () => {
        const val = document.getElementById("modal-input").value;
        if (!val) return false;
        const goal = appState.goals.find((g) => g.id === goalId);
        const topic = goal.topics.find((t) => t.id === topicId);
        topic.subtopics.push(GoalSystem.createSubtopic(val));
        saveState();
        this.renderView("goals");
        this.showToast("เพิ่มเรื่องย่อยแล้ว", "success");
        return true;
      }
    );
  },

  handleAddTask(goalId, topicId, subId) {
    this.openModal(
      "เพิ่มงาน (Task)",
      `<input type="text" id="modal-input" class="input-std" placeholder="เช่น: อ่านหนังสือ 1 บท">`,
      () => {
        const val = document.getElementById("modal-input").value;
        if (!val) return false;
        const goal = appState.goals.find((g) => g.id === goalId);
        const topic = goal.topics.find((t) => t.id === topicId);
        const sub = topic.subtopics.find((s) => s.id === subId);
        sub.tasks.push(GoalSystem.createTask(val));
        saveState();
        this.renderView("goals");
        this.showToast("เพิ่มงานสำเร็จ! ลุยเลย", "success");
        return true;
      }
    );
  },

  handleToggleTask(gId, tId, sId, taskId) {
    GoalSystem.toggleTask(gId, tId, sId, taskId);
    this.renderView("goals");
    const goal = appState.goals.find((g) => g.id === gId);
    const topic = goal.topics.find((t) => t.id === tId);
    const sub = topic.subtopics.find((s) => s.id === sId);
    const task = sub.tasks.find((t) => t.id === taskId);
    if (task.isComplete) {
      this.showToast("เยี่ยมมาก! เสร็จไปอีกหนึ่งงาน ", "success");
    }
  },

  toggleExpand(id) {
    const goal = appState.goals.find((g) => g.id === id);
    if (goal) {
      goal.expanded = !goal.expanded;
      this.renderView("goals");
    }
  },

  deleteGoal(id) {
    this.openModal(
      "ลบเป้าหมาย?",
      "คุณแน่ใจไหม? ข้อมูลทั้งหมดในเป้าหมายนี้จะหายไป",
      () => {
        appState.goals = appState.goals.filter((g) => g.id !== id);
        saveState();
        this.renderView("goals");
        this.showToast("ลบเป้าหมายแล้ว", "info");
        return true;
      }
    );
  },

  deleteTopic(gId, tId) {
    if (!confirm("ลบหัวข้อนี้?")) return;
    const goal = appState.goals.find((g) => g.id === gId);
    goal.topics = goal.topics.filter((t) => t.id !== tId);
    saveState();
    this.renderView("goals");
    this.showToast("ลบหัวข้อแล้ว", "info");
  },

  deleteSubtopic(gId, tId, sId) {
    if (!confirm("ลบเรื่องย่อยนี้?")) return;
    const goal = appState.goals.find((g) => g.id === gId);
    const topic = goal.topics.find((t) => t.id === tId);
    topic.subtopics = topic.subtopics.filter((s) => s.id !== sId);
    saveState();
    this.renderView("goals");
    this.showToast("ลบเรื่องย่อยแล้ว", "info");
  },

  deleteTask(gId, tId, sId, taskId) {
    const goal = appState.goals.find((g) => g.id === gId);
    const topic = goal.topics.find((t) => t.id === tId);
    const sub = topic.subtopics.find((s) => s.id === sId);
    sub.tasks = sub.tasks.filter((t) => t.id !== taskId);
    saveState();
    this.renderView("goals");
    this.showToast("ลบงานแล้ว", "info");
  },

  // ============================================================
  // 6. LIBRARY (COVER EDITION)
  // ============================================================
  renderLibrary(container) {
    if (!appState.library) appState.library = [];

    // 1. ส่วนหัวและปุ่มควบคุม
    const headerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <div>
                <div class="section-tag" style="background:var(--color-blue);"> My Library</div>
            </div>
            <button class="btn-main" onclick="App.handleAddLibrary()">+ New Item</button>
        </div>

        <div class="library-controls">
            <button class="lib-filter-btn ${
              this.libraryFilter === "all" ? "active" : ""
            }"
                onclick="App.setLibFilter('all')">ทั้งหมด (${
                  appState.library.length
                })</button>

            <button class="lib-filter-btn ${
              this.libraryFilter === "reading" ? "active" : ""
            }"
                onclick="App.setLibFilter('reading')">▶ กำลังอ่าน</button>

            <button class="lib-filter-btn ${
              this.libraryFilter === "todo" ? "active" : ""
            }"
                onclick="App.setLibFilter('todo')"> ดองไว้</button>

            <button class="lib-filter-btn ${
              this.libraryFilter === "done" ? "active" : ""
            }"
                onclick="App.setLibFilter('done')"> อ่านจบ</button>
        </div>
    `;

    // 2. การกรองข้อมูล (Filtering)
    let filteredList = appState.library;
    if (this.libraryFilter !== "all") {
      filteredList = appState.library.filter(
        (item) => item.status === this.libraryFilter
      );
    }

    // เรียงลำดับ (เอาที่เพิ่งเพิ่มขึ้นก่อน)
    filteredList.sort((a, b) => b.id - a.id);

    // 3. ฟังก์ชันย่อยสร้างการ์ด HTML
    const createCard = (item) => {
      // จัดการรูปปก (ถ้าไม่มีรูป ให้โชว์ไอคอน)
      const coverHTML = item.cover
        ? `<img src="${
            item.cover
          }" class="book-cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <div class="no-cover" style="display:none"><span>${getIcon(
                 item.type
               )}<br>No Image</span></div>`
        : `<div class="no-cover"><span>${getIcon(item.type)}</span></div>`;

      // กำหนดสีสันหนังสือตามประเภท
      const spineClass = `spine-${item.type}`;

      // ปุ่ม Action ตามสถานะ
      let actionBtns = "";
      const btnStyle =
        "font-size:0.65rem; font-weight:900; background:#000; color:#fff; border:none; padding:2px 6px; border-radius:3px; cursor:pointer; transition:0.1s;";

      if (item.status === "todo") {
        actionBtns += `<button class="btn-icon-sm" title="เริ่มอ่าน" style="${btnStyle}" onclick="App.setLibraryStatus('${item.id}', 'reading')">GO</button>`;
      } else if (item.status === "reading") {
        actionBtns += `<button class="btn-icon-sm" title="อ่านจบแล้ว" style="${btnStyle} background:var(--color-green);" onclick="App.setLibraryStatus('${item.id}', 'done')">FIN</button>`;
        actionBtns += `<button class="btn-icon-sm" title="พักไว้ก่อน" style="${btnStyle} opacity:0.4;" onclick="App.setLibraryStatus('${item.id}', 'todo')">OFF</button>`;
      } else if (item.status === "done") {
        actionBtns += `<button class="btn-icon-sm" title="อ่านซ้ำ" style="${btnStyle}" onclick="App.setLibraryStatus('${item.id}', 'reading')">RE</button>`;
      }

      // ปุ่มลบ เปลี่ยนเป็นดีไซน์เดียวกัน
      const delBtnStyle =
        "font-size:0.65rem; font-weight:900; background:transparent; color:var(--danger); border:1.5px solid var(--danger); padding:1px 5px; border-radius:3px; cursor:pointer;";

      return `
            <div class="book-card ${spineClass}">
                <div class="book-type-badge">${item.type.toUpperCase()}</div>

                <div class="book-cover-area">
                    ${coverHTML}
                </div>

                <div class="book-details">
                    <div class="book-title" title="${item.title}">${
        item.title
      }</div>
                    <div class="book-author">${item.author || "-"}</div>

                    <div class="book-actions">
                        ${actionBtns}
                        <button class="btn-icon-sm" style="color:var(--danger);" title="ลบ" onclick="App.deleteLibraryItem('${
                          item.id
                        }')">🗑</button>
                    </div>
                </div>
            </div>
        `;
    };

    // Helper ไอคอน
    const getIcon = (type) =>
      ({ book: "", course: "", article: "", note: "" }[type] || "");

    // 4. ประกอบร่าง
    let contentHTML = "";
    if (filteredList.length > 0) {
      contentHTML = `<div class="library-grid">${filteredList
        .map(createCard)
        .join("")}</div>`;
    } else {
      contentHTML = `
            <div class="library-empty">
                <div style="font-size:3rem; margin-bottom:10px; opacity:0.5;">🕸️</div>
                <div>ไม่มีรายการในหมวดนี้</div>
            </div>`;
    }

    container.innerHTML = headerHTML + contentHTML;
  },

  // ฟังก์ชันตั้งค่า Filter
  setLibFilter(filterName) {
    this.libraryFilter = filterName;
    this.renderView("library"); // รีเฟรชหน้า
  },
  handleAddLibrary() {
    const html = `
        <div style="display:grid; gap:15px;">
            <div>
                <label style="font-weight:700; font-size:0.9rem; color:var(--text-main);"> ประเภท</label>
                <select id="lib-type" class="input-std">
                    <option value="book"> หนังสือ (Book) </option>
                    <option value="course"> คอร์ส (Course) </option>
                    <option value="article"> บทความ (Article) </option>
                    <option value="note"> โน้ต (Note) </option>
                    <option value="movie"> หนัง (Movies) </option>
                    <option value="manga"> มังงะ (Manga) </option>
                    <option value="series"> series (Series) </option>


                </select>
            </div>

            <div>
                <label style="font-weight:700; font-size:0.9rem; color:var(--text-main);"> ชื่อเรื่อง</label>
                <input type="text" id="lib-title" class="input-std" placeholder="เช่น: Atomic Habits" autocomplete="off">
            </div>

            <div>
                <label style="font-weight:700; font-size:0.9rem; color:var(--text-main);"> ผู้แต่ง / ผู้สอน</label>
                <input type="text" id="lib-author" class="input-std" placeholder="เช่น: James Clear" autocomplete="off">
            </div>

            <div>
                <label style="font-weight:700; font-size:0.9rem; color:var(--text-main);"> ลิงก์รูปปก (URL)</label>
                <input type="text" id="lib-cover" class="input-std" placeholder="https://..." autocomplete="off">
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px; font-style:italic;">
                    *เคล็ดลับ: คลิกขวาที่รูปใน Google -> 'Copy Image Address' มาวาง (ถ้าไม่ใส่จะมีไอคอนขึ้นแทน)
                </div>
            </div>
        </div>
    `;

    this.openModal("เพิ่มเข้าชั้นหนังสือ", html, () => {
      // 1. ดึงค่าจากฟอร์ม
      const type = document.getElementById("lib-type").value;
      const title = document.getElementById("lib-title").value;
      const author = document.getElementById("lib-author").value;
      const cover = document.getElementById("lib-cover").value;

      // 2. เช็คว่ากรอกชื่อหรือยัง
      if (!title) {
        this.showToast("กรุณาระบุชื่อเรื่องก่อนนะครับ", "error");
        // return false เพื่อให้ Modal ไม่ปิด
        return false;
      }

      // 3. สร้าง Object ข้อมูลใหม่
      const newItem = {
        id: Date.now().toString(),
        type: type,
        title: title,
        author: author,
        cover: cover,
        status: "todo", // เริ่มต้นเป็น 'ดองไว้' เสมอ
        addedAt: new Date(),
      };

      // 4. บันทึกเข้า State
      appState.library.push(newItem);
      saveState();

      // 5. รีเฟรชหน้าจอ
      // เปลี่ยน Filter เป็น All เพื่อให้เห็นของใหม่ทันที
      this.libraryFilter = "all";
      this.renderView("library");

      this.showToast("เพิ่มลงชั้นหนังสือเรียบร้อย! ", "success");
      return true; // return true เพื่อปิด Modal
    });
  },
  // ฟังก์ชันเปลี่ยนสถานะ (อัพเดต Logic ให้ชัวร์ขึ้น)
  setLibraryStatus(id, newStatus) {
    const item = appState.library.find((i) => i.id === id);
    if (item) {
      item.status = newStatus;
      saveState(); // บันทึกลง LocalStorage

      // โชว์ Toast แจ้งเตือนสวยๆ
      let msg = "";
      if (newStatus === "reading")
        msg = ` เริ่มอ่าน "${item.title}" แล้ว! สู้ๆ`;
      if (newStatus === "done") msg = ` เยี่ยมมาก! อ่าน "${item.title}" จบแล้ว`;
      if (newStatus === "todo") msg = `⏸ พักเรื่อง "${item.title}" ไว้ก่อน`;

      this.showToast(msg, newStatus === "done" ? "success" : "info");

      // ถ้าอยู่ในหมวด All ให้รีเฟรชเฉยๆ แต่ถ้าอยู่หมวดอื่น ให้ดูว่า item ยังควรอยู่หน้านั้นไหม
      this.renderView("library");
    }
  },

  // ฟังก์ชันลบ
  deleteLibraryItem(id) {
    this.openModal("ยืนยันลบ?", "รายการนี้จะหายไปจากชั้นหนังสือเลยนะ", () => {
      appState.library = appState.library.filter((i) => i.id !== id);
      saveState();
      this.renderView("library");
      this.showToast("ลบออกจากชั้นหนังสือแล้ว", "info");
      return true;
    });
  },

  // ============================================================
  // 7. TOOLS HUB (REMASTERED)
  // ============================================================

  // หน้ารวม Tools
  renderToolsHub(container) {
    const tools = [
      {
        id: "money",
        name: "รายรับ-รายจ่าย",
        icon: "💰",
        color: "var(--color-red)",
        desc: "จัดการงบประมาณ",
      },
      {
        id: "habit",
        name: "ติดตามนิสัย",
        icon: "🔥",
        color: "var(--color-orange)",
        desc: "สร้างวินัยให้ตนเอง",
      },
      {
        id: "journal",
        name: "บันทึก/สะท้อน",
        icon: "📖",
        color: "var(--color-blue)",
        desc: "คุยกับตัวเองวันนี้",
      },
      {
        id: "exercise",
        name: "ออกกำลังกาย",
        icon: "🏃🏻",
        color: "var(--color-purple)",
        desc: "สุขภาพแข็งแรง",
      },
    ];

    container.innerHTML = `
        <div style="margin-bottom:20px;">
            <div class="section-tag" style="background:var(--text-main);"> Toolbox </div>
            <div style="font-size:1.5rem; font-weight:900;">คลังเครื่องมือพัฒนาชีวิต</div>
        </div>
        <div class="tools-grid">
            ${tools
              .map(
                (t) => `
                <div class="paper-card tool-card" onclick="App.openTool('${t.id}')"
                     style="height:auto; align-items:flex-start; padding:25px; cursor:pointer; transition:0.2s; border-bottom:6px solid ${t.color};">
                    <div class="tool-icon" style="font-size:2.5rem; margin-bottom:10px;">${t.icon}</div>
                    <div class="tool-name" style="font-size:1.2rem; font-weight:800; margin-bottom:5px;">${t.name}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">${t.desc}</div>
                </div>
            `
              )
              .join("")}
        </div>`;
  },

  openTool(id) {
    const c = document.getElementById("content-area");
    // อัพเดต Title ให้ดูสวยงาม
    const titles = {
      money: "💰 MONEY MANAGER",
      habit: "🔥 HABIT TRACKER",
      journal: "📖 DAILY JOURNAL",
      exercise: "🏃🏻 ACTIVE LIFE",
    };
    document.getElementById("page-title").textContent = titles[id];

    if (!appState.tools) appState.tools = {};

    // Router ย่อย
    if (id === "money") this.renderMoneyTool(c);
    else if (id === "habit") this.renderHabitTool(c);
    else if (id === "journal") this.renderJournalTool(c);
    else if (id === "exercise") this.renderExerciseTool(c);
  },

  renderBackBtn() {
    return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.renderView('tools')">⬅ Back to Hub</button>`;
  },

  // ------------------------------------------
  // 7.1 MONEY TOOL (FIXED & UPGRADED)
  // ------------------------------------------

  renderMoneyTool(container) {
    // 1. Init Data Structure
    if (!appState.tools.money)
      appState.tools.money = { transactions: [], budget: 15000 };

    // --- [NEW] Init Categories if not exist ---
    if (!appState.tools.money.categories) {
      appState.tools.money.categories = {
        expense: [
          { icon: "🍔", label: "อาหาร" },
          { icon: "🚗", label: "เดินทาง" },
          { icon: "🏠", label: "ของใช้" },
          { icon: "🛍️", label: "ช้อปปิ้ง" },
          { icon: "💊", label: "สุขภาพ" },
          { icon: "🎉", label: "บันเทิง" },
          { icon: "🔌", label: "บิล/น้ำไฟ" },
          { icon: "💸", label: "อื่นๆ" },
        ],
        income: [
          { icon: "💰", label: "เงินเดือน" },
          { icon: "💼", label: "ฟรีแลนซ์" },
          { icon: "📈", label: "ลงทุน" },
          { icon: "🎁", label: "โบนัส" },
        ],
      };
    }

    // 2. Init Temp State (For UI Inputs)
    if (!this.moneyTempState) {
      this.moneyTempState = {
        type: "expense",
        category: "อาหาร",
        tempAmount: "", // [FIX] เพิ่มตัวแปรเก็บค่าเงินชั่วคราว
        tempNote: "", // [FIX] เพิ่มตัวแปรเก็บโน้ตชั่วคราว
      };
    }

    const data = appState.tools.money;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 3. Calculate Logic (เหมือนเดิม)
    const monthlyTrans = data.transactions.filter((t) => {
      const d = new Date(t.rawDate || Date.now());
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyTrans
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthlyTrans
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const budget = data.budget || 15000;
    const budgetPercent = Math.min((expense / budget) * 100, 100);

    // --- [NEW] Load Categories from State ---
    const currentCats =
      this.moneyTempState.type === "expense"
        ? appState.tools.money.categories.expense
        : appState.tools.money.categories.income;

    // 4. Render HTML
    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:20px;">
            ${this.renderBackBtn()}
            <div class="section-tag" style="background:var(--color-red); margin:0;">Money Manager</div>
            <button onclick="App.setBudget()" style="margin-left:auto; font-size:0.8rem; background:none; border:1px solid #aaa; padding:4px 8px; border-radius:4px; cursor:pointer;">⚙️ ตั้งงบ</button>
        </div>

        <div class="balance-card">
            <div class="balance-label">เงินคงเหลือ (Cash Flow)</div>
            <div class="balance-amount" style="color:${
              balance >= 0 ? "#4cd137" : "#e74c3c"
            };">
                ${balance.toLocaleString()} ฿
            </div>

            <div style="display:flex; justify-content:center; gap:30px; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.2);">
                <div>
                    <div style="font-size:0.75rem; opacity:0.7;">รายรับเดือนนี้</div>
                    <div style="font-weight:700; color:#4cd137;">+${income.toLocaleString()}</div>
                </div>
                <div>
                     <div style="font-size:0.75rem; opacity:0.7;">รายจ่ายเดือนนี้</div>
                     <div style="font-weight:700; color:#e74c3c;">-${expense.toLocaleString()}</div>
                </div>
            </div>

            <div style="margin-top:15px; background:rgba(255,255,255,0.2); height:6px; border-radius:10px; overflow:hidden; position:relative;">
                <div style="position:absolute; left:0; top:0; height:100%; width:${budgetPercent}%; background:${
      budgetPercent > 90 ? "#e74c3c" : "#f1c40f"
    };"></div>
            </div>
            <div style="text-align:right; font-size:0.7rem; margin-top:4px; opacity:0.6;">
                ใช้ไป ${Math.round(
                  budgetPercent
                )}% ของงบ ${budget.toLocaleString()}
            </div>
        </div>

        <div class="paper-card" style="margin-bottom:25px;">
            <div class="money-type-toggle">
                <button class="type-btn ${
                  this.moneyTempState.type === "expense" ? "active expense" : ""
                }"
                    onclick="App.setMoneyType('expense')">รายจ่าย (-)</button>
                <button class="type-btn ${
                  this.moneyTempState.type === "income" ? "active income" : ""
                }"
                    onclick="App.setMoneyType('income')">รายรับ (+)</button>
            </div>

            <div style="position:relative; margin-bottom:15px;">
                <span style="position:absolute; left:15px; top:50%; transform:translateY(-50%); font-weight:900; font-size:1.2rem; color:var(--text-muted);">฿</span>
                <input type="number" id="money-amount" class="input-std" placeholder="0.00"
                    value="${this.moneyTempState.tempAmount}"
                    oninput="App.moneyTempState.tempAmount = this.value"
                    style="padding-left:40px; font-size:1.5rem; font-weight:bold; text-align:right;">
            </div>

            <div class="cat-grid">
                ${currentCats
                  .map(
                    (c) => `
                    <div class="cat-btn ${
                      this.moneyTempState.category === c.label ? "selected" : ""
                    }"
                         onclick="App.setMoneyCat('${c.label}')">
                        <div style="font-size:1.2rem;">${c.icon}</div>
                        <div>${c.label}</div>
                    </div>
                `
                  )
                  .join("")}
                <div class="cat-btn" onclick="App.handleAddMoneyCategory()" style="border:1px dashed #ccc; opacity:0.7;">
                    <div style="font-size:1.2rem;">➕</div>
                    <div>เพิ่ม</div>
                </div>
            </div>

            <div class="input-row">
                <input type="text" id="money-note" class="input-std" placeholder="บันทึกเพิ่มเติม (ถ้ามี)..."
                    value="${this.moneyTempState.tempNote}"
                    oninput="App.moneyTempState.tempNote = this.value">

                <button class="btn-main" onclick="App.addMoneyTransaction()"
                    style="background:${
                      this.moneyTempState.type === "expense"
                        ? "var(--danger)"
                        : "var(--success)"
                    }; color:#fff; min-width:100px;">
                    บันทึก
                </button>
            </div>
        </div>

        <div style="font-weight:800; margin-bottom:10px; color:var(--text-muted); display:flex; justify-content:space-between;">
             <span> รายการล่าสุด</span>
             <span style="font-size:0.8rem; font-weight:normal;">(แสดง 10 รายการ)</span>
        </div>

        <ul class="receipt-list">
            ${data.transactions
              .slice()
              .reverse()
              .slice(0, 10)
              .map((t) => {
                const isExp = t.type === "expense";
                return `
                <li class="receipt-item">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:700;">${
                          t.category || "ทั่วไป"
                        } <span style="font-weight:400; color:var(--text-muted);"> - ${
                  t.note || "-"
                }</span></span>
                        <span style="font-size:0.75rem; color:#aaa;">${new Date(
                          t.rawDate || Date.now()
                        ).toLocaleDateString("th-TH")}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-weight:800; font-size:1.1rem; color:${
                          isExp ? "var(--danger)" : "var(--success)"
                        };">
                            ${isExp ? "-" : "+"}${t.amount.toLocaleString()}
                        </span>
                        <button onclick="App.deleteMoneyTransaction(${
                          t.id
                        })" style="border:none; background:none; color:#ccc; cursor:pointer; font-size:1.2rem;">&times;</button>
                    </div>
                </li>
                `;
              })
              .join("")}
        </ul>

        ${
          data.transactions.length === 0
            ? `<div style="text-align:center; padding:20px; color:#aaa;">ยังไม่มีรายการ เริ่มจดกันเลย!</div>`
            : ""
        }
    `;
  },

  // Helper Functions

  // [FIX] ฟังก์ชันนี้ต้อง Save ค่าก่อน Re-render
  setMoneyType(type) {
    // 1. บันทึกค่าปัจจุบันลง TempState
    this.moneyTempState.tempAmount =
      document.getElementById("money-amount").value;
    this.moneyTempState.tempNote = document.getElementById("money-note").value;

    // 2. เปลี่ยน Type
    this.moneyTempState.type = type;

    // 3. รีเซ็ต Category ให้เป็นตัวแรกของ Type นั้นๆ (เพื่อป้องกัน error)
    const cats = appState.tools.money.categories[type];
    if (cats && cats.length > 0) {
      this.moneyTempState.category = cats[0].label;
    }

    // 4. Render ใหม่
    this.renderMoneyTool(document.getElementById("content-area"));
  },

  // [FIX] ฟังก์ชันนี้ต้อง Save ค่าก่อน Re-render
  setMoneyCat(cat) {
    this.moneyTempState.tempAmount =
      document.getElementById("money-amount").value;
    this.moneyTempState.tempNote = document.getElementById("money-note").value;
    this.moneyTempState.category = cat;
    this.renderMoneyTool(document.getElementById("content-area"));
  },

  setBudget() {
    this.openModal(
      "ตั้งงบประมาณรายเดือน",
      `<input type="number" id="budget-input" class="input-std" value="${
        appState.tools.money.budget || 15000
      }">`,
      () => {
        const val = parseFloat(document.getElementById("budget-input").value);
        if (val > 0) {
          appState.tools.money.budget = val;
          saveState();
          this.renderMoneyTool(document.getElementById("content-area"));
          return true;
        }
        return false;
      }
    );
  },

  // [NEW] ฟังก์ชันเพิ่มหมวดหมู่เอง
  handleAddMoneyCategory() {
    const type = this.moneyTempState.type; // expense or income
    const html = `
        <div style="margin-bottom:15px;">
            <label>ชื่อหมวดหมู่</label>
            <input type="text" id="new-cat-name" class="input-std" placeholder="เช่น ค่ากาแฟ">
        </div>
        <div>
            <label>ไอคอน (Emoji)</label>
            <input type="text" id="new-cat-icon" class="input-std" placeholder="เช่น ☕️" value="✨">
        </div>
      `;

    this.openModal(
      `เพิ่มหมวดหมู่ (${type === "expense" ? "รายจ่าย" : "รายรับ"})`,
      html,
      () => {
        const name = document.getElementById("new-cat-name").value;
        const icon = document.getElementById("new-cat-icon").value;

        if (!name) {
          this.showToast("ใส่ชื่อก่อนนะ", "error");
          return false;
        }

        // เพิ่มลง State
        appState.tools.money.categories[type].push({ icon: icon, label: name });
        saveState();

        // Re-render
        this.setMoneyCat(name); // เลือกตัวใหม่ให้อัตโนมัติ
        this.showToast("เพิ่มหมวดหมู่แล้ว", "success");
        return true;
      }
    );
  },

  addMoneyTransaction() {
    const amtInput = document.getElementById("money-amount");
    const noteInput = document.getElementById("money-note");

    const amount = parseFloat(amtInput.value);
    const note = noteInput.value.trim();

    if (!amount || amount <= 0) {
      this.showToast("ใส่จำนวนเงินด้วยครับ", "error");
      return;
    }

    const newTrans = {
      id: Date.now(),
      rawDate: new Date(),
      date: new Date().toLocaleDateString("th-TH"),
      type: this.moneyTempState.type,
      category: this.moneyTempState.category,
      amount: amount,
      note: note,
    };

    appState.tools.money.transactions.push(newTrans);
    saveState();

    // [FIX] Reset Temp Values หลังบันทึกสำเร็จ
    this.moneyTempState.tempAmount = "";
    this.moneyTempState.tempNote = "";

    this.renderMoneyTool(document.getElementById("content-area"));
    this.showToast("บันทึกเรียบร้อย! ", "success");
  },

  deleteMoneyTransaction(id) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    appState.tools.money.transactions =
      appState.tools.money.transactions.filter((t) => t.id !== id);
    saveState();
    this.renderMoneyTool(document.getElementById("content-area"));
  },

  // ------------------------------------------
  // 7.2 HABIT TOOL (MINIMALIST EDITION: No Emojis, Clean UI)
  // ------------------------------------------
  renderHabitTool(container) {
    if (!appState.tools.habits) appState.tools.habits = [];

    // Helper: คำนวณ Streak จริง
    const checkStreakStatus = (lastDone, currentStreak) => {
      if (!lastDone) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parts = lastDone.split("/");
      const lastDate = new Date(parts[2], parts[1] - 1, parts[0]);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        Math.abs(today - lastDate) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 1) return 0;
      return currentStreak;
    };

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
             <div style="display:flex; align-items:center;">
                ${this.renderBackBtn()}
                <div class="section-tag" style="background:var(--text-main); margin:0;">Habit Tracker</div>
             </div>
             <button class="btn-action" onclick="App.handleAddHabitModal()" style="font-size:0.85rem; font-weight:600;">+ New Habit</button>
        </div>

        <div class="habit-grid" style="grid-template-columns: 1fr;">
            ${appState.tools.habits
              .map((h) => {
                const todayStr = new Date().toLocaleDateString("th-TH");
                const isDone = h.lastDone === todayStr;
                const displayStreak = isDone
                  ? h.streak
                  : checkStreakStatus(h.lastDone, h.streak);

                // ใช้สีที่ user เลือก หรือสี default แบบเรียบๆ
                const cardColor = h.color || "var(--text-main)";

                return `
                <div class="habit-card"
                     style="
                        background: #fff;
                        border: 1px solid #eee;
                        border-left: 4px solid ${cardColor};
                        padding: 15px 20px;
                        border-radius: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
                        transition: all 0.2s;
                        ${isDone ? "opacity: 0.7;" : ""}
                     "
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.05)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.03)'"
                >

                    <div style="display:flex; flex-direction:column;">
                        <span style="
                            font-weight: 700;
                            font-size: 1rem;
                            color: var(--text-main);
                            ${
                              isDone
                                ? "text-decoration: line-through; color: var(--text-muted);"
                                : ""
                            }
                        ">
                            ${h.name}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                            Current Streak: <b style="color:${cardColor}">${displayStreak}</b> days
                        </span>
                    </div>

                    <div style="display:flex; align-items:center; gap:15px;">

                        <button onclick="App.toggleHabit('${h.id}')"
                            style="
                                padding: 8px 16px;
                                border: 1px solid ${
                                  isDone ? cardColor : "#e0e0e0"
                                };
                                background: ${
                                  isDone ? cardColor : "transparent"
                                };
                                color: ${isDone ? "#fff" : "var(--text-muted)"};
                                border-radius: 6px;
                                font-size: 0.8rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                                min-width: 80px;
                            ">
                            ${isDone ? "Completed" : "Check In"}
                        </button>

                        <button onclick="App.deleteHabit('${h.id}')"
                            style="
                                border: none;
                                background: none;
                                color: #ccc;
                                font-size: 1.2rem;
                                cursor: pointer;
                                line-height: 1;
                                padding: 0 5px;
                            "
                            onmouseover="this.style.color='var(--danger)'"
                            onmouseout="this.style.color='#ccc'"
                        >
                            &times;
                        </button>
                    </div>

                </div>`;
              })
              .join("")}
        </div>

        ${
          appState.tools.habits.length === 0
            ? `<div style="text-align:center; margin-top:50px; padding:40px; border:1px dashed #ddd; border-radius:8px; color:var(--text-muted);">
                <div style="font-weight:600; font-size:0.9rem;">No active habits</div>
                <div style="font-size:0.8rem; margin-top:5px;">Click "+ New Habit" to start building your routine.</div>
            </div>`
            : ""
        }
    `;
  },

  // ------------------------------------------
  // HABIT HELPER FUNCTIONS (วางต่อจาก renderHabitTool)
  // ------------------------------------------

  // 1. ฟังก์ชันสร้างนิสัย (แบบเรียบๆ ไม่มีเลือกไอคอน)
  handleAddHabitModal() {
    const html = `
        <div style="margin-bottom:15px;">
            <label style="font-weight:700;">ชื่อนิสัย</label>
            <input type="text" id="h-name" class="input-std" placeholder="เช่น ดื่มน้ำ, อ่านหนังสือ">
        </div>
        <div>
            <label style="font-weight:700;">สีประจำตัว</label>
            <select id="h-color" class="input-std">
                <option value="var(--text-main)">⚫️ ดำ (Basic)</option>
                <option value="var(--color-orange)">🟠 ส้ม</option>
                <option value="var(--color-blue)">🔵 ฟ้า</option>
                <option value="var(--color-green)">🟢 เขียว</option>
                <option value="var(--color-purple)">🟣 ม่วง</option>
                <option value="var(--color-pink)">🔴 ชมพู</option>
            </select>
        </div>
      `;

    this.openModal("สร้างนิสัยใหม่", html, () => {
      const name = document.getElementById("h-name").value;
      const color = document.getElementById("h-color").value;

      if (!name) {
        this.showToast("ตั้งชื่อก่อนนะ", "error");
        return false;
      }

      appState.tools.habits.push({
        id: Date.now().toString(),
        name: name,
        icon: "", // ไม่ใช้อิโมจิแล้ว
        color: color,
        streak: 0,
        lastDone: null,
      });
      saveState();
      this.renderHabitTool(document.getElementById("content-area"));
      this.showToast("สร้างนิสัยใหม่แล้ว", "success");
      return true;
    });
  },

  // 2. ฟังก์ชันเช็คชื่อ (Check-in / Undo)
  toggleHabit(id) {
    const h = appState.tools.habits.find((x) => x.id === id);
    if (!h) return;

    const todayStr = new Date().toLocaleDateString("th-TH");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("th-TH");

    // กรณี: ทำเสร็จแล้ววันนี้ -> จะกดยกเลิก (Undo)
    if (h.lastDone === todayStr) {
      h.lastDone = null;
      h.streak = Math.max(0, h.streak - 1);
      this.showToast(`ยกเลิก: ${h.name}`, "info");
    }
    // กรณี: ยังไม่ทำ -> จะกดเช็คชื่อ
    else {
      if (h.lastDone === yesterdayStr) {
        h.streak++;
      } else {
        h.streak = 1; // เริ่มใหม่
      }
      h.lastDone = todayStr;
      this.playSuccessSound();
      this.showToast(`สำเร็จ: ${h.name} `, "success");
    }

    saveState();

    // รีเฟรชหน้าปัจจุบัน (เผื่อกดจาก Dashboard)
    if (this.currentPage === "home") {
      this.renderDashboard(document.getElementById("content-area"));
    } else {
      this.renderHabitTool(document.getElementById("content-area"));
    }
  },

  // [แถม] ตัวช่วยให้ Dashboard ทำงานได้ (Dashboard เรียกใช้ checkHabit)
  checkHabit(id) {
    this.toggleHabit(id);
  },

  // 3. ฟังก์ชันลบ
  deleteHabit(id) {
    if (!confirm("ลบนิสัยนี้?")) return;
    appState.tools.habits = appState.tools.habits.filter((x) => x.id !== id);
    saveState();
    this.renderHabitTool(document.getElementById("content-area"));
  },

  // ============================================================
  // 7.3 JOURNAL TOOL (FIXED: Add Multiple Tags + No Reload)
  // ============================================================
  renderJournalTool(container) {
    if (!appState.tools.journal) appState.tools.journal = [];

    // 1. Init State (เพิ่ม tempText, tempGratitude เพื่อจำค่า)
    if (!this.journalState) {
      this.journalState = {
        isEditing: false,
        editId: null,
        tempTags: [],
        tempText: null, // เพิ่มตัวนี้
        tempGratitude: null, // เพิ่มตัวนี้
      };
    }

    // Prepare Data
    let editData = { text: "", gratitude: "", mood: "🙂" };

    // กรณีแก้ไข: ดึงข้อมูลเดิมมา
    if (this.journalState.isEditing && this.journalState.editId) {
      const found = appState.tools.journal.find(
        (j) => j.id === this.journalState.editId
      );
      if (found) editData = found;

      // Load tags ครั้งแรก
      if (this.journalState.tempTags.length === 0 && editData.tags) {
        this.journalState.tempTags = [...editData.tags];
      }
    }

    // --- LOGIC การแสดงผลข้อความ (สำคัญ!) ---
    // ถ้ามีค่าที่พิมพ์ค้างไว้ใน temp (จากการกดเพิ่มแท็ก) ให้ใช้ค่านั้น
    // ถ้าไม่มี ให้ใช้ค่าจาก Database (editData) หรือค่าว่าง
    const displayText =
      this.journalState.tempText !== null
        ? this.journalState.tempText
        : editData.text || "";
    const displayGratitude =
      this.journalState.tempGratitude !== null
        ? this.journalState.tempGratitude
        : editData.gratitude || "";

    // --- LOGIC TAGS ---
    const presetTags = [
      "งาน ",
      "ครอบครัว ",
      "ความรัก ",
      "ไอเดีย ",
      "สุขภาพ ",
      "การเงิน ",
      "พัฒนาตัวเอง ",
      "พักผ่อน ",
    ];
    const allTagsDisplay = [
      ...new Set([...presetTags, ...this.journalState.tempTags]),
    ];

    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:20px;">
            ${this.renderBackBtn()}
            <div class="section-tag" style="background:var(--color-blue); margin:0;">Daily Reflection</div>
        </div>

        <div class="paper-card" style="border-top: 5px solid var(--color-blue);">

            <div class="jor-header">
                <h3 class="jor-title">${
                  this.journalState.isEditing
                    ? "✏️ แก้ไขบันทึก"
                    : "|| บันทึกเรื่องราววันนี้"
                }</h3>
                ${
                  this.journalState.isEditing
                    ? `<button type="button" class="btn-action" style="color:var(--danger);" onclick="App.cancelEditJournal()">ยกเลิก</button>`
                    : ""
                }
            </div>

            <input type="hidden" id="j-mood-val" value="${
              editData.mood || "🙂"
            }">
            <div class="jor-mood-container">
                ${["🤩", "😊", "🙂", "😔", "😫", "😡"]
                  .map(
                    (m) => `
                    <div class="jor-mood-btn ${
                      m === (editData.mood || "🙂") ? "selected" : ""
                    }"
                         onclick="App.setJournalMood('${m}', this)">
                        ${m}
                    </div>
                `
                  )
                  .join("")}
            </div>

            <div>
                <label class="jor-label">เรื่องราววันนี้ (Story)</label>
                <textarea id="j-text" class="jor-input" placeholder="วันนี้เจออะไรมาบ้าง? รู้สึกยังไง?">${displayText}</textarea>
            </div>

            <div>
                <label class="jor-label">ขอบคุณ / ความภูมิใจ (Gratitude)</label>
                <input type="text" id="j-gratitude" class="jor-input" placeholder="เรื่องเล็กๆ ที่ทำให้ยิ้มได้..." value="${displayGratitude}">
            </div>

            <div>
                <label class="jor-label">ติดแท็ก (Tags)</label>

                <div class="jor-tag-input-group">
                    <input type="text" id="new-tag-input" class="jor-tag-input"
                        placeholder="+ พิมพ์แท็กใหม่ แล้วกดเพิ่ม..."
                        onkeypress="if(event.key==='Enter'){ event.preventDefault(); App.handleAddCustomTag(); }">

                    <button type="button" class="jor-btn-add-tag" onclick="App.handleAddCustomTag()">เพิ่ม</button>
                </div>

                <div class="jor-tag-container">
                    ${allTagsDisplay
                      .map((tag) => {
                        const isActive =
                          this.journalState.tempTags.includes(tag);
                        return `<div id="tag-${tag}" class="jor-tag ${
                          isActive ? "active" : ""
                        }"
                                     onclick="App.toggleJournalTag('${tag}')">${tag}</div>`;
                      })
                      .join("")}
                </div>
            </div>

            <button type="button" class="btn-main" onclick="App.saveJournal()" style="width:100%; height:50px; background:var(--color-blue);">
                ${
                  this.journalState.isEditing
                    ? "บันทึกการแก้ไข"
                    : "บันทึกเรื่องราว"
                }
            </button>
        </div>

        <div style="margin-top:40px;">
           ${this.renderTimelineLog(appState.tools.journal)}
        </div>
    `;
  },

  // Helper สำหรับ Timeline เพื่อลดความยาวโค้ด (Optional)
  renderTimelineLog(logs) {
    if (!logs || logs.length === 0)
      return `<div style="text-align:center; color:#ccc; padding:30px;">- ยังไม่มีบันทึก เริ่มต้นเขียนวันนี้เลย -</div>`;
    return logs
      .slice()
      .reverse()
      .map((e) => {
        // ... (ใส่โค้ดส่วน loop แสดง history เดิมของคุณตรงนี้) ...
        const d = new Date(e.date);
        return `
            <div class="jor-history-item">
                <div style="font-size:2.5rem; line-height:1;">${e.mood}</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <div>
                            <span class="jor-date">${d.toLocaleDateString(
                              "th-TH",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              }
                            )}</span>
                            <span class="jor-time">• ${d.toLocaleTimeString(
                              "th-TH",
                              { hour: "2-digit", minute: "2-digit" }
                            )}</span>
                        </div>
                        <div>
                            <button onclick="App.startEditJournal('${
                              e.id
                            }')" style="border:none; background:none; cursor:pointer; opacity:0.4;"></button>
                            <button onclick="App.deleteJournal('${
                              e.id
                            }')" style="border:none; background:none; cursor:pointer; opacity:0.4; color:var(--danger);">🗑</button>
                        </div>
                    </div>
                    <div style="font-size:1rem; line-height:1.6; color:#333; white-space:pre-wrap;">${
                      e.text
                    }</div>
                    ${
                      e.gratitude
                        ? `<div style="margin-top:8px; font-size:0.85rem; color:var(--color-blue); font-weight:600;"> ${e.gratitude}</div>`
                        : ""
                    }
                    <div style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
                        ${(e.tags || [])
                          .map(
                            (t) =>
                              `<span style="font-size:0.7rem; background:#f4f4f4; padding:2px 8px; border-radius:4px; color:#666;">#${t}</span>`
                          )
                          .join("")}
                    </div>
                </div>
            </div>`;
      })
      .join("");
  },

  // --- HELPER FUNCTIONS (FIXED) ---

  // 3. ฟังก์ชันจำค่า (ต้องทำงานจริงแล้ว)
  saveTempInputs() {
    const txt = document.getElementById("j-text");
    const gra = document.getElementById("j-gratitude");
    // เก็บค่าปัจจุบันลง State
    if (txt) this.journalState.tempText = txt.value;
    if (gra) this.journalState.tempGratitude = gra.value;
  },

  handleAddCustomTag() {
    const input = document.getElementById("new-tag-input");
    const val = input.value.trim();

    if (!val) return;

    // 1. จำค่าที่พิมพ์ค้างไว้ก่อน (สำคัญมาก ไม่งั้นข้อความหาย!)
    this.saveTempInputs();

    // 2. เพิ่มแท็ก
    if (!this.journalState.tempTags.includes(val)) {
      this.journalState.tempTags.push(val);
      this.showToast(`เพิ่มแท็ก "${val}" แล้ว`, "success");
    }

    // 3. Render ใหม่
    this.renderJournalTool(document.getElementById("content-area"));

    // 4. (UX) โฟกัสกลับไปที่ช่องพิมพ์แท็ก ให้พิมพ์ต่อได้เลย
    setTimeout(() => {
      const newInput = document.getElementById("new-tag-input");
      if (newInput) newInput.focus();
    }, 50);
  },

  setJournalMood(val, btnEl) {
    document.getElementById("j-mood-val").value = val;
    document
      .querySelectorAll(".jor-mood-btn")
      .forEach((b) => b.classList.remove("selected"));
    btnEl.classList.add("selected");
  },

  toggleJournalTag(tag) {
    // ใช้แบบ classList ไม่ต้อง Re-render (พิมพ์ไม่สะดุด)
    const idx = this.journalState.tempTags.indexOf(tag);
    let btn = document.getElementById(`tag-${tag}`);

    // ถ้าปุ่มยังไม่ถูกสร้าง (เช่น custom tag ใหม่) ให้ re-render
    if (!btn) {
      this.saveTempInputs(); // จำค่าก่อน
      if (idx === -1) this.journalState.tempTags.push(tag);
      else this.journalState.tempTags.splice(idx, 1);
      this.renderJournalTool(document.getElementById("content-area"));
      return;
    }

    if (idx > -1) {
      this.journalState.tempTags.splice(idx, 1);
      btn.classList.remove("active");
    } else {
      this.journalState.tempTags.push(tag);
      btn.classList.add("active");
    }
  },

  saveJournal() {
    const text = document.getElementById("j-text")
      ? document.getElementById("j-text").value.trim()
      : "";
    const gratitude = document.getElementById("j-gratitude")
      ? document.getElementById("j-gratitude").value.trim()
      : "";
    const mood = document.getElementById("j-mood-val").value;

    if (!text && !gratitude) {
      this.showToast("เขียนอะไรสักหน่อยนะ...", "error");
      return;
    }

    const entryData = {
      text,
      gratitude,
      mood,
      tags: [...this.journalState.tempTags],
    };

    if (this.journalState.isEditing) {
      const index = appState.tools.journal.findIndex(
        (j) => j.id === this.journalState.editId
      );
      if (index !== -1) {
        appState.tools.journal[index] = {
          ...appState.tools.journal[index],
          ...entryData,
        };
        this.showToast("แก้ไขเรียบร้อย ", "success");
      }
    } else {
      appState.tools.journal.push({
        id: Date.now().toString(),
        date: new Date(),
        ...entryData,
      });
      this.showToast("บันทึกความทรงจำแล้ว ", "success");
    }

    saveState();
    this.cancelEditJournal(); // เคลียร์ค่าทุกอย่าง
  },

  startEditJournal(id) {
    const item = appState.tools.journal.find((j) => j.id === id);
    if (item) {
      // Reset temp values
      this.journalState = {
        isEditing: true,
        editId: id,
        tempTags: item.tags ? [...item.tags] : [],
        tempText: null, // Reset ให้ไปใช้ค่าจาก item
        tempGratitude: null, // Reset ให้ไปใช้ค่าจาก item
      };
      this.renderJournalTool(document.getElementById("content-area"));
      document
        .getElementById("content-area")
        .scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  cancelEditJournal() {
    // Reset State ทั้งหมด
    this.journalState = {
      isEditing: false,
      editId: null,
      tempTags: [],
      tempText: null,
      tempGratitude: null,
    };
    this.renderJournalTool(document.getElementById("content-area"));
  },

  deleteJournal(id) {
    this.openModal("ลบบันทึก?", "บันทึกนี้จะหายไปถาวรเลยนะ", () => {
      appState.tools.journal = appState.tools.journal.filter(
        (x) => x.id !== id
      );
      saveState();
      if (this.journalState.editId === id) this.cancelEditJournal();
      else this.renderJournalTool(document.getElementById("content-area"));
      this.showToast("ลบเรียบร้อย", "info");
      return true;
    });
  },

  /// ============================================================
  // 7.4 EXERCISE TOOL (FINAL FIXED & CLEAN VERSION)
  // ============================================================
  renderExerciseTool(container) {
    // 1. Init Data
    if (!appState.tools.exercise) appState.tools.exercise = [];
    if (!appState.tools.exercise.profile) {
      appState.tools.exercise.profile = {
        weight: "",
        height: "",
        age: "",
        gender: "m",
        activity: 1.2,
      };
    }

    // --- 2. Calculate Stats ---
    const logs = appState.tools.exercise;
    const profile = appState.tools.exercise.profile;
    const goalMinutes = 250;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weeklyLogs = Array.isArray(logs)
      ? logs.filter((l) => new Date(l.date) >= monday)
      : [];
    const totalMins = weeklyLogs.reduce(
      (acc, curr) => acc + parseInt(curr.duration || 0),
      0
    );
    const totalCals = weeklyLogs.reduce(
      (acc, curr) => acc + parseInt(curr.cals || 0),
      0
    );
    const progressPercent = Math.min((totalMins / goalMinutes) * 100, 100);

    // --- 3. Body Metrics ---
    let bmi = 0,
      bmr = 0,
      tdee = 0;
    if (profile.weight && profile.height && profile.age) {
      const w = parseFloat(profile.weight);
      const h = parseFloat(profile.height);
      const a = parseFloat(profile.age);
      // BMI
      bmi = w / (h / 100) ** 2;
      // BMR (Mifflin-St Jeor)
      bmr = 10 * w + 6.25 * h - 5 * a + (profile.gender === "m" ? 5 : -161);
      // TDEE
      tdee = bmr * parseFloat(profile.activity);
    }

    // --- 4. HTML Render (ใช้ Class จาก style.css แล้ว) ---
    container.innerHTML = `
        <div class="ex-header">
            ${this.renderBackBtn()}
            <div class="section-tag" style="background:var(--color-purple); margin:0;">Active Life</div>
        </div>

        <div class="paper-card ex-dash-card">
             <div class="ex-dash-content">
                <div>
                    <div class="ex-goal-label">WEEKLY GOAL</div>
                    <div class="ex-big-stat">
                        ${totalMins} <span class="ex-sub-stat">/ ${goalMinutes} min</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:1.5rem; font-weight:800;">🔥 ${totalCals.toLocaleString()}</div>
                    <div class="ex-goal-label">KCALS</div>
                </div>
            </div>
            <div class="p-bar" style="height:8px; background:#e0e0e0;">
                <div class="p-fill" style="width:${progressPercent}%; background:var(--color-purple);"></div>
            </div>
        </div>

        <div class="paper-card ex-metrics-card">
            <div class="ex-metrics-header">
                <span> Body Metrics </span>
                <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">(คำนวณอัตโนมัติ)</span>
            </div>

            <div class="ex-input-grid">
                <input type="number" id="m-weight" class="input-std ex-input-metric" placeholder="กก." value="${
                  profile.weight
                }" oninput="App.saveExProfile()">
                <input type="number" id="m-height" class="input-std ex-input-metric" placeholder="ซม." value="${
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

            <div class="ex-results-container">
                <div class="ex-result-box">
                    <div class="ex-result-label">BMI</div>
                    <div class="ex-result-value" style="color:${
                      bmi > 25 || bmi < 18.5
                        ? "var(--danger)"
                        : "var(--success)"
                    }">
                        ${bmi ? bmi.toFixed(1) : "-"}
                    </div>
                </div>
                <div class="ex-result-box">
                    <div class="ex-result-label">BMR (Burn)</div>
                    <div class="ex-result-value">${
                      bmr ? Math.round(bmr) : "-"
                    }</div>
                </div>
                <div class="ex-result-box">
                    <div class="ex-result-label">TDEE (Daily)</div>
                    <div class="ex-result-value" style="color:var(--color-purple)">${
                      tdee ? Math.round(tdee) : "-"
                    }</div>
                </div>
            </div>
        </div>

        <div class="paper-card ex-form-card">
            <div style="font-weight:800; margin-bottom:10px;"> Record Activity </div>

            <div class="ex-presets-area">
                <button class="ex-preset-chip" onclick="App.fillEx('วิ่ง ', 30, 300)"> วิ่ง </button>
                <button class="ex-preset-chip" onclick="App.fillEx('เวท ', 45, 200)"> เวท </button>
                <button class="ex-preset-chip" onclick="App.fillEx('เดิน ', 20, 80)"> เดิน </button>
                <button class="ex-preset-chip" onclick="App.fillEx('HIIT ', 25, 300)"> HIIT </button>
                <button class="ex-preset-chip" onclick="App.fillEx('โยคะ ', 60, 150)"> โยคะ </button>
            </div>

            <div class="ex-entry-grid">
                <input type="text" id="ex-type" class="input-std" placeholder="รายการ...">
                <input type="number" id="ex-dur" class="input-std" placeholder="นาที">
                <input type="number" id="ex-cal" class="input-std" placeholder="Cal">
            </div>

            <div class="ex-intensity-box">
                <span style="font-size:0.8rem; color:#666; font-weight:700;">ความเหนื่อย:</span>
                <div class="ex-radio-group">
                    <label class="ex-radio-label"><input type="radio" name="ex-int" value="😌" checked> 😌 ชิว</label>
                    <label class="ex-radio-label"><input type="radio" name="ex-int" value="🙂"> 🙂 พอดี</label>
                    <label class="ex-radio-label"><input type="radio" name="ex-int" value="🔥"> 🔥 โหด</label>
                </div>
            </div>

            <button class="btn-main" onclick="App.addEx()" style="background:var(--color-purple); width:100%;">บันทึกกิจกรรม</button>
        </div>

        <div class="ex-history-section">
            <div class="ex-history-title" > RECENT LOGS </div>
            <div class="ex-history-list">
                ${(Array.isArray(logs) ? logs : [])
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map(
                    (l) => `
                    <div class="ex-log-item">
                        <div class="ex-log-icon">
                            ${
                              l.type.includes("วิ่ง")
                                ? "🏃🏻"
                                : l.type.includes("เวท")
                                ? "🏋🏻‍♂️"
                                : l.type.includes("เดิน")
                                ? "🚶🏻"
                                : l.type.includes("โยคะ")
                                ? "🧘🏻‍♀️"
                                : "💪"
                            }
                        </div>
                        <div class="ex-log-details">
                            <div class="ex-log-title">${l.type}</div>
                            <div class="ex-log-meta">
                                ⏱ ${l.duration} นาที • 🔥 ${
                      l.cals || 0
                    } cal • ${l.intensity || ""}
                            </div>
                        </div>
                        <div class="ex-log-actions">
                            <div class="ex-log-date">${new Date(
                              l.date
                            ).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                            })}</div>
                            <button class="ex-btn-delete" style='border: 1px solid #ccccccff;' onclick="App.delEx('${
                              l.id
                            }')"> X </button>
                        </div>
                    </div>
                `
                  )
                  .join("")}
                ${
                  !logs || logs.length === 0
                    ? `<div style="text-align:center; padding:30px; color:#ccc; border:2px dashed #eee; border-radius:10px;"> ยังไม่มีประวัติ </div>`
                    : ""
                }
            </div>
        </div>
    `;
  },

  // --- EXERCISE HELPER FUNCTIONS ---

  saveExProfile() {
    const w = document.getElementById("m-weight").value;
    const h = document.getElementById("m-height").value;
    const a = document.getElementById("m-age").value;
    const g = document.getElementById("m-gender").value;

    appState.tools.exercise.profile = {
      weight: w,
      height: h,
      age: a,
      gender: g,
      activity: 1.2,
    };
    saveState();

    // Debounce re-render เพื่อให้พิมพ์ไม่กระตุก
    if (this.calcTimeout) clearTimeout(this.calcTimeout);
    this.calcTimeout = setTimeout(() => {
      this.renderExerciseTool(document.getElementById("content-area"));
    }, 800);
  },

  fillEx(type, dur, cal) {
    document.getElementById("ex-type").value = type;
    document.getElementById("ex-dur").value = dur;
    document.getElementById("ex-cal").value = cal;
  },

  addEx() {
    const t = document.getElementById("ex-type").value.trim();
    const d = document.getElementById("ex-dur").value;
    const c = document.getElementById("ex-cal").value;

    let intensity = "";
    const radios = document.getElementsByName("ex-int");
    for (let r of radios) {
      if (r.checked) intensity = r.value;
    }

    if (!t || !d) {
      this.showToast("ระบุประเภทและเวลาด้วยนะครับ", "error");
      return;
    }

    if (!appState.tools.exercise) appState.tools.exercise = [];

    appState.tools.exercise.push({
      id: Date.now().toString(), // บังคับเป็น String เพื่อแก้บั๊ก ID
      date: new Date(),
      type: t,
      duration: parseInt(d),
      cals: parseInt(c) || 0,
      intensity: intensity,
    });

    saveState();
    this.renderExerciseTool(document.getElementById("content-area"));
    this.showToast("บันทึกความฟิตเรียบร้อย! ", "success");
  },

  delEx(id) {
    // แปลงเป็น String ทั้งคู่เพื่อความชัวร์ในการเปรียบเทียบ
    const targetId = id.toString();

    this.openModal("ลบประวัติ?", "รายการนี้จะหายไปเลยนะ เอาจริงดิ?", () => {
      appState.tools.exercise = appState.tools.exercise.filter(
        (x) => x.id.toString() !== targetId
      );
      saveState();
      this.renderExerciseTool(document.getElementById("content-area"));
      this.showToast("ลบรายการแล้ว", "info");
      return true;
    });
  },

  // ============================================================
  // 8. REVIEWS & SETTINGS
  // ============================================================
  renderReviews(container) {
    if (!appState.reviews) appState.reviews = [];
    window.showRev = (i) => {
      const r = appState.reviews[appState.reviews.length - 1 - i];
      this.openModal(
        `Week ${r.w}/${r.y}`,
        `<b>Wins:</b><br>${r.a.q1}<br><br><b>Improve:</b><br>${r.a.q2}<br><br><b>Focus:</b><br>${r.a.q3}`,
        () => true
      );
    };
    container.innerHTML = `

            <div class="paper-card" style="margin-bottom:20px;">
              <div class="section-tag">Weekly Review</div>
                <div style="margin-bottom:15px;">
                  <label style="font-weight:600;">1. สัปดาห์นี้ทำอะไรสำเร็จบ้าง?</label>
                  <textarea id="rv-q1" class="input-std" style="height:80px;"></textarea>
                </div>

                <div style="margin-bottom:15px;">
                  <label style="font-weight:600;">2. สิ่งที่ต้องปรับปรุง?</label>
                  <textarea id="rv-q2" class="input-std" style="height:80px;"></textarea>
                </div>

                <div style="margin-bottom:15px;">
                  <label style="font-weight:600;">3. โฟกัสสัปดาห์หน้า?</label>
                  <textarea id="rv-q3" class="input-std" style="height:80px;"></textarea>
                </div>
                <button class="btn-main" style="width:100%;" onclick="App.saveRev()">บันทึกทบทวน</button>
              </div>

              <div class="paper-card"><div class="section-tag">History</div>
                ${appState.reviews
                  .slice()
                  .reverse()
                  .map(
                    (r, i) =>
                      `<div style="padding:10px; border-bottom:1px solid var(--border-soft); cursor:pointer;" onclick="window.showRev(${i})">
                      <div style="font-weight:600;">Week ${r.w} / ${r.y}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${new Date(
                          r.d
                        ).toLocaleDateString("th-TH")}</div>
                    </div>`
                  )
                  .join("")}
              </div>
        `;
  },

  saveRev() {
    const q1 = document.getElementById("rv-q1").value;
    const q2 = document.getElementById("rv-q2").value;
    const q3 = document.getElementById("rv-q3").value;
    if (!q1 && !q2) {
      this.showToast("เขียนหน่อยน่า", "error");
      return;
    }
    appState.reviews.push({
      id: Date.now(),
      d: new Date(),
      w: TimeSystem.current.weekNumber,
      y: new Date().getFullYear(),
      a: { q1, q2, q3 },
    });
    saveState();
    this.renderReviews(document.getElementById("content-area"));
    this.showToast("บันทึกแล้ว", "success");
  },

  renderSettings(container) {
    container.innerHTML = `
          <div class="settings-container" style="max-width:600px; margin:0 auto;">

              <div class="paper-card" style="margin-bottom:20px;">
                  <div class="section-tag"> Data Management </div>
                    <p style="margin-bottom:15px; font-size:0.9rem;"> ดาวน์โหลดข้อมูลเก็บไว้ (Backup) </p>
                    <button class="btn-action" onclick="App.exportData()"> ⬇ Download JSON</button>
                    <hr style="margin:20px 0; border:0; border-top:1px dashed var(--border-soft);">
                    <p style="margin-bottom:15px; font-size:0.9rem;"> กู้คืนข้อมูล (Restore) </p>
                    <input type="file" id="import-file" style="display:none;" onchange="App.importData(this)">
                    <button class="btn-action" onclick="document.getElementById('import-file').click()"> ⬆ Upload JSON </button>
              </div>

              <div class="paper-card" style="border-color:var(--danger);">
                    <div class="section-tag" style="background:var(--danger); color:#fff;">Danger Zone</div>
                    <p style="margin-bottom:15px;    font-size:0.9rem;">ล้างข้อมูลทั้งหมด</p>
                    <button class="btn-danger" style="padding:10px 20px; border-radius:6px; cursor:pointer;" onclick="App.hardReset()"> RESET ALL</button>
              </div>

          </div>
        `;
  },
  exportData() {
    const str = JSON.stringify(appState, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-os-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.goals) {
          this.openModal("Restore?", "ข้อมูลเก่าจะหายนะ", () => {
            appState = json;
            saveState();
            location.reload();
            return true;
          });
        }
      } catch (err) {
        this.showToast("ไฟล์ผิดพลาด", "error");
      }
    };
    reader.readAsText(file);
  },
  hardReset() {
    this.openModal("RESET?", "พิมพ์ 'RESET' เพื่อยืนยัน", () => {
      localStorage.removeItem("lifeDashboardState");
      location.reload();
      return true;
    });
  },

  renderTimeWidget(data) {
    const w = document.getElementById("mini-time-display");
    if (!w) return;

    const userName = appState.user?.name || "COMMANDER";
    const userAvatar = appState.user?.avatar || "👤";
    const userEdu = appState.user?.education || "BACHELOR DEGREE";

    w.innerHTML = `
        <div style="text-align: left; padding: 5px; cursor: pointer;" onclick="App.editProfile()">
            <div style="font-size: 0.6rem; font-weight: 800; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 10px;">
                Personal Operator
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; border: 2px solid #fff; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 3px 3px 0 #000;">
                    ${userAvatar}
                </div>

                <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 0.8rem; font-weight: 900; color: #fff; text-transform: uppercase; margin-bottom: 2px;">
                        ${userName}
                    </div>
                    <div style="font-size: 0.5rem; font-weight: 900; line-height: 1.1; color: var(--color-yellow); text-transform: uppercase; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                        ${userEdu}
                    </div>
                </div>
            </div>

            <div style="margin-top: 15px; padding: 6px 10px; background: #000; border: 1px solid #fff; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.6rem; font-weight: 800; color: #fff;">
                    TIME: ${data.date.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 6px; height: 6px; background: #4cd137; border-radius: 50%; box-shadow: 0 0 5px #4cd137;"></div>
                    <span style="font-size: 0.6rem; font-weight: 800; color: #4cd137;">ONLINE</span>
                </div>
            </div>
        </div>
    `;
  },

  // ============================================================
  // ACTION FUNCTIONS
  // ============================================================

  // --- 1. Focus Actions ---
  handleSetFocus(val) {
    if (!val.trim()) return;
    appState.today.focus = val;
    saveState();
    this.renderView("today");
    this.showToast("ตั้งเป้าหมายเรียบร้อย! ลุยเลย", "success");
  },

  handleClearFocus() {
    this.openModal("สำเร็จแล้ว?", "คุณทำภารกิจหลักเสร็จแล้วใช่ไหม?", () => {
      appState.today.focus = null;
      saveState();
      this.renderView("today");
      this.showToast("เยี่ยมมาก! ภารกิจสำเร็จ 🎉", "success");
      return true;
    });
  },

  // --- 2. Timer & Atmosphere Logic ---

  playAtmosphere(type) {
    // 1. หยุดเสียงเก่าก่อน
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    appState.today.atmosphere = type;
    saveState();

    // 2. เลือก URL เสียง
    let url = "";
    if (type === "rain")
      url = "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg";
    if (type === "cafe")
      url = "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";

    // 3. เล่นเสียงใหม่
    if (url) {
      this.currentAudio = new Audio(url);
      this.currentAudio.loop = true; // เล่นวนซ้ำ
      this.currentAudio.volume = 0.6;
      this.currentAudio
        .play()
        .catch((e) => console.log("Audio Error (Browser Policy):", e));
    }

    // รีเฟรชหน้าเพื่อโชว์ชื่อเพลง
    this.renderView("today");
  },

  toggleTimer() {
    if (this.timerState.isRunning) {
      clearInterval(this.timerState.interval);
      this.timerState.isRunning = false;
    } else {
      this.timerState.isRunning = true;
      this.timerState.interval = setInterval(() => {
        if (this.timerState.time > 0) {
          this.timerState.time--;
          this.updateTimerDisplay();
        } else {
          this.playAlarmSound();
          clearInterval(this.timerState.interval);
          this.timerState.isRunning = false;
          alert("⏰ หมดเวลาแล้ว! พักผ่อนได้");
        }
        this.updateTimerBtnState(); // อัปเดตสีปุ่ม
      }, 1000);
    }
    this.updateTimerBtnState();
  },

  setTimer(minutes) {
    if (this.timerState.interval) clearInterval(this.timerState.interval);
    this.timerState.isRunning = false;
    this.timerState.time = minutes === 0 ? 25 * 60 : minutes * 60;
    this.updateTimerDisplay();
    this.updateTimerBtnState();
  },

  updateTimerDisplay() {
    const el = document.getElementById("timer-display");
    if (el) {
      const m = Math.floor(this.timerState.time / 60)
        .toString()
        .padStart(2, "0");
      const s = (this.timerState.time % 60).toString().padStart(2, "0");
      el.textContent = `${m}:${s}`;
    }
  },

  updateTimerBtnState() {
    const btn = document.getElementById("btn-timer-toggle");
    if (btn) {
      btn.textContent = this.timerState.isRunning
        ? "⏸ PAUSE"
        : "▶️ START FOCUS";
      if (this.timerState.isRunning) {
        btn.classList.add("running");
        btn.style.background = "var(--color-yellow)";
        btn.style.color = "#000";
      } else {
        btn.classList.remove("running");
        btn.style.background = "";
        btn.style.color = "";
      }
    }
  },

  playAlarmSound() {
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
  },

  // --- 3. Task Actions ---
  addTodayTask(type, inputEl) {
    const val = inputEl ? inputEl.value.trim() : "";
    if (!val) return;

    if (type === "mustDo" && appState.today.mustDo.length >= 3) {
      this.showToast("งานด่วนทำแค่ 3 อย่างพอนะ!", "error");
      return;
    }

    const newTask = {
      id: GoalSystem.generateId(),
      title: val,
      completed: false,
    };
    appState.today[type].push(newTask);
    saveState();

    inputEl.value = ""; // ล้างช่องพิมพ์
    this.renderView("today");
  },

  toggleTodayTask(type, id) {
    const task = appState.today[type].find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveState();
      this.renderView("today");
      if (task.completed) this.playSuccessSound();
    }
  },

  deleteTodayTask(type, id) {
    appState.today[type] = appState.today[type].filter((t) => t.id !== id);
    saveState();
    this.renderView("today");
  },

  // --- 4. Note Actions ---
  saveBrainDump(val) {
    appState.today.brainDump = val;
    saveState();
  },

  saveTodayNote(val) {
    appState.today.notes = val;
    saveState();
  },

  playSuccessSound() {
    // เสียงติ๊งเบาๆ (Optional)
  },
  editProfile() {
    const avatarPresets = ["⬤", "◼", "◆", "▲", "▼", "◈", "▣", "▰"];

    const html = `
        <div style="display:grid; gap:15px;">
            <div>
                <label style="font-weight:700; font-size:0.8rem; color:var(--text-muted);">NAME</label>
                <input type="text" id="edit-user-name" class="input-std" value="${
                  appState.user.name
                }">
            </div>
            <div>
                <label style="font-weight:700; font-size:0.8rem; color:var(--text-muted);">MAJOR / EDUCATION</label>
                <input type="text" id="edit-user-edu" class="input-std" value="${
                  appState.user.education || ""
                }" placeholder="เช่น Computer Science">
            </div>
            <div>
                <label style="font-weight:700; font-size:0.8rem; color:var(--text-muted);">AVATAR</label>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-top:8px;">
                    ${avatarPresets
                      .map(
                        (icon) => `
                        <div class="avatar-option"
                             style="font-size:1.2rem; padding:8px; border:var(--border-std); border-radius:8px; text-align:center; cursor:pointer; background:#fff;"
                             onclick="document.getElementById('edit-user-avatar').value='${icon}';
                                      document.querySelectorAll('.avatar-option').forEach(el=>el.style.background='#fff');
                                      this.style.background='var(--color-yellow)';"
                        >${icon}</div>
                    `
                      )
                      .join("")}
                </div>
                <input type="hidden" id="edit-user-avatar" value="${
                  appState.user.avatar
                }">
            </div>
        </div>
    `;

    this.openModal("Customize Profile", html, () => {
      const name = document.getElementById("edit-user-name").value.trim();
      const edu = document.getElementById("edit-user-edu").value.trim();
      const avatar = document.getElementById("edit-user-avatar").value.trim();

      if (name) {
        appState.user.name = name;
        appState.user.education = edu || "N/A";
        appState.user.avatar = avatar || "⚫";

        saveState();
        TimeSystem.update(); // อัปเดตการแสดงผลทันที
        this.showToast("Profile Saved!", "success");
        return true;
      }
      return false;
    });
  },
};



// ระบบตัดเสียงอัตโนมัติเมื่อซ่อนหน้าจอ หรือปิดแอป (สำหรับ iPad/Mobile)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // เมื่อหน้าจอถูกซ่อน (สลับแอป/ล็อคจอ) ให้หาเสียงที่กำลังเล่นแล้วหยุดมันซะ
        const activeAudios = document.querySelectorAll('audio');
        activeAudios.forEach(audio => {
            audio.pause(); // สั่งหยุดเสียง
            audio.currentTime = 0; // รีเซ็ตไปจุดเริ่มต้น (ถ้าอยากให้เริ่มใหม่ตอนกลับมา)
        });

        // ถ้ามึงใช้ฟังก์ชันคุมปุ่มใน App ให้สั่งอัปเดตสถานะปุ่มด้วย
        document.querySelectorAll('.btn-sound').forEach(btn => {
            btn.classList.remove('active');
            btn.innerHTML = btn.dataset.icon || '🔈'; // เปลี่ยนไอคอนกลับเป็นปิด
        });

        console.log("SYSTEM_LOG: Background Audio Terminated.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
