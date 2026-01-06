/* =========================================
   GLOBAL EVENT LISTENERS (SYSTEM LEVEL)
   ========================================= */

// Force Audio Kill on Visibility Change
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // 1. Find all audio elements
    const audios = document.querySelectorAll("audio");

    audios.forEach((audio) => {
      audio.pause();
      audio.src = ""; // Clear source to stop buffering
      audio.load();
      audio.remove();
    });

    // 2. Close AudioContext if active
    if (window.AudioContext || window.webkitAudioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.close();
    }

    // 3. Reset UI buttons
    document.querySelectorAll(".btn-sound").forEach((btn) => {
      btn.classList.remove("active");
      btn.innerHTML = btn.dataset.icon || "🔈";
      btn.style.boxShadow = "";
    });
  }
});

/* =========================================
   APP CONTROLLER
   ========================================= */

const App = {
  currentPage: "home",
  currentAudio: null,
  libraryFilter: "all",
  libraryTypeFilter: "all",

  journalState: {
    isEditing: false,
    editId: null,
    tempTags: [],
    tempText: null,
    tempGratitude: null,
    tempMood: null,
  },

  timerState: {
    time: 25 * 60,
    isRunning: false,
    interval: null,
    mode: "focus",
    sessions: 0,
  },

  moneyTempState: {
    type: "expense",
    category: "อาหาร",
    tempAmount: "",
    tempNote: "",
  },

  scheduleState: {
    view: "daily",
    selectedDate: new Date(),
    viewMonth: new Date(),
    draggedItem: null,
  },

  // 👇 1. เพิ่มคลังคำคมตรงนี้ (อยากได้แนวอิสลามหรืออื่นๆ ใส่เพิ่มตรงนี้ได้เลย)
  quotes: [
    // --- หมวดอิสลาม (Islamic Reminder) ---
    {
      text: "แท้จริงแล้ว หลังจากความยากลำบาก ย่อมมีความง่ายดาย",
      author: "อัล-กุรอาน (94:6)",
      tag: "ISLAMIC",
    },
    {
      text: "จงฉกฉวย 5 สิ่งก่อน 5 สิ่ง: วัยหนุ่มก่อนชรา, สุขภาพดีก่อนเจ็บป่วย, ความมั่งมีก่อนยากจน, เวลาว่างก่อนยุ่ง, และชีวิตก่อนตาย",
      author: "หะดีษ",
      tag: "REMINDER",
    },
    {
      text: "การงานที่ดีที่สุด คือสิ่งที่ทำอย่างสม่ำเสมอ แม้จะเล็กน้อยก็ตาม",
      author: "หะดีษ",
      tag: "CONSISTENCY",
    },
    {
      text: "โลกดุนยานี้ เปรียบเสมือนคุกของผู้ศรัทธา และเป็นสวรรค์ของผู้ปฏิเสธ",
      author: "หะดีษ",
      tag: "REALITY",
    },
    {
      text: "อย่าโกรธ แล้วท่านจะได้เข้าสวรรค์",
      author: "ศาสดามูฮัมหมัด (ซ.ล.)",
      tag: "PATIENCE",
    },

    // --- หมวดปลุกใจ (Productivity & Mindset) ---
    {
      text: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
      tag: "VISION",
    },
    {
      text: "Discipline is doing what needs to be done, even if you don't want to.",
      author: "Unknown",
      tag: "DISCIPLINE",
    },
    {
      text: "พรุ่งนี้ไม่มีจริง มีแต่วันนี้ที่คุณต้องลงมือทำ",
      author: "เตือนใจ",
      tag: "ACTION",
    },
    {
      text: "อย่ากลัวที่จะล้มเหลว จงกลัวที่จะอยู่ที่เดิมในปีหน้า",
      author: "Anonymous",
      tag: "GROWTH",
    },
    {
      text: "ความสำเร็จไม่ได้วัดที่จุดสูงสุด แต่วัดที่ระยะทางที่คุณปีนขึ้นมา",
      author: "Unknown",
      tag: "SUCCESS",
    },
  ],

  // ============================================================
  // 1. INITIALIZATION & SYSTEM
  // ============================================================

  init() {
    loadState();
    TimeSystem.init();
    this.bindNavigation();
    this.bindSidebarEvents();

    document.addEventListener("time-updated", (e) => {
      this.renderTimeWidget(e.detail);
    });

    TimeSystem.update();

    // Reset Timer State on Init
    this.timerState = {
      time: 25 * 60,
      isRunning: false,
      interval: null,
      sessions: 0,
    };

    this.renderView("home");
  },

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
        sidebar.classList.toggle("mobile-active");
        overlay && overlay.classList.toggle("active");
      } else {
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
          overlay && overlay.classList.remove("active");
        }
      });
    });
  },

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
            <div class="u-mb-lg">${htmlContent}</div>
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
      "schedule",
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

    // Reset Title
    const titles = {
      home: "Home",
      schedule: "PLANNER",
      goals: "Goals",
      today: "Focus",
      library: "Library",
      tools: "Tools",
      reviews: "Review",
      settings: "Settings",
    };
    pageTitle.textContent = titles[pageName] || pageName.toUpperCase();

    switch (pageName) {
      case "home":
        this.renderDashboard(contentArea);
        break;
      case "schedule":
        this.renderSchedule(contentArea);
        break;
      case "goals":
        this.renderGoals(contentArea);
        break;
      case "today":
        this.renderToday(contentArea);
        break;
      case "library":
        this.renderLibrary(contentArea);
        break;
      case "tools":
        this.renderToolsHub(contentArea);
        break;
      case "reviews":
        this.renderReviews(contentArea);
        break;
      case "settings":
        this.renderSettings(contentArea);
        break;
      default:
        contentArea.innerHTML = `<p class="placeholder-text">กำลังก่อสร้าง...</p>`;
    }
  },

  // ============================================================
  // 3. DASHBOARD
  // ============================================================

  renderDashboard(container) {
    const timeData = TimeSystem.current || {
      weekNumber: 0,
      progress: {
        day: 0,
      },
      dayPart: "Day",
    };
    const todayData = appState.today || {
      focus: null,
    };
    const now = new Date();

    // 1. ประกาศตัวแปรวันที่วันนี้ (จำเป็นมาก!)
    const todayKey = new Date().toLocaleDateString("th-TH");

    // 2. คำนวณ moneyToday (วางตรงนี้!)
    const moneyToday = appState.tools?.money
      ? appState.tools.money.transactions
          .filter((t) => t.date === todayKey && t.type === "expense")
          .reduce((s, t) => s + t.amount, 0)
      : 0;

    // A. Dates
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
    const hijriStr = new Intl.DateTimeFormat("th-TH-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);

    // B. Islamic Events Countdown
    const islamicEvents = [
      {
        name: "เริ่มถือศีลอด",
        date: "2026-02-18",
      },
      {
        name: "วันรายอ (อีดิ้ลฟิตริ)",
        date: "2026-03-20",
      },
      {
        name: "วันกุรบาน (อีดิ้ลอัฎฮา)",
        date: "2026-05-27",
      },
      {
        name: "ปีใหม่อิสลาม 1448",
        date: "2026-06-16",
      },
    ];

    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const nextEvent = islamicEvents.find((e) => new Date(e.date) >= todayZero);

    let countdownHTML = "";
    if (nextEvent) {
      const diffTime = new Date(nextEvent.date) - todayZero;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const badgeColor =
        diffDays <= 7 ? "var(--color-red)" : "var(--text-muted)";
      const badgeText = diffDays === 0 ? "วันนี้!" : `อีก ${diffDays} วัน`;

      countdownHTML = `
        <div class="u-flex-align-center u-gap-xs u-mt-xs"
             style="background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:6px; width:fit-content;">
            <span style="font-size:0.75rem; font-weight:700; color:${badgeColor};"> ${badgeText}</span>
            <span style="font-size:0.75rem; color:var(--text-main); opacity:0.8;">ถึง${nextEvent.name}</span>
        </div>`;
    } else {
      countdownHTML = `<div class="u-text-xs u-text-muted u-mt-xs">รออัปเดตปฏิทินปีหน้า</div>`;
    }

    // C. Data Stats
    const library = appState.library || [];
    const libStats = library.reduce((acc, item) => {
      const type = item.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const exLogs = Array.isArray(appState.tools.exercise)
      ? appState.tools.exercise
      : [];
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weeklyExLogs = exLogs.filter((l) => new Date(l.date) >= monday);
    const totalMins = weeklyExLogs.reduce(
      (sum, l) => sum + parseInt(l.duration || 0),
      0
    );

    // D. Manifesto Logic (Updated)
    const featuredJournal = appState.tools.journal?.find((j) => j.isFeatured);
    let initialContent, initialAuthor, initialTag, initialStamp;

    if (featuredJournal) {
      // ถ้ามีการปักหมุด Journal ให้โชว์อันนั้นก่อน
      initialContent =
        featuredJournal.text.length > 100
          ? featuredJournal.text.substring(0, 100) + "..."
          : featuredJournal.text;
      initialAuthor = appState.user?.name || "ME";
      initialTag = "PINNED LOG";
      initialStamp = "IMPORTANT";
    } else {
      // ถ้าไม่มีปักหมุด ให้สุ่มจากคลังคำคม (App.quotes) + Journal เก่าๆ
      const userJournals = (appState.tools.journal || []).map((j) => ({
        text: j.text,
        author: "MY PAST SELF",
        tag: "FLASHBACK",
        stamp: "MEMORY",
      }));

      // รวมคำคมกลาง + Journal เรา
      const pool = [...this.quotes, ...userJournals];

      // สุ่มเลือก 1 อัน
      const random =
        pool.length > 0
          ? pool[Math.floor(Math.random() * pool.length)]
          : { text: "No quotes available", author: "System", tag: "EMPTY" };

      initialContent =
        random.text.length > 100
          ? random.text.substring(0, 100) + "..."
          : random.text;
      initialAuthor = random.author;
      initialTag = random.tag || "WISDOM";
      initialStamp = random.stamp || "RANDOM"; // ถ้าไม่มี stamp ให้ใช้คำว่า RANDOM
    }

    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear =
      Math.floor((new Date() - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const totalDaysInYear =
      (currentYear % 4 === 0 && currentYear % 100 > 0) ||
      currentYear % 400 === 0
        ? 366
        : 365;

    // B. GOALS LOGIC (NEW!)
    // ดึง Goal มาโชว์สูงสุด 3 อัน
    const activeGoals = (appState.goals || []).slice(0, 3);
    const goalsHTML =
      activeGoals.length > 0
        ? `<div class="dash-goal-list">
         ${activeGoals
           .map((g) => {
             const progress = GoalSystem.calculateProgress(g);
             return `
            <div class="dash-goal-item">
                <div class="dash-goal-header">
                    <div class="dash-goal-title">${g.icon || "🎯"} ${
               g.title
             }</div>
                    <div class="dash-goal-percent">${progress}%</div>
                </div>
                <div class="p-bar" style="height:6px; margin-top:0;">
                    <div class="p-fill" style="width:${progress}%; background:var(--color-purple);"></div>
                </div>
            </div>`;
           })
           .join("")}
       </div>
       <button class="u-text-xs u-text-muted u-mt-sm u-w-full u-text-center u-cursor-pointer u-no-border u-bg-transparent" onclick="App.navigateTo('goals')">ดูเป้าหมายทั้งหมด ▶</button>`
        : `<div class="u-text-center u-text-muted u-p-md"> <span class="u-text-lg u-cursor-pointer" onclick="App.handleAddGoal()">+ เริ่มสร้างเป้าหมายใหม่</span></div>`;

    // C. HABITS LOGIC (FIXED: checkHabit -> toggleHabit)
    const habitsList = appState.tools?.habits || [];
    const habitsHTML =
      habitsList.length > 0
        ? `<div class="dash-habit-container">
         ${habitsList
           .map((h) => {
             const isDone = h.lastDone === todayKey;
             // แก้ไขตรงนี้จาก App.checkHabit เป็น App.toggleHabit
             return `
             <div class="dash-habit-row ${
               isDone ? "is-done" : ""
             }" onclick="event.stopPropagation(); App.toggleHabit('${h.id}')">
                 <div class="habit-info">
                     <div class="habit-streak-badge">
                         ${h.streak} STREAK
                     </div>
                     <span style="font-weight:700; font-size:0.9rem; color:${
                       isDone ? "var(--color-green)" : "var(--text-main)"
                     }; text-decoration:${isDone ? "line-through" : "none"}">
                        ${h.name}
                     </span>
                 </div>
                 <button class="btn-check-habit">
                    ${isDone ? "✓" : ""}
                 </button>
             </div>`;
           })
           .join("")}
       </div>`
        : `<div class="u-text-center u-p-lg" style="cursor:pointer; " onclick="App.openTool('habit')"> + เริ่มสร้างนิสัยใหม่ </div>`;

    // RENDER UI
    container.innerHTML = `
        <div class="dashboard-grid-v2">

          <div class="paper-card status-card-enhanced hover-card" onclick="App.navigateTo('reviews')">
            <div class="u-w-full u-flex-between u-flex-align-center">
                <div class="sys-tag-dark">SYSTEM STATUS</div>
                <div class="u-text-sm u-font-black u-text-muted">YEAR ${currentYear}</div>
            </div>
            <div class="day-counter-wrapper">
                <div class="day-label" > DAY PROGRESS OF THE YEAR </div>
                <div class="day-big-fraction">
                    <span class="curr-day">${dayOfYear}</span>
                    <span class="separator">/</span>
                    <span class="total-day">${totalDaysInYear}</span>
                </div>
                <div class="u-text-xs u-font-bold u-text-muted u-mt-xs">
                    QUARTER ${currentQuarter} • ${timeData.dayPart.toUpperCase()} PHASE
                </div>
            </div>
            <div class="u-w-full u-mt-auto">
              <div class="u-flex-between u-text-xs u-font-black u-mb-xs">
                  <span>COMPLETED</span>
                  <span>${timeData.progress.year}%</span>
              </div>
              <div class="sys-progress-track">
                  <div class="sys-progress-fill" style="width:${
                    timeData.progress.year
                  }%;"></div>
                  <div class="sys-progress-grid"></div>
              </div>
              <div class="sys-action-text"> TAP TO REVIEW YOUR WEEK ▶</div>
            </div>
          </div>

        <div class="paper-card bg-yellow clock-card hover-card" onclick="App.navigateTo('today')">
            <div class="u-flex-between u-flex-align-start">
                <div>
                    <div class="clock-time-text">${timeStr}</div>
                    <div class="clock-date-text">${dateStr}</div>
                    <div class="u-text-sm u-font-bold u-mt-xs" style="color:var(--text-main); opacity:0.7;">
                         ${hijriStr}
                    </div>
                    ${countdownHTML}
                </div>
                <div class="clock-week-badge">
                    WEEK ${timeData.weekNumber}
                </div>
            </div>
            <div class="clock-progress-area">
                <div class="u-flex-between u-text-xs u-font-black">
                    <span>DAY PROGRESS</span>
                    <span>${timeData.progress.day}%</span>
                </div>
                <div class="clock-progress-bar">
                    <div class="clock-progress-fill" style="width:${
                      timeData.progress.day
                    }%;"></div>
                </div>
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" onclick="App.navigateTo('schedule')">
             <div class="manifesto-tape"></div>
             <div class="manifesto-header">
                <span class="manifesto-tag section-tag bg-black">UPCOMING</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body" style="padding:15px; justify-content:flex-start;">
                ${(() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const upcoming = (appState.schedule || [])
                    .filter((e) => e.date >= todayStr)
                    .sort((a, b) =>
                      (a.date + a.timeStart).localeCompare(b.date + b.timeStart)
                    )
                    .slice(0, 3);

                  if (upcoming.length === 0)
                    return `<div class="u-text-center u-text-muted">วันนี้ว่าง... สบายจัง 💤</div>`;

                  return upcoming
                    .map(
                      (e) => `
                        <div style="border-left:4px solid ${
                          e.important ? "var(--color-red)" : "#ccc"
                        }; padding-left:10px; margin-bottom:8px;">
                            <div class="u-flex-between">
                                <span class="u-font-bold u-text-sm">${
                                  e.timeStart
                                }</span>
                                <span class="u-text-xs u-text-muted">${
                                  e.date === todayStr ? "TODAY" : e.date
                                }</span>
                            </div>
                            <div class="u-text-main">${e.title} ${
                        e.important ? "🔥" : ""
                      }</div>
                        </div>
                    `
                    )
                    .join("");
                })()}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" id="manifesto-widget" onclick="App.openTool('journal')">
            <button class="btn-shuffle" onclick="event.stopPropagation(); App.shuffleManifesto()">สุ่ม</button>
            <div class="manifesto-tape"></div>
            <div class="manifesto-header">
                <span class="manifesto-tag" id="man-tag">${initialTag}</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body">
                <div class="manifesto-quote" id="man-text">"${initialContent}"</div>
                <div class="manifesto-author" id="man-author">— ${initialAuthor}</div>
            </div>
            <div class="manifesto-stamp" id="man-stamp">${initialStamp}</div>
        </div>

        <div class="paper-card quote-manifesto hover-card" id="focus-widget" onclick="App.navigateTo('today')">
            <div class="manifesto-tape-today"></div>
            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background:var(--color-pink);">TODAY FOCUS</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body u-text-center">
                ${
                  todayData.focus
                    ? `
                  <div class="manifesto-quote" style="font-size:1.6rem; line-height:1.3;">"${todayData.focus}"</div>
                  <button class="btn-action u-text-white bg-success u-mt-md" onclick="event.stopPropagation(); App.handleClearFocus()">เสร็จแล้ว!</button>
                `
                    : `
                  <div class="u-p-lg" style="">
                      <div class="u-text-muted u-text-lg">ยังไม่มีเป้าหมายวันนี้...</div>
                      <button class="btn-action bg-yellow u-font-black u-mt-md" onclick="event.stopPropagation(); App.navigateTo('today')">+ กำหนดงานสำคัญ</button>
                  </div>
                `
                }

            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" onclick="App.navigateTo('goals')">
            <div class="manifesto-tape-purple"></div>

            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background:var(--color-purple); ">ACTIVE GOALS</span>
                <div class="manifesto-hole"></div>
            </div>

            <div class="manifesto-body u-text-lg u-text-muted" style="justify-content: flex-star; gap: 10px; ">
                ${goalsHTML}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" onclick="App.openTool('habit')">
             <div class="manifesto-tape-habits"></div>

            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background:var(--color-green);">HABIT CONTROL</span>
                <div class="manifesto-hole"></div>
            </div>

            <div class="manifesto-body u-text-lg u-text-muted" style="justify-content: center; padding-top: 15px;">
                ${habitsHTML}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card u-cursor-pointer" onclick="App.openTool('money')">
            <div class="manifesto-tape-orange"></div>
            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background:var(--color-orange);">FINANCIAL</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body">
                ${(() => {
                  const budget = appState.tools.money?.budget || 0;
                  const tx = appState.tools.money?.transactions || [];
                  const monthExpense = tx
                    .filter(
                      (t) =>
                        new Date(t.rawDate || Date.now()).getMonth() ===
                          new Date().getMonth() && t.type === "expense"
                    )
                    .reduce((s, t) => s + t.amount, 0);
                  const percent = budget
                    ? Math.min((monthExpense / budget) * 100, 100)
                    : 0;
                  let verdict = "ควบคุมตัวเองได้ดี",
                    action = "รักษาวินัยแบบนี้ต่อไป",
                    tone = "u-text-success";
                  if (!budget) {
                    verdict = "ไม่มีงบ = ไม่มีการควบคุม";
                    action = "ตั้งงบประมาณเดี๋ยวนี้";
                    tone = "u-text-muted";
                  } else if (percent >= 100) {
                    verdict = "เกินงบแล้ว";
                    action = "หยุดใช้เงินที่ไม่จำเป็นทันที";
                    tone = "u-text-danger";
                  } else if (percent >= 85) {
                    verdict = "ใกล้พัง";
                    action = "ตัดรายจ่ายที่ไม่จำเป็น";
                    tone = "u-text-warning";
                  } else if (percent >= 65) {
                    verdict = "เริ่มเสี่ยง";
                    action = "ใช้เงินอย่างมีสติ";
                    tone = "u-text-warning";
                  }

                  return `
                    <div class="manifesto-quote ${tone}" style="font-size:1.6rem; line-height:1.25;">${verdict}</div>
                    <div class="u-text-sm u-font-bold u-mt-sm">คำแนะนำ: ${action}</div>
                    <div class="u-text-xs u-text-muted u-mt-sm">ใช้ไปแล้ว ${monthExpense.toLocaleString()} ฿ จากงบ ${budget.toLocaleString()} ฿</div>
                    <div class="u-mt-md">
                        <div class="p-bar" style="height:4px; border:1.5px solid var(--border-color);">
                            <div class="p-fill" style="width:${percent}%; background:${
                    percent >= 85 ? "#ef4444" : "#22c55e"
                  };"></div>
                        </div>
                    </div>
                    <div class="u-text-xs u-mt-sm">วันนี้ใช้ไป <span class="u-font-bold u-text-danger">${moneyToday.toLocaleString()} ฿</span></div>
                  `;
                })()}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" onclick="App.navigateTo('library')">
        <div class="manifesto-tape-blue"></div>
            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background: var(--color-blue);">LIBRARY</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body" style="justify-content: space-between;">
                ${(() => {
                  const readingList = library.filter(
                    (i) => i.status === "reading"
                  );
                  const doneCount = library.filter(
                    (i) => i.status === "done"
                  ).length;
                  const currentBook =
                    readingList.length > 0
                      ? readingList[readingList.length - 1]
                      : null;

                  // ส่วนที่ 1: แสดงแค่ ชื่อเรื่อง + ประเภท (ไม่มีรูป)
                  const currentBookHTML = currentBook
                    ? `
                        <div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border:1px solid rgba(0,0,0,0.05); text-align:left;">
                             <div class="u-flex-between u-mb-xs">
                                 <span class="u-text-xs u-font-bold" style="color:var(--color-blue);">● READING NOW</span>
                                 <span class="u-text-xs u-font-bold u-uppercase" style="background:#fff; padding:2px 8px; border:1px solid #000; border-radius:4px; font-size:0.65rem;">
                                    ${currentBook.type}
                                 </span>
                             </div>
                             <div class="u-font-black u-text-main" style="font-size:1.1rem; line-height:1.3; margin-bottom:4px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                                ${currentBook.title}
                             </div>
                             <div class="u-text-xs u-text-muted">${
                               currentBook.author || ""
                             }</div>
                        </div>
                    `
                    : `
                        <div class="u-text-center u-text-muted" style="padding:15px;  border-radius:8px;">
                            <div class="u-text-lg u-p-lg " style="cursor:pointer;"> ไม่มีอะไรเลยคร้าบบบ </div>
                        </div>
                    `;

                  // ส่วนที่ 2: Stats
                  return `
                        ${currentBookHTML}

                        <div class="u-flex-between u-mt-md" style="border-top:2px dashed #eee; padding-top:15px;">
                            <div class="u-text-center">
                                <div style="font-size:1.4rem; font-weight:900; color:var(--color-blue); line-height:1;">${readingList.length}</div>
                                <div class="u-text-xs u-font-bold u-text-muted">READING</div>
                            </div>
                            <div class="u-text-center" style="border-left:1px solid #eee; border-right:1px solid #eee; padding:0 15px;">
                                <div style="font-size:1.4rem; font-weight:900; color:var(--color-green); line-height:1;">${doneCount}</div>
                                <div class="u-text-xs u-font-bold u-text-muted">DONE</div>
                            </div>
                            <div class="u-text-center">
                                <div style="font-size:1.4rem; font-weight:900; color:var(--text-main); line-height:1;">${library.length}</div>
                                <div class="u-text-xs u-font-bold u-text-muted">TOTAL</div>
                            </div>
                        </div>
                    `;
                })()}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card u-cursor-pointer" onclick="App.openTool('exercise')">
                <div class="manifesto-tape-red"></div>
            <div class="manifesto-header">
                <span class="manifesto-tag bg-red section-tag" style="background: var(--color-red);">PHYSICAL VERDICT</span>
                <div class="manifesto-hole"></div>
            </div>
            <div class="manifesto-body">
                ${(() => {
                  // 1. ดึงข้อมูลแบบรองรับโครงสร้างใหม่ (logs แยกกับ profile)
                  const exTool = appState.tools.exercise || {};
                  const logs = Array.isArray(exTool)
                    ? exTool
                    : exTool.logs || [];
                  const profile = exTool.profile || {
                    goalMin: 150,
                    goalCal: 2000,
                  };

                  // 2. คำนวณยอดสัปดาห์นี้
                  const day = now.getDay();
                  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(now.setDate(diff));
                  monday.setHours(0, 0, 0, 0);

                  const weeklyLogs = logs.filter(
                    (l) => new Date(l.date) >= monday
                  );
                  const totalMins = weeklyLogs.reduce(
                    (s, t) => s + parseInt(t.duration || 0),
                    0
                  );
                  const totalCals = weeklyLogs.reduce(
                    (s, t) => s + parseInt(t.cals || 0),
                    0
                  );

                  // 3. เป้าหมาย
                  const goalMin = parseInt(profile.goalMin || 150);
                  const goalCal = parseInt(profile.goalCal || 2000);

                  const minPct = Math.min((totalMins / goalMin) * 100, 100);
                  const calPct = Math.min((totalCals / goalCal) * 100, 100);

                  // 4. ตัดสินผล (Verdict)
                  let verdict = "ร่างกายยังไหว",
                    tone = "u-text-success";

                  if (totalMins === 0) {
                    verdict = "ลุกไปออกกำลังกาย!!!!!";
                    tone = "u-text-danger";
                  } else if (totalMins < goalMin * 0.5) {
                    verdict = "สนิมเริ่มเกาะ";
                    tone = "u-text-warning";
                  } else if (totalMins >= goalMin) {
                    verdict = "ฟิตเปรี้ยะ 🔥";
                    tone = "u-text-success";
                  }

                  return `
                    <div class="u-flex-between u-flex-align-end">
                        <div class="manifesto-quote ${tone}" style="font-size:1.4rem; margin-bottom:0;">${verdict}</div>
                        <div class="u-text-right">
                            <div class="u-text-xs u-font-bold u-text-muted">WEEKLY GOAL</div>
                            <div class="u-font-black">${Math.round(
                              minPct
                            )}%</div>
                        </div>
                    </div>

                    <div class="u-mt-md">
                        <div class="u-flex-between u-text-xs u-mb-xs">
                            <span class="u-font-bold" style="color:var(--color-red);">TIME</span>
                            <span class="u-text-muted">${totalMins}/${goalMin} min</span>
                        </div>
                        <div class="p-bar" style="height:6px; margin-top:0; border:1px solid #ddd;">
                            <div class="p-fill bg-red" style="width:${minPct}%;"></div>
                        </div>

                        <div class="u-flex-between u-text-xs u-mb-xs u-mt-sm">
                            <span class="u-font-bold" style="color:var(--color-orange);">BURN</span>
                            <span class="u-text-muted">${totalCals.toLocaleString()}/${goalCal.toLocaleString()} kcal</span>
                        </div>
                        <div class="p-bar" style="height:6px; margin-top:0; border:1px solid #ddd;">
                            <div class="p-fill bg-orange" style="width:${calPct}%;"></div>
                        </div>
                    </div>
                  `;
                })()}
            </div>
        </div>

        <div class="paper-card quote-manifesto hover-card" onclick="App.openTool('journal')" style="grid-column: span 2;">
            <div class="manifesto-tape-blue"></div>

            <div class="manifesto-header">
                <span class="manifesto-tag section-tag" style="background: var(--color-blue);">DAILY LOG</span>
                <div class="manifesto-hole"></div>
            </div>

            <div class="manifesto-body" style="justify-content: center; padding: 25px;">
                ${(() => {
                  const journals = appState.tools.journal || [];
                  const lastEntry =
                    journals.length > 0 ? journals[journals.length - 1] : null;

                  if (lastEntry) {
                    const shortText =
                      lastEntry.text.length > 80 // เพิ่มลิมิตตัวอักษรหน่อยเพราะช่องกว้างขึ้น
                        ? lastEntry.text.substring(0, 80) + "..."
                        : lastEntry.text;
                    const timeStr = new Date(lastEntry.date).toLocaleTimeString(
                      "th-TH",
                      { hour: "2-digit", minute: "2-digit" }
                    );

                    return `
                            <div class="u-flex-align-center u-gap-md" style="width: 100%;">
                                <div style="font-size:3.5rem; line-height:1; filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.1)); margin-right: 15px;">
                                    ${lastEntry.mood || "📝"}
                                </div>
                                <div style="flex:1;">
                                    <div class="u-text-xs u-font-bold u-text-muted" style="margin-bottom: 5px;">LATEST LOG • ${timeStr}</div>
                                    <div class="u-font-bold u-text-main" style="font-size:1.1rem; line-height:1.4;">"${shortText}"</div>
                                </div>
                                <div class="u-text-right" style="min-width: 80px;">
                                    <span class="u-text-xs u-text-muted" style="border-bottom:1px solid #ccc;">อ่านทบทวน ▶</span>
                                </div>
                            </div>
                        `;
                  } else {
                    return `
                            <div class="u-text-center">
                                <div style="font-size:3rem; margin-bottom:10px; opacity:0.5;">🖊️</div>
                                <div class="u-font-bold u-text-lg">ยังไม่มีบันทึก</div>
                                <div class="u-text-xs u-text-muted">เขียนระบายความรู้สึกวันนี้หน่อยไหม?</div>
                            </div>
                        `;
                  }
                })()}
            </div>
        </div>
    <style>.hover-card { transition: transform 0.2s, box-shadow 0.2s; } .hover-card:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); }</style>
    `;
  },

  // ============================================================
  // 10. ULTIMATE SCHEDULE (COMPLETE VERSION)
  // ============================================================

  renderSchedule(container) {
    if (!appState.schedule) appState.schedule = [];

    const selected = this.scheduleState.selectedDate;
    const viewMonth = this.scheduleState.viewMonth;

    // ✅ ป้องกันปัญหา Timezone: ใช้ Local Date ในการสร้าง Key สำหรับดึงข้อมูล
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

    // --- ส่วนประกอบ UI: หัวข้อและปุ่มควบคุมวันที่ ---
    const headerHTML = `
      <div class="u-flex-between u-flex-align-center u-mb-lg sched-header-responsive">
          <div class="u-flex-align-center">
             <div class="section-tag bg-black" style="margin:0; font-size:1rem; padding:8px 12px;">SCHEDULE</div>
          </div>
          <div class="sched-date-control">
             <button class="sched-nav-btn prev" onclick="App.changeScheduleDate(-1)">◀</button>
             <div class="sched-current-date">${dateStr}</div>
             <button class="sched-nav-btn next" onclick="App.changeScheduleDate(1)">▶</button>
          </div>
      </div>
    `;

    // --- ส่วนประกอบ UI: ปฏิทินรายเดือน (Full Calendar) ---
    const renderFullCalendar = () => {
      const firstDay = new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth(),
        1
      );
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
      // เติมวันจากเดือนก่อนหน้า (สีจาง)
      for (let x = firstDay.getDay(); x > 0; x--) {
        daysHtml += `<div class="cal-day prev-month">${
          prevLastDay.getDate() - x + 1
        }</div>`;
      }
      // เติมวันในเดือนปัจจุบัน
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const dKey = `${viewMonth.getFullYear()}-${String(
          viewMonth.getMonth() + 1
        ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const isSelected = dKey === isoDate;
        const hasEvent = appState.schedule.some((e) => e.date === dKey);
        const isToday = dKey === new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

        daysHtml += `
            <div class="cal-day ${isSelected ? "active" : ""} ${
          hasEvent ? "has-event" : ""
        } ${isToday ? "is-today" : ""}"
                 onclick="App.setScheduleDate('${new Date(
                   viewMonth.getFullYear(),
                   viewMonth.getMonth(),
                   i
                 ).toISOString()}')">
                ${i}
            </div>`;
      }

      return `
        <div class="paper-card full-calendar">
            <div class="u-flex-between u-mb-md u-flex-align-center">
                <div class="u-font-black u-text-lg">${monthYearStr}</div>
                <div class="u-flex u-gap-xs">
                    <button class="btn-action btn-sm" onclick="App.changeViewMonth(-1)">◀</button>
                    <button class="btn-action btn-sm" onclick="App.changeViewMonth(1)">▶</button>
                </div>
            </div>
            <div class="cal-grid-header">
                <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
            </div>
            <div class="cal-grid-body">${daysHtml}</div>
        </div>`;
    };

    // --- ส่วนประกอบ UI: แผนผังกิจกรรมประจำวัน (Timeline) ---
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
        id: "sleep",
        label: "SLEEP",
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
        <div class="sched-block-zone" ondrop="App.handleDrop(event, '${
          block.id
        }', '${isoDate}')" ondragover="App.allowDrop(event)">
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
                    <div class="sched-event-card"
                         style="border-left-color: ${
                           evt.important
                             ? "var(--color-red)"
                             : "var(--color-blue)"
                         }"
                         draggable="true" ondragstart="App.handleDragStart(event, '${
                           evt.id
                         }')">
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
                    : '<div class="sched-placeholder">ลากสติกเกอร์มาวางที่นี่</div>'
                }
            </div>
        </div>`;
      })
      .join("");

    // --- รวมโครงสร้างทั้งหมดลง Container ---
    container.innerHTML = `
        ${headerHTML}
        <div class="sched-new-layout">
            <div class="sched-calendar-area">
                ${renderFullCalendar()}
                <div class="sched-dock">
                    <div class="u-font-black u-mb-sm u-text-center">STICKERS</div>
                    <div class="sched-stickers-row">
                        <div class="sched-sticker" draggable="true" ondragstart="App.handleStickerDragStart(event, 'ประชุม', 'work')">💼 ประชุม</div>
                        <div class="sched-sticker" draggable="true" ondragstart="App.handleStickerDragStart(event, 'Coding', 'work')">💻 Coding</div>
                        <div class="sched-sticker" draggable="true" ondragstart="App.handleStickerDragStart(event, 'ออกกำลัง', 'health')">💪 Workout</div>
                        <div class="sched-sticker" draggable="true" ondragstart="App.handleStickerDragStart(event, 'กินข้าว', 'life')">🍽️ กินข้าว</div>
                        <div class="sched-sticker" draggable="true" ondragstart="App.handleStickerDragStart(event, 'อ่านหนังสือ', 'life')">📚 อ่านหนังสือ</div>
                    </div>
                    <button class="btn-action add-task" onclick="App.handleAddEventModal('${isoDate}')">+ พิมพ์เพิ่มเอง</button>
                </div>
            </div>
            <div class="sched-timeline-area">
                ${timelineHTML}
            </div>
        </div>
    `;
  },

  // --- ฟังก์ชันช่วยเหลือ (Helpers) ---

  changeViewMonth(val) {
    this.scheduleState.viewMonth.setMonth(
      this.scheduleState.viewMonth.getMonth() + val
    );
    this.renderSchedule(document.getElementById("content-area"));
  },

  changeScheduleDate(days) {
    this.scheduleState.selectedDate.setDate(
      this.scheduleState.selectedDate.getDate() + days
    );
    // อัปเดต viewMonth ให้ตรงกับวันที่เลือกเผื่อข้ามเดือน
    this.scheduleState.viewMonth = new Date(
      this.scheduleState.selectedDate.getFullYear(),
      this.scheduleState.selectedDate.getMonth(),
      1
    );
    this.renderSchedule(document.getElementById("content-area"));
  },

  setScheduleDate(isoString) {
    this.scheduleState.selectedDate = new Date(isoString);
    this.renderSchedule(document.getElementById("content-area"));
  },

  // --- ระบบจัดการ Task (Add / Edit / Delete) ---

  handleAddEventModal(dateStr, presetTitle = "", presetType = "work") {
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

    this.openModal("เพิ่มกิจกรรม", html, () => {
      const title = document.getElementById("evt-title").value;
      if (!title) {
        this.showToast("กรุณากรอกชื่อกิจกรรม", "error");
        return false;
      }

      const start = document.getElementById("evt-start").value;
      const hour = parseInt(start.split(":")[0]);
      let period = "morning";
      if (hour >= 12) period = "afternoon";
      if (hour >= 17) period = "evening";
      if (hour >= 22 || hour < 5) period = "sleep";

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
      this.renderSchedule(document.getElementById("content-area"));
      return true;
    });
  },

  handleEditEventModal(id) {
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

    this.openModal("แก้ไขกิจกรรม", html, () => {
      const title = document.getElementById("edit-evt-title").value;
      if (!title) return false;

      const start = document.getElementById("edit-evt-start").value;
      const hour = parseInt(start.split(":")[0]);
      let period = "morning";
      if (hour >= 12) period = "afternoon";
      if (hour >= 17) period = "evening";
      if (hour >= 22 || hour < 5) period = "sleep";

      evt.title = title;
      evt.timeStart = start;
      evt.timeEnd = document.getElementById("edit-evt-end").value;
      evt.type = document.getElementById("edit-evt-type").value;
      evt.period = period;
      evt.important = document.getElementById("edit-evt-imp").checked;

      saveState();
      this.renderSchedule(document.getElementById("content-area"));
      this.showToast("แก้ไขงานเรียบร้อย", "success");
      return true;
    });
  },

  deleteEvent(id) {
    this.openModal("ลบรายการ?", "คุณต้องการลบกิจกรรมนี้ใช่ไหม?", () => {
      appState.schedule = appState.schedule.filter((e) => e.id !== id);
      saveState();
      this.renderSchedule(document.getElementById("content-area"));
      this.showToast("ลบเรียบร้อย", "info");
      return true;
    });
  },

  // --- ระบบ Drag & Drop ---

  allowDrop(ev) {
    ev.preventDefault();
  },

  handleDragStart(ev, id) {
    ev.dataTransfer.setData("text/plain", JSON.stringify({ type: "move", id }));
  },

  handleStickerDragStart(ev, title, type) {
    ev.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "new", title, category: type })
    );
  },

  handleDrop(ev, periodId, dateStr) {
    ev.preventDefault();
    try {
      const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
      if (data.type === "new") {
        this.handleAddEventModal(dateStr, data.title, data.category);
      } else if (data.type === "move") {
        const item = appState.schedule.find((e) => e.id === data.id);
        if (item) {
          item.period = periodId;
          item.date = dateStr;
          saveState();
          this.renderSchedule(document.getElementById("content-area"));
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  // ============================================================
  // 4. TODAY VIEW (FOCUS COMMAND CENTER)
  // ============================================================

  renderToday(container) {
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

    // --- 3. ส่วน HTML หลัก (เปลี่ยน Style เป็น Class ตรงนี้!) ---
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
                              this.timerState.sessions || 0
                            }</div>
                        </div>
                        <div id="timer-display" class="timer-digits">
                            ${Math.floor(this.timerState.time / 60)
                              .toString()
                              .padStart(2, "0")}:${(this.timerState.time % 60)
      .toString()
      .padStart(2, "0")}
                        </div>
                        <button id="btn-timer-toggle" class="btn-action u-w-full" onclick="App.toggleTimer()">
                            ${this.timerState.isRunning ? "⏸ PAUSE" : "▶ START"}
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
    this.updateTimerBtnState();
  },

  // ============================================================
  // 5. GOALS MODULE
  // ============================================================

  renderGoals(container) {
    container.innerHTML = `
            <div class="u-flex-between u-flex-align-center u-mb-lg">
                <div>
                    <div class="section-tag" style="background:var(--color-purple);">Life Map</div>
                    <div class="u-text-sm u-text-muted u-mt-xs">แผนที่ชีวิตและการเดินทางของคุณ</div>
                </div>
                <button class="btn-action" onclick="App.handleAddGoal()">+ NEW GOAL</button>
            </div>
        `;

    if (!appState.goals || appState.goals.length === 0) {
      // ปรับ Empty State
      container.innerHTML += `
                <div class="paper-card u-text-center" style="padding:50px; border:2px dashed var(--border-color);">
                    <div style="font-size:4rem; margin-bottom:20px;">🗺️</div>
                    <div class="u-text-lg u-font-bold u-mb-sm">NO ACTIVE GOALS</div>
                    <div class="u-text-muted u-mb-lg">เริ่มต้นวาดแผนที่ชีวิตของคุณได้เลย</div>
                    <button class="btn-action" onclick="App.handleAddGoal()">CREATE NOW</button>
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
      goalCard.className = "paper-card u-mb-lg";
      goalCard.style.borderTop = `8px solid ${themeColor}`;

      goalCard.innerHTML = `
                <div class="u-flex-between u-cursor-pointer" style="align-items:start;" onclick="App.toggleExpand('${
                  goal.id
                }')">
                    <div class="u-flex-align-center u-gap-md">
                        <div class="u-flex-center" style="font-size:3rem; background:var(--bg-main); width:70px; height:70px; border:2px solid var(--border-color); border-radius:12px; box-shadow:4px 4px 0 rgba(0,0,0,0.1);">
                            ${goal.icon || "🎯"}
                        </div>
                        <div>
                            <div class="u-text-xl u-font-black u-mb-xs" style="line-height:1.2;">${
                              goal.title
                            }</div>
                            <div class="u-text-sm u-text-muted">Progress: ${progress}%</div>
                        </div>
                    </div>
                    <div class="u-text-right">
                        <button class="btn-action u-text-danger" style="padding:4px 8px; font-size:0.7rem; border-color:var(--danger);" onclick="event.stopPropagation(); App.deleteGoal('${
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

      const topicContainer = goalCard.querySelector(`#topics-${goal.id}`);
      goal.topics.forEach((topic) => {
        const topicEl = document.createElement("div");
        topicEl.className = "topic-item";
        topicEl.style.borderLeft = `4px solid ${themeColor}`;
        topicEl.innerHTML = `
                    <div class="u-flex-between u-flex-align-center u-mb-sm">
                        <div class="u-font-black u-text-main" style="font-size:1.1rem;">${topic.title} <span class="u-font-bold u-text-sm u-text-muted">(${topic.progress}%)</span></div>
                        <div class="u-gap-xs u-flex">
                            <button class="btn-add btn-sm" onclick="App.handleAddSubtopic('${goal.id}', '${topic.id}')">+ เรื่องย่อย</button>
                            <button class="btn-action btn-sm u-text-danger" onclick="App.deleteTopic('${goal.id}', '${topic.id}')">×</button>
                        </div>
                    </div>
                    <div id="sub-${topic.id}"></div>`;
        topicContainer.appendChild(topicEl);

        const subContainer = topicEl.querySelector(`#sub-${topic.id}`);
        topic.subtopics.forEach((sub) => {
          const subEl = document.createElement("div");
          subEl.className = "subtopic-item";
          subEl.innerHTML = `
                        <div class="u-flex-between u-mb-sm u-pb-xs" style="border-bottom:1px solid var(--border-soft);">
                            <div class="u-font-bold">${sub.title}</div>
                            <div class="u-flex u-gap-xs">
                                <button class="btn-add btn-sm" onclick="App.handleAddTask('${goal.id}', '${topic.id}', '${sub.id}')">+ งาน</button>
                                <button class="btn-action btn-sm u-text-muted" onclick="App.deleteSubtopic('${goal.id}', '${topic.id}', '${sub.id}')">×</button>
                            </div>
                        </div>
                        <div id="tasks-${sub.id}" class="u-flex-col u-gap-xs"></div>`;
          subContainer.appendChild(subEl);

          const taskContainer = subEl.querySelector(`#tasks-${sub.id}`);
          sub.tasks.forEach((task) => {
            const taskEl = document.createElement("div");
            taskEl.innerHTML = `
                            <label class="u-flex-align-center u-cursor-pointer u-py-xs" style="transition:0.2s;">
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
                                    class="u-mt-auto u-no-border u-bg-transparent u-text-muted u-cursor-pointer u-font-bold" style="margin-left:auto; opacity:0.3;">×</button>
                            </label>`;
            taskContainer.appendChild(taskEl);
          });
        });
      });
    });
    container.appendChild(goalsContainer);
  },

  handleAddGoal() {
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
        return true;
      }
    );
  },

  handleToggleTask(gId, tId, sId, taskId) {
    GoalSystem.toggleTask(gId, tId, sId, taskId);
    this.renderView("goals");
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
    this.openModal(
      "ลบหัวข้อ?",
      "ยืนยันการลบหัวข้อนี้ (ข้อมูลข้างในจะหายไปด้วยนะ)",
      () => {
        const goal = appState.goals.find((g) => g.id === gId);
        if (goal) {
          goal.topics = goal.topics.filter((t) => t.id !== tId);
          saveState();
          this.renderView("goals");
          this.showToast("ลบหัวข้อเรียบร้อย", "info");
        }
        return true;
      }
    );
  },

  deleteSubtopic(gId, tId, sId) {
    this.openModal("ลบเรื่องย่อย?", "ต้องการลบเรื่องย่อยนี้ใช่ไหม?", () => {
      const goal = appState.goals.find((g) => g.id === gId);
      const topic = goal.topics.find((t) => t.id === tId);
      if (topic) {
        topic.subtopics = topic.subtopics.filter((s) => s.id !== sId);
        saveState();
        this.renderView("goals");
        this.showToast("ลบเรื่องย่อยแล้ว", "info");
      }
      return true;
    });
  },

  deleteTask(gId, tId, sId, taskId) {
    const goal = appState.goals.find((g) => g.id === gId);
    const topic = goal.topics.find((t) => t.id === tId);
    const sub = topic.subtopics.find((s) => s.id === sId);
    sub.tasks = sub.tasks.filter((t) => t.id !== taskId);
    saveState();
    this.renderView("goals");
  },

  // ============================================================
  // 6. LIBRARY
  // ============================================================

  renderLibrary(container) {
    if (!appState.library) appState.library = [];

    // --- 1. ส่วน Header & Controls ---
    // ปุ่มกรองสถานะ (Status)
    const statusControls = `
        <div class="library-controls">
            <span class="u-text-xs u-font-bold u-text-muted u-mr-sm">STATUS:</span>
            <button class="lib-filter-btn ${
              this.libraryFilter === "all" ? "active" : ""
            }" onclick="App.setLibFilter('all')">ALL</button>
            <button class="lib-filter-btn ${
              this.libraryFilter === "reading" ? "active" : ""
            }" onclick="App.setLibFilter('reading')">READING</button>
            <button class="lib-filter-btn ${
              this.libraryFilter === "todo" ? "active" : ""
            }" onclick="App.setLibFilter('todo')">QUEUE</button>
            <button class="lib-filter-btn ${
              this.libraryFilter === "done" ? "active" : ""
            }" onclick="App.setLibFilter('done')">DONE</button>
        </div>`;

    // ปุ่มกรองประเภท (Type) - อันนี้ของใหม่!
    const typeList = [
      "all",
      "book",
      "course",
      "movie",
      "series",
      "manga",
      "article",
    ];
    const typeControls = `
        <div class="library-controls" style="margin-top:-15px; border-bottom:2px dashed #ccc; padding-bottom:15px;">
            <span class="u-text-xs u-font-bold u-text-muted u-mr-sm">TYPE:</span>
            ${typeList
              .map(
                (t) => `
                <button class="lib-filter-btn ${
                  this.libraryTypeFilter === t ? "active" : ""
                }"
                onclick="App.setLibTypeFilter('${t}')" style="font-size:0.8rem; padding:6px 12px;">
                ${t.toUpperCase()}
                </button>
            `
              )
              .join("")}
        </div>`;

    const headerHTML = `
        <div class="u-flex-between u-flex-align-center u-mb-md">
            <div><div class="section-tag" style="background:var(--color-blue);"> My Library</div></div>
            <button class="btn-action" onclick="App.handleAddLibrary()">+ NEW ITEM</button>
        </div>
        ${statusControls}
        ${typeControls}
    `;

    // --- 2. Logic การกรองข้อมูล (Double Filter) ---
    let filteredList = appState.library;

    // กรองรอบที่ 1: สถานะ
    if (this.libraryFilter !== "all") {
      filteredList = filteredList.filter(
        (item) => item.status === this.libraryFilter
      );
    }

    // กรองรอบที่ 2: ประเภท
    if (this.libraryTypeFilter !== "all") {
      filteredList = filteredList.filter(
        (item) => item.type === this.libraryTypeFilter
      );
    }

    // เรียงลำดับ (ใหม่สุดขึ้นก่อน)
    filteredList.sort((a, b) => b.id - a.id);

    // --- 3. Helper Functions สำหรับการ์ด ---
    const getIcon = (type) =>
      ({
        book: "Book",
        course: "Course",
        article: "Article",
        note: "Note",
        movie: "Movie",
        manga: "Manga",
        series: "Series",
      }[type] || "Item");

    const createCard = (item) => {
      // (ส่วนสร้างการ์ดเหมือนเดิมเป๊ะครับ แต่ผมใส่ไว้ให้ครบเผื่อก๊อปวางทีเดียว)
      const coverHTML = item.cover
        ? `<img src="${
            item.cover
          }" class="book-cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
           <div class="no-cover" style="display:none"><span>${getIcon(
             item.type
           )}<br>NO COVER</span></div>`
        : `<div class="no-cover"><span>${getIcon(item.type)}</span></div>`;

      const spineClass = `spine-${item.type}` || "spine-book"; // Fallback

      let actionBtns = "";
      const btnStyle =
        "font-size:0.65rem; font-weight:900; background:#000; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; transition:0.1s;";

      if (item.status === "todo") {
        actionBtns += `<button title="Start Reading" style="${btnStyle}" onclick="App.setLibraryStatus('${item.id}', 'reading')">START ▶</button>`;
      } else if (item.status === "reading") {
        actionBtns += `<button title="Finish" style="${btnStyle} background:var(--color-green);" onclick="App.setLibraryStatus('${item.id}', 'done')">DONE ✔</button>`;
        actionBtns += `<button title="Pause" style="${btnStyle} opacity:0.5;" onclick="App.setLibraryStatus('${item.id}', 'todo')">PAUSE</button>`;
      } else if (item.status === "done") {
        actionBtns += `<button title="Read Again" style="${btnStyle}" onclick="App.setLibraryStatus('${item.id}', 'reading')">RE-READ ↻</button>`;
      }

      return `
            <div class="book-card ${spineClass}">
                <div class="book-type-badge">${item.type.toUpperCase()}</div>
                <div class="book-cover-area">${coverHTML}</div>
                <div class="book-details">
                    <div class="book-title" title="${item.title}">${
        item.title
      }</div>
                    <div class="book-author">${item.author || "-"}</div>
                    <div class="book-actions">
                        ${actionBtns}
                        <button class="u-text-danger u-cursor-pointer" style="border:none; background:none; font-weight:bold;" onclick="App.deleteLibraryItem('${
                          item.id
                        }')">DEL</button>
                    </div>
                </div>
            </div>`;
    };

    // --- 4. Render Grid ---
    const contentHTML =
      filteredList.length > 0
        ? `<div class="library-grid">${filteredList
            .map(createCard)
            .join("")}</div>`
        : `<div class="paper-card u-text-center" style="padding:60px 20px; border:3px dashed #ccc; background:rgba(0,0,0,0.02);">
                <div style="font-size:3rem; margin-bottom:10px; opacity:0.3;">🔍</div>
                <div class="u-text-muted u-font-bold">NO ITEMS FOUND</div>
                <div class="u-text-xs u-text-muted u-mt-xs">Try adjusting your filters</div>
           </div>`;

    container.innerHTML = headerHTML + contentHTML;
  },

  setLibFilter(filterName) {
    this.libraryFilter = filterName;
    this.renderView("library");
  },

  setLibTypeFilter(typeName) {
    this.libraryTypeFilter = typeName;
    this.renderView("library");
  },

  handleAddLibrary() {
    const html = `
        <div class="u-flex-col u-gap-md">
            <div>
                <label class="u-font-bold u-text-sm u-text-main"> ประเภท</label>
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
                <label class="u-font-bold u-text-sm u-text-main"> ชื่อเรื่อง</label>
                <input type="text" id="lib-title" class="input-std" placeholder="เช่น: Atomic Habits" autocomplete="off">
            </div>
            <div>
                <label class="u-font-bold u-text-sm u-text-main"> ผู้แต่ง / ผู้สอน</label>
                <input type="text" id="lib-author" class="input-std" placeholder="เช่น: James Clear" autocomplete="off">
            </div>
            <div>
                <label class="u-font-bold u-text-sm u-text-main"> ลิงก์รูปปก (URL)</label>
                <input type="text" id="lib-cover" class="input-std" placeholder="https://..." autocomplete="off">
            </div>
        </div>`;

    this.openModal("เพิ่มเข้าชั้นหนังสือ", html, () => {
      const type = document.getElementById("lib-type").value;
      const title = document.getElementById("lib-title").value;
      const author = document.getElementById("lib-author").value;
      const cover = document.getElementById("lib-cover").value;

      if (!title) {
        this.showToast("กรุณาระบุชื่อเรื่องก่อนนะครับ", "error");
        return false;
      }

      appState.library.push({
        id: Date.now().toString(),
        type: type,
        title: title,
        author: author,
        cover: cover,
        status: "todo",
        addedAt: new Date(),
      });
      saveState();
      this.libraryFilter = "all";
      this.renderView("library");
      this.showToast("เพิ่มลงชั้นหนังสือเรียบร้อย! ", "success");
      return true;
    });
  },

  setLibraryStatus(id, newStatus) {
    const item = appState.library.find((i) => i.id === id);
    if (item) {
      item.status = newStatus;
      saveState();
      let msg = "";
      if (newStatus === "reading")
        msg = ` เริ่มอ่าน "${item.title}" แล้ว! สู้ๆ`;
      if (newStatus === "done") msg = ` เยี่ยมมาก! อ่าน "${item.title}" จบแล้ว`;
      if (newStatus === "todo") msg = `⏸ พักเรื่อง "${item.title}" ไว้ก่อน`;
      this.showToast(msg, newStatus === "done" ? "success" : "info");
      this.renderView("library");
    }
  },

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
  // 7. TOOLS HUB & MODULES
  // ============================================================

  renderToolsHub(container) {
    const tools = [
      {
        id: "money",
        name: "รายรับ-รายจ่าย",
        icon: "💰",
        color: "var(--color-orange)",
        desc: "จัดการงบประมาณ",
      },
      {
        id: "habit",
        name: "ติดตามนิสัย",
        icon: "🌱",
        color: "var(--color-green)",
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
        color: "var(--color-red)",
        desc: "สุขภาพแข็งแรง",
      },
    ];

    container.innerHTML = `
        <div class="u-mb-lg">
            <div class="section-tag u-text-main"> Toolbox </div>
            <div class="u-text-xl u-font-black">ระบบพัฒนาตนเอง</div>
        </div>
        <div class="tools-grid">
            ${tools
              .map(
                (t) => `
                <div class="paper-card tool-card u-cursor-pointer" onclick="App.openTool('${t.id}')"
                     style="height:auto; align-items:flex-start; padding:25px; border-bottom:6px solid ${t.color};">
                    <div class="tool-icon" style="font-size:2.5rem; margin-bottom:10px;">${t.icon}</div>
                    <div class="tool-name u-text-lg u-font-bold u-mb-xs">${t.name}</div>
                    <div class="u-text-sm u-text-muted">${t.desc}</div>
                </div>`
              )
              .join("")}
        </div>`;
  },

  openTool(id) {
    const c = document.getElementById("content-area");
    const titles = {
      money: "💰 MONEY MANAGER",
      habit: "🔥 HABIT TRACKER",
      journal: "📖 DAILY JOURNAL",
      exercise: "🏃🏻 ACTIVE LIFE",
    };
    document.getElementById("page-title").textContent = titles[id];
    if (!appState.tools) appState.tools = {};
    if (id === "money") this.renderMoneyTool(c);
    else if (id === "habit") this.renderHabitTool(c);
    else if (id === "journal") this.renderJournalTool(c);
    else if (id === "exercise") this.renderExerciseTool(c);
  },

  renderBackBtn() {
    return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.renderView('tools')">⬅ Tools</button>`;
  },

  // --- 7.1 Money Tool ---

  renderMoneyTool(container) {
    if (!appState.tools.money)
      appState.tools.money = {
        transactions: [],
        budget: 15000,
      };
    if (!appState.tools.money.categories) {
      appState.tools.money.categories = {
        expense: [
          {
            icon: "🍔",
            label: "อาหาร",
          },
          {
            icon: "🚗",
            label: "เดินทาง",
          },
          {
            icon: "🏠",
            label: "ของใช้",
          },
          {
            icon: "🛍️",
            label: "ช้อปปิ้ง",
          },
        ],
        income: [
          {
            icon: "💰",
            label: "เงินเดือน",
          },
          {
            icon: "💼",
            label: "ฟรีแลนซ์",
          },
          {
            icon: "📈",
            label: "ลงทุน",
          },
        ],
      };
    }

    const data = appState.tools.money;
    const now = new Date();
    const monthlyTrans = data.transactions.filter((t) => {
      const d = new Date(t.rawDate || Date.now());
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
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
    const currentCats =
      this.moneyTempState.type === "expense"
        ? data.categories.expense
        : data.categories.income;

    container.innerHTML = `
        <div class="u-flex-align-center u-mb-lg">
            ${this.renderBackBtn()}
            <div class="section-tag bg-danger" style="margin:0;">Money Manager</div>
            <button onclick="App.setBudget()" style="margin-left:auto; font-size:0.75rem; font-weight:bold; background:#000; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">SET BUDGET</button>
        </div>

        <div class="balance-card">
             <div class="balance-label">> CURRENT_CASH_FLOW</div> <div class="balance-amount" style="color:${
               balance >= 0 ? "#33ff00" : "#ff3333"
             };">${balance.toLocaleString()} ฿</div>
             <div class="u-flex-center u-mt-md u-pt-md" style="gap:30px; border-top:1px dashed rgba(255,255,255,0.2);">
                <div><div style="font-size:0.75rem; opacity:0.7;">INCOME</div><div style="font-weight:700; color:#33ff00;">+${income.toLocaleString()}</div></div>
                <div><div style="font-size:0.75rem; opacity:0.7;">EXPENSE</div><div style="font-weight:700; color:#ff3333;">-${expense.toLocaleString()}</div></div>
            </div>
            <div class="u-mt-md" style="background:#333; height:10px; border:1px solid #555; overflow:hidden; position:relative;">
                <div style="position:absolute; left:0; top:0; height:100%; width:${budgetPercent}%; background:${
      budgetPercent > 90 ? "#ff3333" : "#33ff00"
    }; box-shadow: 0 0 5px ${
      budgetPercent > 90 ? "#ff3333" : "#33ff00"
    };"></div>
            </div>
            <div class="u-text-right u-text-xs u-mt-xs" style="opacity:0.6; font-family:monospace;">USAGE: ${Math.round(
              budgetPercent
            )}% // LIMIT: ${budget.toLocaleString()}</div>
        </div>

        <div class="paper-card u-mb-lg">
            <div class="money-type-toggle">
                <button class="type-btn-expense ${
                  this.moneyTempState.type === "expense" ? "active expense" : ""
                }" onclick="App.setMoneyType('expense')">EXPENSE (-)</button>
                <button class="type-btn-income ${
                  this.moneyTempState.type === "income" ? "active income" : ""
                }" onclick="App.setMoneyType('income')">INCOME (+)</button>
            </div>

            <div class="u-mb-md" style="position:relative;">
                <span style="position:absolute; left:15px; top:50%; transform:translateY(-50%); font-weight:900; font-size:1.2rem; color:var(--text-muted);">฿</span>
                <input type="number" id="money-amount" class="input-std u-text-right u-font-bold u-text-xl" placeholder="0.00" value="${
                  this.moneyTempState.tempAmount
                }" oninput="App.moneyTempState.tempAmount = this.value" style="padding-left:40px;">
            </div>
            <div class="cat-grid">
                ${currentCats
                  .map(
                    (c) => `
                    <div class="cat-btn ${
                      this.moneyTempState.category === c.label ? "selected" : ""
                    }" onclick="App.setMoneyCat('${c.label}')">
                        <div class="u-text-lg">${c.icon}</div>
                        <div>${c.label}</div>
                    </div>`
                  )
                  .join("")}
                <div class="cat-btn" onclick="App.handleAddMoneyCategory()" style="border:1px dashed #ccc; opacity:0.7;">
                    <div class="u-text-lg">➕</div>
                    <div>ADD</div>
                </div>
            </div>
            <div class="input-row">
                <input type="text" id="money-note" class="input-std" placeholder="Note (Optional)..." value="${
                  this.moneyTempState.tempNote
                }" oninput="App.moneyTempState.tempNote = this.value">
                <button class="btn-action" onclick="App.addMoneyTransaction()" style="background:${
                  this.moneyTempState.type === "expense"
                    ? "var(--danger)"
                    : "var(--success)"
                }; min-width:100px; color: var(--color-black);"> SAVE </button>
            </div>
        </div>

        <div class="u-font-black u-mb-sm u-text-muted u-flex-between">
             <span style="font-weight:bold; letter-spacing:1px;">RECENT TRANSACTIONS</span>
             <span class="u-text-sm" style="font-weight:normal;">(Last 10)</span>
        </div>
        <ul class="receipt-list">
            ${data.transactions
              .slice()
              .reverse()
              .slice(0, 10)
              .map(
                (t) => `
                <li class="receipt-item">
                    <div class="u-flex-col">
                        <span class="u-font-bold">${
                          t.category || "General"
                        } <span class="u-text-muted" style="font-weight:400;"> - ${
                  t.note || ""
                }</span></span>
                        <span style="font-size:0.75rem; color:#aaa;">${new Date(
                          t.rawDate || Date.now()
                        ).toLocaleDateString("th-TH")}</span>
                    </div>
                    <div class="u-flex-align-center u-gap-sm">
                        <span style="font-weight:800; font-size:1.1rem; color:${
                          t.type === "expense"
                            ? "var(--danger)"
                            : "var(--success)"
                        };">
                            ${
                              t.type === "expense" ? "-" : "+"
                            }${t.amount.toLocaleString()}
                        </span>
                        <button onclick="App.deleteMoneyTransaction(${
                          t.id
                        })" style="border:none; background:none; color:#ccc; cursor:pointer; font-size:1.2rem;">&times;</button>
                    </div>
                </li>`
              )
              .join("")}
        </ul>
        ${
          data.transactions.length === 0
            ? `<div class="u-text-center u-p-lg" style="color:#aaa;">No transactions yet.</div>`
            : ""
        }
    `;
  },

  setMoneyType(type) {
    this.moneyTempState.tempAmount =
      document.getElementById("money-amount").value;
    this.moneyTempState.tempNote = document.getElementById("money-note").value;
    this.moneyTempState.type = type;
    const cats = appState.tools.money.categories[type];
    if (cats && cats.length > 0) this.moneyTempState.category = cats[0].label;
    this.renderMoneyTool(document.getElementById("content-area"));
  },

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

  handleAddMoneyCategory() {
    const type = this.moneyTempState.type;
    const html = `
        <div class="u-mb-md"><label>ชื่อหมวดหมู่</label><input type="text" id="new-cat-name" class="input-std" placeholder="เช่น ค่ากาแฟ"></div>
        <div><label>ไอคอน (Emoji)</label><input type="text" id="new-cat-icon" class="input-std" placeholder="เช่น ☕️" value="✨"></div>`;
    this.openModal(
      `เพิ่มหมวดหมู่ (${type === "expense" ? "รายจ่าย" : "รายรับ"})`,
      html,
      () => {
        const name = document.getElementById("new-cat-name").value;
        const icon = document.getElementById("new-cat-icon").value;
        if (!name) return false;
        appState.tools.money.categories[type].push({
          icon: icon,
          label: name,
        });
        saveState();
        this.setMoneyCat(name);
        return true;
      }
    );
  },

  addMoneyTransaction() {
    const amount = parseFloat(document.getElementById("money-amount").value);
    const note = document.getElementById("money-note").value.trim();
    if (!amount || amount <= 0) {
      this.showToast("ใส่จำนวนเงินด้วยครับ", "error");
      return;
    }
    appState.tools.money.transactions.push({
      id: Date.now(),
      rawDate: new Date(),
      date: new Date().toLocaleDateString("th-TH"),
      type: this.moneyTempState.type,
      category: this.moneyTempState.category,
      amount: amount,
      note: note,
    });
    saveState();
    this.moneyTempState.tempAmount = "";
    this.moneyTempState.tempNote = "";
    this.renderMoneyTool(document.getElementById("content-area"));
    this.showToast("บันทึกเรียบร้อย!", "success");
  },

  deleteMoneyTransaction(id) {
    this.openModal("ลบรายการ?", "ต้องการลบรายการรับ-จ่ายนี้ใช่ไหม?", () => {
      appState.tools.money.transactions =
        appState.tools.money.transactions.filter((t) => t.id !== id);
      saveState();
      this.renderMoneyTool(document.getElementById("content-area"));
      this.showToast("ลบรายการเรียบร้อย", "info");
      return true;
    });
  },

  // --- 7.2 Habit Tool ---

  renderHabitTool(container) {
    if (!appState.tools.habits) appState.tools.habits = [];

    // 1. ประกาศตัวแปร emptyStateHTML ไว้ตรงนี้
    const emptyStateHTML = `
    <div class="paper-card u-text-center" style="padding:40px; border:3px dashed #ccc; background:rgba(0,0,0,0.02);">
        <div style="font-size:3rem; margin-bottom:10px;">🌱</div>
        <div class="u-text-lg u-font-bold u-mb-sm">ยังไม่มีนิสัยที่ติดตาม</div>
        <div class="u-text-muted u-mb-lg">สร้างวินัยเล็กๆ เริ่มต้นวันนี้เลย</div>
        <button class="btn-action" onclick="App.handleAddHabitModal()">+ สร้างนิสัยใหม่</button>
    </div>
    `;

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
      return diffDays > 1 ? 0 : currentStreak;
    };

    container.innerHTML = `
        <div class="u-flex-between u-flex-align-center u-mb-lg">
             <div class="u-flex-align-center">${this.renderBackBtn()}<div class="section-tag u-text-main" style="margin:0;">Habit Tracker</div></div>
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
                        <span class="u-text-sm u-text-muted u-mt-xs">Current Streak: <b style="color:${cardColor}">${displayStreak}</b> days</span>
                    </div>
                    <div class="u-flex-align-center u-gap-md">
                        <button onclick="App.toggleHabit('${
                          h.id
                        }')" style="padding: 8px 16px; border: 1px solid ${
                  isDone ? cardColor : "#e0e0e0"
                }; background: ${isDone ? cardColor : "transparent"}; color: ${
                  isDone ? "#fff" : "var(--text-muted)"
                }; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                            ${isDone ? "Completed" : "Check In"}
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
  },

  handleAddHabitModal() {
    const html = `
        <div class="u-mb-md"><label class="u-font-bold">ชื่อนิสัย</label><input type="text" id="h-name" class="input-std" placeholder="เช่น ดื่มน้ำ"></div>
        <div><label class="u-font-bold">สีประจำตัว</label><select id="h-color" class="input-std"><option value="var(--text-main)">⚫️ ดำ</option><option value="var(--color-orange)">🟠 ส้ม</option><option value="var(--color-blue)">🔵 ฟ้า</option><option value="var(--color-green)">🟢 เขียว</option></select></div>`;
    this.openModal("สร้างนิสัยใหม่", html, () => {
      const name = document.getElementById("h-name").value;
      const color = document.getElementById("h-color").value;
      if (!name) return false;
      appState.tools.habits.push({
        id: Date.now().toString(),
        name: name,
        color: color,
        streak: 0,
        lastDone: null,
      });
      saveState();
      this.renderHabitTool(document.getElementById("content-area"));
      return true;
    });
  },

  // ค้นหาฟังก์ชัน toggleHabit แล้ววางทับด้วยอันนี้ครับ
  toggleHabit(id) {
    const h = appState.tools.habits.find((x) => x.id === id);
    if (!h) return;

    // Helper: แปลงวันที่ไทย (d/m/yyyy) กลับเป็น Date Object
    const parseDate = (str) => {
      if (!str) return null;
      if (str === "yesterday") {
        // ดักจับค่า Demo Data ที่ผิดพลาด
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
      }
      const parts = str.split("/");
      if (parts.length === 3) {
        // แปลงจาก d/m/yyyy (พ.ศ.) เป็น ค.ศ. เพื่อคำนวณ
        return new Date(parts[2] - 543, parts[1] - 1, parts[0]);
      }
      return new Date(str); // เผื่อกรณี format อื่น
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString("th-TH");

    const lastDoneDate = parseDate(h.lastDone);

    // กรณี: กดซ้ำวันนี้ (Undo)
    if (h.lastDone === todayStr) {
      h.lastDone = null;
      h.streak = Math.max(0, h.streak - 1);
    }
    // กรณี: กด Check-in
    else {
      let isConsecutive = false;

      if (lastDoneDate) {
        lastDoneDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today - lastDoneDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // ถ้าห่างกัน 1 วัน ถือว่าต่อเนื่อง
        if (diffDays === 1) isConsecutive = true;
      } else {
        // ถ้าไม่เคยทำมาก่อน (หรือค่าว่าง) ถือว่าเริ่มนับ 1
        isConsecutive = false;
      }

      if (isConsecutive) {
        h.streak++;
        this.showToast(
          `สุดยอด! รักษา Streak วันที่ ${h.streak} แล้ว 🔥`,
          "success"
        );
      } else {
        h.streak = 1;
        this.showToast(`เริ่มนับ Streak ใหม่! สู้ๆ ✌️`, "info");
      }

      h.lastDone = todayStr;
    }

    saveState();

    // อัปเดตหน้าจอให้ทันที
    if (this.currentPage === "home") {
      this.renderDashboard(document.getElementById("content-area"));
    } else {
      this.renderHabitTool(document.getElementById("content-area"));
    }
  },

  deleteHabit(id) {
    this.openModal("ลบนิสัย?", "ต้องการเลิกติดตามนิสัยนี้แล้วใช่ไหม?", () => {
      appState.tools.habits = appState.tools.habits.filter((x) => x.id !== id);
      saveState();
      this.renderHabitTool(document.getElementById("content-area"));
      this.showToast("ลบนิสัยเรียบร้อย", "info");
      return true;
    });
  },

  // --- 7.3 Journal Tool ---

  renderJournalTool(container) {
    if (!appState.tools.journal) appState.tools.journal = [];
    const editData = this.journalState.isEditing
      ? appState.tools.journal.find((j) => j.id === this.journalState.editId) ||
        {}
      : {};
    if (
      this.journalState.isEditing &&
      this.journalState.tempTags.length === 0 &&
      editData.tags
    ) {
      this.journalState.tempTags = [...editData.tags];
    }

    const displayMood = this.journalState.tempMood || editData.mood || "🙂";
    const displayText = this.journalState.tempText ?? editData.text ?? "";
    const displayGratitude =
      this.journalState.tempGratitude ?? editData.gratitude ?? "";
    const allTagsDisplay = [
      ...new Set([
        "งาน",
        "ไอเดีย",
        "ความรู้สึก",
        ...this.journalState.tempTags,
      ]),
    ];
    const todayStr = new Date().toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

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
                <div class="jor-card-text">${e.text}</div>
                ${
                  e.gratitude
                    ? `<div class="jor-card-gratitude"><span class="icon">✨</span> ${e.gratitude}</div>`
                    : ""
                }
                <div class="jor-card-tags">${(e.tags || [])
                  .map((t) => `<span>#${t}</span>`)
                  .join("")}</div>
            </div>
        </div>`
        )
        .join("");

    container.innerHTML = `
        <div class="u-flex-align-center u-mb-lg">${this.renderBackBtn()}<div class="section-tag bg-blue" style="margin:0;">Daily Log</div></div>
        <div class="journal-layout">
            <div class="paper-card jor-editor-wrapper">
                <div class="jor-editor-header">
                    <div><div class="u-text-sm u-font-bold u-text-muted"> TODAY'S DATE </div><div class="u-text-lg u-font-black u-text-main">${todayStr}</div></div>
                    ${
                      this.journalState.isEditing
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
                                     this.journalState.tempTags.includes(t)
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
                  this.journalState.isEditing ? "อัปเดต" : "บันทึก"
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
  },

  saveTempInputs() {
    this.journalState.tempText = document.getElementById("j-text").value;
    this.journalState.tempGratitude =
      document.getElementById("j-gratitude").value;
    this.journalState.tempMood = document.getElementById("j-mood-val").value;
  },

  setJournalMood(val, btnEl) {
    document.getElementById("j-mood-val").value = val;
    document
      .querySelectorAll(".mood-chk")
      .forEach((b) => b.classList.remove("active"));
    btnEl.classList.add("active");
    this.journalState.tempMood = val;
  },

  toggleJournalTag(tag) {
    const idx = this.journalState.tempTags.indexOf(tag);
    if (idx > -1) this.journalState.tempTags.splice(idx, 1);
    else this.journalState.tempTags.push(tag);
    this.saveTempInputs();
    this.renderJournalTool(document.getElementById("content-area"));
  },

  handleAddCustomTag() {
    const val = document.getElementById("new-tag-input").value.trim();
    if (val && !this.journalState.tempTags.includes(val)) {
      this.journalState.tempTags.push(val);
      this.saveTempInputs();
      this.renderJournalTool(document.getElementById("content-area"));
    }
  },

  saveJournal() {
    const text = document.getElementById("j-text").value.trim();
    const gratitude = document.getElementById("j-gratitude").value.trim();
    const mood = document.getElementById("j-mood-val").value;
    const isFeatured = document.getElementById("j-featured").checked;

    if (!text && !gratitude)
      return this.showToast("เขียนอะไรสักหน่อยนะ...", "error");

    if (isFeatured)
      appState.tools.journal.forEach((j) => (j.isFeatured = false));

    const entryData = {
      text,
      gratitude,
      mood,
      tags: [...this.journalState.tempTags],
      isFeatured,
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
        this.showToast("แก้ไขเรียบร้อย", "success");
      }
    } else {
      appState.tools.journal.push({
        id: Date.now().toString(),
        date: new Date(),
        ...entryData,
      });
      this.showToast("บันทึกแล้ว", "success");
    }
    saveState();
    this.cancelEditJournal();
  },

  startEditJournal(id) {
    const item = appState.tools.journal.find((j) => j.id === id);
    if (item) {
      this.journalState = {
        isEditing: true,
        editId: id,
        tempTags: [...(item.tags || [])],
        tempText: null,
        tempGratitude: null,
      };
      this.renderJournalTool(document.getElementById("content-area"));
    }
  },

  cancelEditJournal() {
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
    this.openModal("ลบบันทึก?", "ข้อความนี้จะหายไปตลอดกาลเลยนะ", () => {
      appState.tools.journal = appState.tools.journal.filter(
        (x) => x.id !== id
      );
      saveState();
      // เช็คว่าถ้าลบตัวที่กำลัง Edit อยู่ ให้เคลียร์หน้าจอด้วย
      if (this.journalState.editId === id) this.cancelEditJournal();
      else this.renderJournalTool(document.getElementById("content-area"));

      this.showToast("ลบบันทึกแล้ว", "info");
      return true;
    });
  },

  toggleJournalPin(id) {
    const target = appState.tools.journal.find((j) => j.id === id);
    if (target) {
      const wasFeatured = target.isFeatured;
      appState.tools.journal.forEach((j) => (j.isFeatured = false));
      target.isFeatured = !wasFeatured;
      saveState();
      this.renderJournalTool(document.getElementById("content-area"));
      this.showToast(
        target.isFeatured ? "ปักหมุดแล้ว" : "เอาหมุดออกแล้ว",
        "success"
      );
    }
  },

  // --- 7.4 Exercise Tool ---

  renderExerciseTool(container) {
    // --- INIT & MIGRATION ---
    if (!appState.tools.exercise) {
      appState.tools.exercise = { logs: [], profile: {} };
    } else if (Array.isArray(appState.tools.exercise)) {
      appState.tools.exercise = {
        logs: [...appState.tools.exercise],
        profile: {},
      };
    }
    const exData = appState.tools.exercise;

    // ตั้งค่า Profile & Goals
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

    // คำนวณ Stats
    const weeklyLogs = logs.filter(
      (l) =>
        new Date(l.date) >=
        new Date(new Date().setDate(new Date().getDate() - 7))
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
        <div class="ex-header">${this.renderBackBtn()}<div class="section-tag bg-red" style="margin:0;">Active Life</div></div>

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
                <input type="text" id="ex-type" class="input-std" placeholder="รายการ...">
                <input type="number" id="ex-dur" class="input-std" placeholder="นาที">
                <input type="number" id="ex-cal" class="input-std" placeholder="Cal">
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
  },

  saveExProfile() {
    // 1. เก็บค่าลง State (เหมือนเดิม)
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
    saveState();

    // 2. คำนวณ BMI/BMR/TDEE สดๆ
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

    // 3. อัปเดตตัวเลข BMI บนจอ (โดยไม่ต้องรีเฟรช!)
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

    // 4. คำนวณ Progress Bar สดๆ (Log เดิม vs เป้าใหม่)
    const logs = appState.tools.exercise.logs || [];
    const weeklyLogs = logs.filter(
      (l) =>
        new Date(l.date) >=
        new Date(new Date().setDate(new Date().getDate() - 7))
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
  },

  addEx() {
    // 1. ดึงค่าจากช่องกรอก
    const type = document.getElementById("ex-type").value.trim();
    const dur = document.getElementById("ex-dur").value;
    const cal = document.getElementById("ex-cal").value;

    // 2. ตรวจสอบความถูกต้อง (Validation)
    if (!type || !dur) {
      this.showToast("กรอกชื่อกิจกรรมและเวลาด้วยนะครับ", "error");
      return;
    }

    // 3. สร้าง Object ข้อมูลใหม่
    const newLog = {
      id: Date.now(),
      date: new Date(), // ใช้วันเวลาปัจจุบัน
      type: type,
      duration: parseInt(dur),
      cals: parseInt(cal) || 0, // ถ้าไม่กรอกแคล ให้เป็น 0
    };

    // 4. บันทึกลง State
    if (!appState.tools.exercise.logs) {
      appState.tools.exercise.logs = [];
    }
    appState.tools.exercise.logs.push(newLog);

    saveState();

    // 5. รีเฟรชหน้าจอและแจ้งเตือน
    this.renderExerciseTool(document.getElementById("content-area"));
    this.showToast("เยี่ยมมาก! บันทึกเรียบร้อย 💪", "success");
  },

  delEx(id) {
    this.openModal(
      "ลบประวัติ?",
      "ต้องการลบประวัติการออกกำลังกายนี้ไหม?",
      () => {
        // ลบออกจาก logs
        appState.tools.exercise.logs = appState.tools.exercise.logs.filter(
          (x) => x.id.toString() !== id.toString()
        );
        saveState();
        this.renderExerciseTool(document.getElementById("content-area"));
        this.showToast("ลบประวัติเรียบร้อย", "info");
        return true;
      }
    );
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
                    `<div class="u-p-sm u-cursor-pointer" style="border-bottom:1px solid var(--border-soft);" onclick="window.showRev(${i})">
                  <div class="u-font-bold">Week ${r.w} / ${
                      r.y
                    }</div><div class="u-text-sm u-text-muted">${new Date(
                      r.d
                    ).toLocaleDateString("th-TH")}</div>
                 </div>`
                )
                .join("")}
            </div>`;
  },

  saveRev() {
    const q1 = document.getElementById("rv-q1").value;
    const q2 = document.getElementById("rv-q2").value;
    const q3 = document.getElementById("rv-q3").value;
    if (!q1 && !q2) return this.showToast("เขียนหน่อยน่า", "error");
    appState.reviews.push({
      id: Date.now(),
      d: new Date(),
      w: TimeSystem.current.weekNumber,
      y: new Date().getFullYear(),
      a: {
        q1,
        q2,
        q3,
      },
    });
    saveState();
    this.renderReviews(document.getElementById("content-area"));
    this.showToast("บันทึกแล้ว", "success");
  },

  renderSettings(container) {
    container.innerHTML = `
          <div class="settings-container" style="max-width:600px; margin:0 auto;">
              <div class="paper-card u-mb-lg">
                  <div class="section-tag"> Data Management </div>
                  <p class="u-text-sm u-mb-md"> ดาวน์โหลดข้อมูลเก็บไว้ (Backup) </p>
                  <button class="btn-action" onclick="App.exportData()"> ⬇ Download JSON</button>
                  <hr style="margin:20px 0; border:0; border-top:1px dashed var(--border-soft);">
                  <p class="u-text-sm u-mb-md"> กู้คืนข้อมูล (Restore) </p>
                  <input type="file" id="import-file" style="display:none;" onchange="App.importData(this)">
                  <button class="btn-action" onclick="document.getElementById('import-file').click()"> ⬆ Upload JSON </button>
              </div>
              <div class="paper-card" style="border-color:var(--danger);">
                    <div class="section-tag bg-danger">Danger Zone</div>
                    <p class="u-text-sm u-mb-md">ล้างข้อมูลทั้งหมด</p>
                    <button class="btn-danger" style="padding:10px 20px; border-radius:6px; cursor:pointer;" onclick="App.hardReset()"> RESET ALL</button>
              </div>
          </div>`;
  },

  exportData() {
    const str = JSON.stringify(appState, null, 2);
    const blob = new Blob([str], {
      type: "application/json",
    });
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

  // ============================================================
  // 9. GLOBAL HELPERS
  // ============================================================

  renderTimeWidget(data) {
    const w = document.getElementById("mini-time-display");
    if (!w) return;
    const userName = appState.user?.name || "COMMANDER";
    const userAvatar = appState.user?.avatar || "👤";
    const userEdu = appState.user?.education || "BACHELOR DEGREE";

    w.innerHTML = `
        <div class="user-profile-widget" onclick="App.editProfile()">
            <div class="user-profile-label">Personal Operator</div>
            <div class="user-profile-content">
                <div class="user-avatar-box">${userAvatar}</div>
                <div class="user-info-box"><div class="user-name">${userName}</div><div class="user-edu">${userEdu}</div></div>
            </div>
            <div class="user-time-box">
                <span class="u-text-xs u-font-black u-text-white">TIME: ${data.date.toLocaleTimeString(
                  "th-TH",
                  { hour: "2-digit", minute: "2-digit" }
                )}</span>
                <div class="u-flex-align-center u-gap-xs"><div class="user-status-dot"></div><span class="u-text-xs u-font-black" style="color:#4cd137;">ONLINE</span></div>
            </div>
        </div>`;
  },

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

  playAtmosphere(type) {
    // 1. ถ้ามีเสียงเดิมเล่นอยู่ ให้ปิดก่อน
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
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
      this.renderView("today");
      return;
    }

    // 3. อัปเดต State
    appState.today.atmosphere = type;
    saveState();

    // 4. กำหนด Path ไฟล์เสียง (ดึงจากโฟลเดอร์ assets/audio/)
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
      case "night": // (เผื่อมี)
        url = "assets/audio/night.mp3";
        break;
    }

    // 5. สั่งเล่นและตั้งค่า Loop
    if (url) {
      this.currentAudio = new Audio(url);

      // 👇 บรรทัดนี้สำคัญที่สุดครับ ทำให้เสียงวนซ้ำไม่รู้จบ
      this.currentAudio.loop = true;

      this.currentAudio.volume = 0.5; // ความดัง 50%

      var playPromise = this.currentAudio.play();

      if (playPromise !== undefined) {
        playPromise
          .then((_) => {
            // เล่นสำเร็จ
          })
          .catch((error) => {
            console.error("Audio Load Error:", error);
            this.showToast(
              `หาไฟล์ ${url} ไม่เจอ! ตรวจสอบชื่อไฟล์ดีๆ นะ`,
              "error"
            );
          });
      }
    }

    // 6. รีเฟรชหน้าจอ
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

          // ใช้ Modal แทน Alert ตรงนี้
          this.openModal(
            "หมดเวลาแล้ว! ⏰",
            "<div class='u-text-center u-text-lg'>เก่งมาก! ได้เวลาพักผ่อนสายตาแล้ว</div>",
            () => true
          );
        }
        this.updateTimerBtnState();
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
      btn.textContent = this.timerState.isRunning ? "⏸ PAUSE" : "▶ START FOCUS";
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
  },

  addTodayTask(type, inputEl) {
    const val = inputEl ? inputEl.value.trim() : "";
    if (!val) return;
    if (type === "mustDo" && appState.today.mustDo.length >= 3)
      return this.showToast("งานด่วนทำแค่ 3 อย่างพอนะ!", "error");

    appState.today[type].push({
      id: GoalSystem.generateId(),
      title: val,
      completed: false,
    });
    saveState();
    inputEl.value = "";
    this.renderView("today");
  },

  toggleTodayTask(type, id) {
    const task = appState.today[type].find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveState();
      this.renderView("today");
    }
  },

  deleteTodayTask(type, id) {
    appState.today[type] = appState.today[type].filter((t) => t.id !== id);
    saveState();
    this.renderView("today");
  },

  saveBrainDump(val) {
    appState.today.brainDump = val;
    saveState();
  },

  saveTodayNote(val) {
    appState.today.notes = val;
    saveState();
  },

  shuffleManifesto() {
    // 1. ดึง Journal ของเรามาแปลงเป็น format เดียวกับคำคม
    const userJournals = (appState.tools.journal || []).map((j) => ({
      text: j.text,
      author: "MY PAST SELF",
      tag: "FLASHBACK",
      stamp: "MEMORY",
    }));

    // 2. รวมพลัง (Quotes กลาง + Journal เรา)
    const pool = [...this.quotes, ...userJournals];

    if (pool.length === 0) return;

    // 3. สุ่ม
    const randomItem = pool[Math.floor(Math.random() * pool.length)];

    // 4. อัปเดตหน้าจอ (Animation + ใส่ข้อความ)
    const widget = document.getElementById("manifesto-widget");
    if (widget) {
      // ทำ Effect ย่อ-ขยาย นิดนึงให้รู้ว่ากดแล้ว
      widget.style.transform = "scale(0.98)";
      setTimeout(() => (widget.style.transform = "scale(1)"), 100);

      const displayText =
        randomItem.text.length > 120
          ? randomItem.text.substring(0, 120) + "..."
          : randomItem.text;

      // ยัดข้อมูลลงไปใน HTML (ID ต้องตรงกับที่คุณแปะมา)
      document.getElementById("man-text").innerText = `"${displayText}"`;
      document.getElementById(
        "man-author"
      ).innerText = `— ${randomItem.author}`;
      document.getElementById("man-tag").innerText = randomItem.tag || "QUOTE";
      document.getElementById("man-stamp").innerText =
        randomItem.stamp || "RANDOM";
    }
  },

  editProfile() {
    const avatarPresets = ["⬤", "◼", "◆", "▲", "▼", "◈", "▣", "▰"];
    const html = `
        <div class="u-flex-col u-gap-md">
            <div><label class="u-text-sm u-font-bold u-text-muted">NAME</label><input type="text" id="edit-user-name" class="input-std" value="${
              appState.user.name
            }"></div>
            <div><label class="u-text-sm u-font-bold u-text-muted">MAJOR / EDUCATION</label><input type="text" id="edit-user-edu" class="input-std" value="${
              appState.user.education || ""
            }" placeholder="เช่น Computer Science"></div>
            <div>
                <label class="u-text-sm u-font-bold u-text-muted">AVATAR</label>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-top:8px;">
                    ${avatarPresets
                      .map(
                        (icon) =>
                          `<div class="avatar-option u-text-lg u-cursor-pointer u-text-center bg-white" style="padding:8px; border:var(--border-std); border-radius:8px;"
                             onclick="document.getElementById('edit-user-avatar').value='${icon}'; document.querySelectorAll('.avatar-option').forEach(el=>el.style.background='#fff'); this.style.background='var(--color-yellow)';this.classList.add('bg-yellow');">${icon}</div>`
                      )
                      .join("")}
                </div>
                <input type="hidden" id="edit-user-avatar" value="${
                  appState.user.avatar
                }">
            </div>
        </div>`;

    this.openModal("Customize Profile", html, () => {
      const name = document.getElementById("edit-user-name").value.trim();
      if (name) {
        appState.user.name = name;
        appState.user.education =
          document.getElementById("edit-user-edu").value.trim() || "N/A";
        appState.user.avatar =
          document.getElementById("edit-user-avatar").value.trim() || "⚫";
        saveState();
        TimeSystem.update();
        this.showToast("Profile Saved!", "success");
        return true;
      }
      return false;
    });
  },
};

/* =========================================
   BOOTSTRAP
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
