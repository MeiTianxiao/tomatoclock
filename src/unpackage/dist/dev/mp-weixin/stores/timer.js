"use strict";
const common_vendor = require("../common/vendor.js");
const types_index = require("../types/index.js");
const api_user = require("../api/user.js");
const stores_user = require("./user.js");
const RANK_ORDER = ["intern", "junior", "middle", "senior", "expert", "master"];
const useTimerStore = common_vendor.defineStore("timer", () => {
  const dailyPoints = common_vendor.ref(0);
  const currentRank = common_vendor.ref("intern");
  const sessions = common_vendor.ref([]);
  const isActive = common_vendor.ref(false);
  const isPaused = common_vendor.ref(false);
  const timeLeft = common_vendor.ref(0);
  const totalDuration = common_vendor.ref(0);
  const targetTime = common_vendor.ref(0);
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
    targetTime.value = Date.now() + duration * 60 * 1e3;
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
    targetTime.value = Date.now() + timeLeft.value * 1e3;
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
    api_user.syncFocusEnd({
      duration_minutes: minutes,
      points,
      rank_after: newRank
    }).catch(console.error);
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
    if (isActive.value && !isPaused.value) {
      const remaining = Math.max(0, Math.ceil((targetTime.value - Date.now()) / 1e3));
      timeLeft.value = remaining;
    }
  }
  function resetDaily() {
    dailyPoints.value = 0;
    currentRank.value = "intern";
    sessions.value = [];
    saveToStorage();
  }
  async function syncWithServer() {
    var _a;
    const userStore = stores_user.useUserStore();
    if (!((_a = userStore.user) == null ? void 0 : _a.id))
      return;
    try {
      const stats = await api_user.getWeeklyStats(userStore.user.id);
      if (stats) {
        let changed = false;
        if (stats.total_points !== void 0 && stats.total_points !== dailyPoints.value) {
          dailyPoints.value = stats.total_points;
          changed = true;
        }
        if (stats.current_rank && stats.current_rank !== currentRank.value) {
          currentRank.value = stats.current_rank;
          changed = true;
        }
        if (changed) {
          saveToStorage();
        }
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at stores/timer.ts:175", "Sync failed:", e);
    }
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
    saveToStorage,
    syncWithServer
  };
});
exports.useTimerStore = useTimerStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/timer.js.map
