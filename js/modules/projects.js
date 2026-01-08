import { appState, saveState } from "../state.js";
import { openModal, showToast, escapeHtml } from "../utils.js";

/* =========================================
   PROJECTS: PORTFOLIO & ARCHIVE MODE
   ========================================= */

export function renderProjects(container) {
  if (!appState.projects) appState.projects = [];

  // 1. แยกกลุ่ม (Active = กำลังทำ / Idea, Done = เสร็จแล้วโชว์)
  const activeProjects = appState.projects.filter((p) => p.status !== "done");
  const doneProjects = appState.projects.filter((p) => p.status === "done");

  // 2. Header
  const headerHTML = `
        <div class="u-flex-between u-flex-align-center u-mb-lg">
            <div>
                <div class="section-tag bg-black">PROJECT ARCHIVE</div>
                <div class="u-text-sm u-text-muted u-mt-xs">คลังเก็บโปรเจกต์และผลงานของคุณ</div>
            </div>
            <button class="btn-action" onclick="App.handleAddProject()">+ เก็บโปรเจกต์ใหม่</button>
        </div>
    `;

  // 3. ส่วน Active (แบบ List หรือ Grid เล็กๆ)
  const activeSection = `
        <div class="u-mb-lg">
            <div class="u-flex-align-center u-mb-md" style="border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <span class="u-font-black u-text-lg"> WORK IN PROGRESS (กำลังปั้น)</span>
                <span class="count-badge u-ml-sm bg-yellow u-text-black">${
                  activeProjects.length
                }</span>
            </div>

            <div class="project-grid active-grid">
                ${
                  activeProjects.length > 0
                    ? activeProjects
                        .map((p) => createProjectCard(p, false))
                        .join("")
                    : `<div class="empty-state">ยังไม่มีโปรเจกต์ที่กำลังทำ... เริ่มเลยไหม?</div>`
                }
            </div>
        </div>
    `;

  // 4. ส่วน Showcase (แบบ Gallery ใหญ่ๆ)
  const showcaseSection = `
        <div class="u-mt-xl">
            <div class="u-flex-align-center u-mb-md" style="border-bottom: 2px solid #000; padding-bottom: 10px;">
                <span class="u-font-black u-text-lg"> SHOWCASE </span>
                <span class="count-badge u-ml-sm bg-green">${
                  doneProjects.length
                }</span>
            </div>

            <div class="project-grid showcase-grid">
                ${
                  doneProjects.length > 0
                    ? doneProjects
                        .map((p) => createProjectCard(p, true))
                        .join("")
                    : `<div class="empty-state">พื้นที่รอโชว์ผลงานชิ้นโบว์แดงของคุณ</div>`
                }
            </div>
        </div>
    `;

  container.innerHTML = headerHTML + activeSection + showcaseSection;
}

// --- Card Generator ---
function createProjectCard(item, isDone) {
  // ถ้ามีรูปปก ให้แสดงรูป ถ้าไม่มีให้แสดง Placeholder สวยๆ
  const coverHTML = item.image
    ? `<div class="proj-cover" style="background-image: url('${item.image}');"></div>`
    : `<div class="proj-cover no-img"><span>${item.icon || "📁"}</span></div>`;

  const statusBadge =
    item.status === "idea"
      ? `<span class="status-pill bg-yellow"> IDEA</span>`
      : item.status === "doing"
      ? `<span class="status-pill bg-blue"> DOING</span>`
      : `<span class="status-pill bg-green">✔ DONE</span>`;

  return `
        <div class="project-card-pro ${isDone ? "done-mode" : ""}">
            ${coverHTML}
            <div class="proj-content">
                <div class="u-flex-between u-mb-xs">
                    ${statusBadge}
                    <div class="proj-tools">
                        <button onclick="App.handleEditProject('${
                          item.id
                        }')">✎</button>
                        <button onclick="App.handleDeleteProject('${
                          item.id
                        }')" class="u-text-danger">×</button>
                    </div>
                </div>

                <div class="proj-title-pro">${escapeHtml(item.title)}</div>
                <div class="proj-cat-pro">${escapeHtml(
                  item.category || "General"
                )}</div>
                <div class="proj-desc-pro">${escapeHtml(item.desc || "-")}</div>

                <div class="proj-footer-pro">
                    <div class="proj-stack-row">
                        ${(item.stack || "")
                          .split(",")
                          .slice(0, 3)
                          .map((s) =>
                            s.trim() ? `<span>${s.trim()}</span>` : ""
                          )
                          .join("")}
                    </div>
                    <div class="proj-actions-row">
                        ${
                          item.link
                            ? `<a href="${item.link}" target="_blank" class="link-btn">OPEN ↗</a>`
                            : ""
                        }

                        ${
                          !isDone
                            ? `<button class="check-btn" onclick="App.markProjectDone('${item.id}')" title="เสร็จแล้ว">✔ FINISH</button>`
                            : `<button class="undo-btn" onclick="App.markProjectActive('${item.id}')" title="กลับมาทำใหม่">↺</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Actions ---

export function handleAddProject() {
  const html = `
        <div class="u-flex-col u-gap-md">
            <div><label class="u-font-bold u-text-sm">ชื่อโปรเจกต์</label><input type="text" id="p-title" class="input-std" placeholder="เช่น: ทำคลิป Youtube, จัดสวน"></div>
            <div><label class="u-font-bold u-text-sm">รูปปก (URL)</label><input type="text" id="p-img" class="input-std" placeholder="https://... (ถ้ามี)"></div>
            <div><label class="u-font-bold u-text-sm">รายละเอียด</label><textarea id="p-desc" class="input-std" placeholder="เกี่ยวกับอะไร?"></textarea></div>
            <div class="u-flex u-gap-sm">
                <div style="flex:1"><label class="u-font-bold u-text-sm">หมวดหมู่</label><input type="text" id="p-cat" class="input-std" placeholder="เช่น: Hobby, Work"></div>
                <div style="flex:1"><label class="u-font-bold u-text-sm">สิ่งที่ใช้</label><input type="text" id="p-stack" class="input-std" placeholder="เช่น: Premiere Pro, ต้นไม้"></div>
            </div>
            <div><label class="u-font-bold u-text-sm">ลิงก์ผลงาน</label><input type="text" id="p-link" class="input-std" placeholder="https://..."></div>
        </div>`;

  openModal("เก็บโปรเจกต์ใหม่", html, () => {
    const title = document.getElementById("p-title").value;
    if (!title) return false;

    appState.projects.push({
      id: Date.now().toString(),
      title,
      image: document.getElementById("p-img").value,
      desc: document.getElementById("p-desc").value,
      category: document.getElementById("p-cat").value,
      stack: document.getElementById("p-stack").value,
      link: document.getElementById("p-link").value,
      status: "doing", // เริ่มที่ Doing เลย
      createdAt: new Date(),
    });
    saveState();
    renderProjects(document.getElementById("content-area"));
    return true;
  });
}

export function handleEditProject(id) {
  const p = appState.projects.find((p) => p.id === id);
  if (!p) return;

  const html = `
        <div class="u-flex-col u-gap-md">
            <div><label class="u-font-bold u-text-sm">ชื่อโปรเจกต์</label><input type="text" id="edit-p-title" class="input-std" value="${escapeHtml(
              p.title
            )}"></div>
            <div><label class="u-font-bold u-text-sm">รูปปก (URL)</label><input type="text" id="edit-p-img" class="input-std" value="${escapeHtml(
              p.image || ""
            )}"></div>
            <div><label class="u-font-bold u-text-sm">รายละเอียด</label><textarea id="edit-p-desc" class="input-std">${escapeHtml(
              p.desc || ""
            )}</textarea></div>
            <div class="u-flex u-gap-sm">
                <div style="flex:1"><label class="u-font-bold u-text-sm">หมวดหมู่</label><input type="text" id="edit-p-cat" class="input-std" value="${escapeHtml(
                  p.category || ""
                )}"></div>
                <div style="flex:1"><label class="u-font-bold u-text-sm">สิ่งที่ใช้</label><input type="text" id="edit-p-stack" class="input-std" value="${escapeHtml(
                  p.stack || ""
                )}"></div>
            </div>
            <div><label class="u-font-bold u-text-sm">ลิงก์ผลงาน</label><input type="text" id="edit-p-link" class="input-std" value="${escapeHtml(
              p.link || ""
            )}"></div>
        </div>`;

  openModal("แก้ไขข้อมูล", html, () => {
    const title = document.getElementById("edit-p-title").value;
    if (!title) return false;

    p.title = title;
    p.image = document.getElementById("edit-p-img").value;
    p.desc = document.getElementById("edit-p-desc").value;
    p.category = document.getElementById("edit-p-cat").value;
    p.stack = document.getElementById("edit-p-stack").value;
    p.link = document.getElementById("edit-p-link").value;

    saveState();
    renderProjects(document.getElementById("content-area"));
    return true;
  });
}

export function handleDeleteProject(id) {
  openModal("ลบโปรเจกต์?", "จะลบข้อมูลนี้ทิ้งจริงๆ ใช่ไหม?", () => {
    appState.projects = appState.projects.filter((p) => p.id !== id);
    saveState();
    renderProjects(document.getElementById("content-area"));
    showToast("ลบเรียบร้อย", "info");
    return true;
  });
}

export function markProjectDone(id) {
  const p = appState.projects.find((p) => p.id === id);
  if (p) {
    p.status = "done";
    saveState();
    renderProjects(document.getElementById("content-area"));
    showToast("ยินดีด้วย! ", "success");
  }
}

export function markProjectActive(id) {
  const p = appState.projects.find((p) => p.id === id);
  if (p) {
    p.status = "doing";
    saveState();
    renderProjects(document.getElementById("content-area"));
  }
}
