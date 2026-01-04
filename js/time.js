const TimeSystem = {
  current: {
    date: new Date(),
    dayPart: "",
    weekNumber: 0,
    progress: { day: 0, week: 0, year: 0 },
  },
  init() {
    this.update();
    setInterval(() => this.update(), 60000);
  },
  update() {
    const now = new Date();
    this.current.date = now;
    const hour = now.getHours();
    this.current.dayPart =
      hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Night";
    this.current.weekNumber = this.getWeekNumber(now);
    this.current.progress.day = (
      ((now - new Date(now).setHours(0, 0, 0, 0)) / 86400000) *
      100
    ).toFixed(1);
    this.current.progress.year = (
      ((now - new Date(now.getFullYear(), 0, 1)) /
        (new Date(now.getFullYear() + 1, 0, 1) -
          new Date(now.getFullYear(), 0, 1))) *
      100
    ).toFixed(1);
    document.dispatchEvent(
      new CustomEvent("time-updated", { detail: this.current })
    );
  },
  getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  },
};
