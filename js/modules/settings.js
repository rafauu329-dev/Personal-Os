import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";

/* =========================================
   SETTINGS (Original UI from app.js)
   ========================================= */

export function renderSettings(container) {
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
}

// --- Interactive Functions ---

export function exportData() {
  const str = JSON.stringify(appState, null, 2);
  const blob = new Blob([str], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `life-os-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Download started...", "success");
}

export function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (json && typeof json === "object") {
        openModal("Restore?", "ข้อมูลเก่าจะหายนะ ข้อมูลใหม่จะมาแทนที่", () => {
          // ✅ 1. บันทึกข้อมูลใหม่ลง LocalStorage โดยตรง
          localStorage.setItem("lifeDashboardState", JSON.stringify(json));

          // ❌ 2. ลบบรรทัดนี้ทิ้งครับ: saveState();  <-- ตัวการทำข้อมูลหาย!
          // (เพราะ saveState จะไปดึงค่า appState เก่ามาเซฟทับ)

          showToast("Restore Successful! Reloading...", "success");

          // 3. รีโหลดหน้าเว็บเพื่อให้โหลดข้อมูลใหม่ขึ้นมา
          setTimeout(() => window.location.reload(), 1000);
          return true;
        });
      }
    } catch (err) {
      showToast("ไฟล์ผิดพลาด (Invalid JSON)", "error");
    }
  };
  reader.readAsText(file);
}

export function hardReset() {
  openModal("RESET?", " เพื่อยืนยันการล้างข้อมูลทั้งหมด", () => {
    localStorage.removeItem("lifeDashboardState");
    showToast("System Resetting...", "warning");
    setTimeout(() => window.location.reload(), 1000);
    return true;
  });
}
