/* =========================================
   MAIN ENTRY POINT
   ========================================= */

// 1. Import Core & Services
import { loadState, saveState, appState } from "./state.js";
import { TimeSystem } from "./services/time.js";
import { showToast, openModal, closeModal, escapeHtml } from "./utils.js";

// 2. Import Modules
import { renderDashboard, shuffleManifesto } from "./modules/dashboard.js";
import * as ScheduleModule from "./modules/schedule.js";
import * as FocusModule from "./modules/focus.js";
import * as GoalsModule from "./modules/goalsRender.js";
import * as LibraryModule from "./modules/library.js";
import * as ToolsModule from "./modules/tools.js";
import * as MoneyModule from "./modules/money.js";
import * as HabitModule from "./modules/habit.js";
import * as JournalModule from "./modules/journal.js";
import * as ExerciseModule from "./modules/exercise.js";
import * as ReviewsModule from "./modules/reviews.js";
import * as SettingsModule from "./modules/settings.js";
import * as ProjectsModule from "./modules/projects.js";
import { MOCK_DATA } from "./mockdata.js";

// 3. Construct Global App
const App = {
  // --- State & Core ---
  state: appState,

  // --- UI States ---
  // เชื่อมต่อตัวแปร state จาก Modules เพื่อให้ HTML เข้าถึงได้
  moneyTempState: MoneyModule.moneyTempState,
  scheduleState: ScheduleModule.scheduleState,
  timerState: FocusModule.timerState,

  // ใน main.js ส่วน init()
  init() {
    try {
      const setAppHeight = () =>
        document.documentElement.style.setProperty(
          "--app-height",
          `${window.innerHeight}px`
        );
      window.addEventListener("resize", setAppHeight);
      setAppHeight();

      console.log("System Initializing...");
      loadState();
      TimeSystem.init();
      this.bindEvents();

      // ลบข้อความ Loading... ออกเมื่อระบบพร้อม
      const contentArea = document.getElementById("content-area");
      if (contentArea) contentArea.innerHTML = "";

      this.navigateTo("home");
      this.renderTimeWidget({ date: new Date() });

      document.addEventListener("time-updated", (e) => {
        this.renderTimeWidget(e.detail);
        if (this.currentPage === "home") {
          // เพิ่ม performance: เช็คก่อนว่า element ยังอยู่ไหมค่อย render
          const container = document.getElementById("content-area");
          if (container) renderDashboard(container);
        }
      });
    } catch (error) {
      console.error("Critical System Error:", error);
      alert(
        "ระบบเกิดข้อผิดพลาด กรุณากด Reset Data ในหน้า Settings หรือเคลียร์ Cache"
      );
      // อาจจะพาไปหน้า Settings อัตโนมัติเพื่อให้กด Reset
      SettingsModule.renderSettings(document.getElementById("content-area"));
    }

    document.addEventListener("habit-updated", () => {
      if (this.currentPage === "home") {
        renderDashboard(document.getElementById("content-area"));
      }
    });
  },

  // --- Sidebar & Mobile Menu Logic ---
  bindEvents() {
    const toggleBtn = document.getElementById("sidebar-toggle");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.querySelector(".sidebar");
    const appLayout = document.getElementById("app-root");
    const navItems = document.querySelectorAll(".nav-item");

    const isMobileMode = () => window.innerWidth <= 1024;

    const toggleMenu = () => {
      if (isMobileMode()) {
        sidebar.classList.toggle("mobile-active");
        if (overlay) overlay.classList.toggle("active");
      } else {
        appLayout.classList.toggle("desktop-collapsed");
      }
    };

    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        toggleMenu();
      };
    }

    if (overlay) {
      overlay.onclick = () => {
        sidebar.classList.remove("mobile-active");
        overlay.classList.remove("active");
      };
    }

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const page = item.dataset.page;
        if (page) this.navigateTo(page);

        if (isMobileMode()) {
          sidebar.classList.remove("mobile-active");
          if (overlay) overlay.classList.remove("active");
        }
      });
    });
  },

  // --- Profile & Time Widget Logic ---
  renderTimeWidget(data) {
    const w = document.getElementById("mini-time-display");
    if (!w) return;

    const user = appState.user || {
      name: "User",
      avatar: "👤",
      education: "Lifelong Learner",
    };
    const userName = user.name || "COMMANDER";
    const userAvatar = user.avatar || "👤";
    const userEdu = user.education || "BACHELOR DEGREE";

    // แสดงผลโปรไฟล์และเวลา
    w.innerHTML = `
            <div class="user-profile-widget" onclick="App.handleEditProfile()">
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

  // --- Navigation System ---
  currentPage: "home",

  navigateTo(pageId) {
    this.currentPage = pageId;
    const container = document.getElementById("content-area");
    const titleEl = document.getElementById("page-title");
    if (!container) return;

    // Update Sidebar Active State
    document
      .querySelectorAll(".nav-item")
      .forEach((el) => el.classList.remove("active"));
    const activeNav = document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );
    if (activeNav) activeNav.classList.add("active");

    // Update Header Title
    if (titleEl) {
      const titles = {
        home: "HOME",
        schedule: "SCHEDULE",
        goals: "GOALS",
        today: "FOCUS",
        library: "LIBRARY",
        tools: "TOOLS",
        reviews: "REVIEW",
        settings: "SETTINGS",
      };
      titleEl.textContent = titles[pageId] || pageId.toUpperCase();
    }

    // Clear & Render
    container.innerHTML = "";
    window.scrollTo(0, 0);

    switch (pageId) {
      case "home":
        renderDashboard(container);
        break;
      case "schedule":
        ScheduleModule.renderSchedule(container);
        break;
      case "goals":
        GoalsModule.renderGoals(container);
        break;
      case "today":
        FocusModule.renderToday(container);
        break;
      case "library":
        LibraryModule.renderLibrary(container);
        break;
      case "tools":
        ToolsModule.renderTools(container);
        break;
      case "reviews":
        ReviewsModule.renderReviews(container);
        break;
      case "projects":
        ProjectsModule.renderProjects(container);
        break;
      case "settings":
        SettingsModule.renderSettings(container);
        break;
      default:
        renderDashboard(container);
    }
  },

  // --- Profile Editing Function (Fixed Name) ---
  handleEditProfile() {
    const avatarPresets = ["⬤", "◼", "◆", "▲", "▼", "◈", "▣", "▰"];
    const html = `
            <div class="u-flex-col u-gap-md">
                <div><label class="u-text-sm u-font-bold u-text-muted">NAME</label><input type="text" id="edit-user-name" class="input-std" value="${
                  appState.user.name || ""
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
                      appState.user.avatar || "👤"
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

        // อัปเดตทันที
        TimeSystem.update();
        this.showToast("Profile Saved!", "success");
        return true;
      }
      return false;
    });
  },

  // --- Bridge for Tools Hub (Opening specific tool pages) ---
  openTool(toolName) {
    this.currentPage = "tools";

    const container = document.getElementById("content-area");
    const titleEl = document.getElementById("page-title");
    window.scrollTo(0, 0);

    // Update Title based on tool
    if (titleEl) {
      const toolTitles = {
        money: "MONEY MANAGER",
        habit: "HABIT TRACKER",
        journal: "DAILY JOURNAL",
        exercise: "ACTIVE LIFE",
      };
      titleEl.textContent = toolTitles[toolName] || toolName.toUpperCase();
    }

    if (toolName === "money") {
      MoneyModule.renderMoney(container);
    } else if (toolName === "habit") {
      HabitModule.renderHabitTracker(container);
    } else if (toolName === "journal") {
      JournalModule.renderJournal(container);
    } else if (toolName === "exercise") {
      ExerciseModule.renderExercise(container);
    }
  },

  // --- Mixins: Combine everything into App object ---
  showToast,
  openModal,
  closeModal,
  escapeHtml,
  shuffleManifesto,
  ...ScheduleModule,
  ...FocusModule,
  ...GoalsModule,
  ...LibraryModule,
  ...ToolsModule,
  ...MoneyModule,
  ...HabitModule,
  ...JournalModule,
  ...ExerciseModule,
  ...ReviewsModule,
  ...SettingsModule,
  ...ProjectsModule,
  loadMockData: SettingsModule.loadMockData,
};

// 5. Global Event: Stop Audio when tab is hidden to save resources
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    const audios = document.querySelectorAll("audio");
    audios.forEach((audio) => {
      audio.pause();
      audio.src = "";
      audio.load();
      audio.remove();
    });
    // Reset toggle buttons UI
    document.querySelectorAll(".btn-sound").forEach((btn) => {
      btn.classList.remove("active");
    });
  }
});

// 6. Expose to Window & Start App
window.App = App;
App.init();
