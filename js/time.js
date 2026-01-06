/* =========================================
   TIME SYSTEM & CALCULATIONS
   ========================================= */

const TimeSystem = {
  current: {
    date: new Date(),
    dayPart: "",
    weekNumber: 0,
    progress: {
      day: 0,
      week: 0,
      year: 0,
    },
  },

  init() {
    this.update();
    // Update every minute (60000ms)
    setInterval(() => this.update(), 60000);
  },

  update() {
    const now = new Date();
    this.current.date = now;

    // Determine Day Part
    const hour = now.getHours();
    this.current.dayPart =
      hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Night";

    // Calculate Week Number
    this.current.weekNumber = this.getWeekNumber(now);

    // Calculate Day Progress (%)
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const dayDuration = 86400000; // 24 * 60 * 60 * 1000
    this.current.progress.day = (
      ((now - startOfDay) / dayDuration) *
      100
    ).toFixed(1);

    // Calculate Year Progress (%)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearDuration = startOfNextYear - startOfYear;
    this.current.progress.year = (
      ((now - startOfYear) / yearDuration) *
      100
    ).toFixed(1);

    // Broadcast Event for Dashboard updates
    document.dispatchEvent(
      new CustomEvent("time-updated", {
        detail: this.current,
      })
    );
  },

  getWeekNumber(d) {
    // ISO 8601 Week Number calculation
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  },
};
