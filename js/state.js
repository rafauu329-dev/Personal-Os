/* =========================================
   STATE MANAGEMENT
   ========================================= */

const DEFAULT_STATE = {
  timeContext: {},
  home: {},
  goals: [],
  today: {
    focus: null,
    mustDo: [],
    niceToDo: [],
    notes: "",
    brainDump: "",
    atmosphere: "silence",
  },
  library: [],
  tools: {
    money: {
      transactions: [],
      budget: 15000,
      categories: null, // Will be initialized in app.js if null
    },
    habits: [],
    journal: [],
    exercise: {
      profile: {
        weight: "",
        height: "",
        age: "",
        gender: "m",
        activity: 1.2,
      },
    },
  },
  reviews: [],
  settings: {
    language: "th",
  },
  user: {
    name: "[TAP TO EDIT]",
    avatar: "⚫",
    education: "COMPUTER ENGINEER",
  },
};

let appState = { ...DEFAULT_STATE };

/* =========================================
   PERSISTENCE (LOCAL STORAGE)
   ========================================= */

function loadState() {
  const saved = localStorage.getItem("lifeDashboardState");
  if (saved) {
    try {
      // Merge saved state with default to ensure new fields exist
      appState = { ...DEFAULT_STATE, ...JSON.parse(saved) };

      // Ensure deep merge for nested objects if necessary (simple spread mostly works here)
      if (!appState.tools) appState.tools = { ...DEFAULT_STATE.tools };
    } catch (e) {
      console.error("Failed to load state:", e);
      appState = { ...DEFAULT_STATE };
    }
  } else {
    saveState();
  }
}

function saveState() {
  // Exclude volatile data (timeContext) before saving
  const { timeContext, ...stateToSave } = appState;
  localStorage.setItem("lifeDashboardState", JSON.stringify(stateToSave));
}
