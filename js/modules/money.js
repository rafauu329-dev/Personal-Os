import { appState, saveState } from "../state.js";
import { openModal, showToast } from "../utils.js";

// --- Local State (Exported so App.moneyTempState works in HTML) ---
export let moneyTempState = {
  type: "expense",
  category: "อาหาร",
  tempAmount: "",
  tempNote: "",
};

// --- Helper for Back Button ---
function renderBackBtn() {
  // เรียก App.renderView('tools') ซึ่งใน main.js จะต้อง map ไว้ หรือใช้ App.navigateTo('tools') ก็ได้
  // ในที่นี้ใช้ App.navigateTo('tools') ตามระบบ Router ใหม่ แต่ปุ่มเขียนว่า Back
  return `<button class="btn-action" style="margin-right:15px; border-width:2px;" onclick="App.navigateTo('tools')">⬅ Tools</button>`;
}

/* =========================================
   MONEY MANAGER (Original UI from app.js)
   ========================================= */

export function renderMoney(container) {
  // 1. Initialize State if missing
  if (!appState.tools.money) {
    appState.tools.money = {
      transactions: [],
      budget: 15000,
    };
  }
  // Initialize Categories if missing
  if (!appState.tools.money.categories) {
    appState.tools.money.categories = {
      expense: [
        { icon: "🍔", label: "อาหาร" },
        { icon: "🚗", label: "เดินทาง" },
        { icon: "🏠", label: "ของใช้" },
        { icon: "🛍️", label: "ช้อปปิ้ง" },
      ],
      income: [
        { icon: "💰", label: "เงินเดือน" },
        { icon: "💼", label: "ฟรีแลนซ์" },
        { icon: "📈", label: "ลงทุน" },
      ],
    };
  }

  const data = appState.tools.money;
  const now = new Date();

  // Filter transactions for current month
  const monthlyTrans = data.transactions.filter((t) => {
    const d = new Date(t.rawDate || Date.now());
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  // Calculate totals
  const income = monthlyTrans
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthlyTrans
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const budget = data.budget || 15000;
  const budgetPercent = Math.min((expense / budget) * 100, 100);

  // Determine current categories to display
  const currentCats =
    moneyTempState.type === "expense"
      ? data.categories.expense
      : data.categories.income;

  // Render HTML
  container.innerHTML = `
        <div class="u-flex-align-center u-mb-lg">
            ${renderBackBtn()}
            <div class="section-tag bg-danger" style="margin:0;">Money Manager</div>
            <button onclick="App.setBudget()" style="margin-left:auto; font-size:0.75rem; font-weight:bold; background:#000; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">SET BUDGET</button>
        </div>

        <div class="balance-card">
             <div class="balance-label">> CURRENT_CASH_FLOW</div>
             <div class="balance-amount" style="color:${
               balance >= 0 ? "#33ff00" : "#ff3333"
             };">${balance.toLocaleString()} ฿</div>
             <div class="u-flex-center u-mt-md u-pt-md" style="gap:30px; border-top:1px dashed rgba(255,255,255,0.2);">
                <div><div style="font-size:0.75rem; opacity:0.7;">INCOME</div><div style="font-weight:700; color:#33ff00;">+${income.toLocaleString()}</div></div>
                <div><div style="font-size:0.75rem; opacity:0.7;">EXPENSE</div><div style="font-weight:700; color:#ff3333;">-${expense.toLocaleString()}</div></div>
            </div>
            <div class="u-mt-md" style="background:#333; height:10px; border:1px solid #555; overflow:hidden; position:relative;">
                <div style="position:absolute; left:0; top:0; height:100%; width:${budgetPercent}%; background:${
    budgetPercent > 90 ? "#ff3333" : "#33ff00"
  }; box-shadow: 0 0 5px ${budgetPercent > 90 ? "#ff3333" : "#33ff00"};"></div>
            </div>
            <div class="u-text-right u-text-xs u-mt-xs" style="opacity:0.6; font-family:monospace;">USAGE: ${Math.round(
              budgetPercent
            )}% // LIMIT: ${budget.toLocaleString()}</div>
        </div>

        <div class="paper-card u-mb-lg">
            <div class="money-type-toggle">
                <button class="type-btn-expense ${
                  moneyTempState.type === "expense" ? "active expense" : ""
                }" onclick="App.setMoneyType('expense')">EXPENSE (-)</button>
                <button class="type-btn-income ${
                  moneyTempState.type === "income" ? "active income" : ""
                }" onclick="App.setMoneyType('income')">INCOME (+)</button>
            </div>

            <div class="u-mb-md" style="position:relative;">
                <span style="position:absolute; left:15px; top:50%; transform:translateY(-50%); font-weight:900; font-size:1.2rem; color:var(--text-muted);">฿</span>
                <input type="number" id="money-amount" class="input-std u-text-right u-font-bold u-text-xl" placeholder="0.00" value="${
                  moneyTempState.tempAmount
                }" oninput="App.moneyTempState.tempAmount = this.value" style="padding-left:40px;">
            </div>
            <div class="cat-grid">
                ${currentCats
                  .map(
                    (c) => `
                    <div class="cat-btn ${
                      moneyTempState.category === c.label ? "selected" : ""
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
                  moneyTempState.tempNote
                }" oninput="App.moneyTempState.tempNote = this.value">
                <button class="btn-action" onclick="App.addMoneyTransaction()" style="background:${
                  moneyTempState.type === "expense"
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
}

// --- Interactive Functions ---

export function setMoneyType(type) {
  moneyTempState.tempAmount = document.getElementById("money-amount").value;
  moneyTempState.tempNote = document.getElementById("money-note").value;
  moneyTempState.type = type;

  // Auto-select first category of new type
  const cats = appState.tools.money.categories[type];
  if (cats && cats.length > 0) moneyTempState.category = cats[0].label;

  renderMoney(document.getElementById("content-area"));
}

export function setMoneyCat(cat) {
  moneyTempState.tempAmount = document.getElementById("money-amount").value;
  moneyTempState.tempNote = document.getElementById("money-note").value;
  moneyTempState.category = cat;
  renderMoney(document.getElementById("content-area"));
}

export function setBudget() {
  openModal(
    "ตั้งงบประมาณรายเดือน",
    `<input type="number" id="budget-input" class="input-std" value="${
      appState.tools.money.budget || 15000
    }">`,
    () => {
      const val = parseFloat(document.getElementById("budget-input").value);
      if (val > 0) {
        appState.tools.money.budget = val;
        saveState();
        renderMoney(document.getElementById("content-area"));
        return true;
      }
      return false;
    }
  );
}

export function handleAddMoneyCategory() {
  const type = moneyTempState.type;
  const html = `
        <div class="u-mb-md"><label>ชื่อหมวดหมู่</label><input type="text" id="new-cat-name" class="input-std" placeholder="เช่น ค่ากาแฟ"></div>
        <div><label>ไอคอน (Emoji)</label><input type="text" id="new-cat-icon" class="input-std" placeholder="เช่น ☕️" value="✨"></div>`;
  openModal(
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
      setMoneyCat(name);
      return true;
    }
  );
}

export function addMoneyTransaction() {
  const amount = parseFloat(document.getElementById("money-amount").value);
  const note = document.getElementById("money-note").value.trim();
  if (!amount || amount <= 0) {
    showToast("ใส่จำนวนเงินด้วยครับ", "error");
    return;
  }
  appState.tools.money.transactions.push({
    id: Date.now(),
    rawDate: new Date(),
    date: new Date().toLocaleDateString("th-TH"),
    type: moneyTempState.type,
    category: moneyTempState.category,
    amount: amount,
    note: note,
  });
  saveState();

  // Clear inputs
  moneyTempState.tempAmount = "";
  moneyTempState.tempNote = "";

  renderMoney(document.getElementById("content-area"));
  showToast("บันทึกเรียบร้อย!", "success");
}

export function deleteMoneyTransaction(id) {
  openModal("ลบรายการ?", "ต้องการลบรายการรับ-จ่ายนี้ใช่ไหม?", () => {
    appState.tools.money.transactions =
      appState.tools.money.transactions.filter((t) => t.id !== id);
    saveState();
    renderMoney(document.getElementById("content-area"));
    showToast("ลบรายการเรียบร้อย", "info");
    return true;
  });
}
