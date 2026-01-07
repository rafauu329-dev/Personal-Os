import { appState } from "../state.js";
import { TimeSystem } from "../services/time.js";
import { GoalSystem } from "../services/goalLogic.js";
import { escapeHtml } from "../utils.js";

// --- Quotes Data ---
export const quotes = [
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
];

// --- Dashboard Logic ---

export function renderDashboard(container) {
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
    const badgeColor = diffDays <= 7 ? "var(--color-red)" : "var(--text-muted)";
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
  // (libStats logic removed as it wasn't used in display, only lengths)

  const exLogs = Array.isArray(appState.tools.exercise)
    ? appState.tools.exercise
    : [];
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  // (weeklyExLogs calculation logic moved inside render block or used locally if needed)

  // D. Manifesto Logic (Updated)
  const featuredJournal = appState.tools.journal?.find((j) => j.isFeatured);
  let initialContent, initialAuthor, initialTag, initialStamp;

  if (featuredJournal) {
    // ถ้ามีการปักหมุด Journal ให้โชว์อันนั้นก่อน
    // แก้ไข: แปลงข้อความให้ปลอดภัยก่อนตัดคำ
    const safeText = escapeHtml(featuredJournal.text);
    initialContent =
      safeText.length > 100 ? safeText.substring(0, 100) + "..." : safeText;
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
    const pool = [...quotes, ...userJournals];

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
    (currentYear % 4 === 0 && currentYear % 100 > 0) || currentYear % 400 === 0
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
                    <div class="dash-goal-title">${g.icon || "🎯"} ${escapeHtml(
               g.title
             )}</div>
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
                            <div class="u-text-lg u-p-lg " style="cursor:pointer; "> แสดงสิ่งที่กำลังทำล่าสุดจากในคลัง </div>
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
                <span class="manifesto-tag section-tag" style="background: var(--color-blue);">JOURNAL LOG</span>
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
                                <div style="font-size:3rem; margin-bottom:10px; opacity:0.5;">+</div>
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
}

export function shuffleManifesto() {
  // 1. ดึง Journal ของเรามาแปลงเป็น format เดียวกับคำคม
  const userJournals = (appState.tools.journal || []).map((j) => ({
    text: j.text,
    author: "MY PAST SELF",
    tag: "FLASHBACK",
    stamp: "MEMORY",
  }));

  // 2. รวมพลัง (Quotes กลาง + Journal เรา)
  const pool = [...quotes, ...userJournals];

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
    document.getElementById("man-author").innerText = `— ${randomItem.author}`;
    document.getElementById("man-tag").innerText = randomItem.tag || "QUOTE";
    document.getElementById("man-stamp").innerText =
      randomItem.stamp || "RANDOM";
  }
}
