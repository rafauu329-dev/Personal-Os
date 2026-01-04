const GoalSystem = {
  generateId: () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2),
  createGoal: (t) => ({
    id: Date.now().toString(),
    title: t,
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

  calculateProgress(goal) {
    let total = 0,
      complete = 0;
    goal.topics.forEach((t) => {
      t.subtopics.forEach((s) => {
        total += s.tasks.length;
        complete += s.tasks.filter((k) => k.isComplete).length;
      });
    });
    return total === 0 ? 0 : Math.round((complete / total) * 100);
  },
  toggleTask(gId, tId, sId, taskId) {
    const goal = appState.goals.find((g) => g.id === gId);
    if (!goal) return;
    const topic = goal.topics.find((t) => t.id === tId);
    const sub = topic.subtopics.find((s) => s.id === sId);
    const task = sub.tasks.find((k) => k.id === taskId);
    if (task) {
      task.isComplete = !task.isComplete;
      saveState();
    }
  },
};
