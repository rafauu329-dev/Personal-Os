import { appState, saveState } from "../state.js";
import { openModal, showToast, escapeHtml } from "../utils.js";

// --- Local State for Filters ---
let libraryFilter = "all";
let libraryTypeFilter = "all";

// --- Main Render Function ---

export function renderLibrary(container) {
  if (!appState.library) appState.library = [];

  // --- 1. ส่วน Header & Controls (แบบเดิม) ---
  const statusControls = `
        <div class="library-controls">
            <span class="u-text-xs u-font-bold u-text-muted u-mr-sm">STATUS:</span>
            <button class="lib-filter-btn ${
              libraryFilter === "all" ? "active" : ""
            }" onclick="App.setLibFilter('all')">ALL</button>
            <button class="lib-filter-btn ${
              libraryFilter === "reading" ? "active" : ""
            }" onclick="App.setLibFilter('reading')">READING</button>
            <button class="lib-filter-btn ${
              libraryFilter === "todo" ? "active" : ""
            }" onclick="App.setLibFilter('todo')">QUEUE</button>
            <button class="lib-filter-btn ${
              libraryFilter === "done" ? "active" : ""
            }" onclick="App.setLibFilter('done')">DONE</button>
        </div>`;

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
                  libraryTypeFilter === t ? "active" : ""
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
            <button class="btn-action" onclick="App.handleAddLibrary()">+ เพิ่มสิ่งที่สนใจ </button>
        </div>
        ${statusControls}
        ${typeControls}
    `;

  // --- 2. Logic การกรองข้อมูล (Double Filter) ---
  let filteredList = appState.library;

  if (libraryFilter !== "all") {
    filteredList = filteredList.filter((item) => item.status === libraryFilter);
  }

  if (libraryTypeFilter !== "all") {
    filteredList = filteredList.filter(
      (item) => item.type === libraryTypeFilter
    );
  }

  filteredList.sort((a, b) => b.id - a.id);

  // --- 3. Helper Functions ---
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
    const coverHTML = item.cover
      ? `<img src="${
          item.cover
        }" class="book-cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
           <div class="no-cover" style="display:none"><span>${getIcon(
             item.type
           )}<br>NO COVER</span></div>`
      : `<div class="no-cover"><span>${getIcon(item.type)}</span></div>`;

    const spineClass = `spine-${item.type}` || "spine-book";

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
                   <div class="book-title" title="${escapeHtml(
                     item.title
                   )}">${escapeHtml(item.title)}</div>
                   <div class="book-author">${escapeHtml(
                     item.author || "-"
                   )}</div>
                    <div class="book-actions">
                        ${actionBtns}
                        <button class="u-text-danger u-cursor-pointer" style="border:none; background:none; font-weight:bold;" onclick="App.deleteLibraryItem('${
                          item.id
                        }')">DEL</button>
                    </div>
                </div>
            </div>`;
  };

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
}

// --- Interactive Functions ---

export function setLibFilter(filterName) {
  libraryFilter = filterName;
  renderLibrary(document.getElementById("content-area"));
}

export function setLibTypeFilter(typeName) {
  libraryTypeFilter = typeName;
  renderLibrary(document.getElementById("content-area"));
}

export function handleAddLibrary() {
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

  openModal("เพิ่มเข้าชั้นหนังสือ", html, () => {
    const type = document.getElementById("lib-type").value;
    const title = document.getElementById("lib-title").value;
    const author = document.getElementById("lib-author").value;
    const cover = document.getElementById("lib-cover").value;

    if (!title) {
      showToast("กรุณาระบุชื่อเรื่องก่อนนะครับ", "error");
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
    // Reset filter to see the new item
    libraryFilter = "all";
    renderLibrary(document.getElementById("content-area"));
    showToast("เพิ่มลงชั้นหนังสือเรียบร้อย! ", "success");
    return true;
  });
}

export function setLibraryStatus(id, newStatus) {
  const item = appState.library.find((i) => i.id === id);
  if (item) {
    item.status = newStatus;
    saveState();
    let msg = "";
    if (newStatus === "reading") msg = ` เริ่มอ่าน "${item.title}" แล้ว! สู้ๆ`;
    if (newStatus === "done") msg = ` เยี่ยมมาก! อ่าน "${item.title}" จบแล้ว`;
    if (newStatus === "todo") msg = `⏸ พักเรื่อง "${item.title}" ไว้ก่อน`;
    showToast(msg, newStatus === "done" ? "success" : "info");
    renderLibrary(document.getElementById("content-area"));
  }
}

export function deleteLibraryItem(id) {
  openModal("ยืนยันลบ?", "รายการนี้จะหายไปจากชั้นหนังสือเลยนะ", () => {
    appState.library = appState.library.filter((i) => i.id !== id);
    saveState();
    renderLibrary(document.getElementById("content-area"));
    showToast("ลบออกจากชั้นหนังสือแล้ว", "info");
    return true;
  });
}
