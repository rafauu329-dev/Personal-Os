import { appState, saveState } from "../state.js";

/* =========================================
   GOAL SYSTEM LOGIC
   ========================================= */

export const GoalSystem = {
  // --- Utility ---
  generateId: () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2),

  // --- Factory Methods (Data Creators) ---

  createGoal: (t) => ({
    id: Date.now().toString(),
    title: t,
    icon: "🎯",
    topics: [],
    expanded: true,
  }),

  createTopic: (t) => ({
    id: Date.now().toString(),
    title: t,
    subtopics: [],
    expanded: true,
  }),

  createSubtopic: (t) => ({
    id: Date.now().toString(),
    title: t,
    tasks: [],
    expanded: true,
  }),

  createTask: (t) => ({
    id: Date.now().toString(),
    title: t,
    isComplete: false,
  }),

  // --- Business Logic ---

  calculateProgress(goal) {
    let total = 0,
      complete = 0;

    if (!goal.topics) return 0;

    goal.topics.forEach((t) => {
      if (t.subtopics) {
        t.subtopics.forEach((s) => {
          if (s.tasks) {
            total += s.tasks.length;
            complete += s.tasks.filter((k) => k.isComplete).length;
          }
        });
      }
    });

    return total === 0 ? 0 : Math.round((complete / total) * 100);
  },

  toggleTask(gId, tId, sId, taskId) {
    const goal = appState.goals.find((g) => g.id === gId);
    if (!goal) return;

    const topic = goal.topics.find((t) => t.id === tId);
    if (!topic) return;

    const sub = topic.subtopics.find((s) => s.id === sId);
    if (!sub) return;

    const task = sub.tasks.find((k) => k.id === taskId);

    if (task) {
      task.isComplete = !task.isComplete;
      saveState();
    }
  },
};
