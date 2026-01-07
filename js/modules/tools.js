import { appState } from "../state.js";

/* =========================================
   TOOLS HUB RENDERER (Original UI from app.js)
   ========================================= */

export function renderTools(container) {
  // ข้อมูลเครื่องมือ 4 อย่าง ตาม app.js เดิม
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

  // สร้าง HTML ตาม app.js เดิมเป๊ะๆ
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
}
