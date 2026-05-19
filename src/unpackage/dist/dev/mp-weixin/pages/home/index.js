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
    const selectedDuration = common_vendor.ref(25);
    const selectedMode = common_vendor.ref("strict");
    const selectedCategory = common_vendor.ref("study");
    const durationOptions = [
      { value: 15, label: "15分钟" },
      { value: 25, label: "25分钟" },
      { value: 45, label: "45分钟" },
      { value: 60, label: "60分钟" }
    ];
    const user = common_vendor.computed(() => userStore.user);
    const dailyPoints = common_vendor.computed(() => timerStore.dailyPoints);
    const currentRank = common_vendor.computed(() => timerStore.currentRank);
    const sessions = common_vendor.computed(() => timerStore.sessions);
    const nextRank = common_vendor.computed(() => timerStore.nextRank);
    const progressToNextRank = common_vendor.computed(() => timerStore.progressToNextRank);
    const rankInfo = common_vendor.computed(() => types_index.RANK_CONFIG[currentRank.value]);
    const totalMinutes = common_vendor.computed(() => {
      return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0);
    });
    const todaySessions = common_vendor.computed(() => {
      return sessions.value.slice(-3).reverse();
    });
    const greeting = common_vendor.computed(() => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour < 6)
        return "夜深了";
      if (hour < 12)
        return "早上好";
      if (hour < 14)
        return "中午好";
      if (hour < 18)
        return "下午好";
      if (hour < 22)
        return "晚上好";
      return "夜深了";
    });
    const currentDate = common_vendor.computed(() => {
      const now = /* @__PURE__ */ new Date();
      const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
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
    function startFocus() {
      timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value);
      common_vendor.index.navigateTo({ url: "/pages/timer/index" });
    }
    function goToStats() {
      common_vendor.index.switchTab({ url: "/pages/stats/index" });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      timerStore.loadFromStorage();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.t(greeting.value),
        b: common_vendor.t((_a = user.value) == null ? void 0 : _a.nickname),
        c: common_vendor.t(currentDate.value),
        d: common_vendor.t(rankInfo.value.icon),
        e: common_vendor.t(rankInfo.value.name),
        f: rankInfo.value.color,
        g: common_vendor.t(dailyPoints.value),
        h: common_vendor.t(totalMinutes.value),
        i: common_vendor.t(sessions.value.length),
        j: common_vendor.t(((_b = nextRank.value) == null ? void 0 : _b.name) || "已满级"),
        k: progressToNextRank.value + "%",
        l: rankInfo.value.color,
        m: common_vendor.t(dailyPoints.value),
        n: common_vendor.t(((_c = nextRank.value) == null ? void 0 : _c.points) || common_vendor.unref(types_index.RANK_CONFIG).master.points),
        o: common_vendor.f(durationOptions, (duration, k0, i0) => {
          return {
            a: common_vendor.t(duration.value),
            b: duration.value,
            c: selectedDuration.value === duration.value ? 1 : "",
            d: common_vendor.o(($event) => selectedDuration.value = duration.value, duration.value)
          };
        }),
        p: selectedMode.value === "strict" ? 1 : "",
        q: common_vendor.o(($event) => selectedMode.value = "strict", "97"),
        r: selectedMode.value === "gentle" ? 1 : "",
        s: common_vendor.o(($event) => selectedMode.value = "gentle", "7b"),
        t: common_vendor.f(common_vendor.unref(types_index.CATEGORY_CONFIG), (config, key, i0) => {
          return {
            a: common_vendor.t(config.icon),
            b: common_vendor.t(config.name),
            c: key,
            d: selectedCategory.value === key ? 1 : "",
            e: config.color,
            f: common_vendor.o(($event) => selectedCategory.value = key, key)
          };
        }),
        v: common_vendor.o(startFocus, "bb"),
        w: common_vendor.o(goToStats, "4e"),
        x: todaySessions.value.length > 0
      }, todaySessions.value.length > 0 ? {
        y: common_vendor.f(todaySessions.value, (session, k0, i0) => {
          return {
            a: common_vendor.t(getCategoryIcon(session.category)),
            b: getCategoryColor(session.category),
            c: common_vendor.t(getCategoryName(session.category)),
            d: common_vendor.t(session.duration),
            e: common_vendor.t(session.points),
            f: session.id
          };
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
