// js/mockData.js

const today = new Date();
const formatDate = (date) => date.toLocaleDateString("th-TH");
const isoDate = (date) => date.toISOString().split("T")[0];

export const MOCK_DATA = {
  user: {
    name: "COMMANDER DEMO",
    avatar: "👨‍🚀",
    education: "SYSTEM ARCHITECT",
  },
  timeContext: {},
  home: {},
  goals: [
    {
      id: "g1",
      title: "Master of Full-Stack",
      icon: "💻",
      expanded: true,
      topics: [
        {
          id: "t1",
          title: "Frontend Mastery",
          subtopics: [
            {
              id: "s1",
              title: "React & Next.js",
              tasks: [
                {
                  id: "k1",
                  title: "Understanding Server Components",
                  isComplete: true,
                },
                {
                  id: "k2",
                  title: "State Management Patterns",
                  isComplete: true,
                },
                { id: "k3", title: "Deploying with Vercel", isComplete: false },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "g2",
      title: "Iron Body 2026",
      icon: "🏋️‍♂️",
      expanded: false,
      topics: [
        {
          id: "t2",
          title: "Weight Loss",
          subtopics: [
            {
              id: "s2",
              title: "Cardio Plan",
              tasks: [
                {
                  id: "k4",
                  title: "Running 5km (3 days/week)",
                  isComplete: true,
                },
                { id: "k5", title: "Swimming 1hr", isComplete: false },
              ],
            },
          ],
        },
      ],
    },
  ],
  today: {
    focus: "Finalizing the System Deployment 🚀",
    mustDo: [
      { id: "td1", title: "Fix Mobile CSS Bugs", completed: true },
      { id: "td2", title: "Test JSON Import/Export", completed: true },
      {
        id: "td3",
        title: "Update Mock Data for Presentation",
        completed: true,
      },
    ],
    niceToDo: [
      { id: "td4", title: "Read Clean Code - 15 mins", completed: false },
      { id: "td5", title: "Organize Workspace", completed: false },
    ],
    notes: "Don't forget to push code to GitHub before 9 PM!",
    brainDump:
      "Idea: Add Ramadan OS feature next month.\nCheck Vercel pricing for more projects.",
    atmosphere: "night",
  },
  library: [
    {
      id: "l1",
      type: "book",
      title: "Atomic Habits",
      author: "James Clear",
      status: "reading",
      cover: "https://images-na.ssl-images-amazon.com/images/I/91bYsX41DVL.jpg",
    },
    {
      id: "l2",
      type: "book",
      title: "The Lean Startup",
      author: "Eric Ries",
      status: "done",
      cover: "https://m.media-amazon.com/images/I/81-QB7nDh4L.jpg",
    },
  ],
  schedule: [
    {
      id: "sch1",
      date: isoDate(today),
      title: "System Check & Bug Fix",
      timeStart: "09:00",
      timeEnd: "11:00",
      type: "work",
      period: "morning",
      important: true,
    },
    {
      id: "sch2",
      date: isoDate(today),
      title: "Lunch with Client",
      timeStart: "12:00",
      timeEnd: "13:30",
      type: "life",
      period: "afternoon",
      important: false,
    },
    {
      id: "sch3",
      date: isoDate(today),
      title: "Gym Session",
      timeStart: "17:00",
      timeEnd: "18:30",
      type: "health",
      period: "evening",
      important: true,
    },
  ],
  tools: {
    money: {
      budget: 25000,
      categories: {
        expense: [
          { icon: "🍔", label: "Food" },
          { icon: "🚗", label: "Travel" },
          { icon: "🛍️", label: "Shopping" },
          { icon: "🏠", label: "Bills" },
        ],
        income: [
          { icon: "💰", label: "Salary" },
          { icon: "💼", label: "Freelance" },
        ],
      },
      transactions: [
        {
          id: 1,
          type: "income",
          category: "Salary",
          amount: 45000,
          note: "Monthly Salary",
          date: formatDate(today),
          rawDate: today,
        },
        {
          id: 2,
          type: "expense",
          category: "Bills",
          amount: 5500,
          note: "Apartment Rent",
          date: formatDate(today),
          rawDate: today,
        },
        {
          id: 3,
          type: "expense",
          category: "Food",
          amount: 350,
          note: "Dinner",
          date: formatDate(today),
          rawDate: today,
        },
      ],
    },
    habits: [
      {
        id: "h1",
        name: "Drink 2L Water",
        color: "var(--color-blue)",
        streak: 15,
        lastDone: formatDate(today),
      },
      {
        id: "h2",
        name: "Exercise 30m",
        color: "var(--color-red)",
        streak: 4,
        lastDone: formatDate(today),
      },
      {
        id: "h3",
        name: "Read 10 Pages",
        color: "var(--color-yellow)",
        streak: 8,
        lastDone: null,
      },
    ],
    journal: [
      {
        id: "j1",
        date: today,
        text: "Today I finalized the Personal OS. It feels amazing to see everything working together smoothly.",
        gratitude: "Having a clear vision for the future.",
        mood: "🤩",
        tags: ["Success", "DevLife"],
        isFeatured: true,
      },
    ],
    exercise: {
      profile: {
        weight: "72",
        height: "178",
        age: "25",
        gender: "m",
        activity: 1.5,
        goalMin: 150,
        goalCal: 2000,
      },
      logs: [
        { id: "ex1", date: today, type: "Running", duration: 40, cals: 350 },
      ],
    },
  },
  reviews: [],
  settings: { language: "th" },
};
