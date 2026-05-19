"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_timer = require("../../stores/timer.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const timerStore = stores_timer.useTimerStore();
    const sessions = common_vendor.computed(() => timerStore.sessions);
    const dailyPoints = common_vendor.computed(() => timerStore.dailyPoints);
    const currentRank = common_vendor.computed(() => timerStore.currentRank);
    common_vendor.computed(() => types_index.RANK_CONFIG[currentRank.value]);
    const totalMinutes = common_vendor.computed(() => {
      return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0);
    });
    const totalSessions = common_vendor.computed(() => {
      return sessions.value.filter((s) => s.completed).length;
    });
    const totalPoints = common_vendor.computed(() => {
      return sessions.value.reduce((sum, s) => sum + (s.completed ? s.points : 0), 0);
    });
    const weekData = common_vendor.computed(() => {
      const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      const now = /* @__PURE__ */ new Date();
      const today = now.getDay() || 7;
      const data = [];
      let maxPoints = 1;
      for (let i = 0; i < 7; i++) {
        const dayOffset = i - (today - 1);
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1e3;
        const daySessions = sessions.value.filter((s) => {
          return s.startTime >= dayStart && s.startTime < dayEnd && s.completed;
        });
        const points = daySessions.reduce((sum, s) => sum + s.points, 0);
        maxPoints = Math.max(maxPoints, points);
        data.push({
          label: days[i],
          points,
          percentage: 0,
          color: i === today - 1 ? "#3b82f6" : "#9ca3af"
        });
      }
      data.forEach((d) => {
        d.percentage = d.points / maxPoints * 100;
      });
      return data;
    });
    common_vendor.computed(() => {
      const stats = {};
      Object.keys(types_index.CATEGORY_CONFIG).forEach((key) => {
        stats[key] = {
          minutes: 0,
          points: 0,
          icon: types_index.CATEGORY_CONFIG[key].icon,
          name: types_index.CATEGORY_CONFIG[key].name,
          color: types_index.CATEGORY_CONFIG[key].color
        };
      });
      sessions.value.forEach((s) => {
        if (s.completed) {
          stats[s.category].minutes += s.duration;
          stats[s.category].points += s.points;
        }
      });
      const totalMinutes2 = Object.values(stats).reduce((sum, s) => sum + s.minutes, 0) || 1;
      return Object.entries(stats).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          percentage: (value.minutes / totalMinutes2 * 100).toFixed(1)
        };
        return acc;
      }, {});
    });
    const recentSessions = common_vendor.computed(() => {
      return sessions.value.filter((s) => s.completed).slice(-10).reverse();
    });
    function getCategoryColor(category) {
      return types_index.CATEGORY_CONFIG[category].color;
    }
    function getCategoryIcon(category) {
      return types_index.CATEGORY_CONFIG[category].icon;
    }
    function getCategoryName(category) {
      return types_index.CATEGORY_CONFIG[category].name;
    }
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours().toString().padStart(2, "0");
      const minute = date.getMinutes().toString().padStart(2, "0");
      return `${month}/${day} ${hour}:${minute}`;
    }
    function viewAllHistory() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      timerStore.loadFromStorage();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(totalMinutes.value),
        b: common_vendor.t(totalSessions.value),
        c: common_vendor.t(totalPoints.value),
        d: common_vendor.t(dailyPoints.value),
        e: common_vendor.f(weekData.value, (day, index, i0) => {
          return {
            a: day.percentage + "%",
            b: day.color,
            c: common_vendor.t(day.label),
            d: index
          };
        }),
        f: recentSessions.value.length === 0
      }, recentSessions.value.length === 0 ? {} : {
        g: common_vendor.f(recentSessions.value.slice(0, 10), (session, k0, i0) => {
          return {
            a: common_vendor.t(getCategoryIcon(session.category)),
            b: getCategoryColor(session.category),
            c: common_vendor.t(getCategoryName(session.category)),
            d: common_vendor.t(formatTime(session.startTime)),
            e: common_vendor.t(session.points),
            f: common_vendor.t(session.duration),
            g: session.id
          };
        }),
        h: common_vendor.o(viewAllHistory, "e6")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1fa681a1"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/stats/index.js.map
