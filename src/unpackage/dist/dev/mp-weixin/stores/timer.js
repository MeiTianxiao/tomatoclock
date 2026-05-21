"use strict";
const common_vendor = require("../common/vendor.js");
const types_index = require("../types/index.js");
const RANK_ORDER = ["intern", "junior", "middle", "senior", "expert", "master"];
const useTimerStore = common_vendor.defineStore("timer", () => {
  const dailyPoints = common_vendor.ref(0);
  const currentRank = common_vendor.ref("intern");
  const sessions = common_vendor.ref([]);
  const isActive = common_vendor.ref(false);
  const isPaused = common_vendor.ref(false);
  const timeLeft = common_vendor.ref(0);
  const totalDuration = common_vendor.ref(0);
  const currentCategory = common_vendor.ref("study");
  const currentMode = common_vendor.ref("strict");
  const nextRank = common_vendor.computed(() => {
    const currentIndex = RANK_ORDER.indexOf(currentRank.value);
    if (currentIndex >= RANK_ORDER.length - 1)
      return null;
    return types_index.RANK_CONFIG[RANK_ORDER[currentIndex + 1]];
  });
  const pointsToNextRank = common_vendor.computed(() => {
    const currentIndex = RANK_ORDER.indexOf(currentRank.value);
    if (currentIndex >= RANK_ORDER.length - 1)
      return 0;
    const nextRankPoints = types_index.RANK_CONFIG[RANK_ORDER[currentIndex + 1]].points;
    return nextRankPoints - dailyPoints.value;
  });
  const progressToNextRank = common_vendor.computed(() => {
    if (!nextRank.value)
      return 100;
    const currentIndex = RANK_ORDER.indexOf(currentRank.value);
    const currentRankPoints = types_index.RANK_CONFIG[RANK_ORDER[currentIndex]].points;
    return Math.min(100, (dailyPoints.value - currentRankPoints) / (nextRank.value.points - currentRankPoints) * 100);
  });
  function loadFromStorage() {
    const stored = common_vendor.index.getStorageSync("timer");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        dailyPoints.value = data.dailyPoints || 0;
        currentRank.value = data.currentRank || "intern";
        sessions.value = data.sessions || [];
      } catch {
        resetDaily();
      }
    }
  }
  function saveToStorage() {
    const data = {
      dailyPoints: dailyPoints.value,
      currentRank: currentRank.value,
      sessions: sessions.value
    };
    common_vendor.index.setStorageSync("timer", JSON.stringify(data));
  }
  function startFocus(duration, category, mode) {
    totalDuration.value = duration * 60;
    timeLeft.value = duration * 60;
    currentCategory.value = category;
    currentMode.value = mode;
    isActive.value = true;
    isPaused.value = false;
  }
  function pauseFocus() {
    isPaused.value = true;
  }
  function resumeFocus() {
    isPaused.value = false;
  }
  function stopFocus() {
    isActive.value = false;
    isPaused.value = false;
    const completedDuration = totalDuration.value - timeLeft.value;
    const minutes = Math.floor(completedDuration / 60);
    if (minutes < 5) {
      return null;
    }
    const points = Math.floor(minutes * 1.2);
    const oldRank = currentRank.value;
    dailyPoints.value += points;
    const newRank = calculateRank();
    const wasPromoted = newRank !== oldRank;
    currentRank.value = newRank;
    const session = {
      id: `session_${Date.now()}`,
      category: currentCategory.value,
      duration: minutes,
      points,
      completed: true,
      startTime: Date.now() - completedDuration * 1e3
    };
    sessions.value.push(session);
    saveToStorage();
    return {
      oldRank,
      newRank,
      earnedPoints: points,
      wasPromoted
    };
  }
  function calculateRank() {
    const points = dailyPoints.value;
    for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
      const rank = RANK_ORDER[i];
      if (points >= types_index.RANK_CONFIG[rank].points) {
        return rank;
      }
    }
    return "intern";
  }
  function tick() {
    if (isActive.value && !isPaused.value && timeLeft.value > 0) {
      timeLeft.value--;
    }
  }
  function resetDaily() {
    dailyPoints.value = 0;
    currentRank.value = "intern";
    sessions.value = [];
    saveToStorage();
  }
  return {
    dailyPoints,
    currentRank,
    sessions,
    isActive,
    isPaused,
    timeLeft,
    totalDuration,
    currentCategory,
    currentMode,
    nextRank,
    pointsToNextRank,
    progressToNextRank,
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    tick,
    resetDaily,
    loadFromStorage,
    saveToStorage
  };
});
exports.useTimerStore = useTimerStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/timer.js.map
