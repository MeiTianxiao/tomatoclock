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
    const isWeixinMp = !!globalThis.wx && typeof globalThis.wx.getAccountInfoSync === "function";
    const selectedDuration = common_vendor.ref(25);
    const selectedMode = common_vendor.ref("strict");
    const selectedCategory = common_vendor.ref("study");
    const isCustomDuration = common_vendor.ref(false);
    const durationOptions = [
      { value: 15, desc: "实习生任务" },
      { value: 30, desc: "科员任务" },
      { value: 45, desc: "科长任务" },
      { value: 60, desc: "处长任务" },
      { value: 90, desc: "局长任务" }
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
    common_vendor.computed(() => {
      return sessions.value.slice(-3).reverse();
    });
    const pointsToNextRank = common_vendor.computed(() => {
      var _a;
      const target = ((_a = nextRank.value) == null ? void 0 : _a.points) ?? types_index.RANK_CONFIG.master.points;
      const left = Math.max(0, target - dailyPoints.value);
      return left;
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
    common_vendor.computed(() => {
      const now = /* @__PURE__ */ new Date();
      const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
    });
    function startFocus() {
      timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value);
      common_vendor.index.navigateTo({ url: "/pages/timer/index" });
    }
    function pickCustomDuration() {
      const options = Array.from({ length: 12 }, (_, i) => (i + 1) * 10);
      common_vendor.index.showActionSheet({
        itemList: options.map((v) => `${v} 分钟`),
        success: (res) => {
          const picked = options[res.tapIndex];
          if (picked) {
            selectedDuration.value = picked;
            isCustomDuration.value = true;
          }
        }
      });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      timerStore.loadFromStorage();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      return common_vendor.e({
        a: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {} : ((_a = user.value) == null ? void 0 : _a.avatar_url) ? {
        c: user.value.avatar_url
      } : {
        d: common_vendor.t(((_c = (_b = user.value) == null ? void 0 : _b.nickname) == null ? void 0 : _c.slice(0, 1)) || "你")
      }, {
        b: (_d = user.value) == null ? void 0 : _d.avatar_url,
        e: common_vendor.t(greeting.value),
        f: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {} : {
        g: common_vendor.t(((_e = user.value) == null ? void 0 : _e.nickname) || "同学")
      }, {
        h: common_vendor.t((totalMinutes.value / 60).toFixed(1)),
        i: common_vendor.t(((_f = nextRank.value) == null ? void 0 : _f.name) || "已满级"),
        j: common_vendor.t(pointsToNextRank.value),
        k: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {} : ((_g = user.value) == null ? void 0 : _g.avatar_url) ? {
        m: user.value.avatar_url
      } : {
        n: common_vendor.t(((_i = (_h = user.value) == null ? void 0 : _h.nickname) == null ? void 0 : _i.slice(0, 1)) || "你")
      }, {
        l: (_j = user.value) == null ? void 0 : _j.avatar_url,
        o: common_vendor.t(rankInfo.value.name),
        p: rankInfo.value.color,
        q: common_vendor.t(dailyPoints.value),
        r: common_vendor.t(((_k = nextRank.value) == null ? void 0 : _k.name) || "已满级"),
        s: common_vendor.t(pointsToNextRank.value),
        t: progressToNextRank.value + "%",
        v: rankInfo.value.color,
        w: common_vendor.f(durationOptions, (duration, k0, i0) => {
          return {
            a: common_vendor.t(duration.value),
            b: common_vendor.t(duration.desc),
            c: duration.value,
            d: selectedDuration.value === duration.value ? 1 : "",
            e: common_vendor.o(($event) => selectedDuration.value = duration.value, duration.value)
          };
        }),
        x: isCustomDuration.value ? 1 : "",
        y: common_vendor.o(pickCustomDuration, "88"),
        z: common_vendor.f(common_vendor.unref(types_index.CATEGORY_CONFIG), (config, key, i0) => {
          return {
            a: common_vendor.t(config.icon),
            b: config.color,
            c: common_vendor.t(config.name),
            d: key,
            e: selectedCategory.value === key ? 1 : "",
            f: common_vendor.o(($event) => selectedCategory.value = key, key)
          };
        }),
        A: selectedMode.value === "gentle" ? 1 : "",
        B: common_vendor.o(($event) => selectedMode.value = "gentle", "18"),
        C: selectedMode.value === "strict" ? 1 : "",
        D: common_vendor.o(($event) => selectedMode.value = "strict", "f9"),
        E: common_vendor.o(startFocus, "20")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
