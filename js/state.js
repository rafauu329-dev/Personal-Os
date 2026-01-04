const DEFAULT_STATE = {
  timeContext: {},
  home: {},
  goals: [],
  today: { focus: null, mustDo: [], niceToDo: [], notes: "" },
  library: [],
  tools: {},
  reviews: [],
  settings: { language: "th" },
  user: {
    name: "[TAP TO EDIT]",
    avatar: "⚫",
    education: "COMPUTER ENGINEER",
  },
};
let appState = { ...DEFAULT_STATE };

function loadState() {
  const saved = localStorage.getItem("lifeDashboardState");
  if (saved) {
    try {
      appState = { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) {
      appState = { ...DEFAULT_STATE };
    }
  } else {
    saveState();
  }
}
function saveState() {
  const { timeContext, ...stateToSave } = appState;
  localStorage.setItem("lifeDashboardState", JSON.stringify(stateToSave));
}

