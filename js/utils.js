import { saveState } from "./state.js";

/* =========================================
   SECURITY & PERFORMANCE HELPERS
   ========================================= */

// 1. ฟังก์ชันป้องกัน XSS (แปลงอักขระอันตรายให้เป็นตัวหนังสือธรรมดา)
export function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 2. ตัวแปรและฟังก์ชันสำหรับหน่วงเวลาเซฟ (Debounce Save)
let saveTimeout = null;
export function saveStateDebounced() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveState();
    // console.log("Auto-saved..."); // เปิดบรรทัดนี้ถ้าอยากเช็คว่าเซฟทำงานไหม
  }, 1000); // รอ 1 วินาทีหลังหยุดพิมพ์ค่อยเซฟ
}

/* =========================================
   UI HELPERS (TOAST & MODAL)
   ========================================= */

export function showToast(message, type = "info") {
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
}

export function openModal(title, htmlContent, onConfirm) {
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

  document.getElementById("modal-cancel-btn").onclick = () => closeModal();

  document.getElementById("modal-confirm-btn").onclick = () => {
    if (onConfirm()) closeModal();
  };

  overlay.classList.add("active");

  const input = content.querySelector("input");
  if (input) input.focus();

  content.onkeyup = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      document.getElementById("modal-confirm-btn").click();
    }
  };
}

export function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("active");
}
