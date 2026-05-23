"use strict";
const RANK_CONFIG = {
  intern: { name: "实习生", points: 0, color: "#9ca3af", icon: "👶", avatar: "https://tomatoclock.onrender.com/static/ranks/intern.png" },
  junior: { name: "科员", points: 100, color: "#10b981", icon: "🧑‍�", avatar: "https://tomatoclock.onrender.com/static/ranks/junior.png" },
  middle: { name: "科长", points: 300, color: "#3b82f6", icon: "�", avatar: "https://tomatoclock.onrender.com/static/ranks/middle.png" },
  senior: { name: "处长", points: 600, color: "#8b5cf6", icon: "🏢", avatar: "https://tomatoclock.onrender.com/static/ranks/senior.png" },
  expert: { name: "副局长", points: 1e3, color: "#f59e0b", icon: "⭐", avatar: "https://tomatoclock.onrender.com/static/ranks/expert.png" },
  master: { name: "局长", points: 1500, color: "#ef4444", icon: "👑", avatar: "https://tomatoclock.onrender.com/static/ranks/master.png" }
};
const CATEGORY_CONFIG = {
  study: { name: "学习", color: "#3b82f6", icon: "📚" },
  work: { name: "工作", color: "#10b981", icon: "💼" },
  exam: { name: "备考", color: "#f59e0b", icon: "📝" },
  reading: { name: "阅读", color: "#8b5cf6", icon: "📖" },
  exercise: { name: "运动", color: "#ec4899", icon: "🏃" },
  other: { name: "其他", color: "#6b7280", icon: "📌" }
};
exports.CATEGORY_CONFIG = CATEGORY_CONFIG;
exports.RANK_CONFIG = RANK_CONFIG;
//# sourceMappingURL=../../.sourcemap/mp-weixin/types/index.js.map
