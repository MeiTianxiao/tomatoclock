"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_timer = require("../../stores/timer.js");
const stores_todo = require("../../stores/todo.js");
const types_index = require("../../types/index.js");
if (!Math) {
  TodoChecklist();
}
const TodoChecklist = () => "../../components/TodoChecklist.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const timerStore = stores_timer.useTimerStore();
    const todoStore = stores_todo.useTodoStore();
    const isWeixinMp = !!globalThis.wx && typeof globalThis.wx.getAccountInfoSync === "function";
    const showFireworks = common_vendor.ref(false);
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
    const hasRealNickname = common_vendor.computed(() => {
      var _a;
      const name = ((_a = user.value) == null ? void 0 : _a.nickname) || "";
      if (!name)
        return false;
      return !name.startsWith("微信用户");
    });
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
      todoStore.clearActiveFocus();
      if (isWeixinMp) {
        common_vendor.index.requestSubscribeMessage({
          tmplIds: ["Q_caCI_KtwEuo1xG8JgyUU4pkdVHsnN4JUsZFB52uTo"],
          complete: () => {
            timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value);
            common_vendor.index.navigateTo({ url: "/pages/timer/index" });
          }
        });
      } else {
        timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value);
        common_vendor.index.navigateTo({ url: "/pages/timer/index" });
      }
    }
    function goStudyRoom() {
      common_vendor.index.navigateTo({ url: "/pages/study-room/index" });
    }
    const customValues = Array.from({ length: 12 }, (_, i) => (i + 1) * 10);
    const customOptions = customValues.map((v) => `${v} 分钟`);
    function onCustomDurationChange(e) {
      const index = e.detail.value;
      const picked = customValues[index];
      if (picked) {
        selectedDuration.value = picked;
        isCustomDuration.value = true;
      }
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      timerStore.loadFromStorage();
      todoStore.loadFromStorage();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
      }
    });
    common_vendor.onShow(() => {
      if (userStore.isLoggedIn) {
        timerStore.syncWithServer();
      }
      checkDailyGoal();
    });
    function checkDailyGoal() {
      const settings = common_vendor.index.getStorageSync("app-settings");
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          const dailyGoal = parsed.dailyGoal || 120;
          if (timerStore.dailyPoints > 0 && totalMinutes.value >= dailyGoal) {
            const today = (/* @__PURE__ */ new Date()).toDateString();
            const lastCelebration = common_vendor.index.getStorageSync("last-celebration");
            if (lastCelebration !== today) {
              showFireworks.value = true;
              common_vendor.index.setStorageSync("last-celebration", today);
              setTimeout(() => {
                showFireworks.value = false;
              }, 4e3);
            }
          }
        } catch {
        }
      }
    }
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      return common_vendor.e({
        a: (_a = user.value) == null ? void 0 : _a.avatar_url
      }, ((_b = user.value) == null ? void 0 : _b.avatar_url) ? {
        b: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        d: common_vendor.t(((_d = (_c = user.value) == null ? void 0 : _c.nickname) == null ? void 0 : _d.slice(0, 1)) || "你")
      }, {
        c: common_vendor.unref(isWeixinMp),
        e: common_vendor.t(greeting.value),
        f: hasRealNickname.value
      }, hasRealNickname.value ? {
        g: common_vendor.t((_e = user.value) == null ? void 0 : _e.nickname)
      } : common_vendor.unref(isWeixinMp) ? {} : {}, {
        h: common_vendor.unref(isWeixinMp),
        i: common_vendor.t((totalMinutes.value / 60).toFixed(1)),
        j: common_vendor.t(pointsToNextRank.value),
        k: showFireworks.value
      }, showFireworks.value ? {
        l: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : {}, {
        m: (_f = user.value) == null ? void 0 : _f.avatar_url
      }, ((_g = user.value) == null ? void 0 : _g.avatar_url) ? {
        n: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        p: common_vendor.t(((_i = (_h = user.value) == null ? void 0 : _h.nickname) == null ? void 0 : _i.slice(0, 1)) || "你")
      }, {
        o: common_vendor.unref(isWeixinMp),
        q: common_vendor.t(rankInfo.value.name),
        r: rankInfo.value.color,
        s: common_vendor.t(dailyPoints.value),
        t: common_vendor.t(pointsToNextRank.value),
        v: progressToNextRank.value + "%",
        w: rankInfo.value.color,
        x: common_vendor.f(durationOptions, (duration, k0, i0) => {
          return {
            a: common_vendor.t(duration.value),
            b: common_vendor.t(duration.desc),
            c: duration.value,
            d: selectedDuration.value === duration.value && !isCustomDuration.value ? 1 : "",
            e: common_vendor.o(($event) => {
              selectedDuration.value = duration.value;
              isCustomDuration.value = false;
            }, duration.value)
          };
        }),
        y: common_vendor.t(isCustomDuration.value ? selectedDuration.value : "10-120"),
        z: isCustomDuration.value ? 1 : "",
        A: common_vendor.unref(customOptions),
        B: common_vendor.o(onCustomDurationChange, "ca"),
        C: common_vendor.f(common_vendor.unref(types_index.CATEGORY_CONFIG), (config, key, i0) => {
          return {
            a: common_vendor.t(config.icon),
            b: config.color,
            c: common_vendor.t(config.name),
            d: key,
            e: selectedCategory.value === key ? 1 : "",
            f: common_vendor.o(($event) => selectedCategory.value = key, key)
          };
        }),
        D: selectedMode.value === "gentle" ? 1 : "",
        E: common_vendor.o(($event) => selectedMode.value = "gentle", "75"),
        F: selectedMode.value === "strict" ? 1 : "",
        G: common_vendor.o(($event) => selectedMode.value = "strict", "de"),
        H: common_vendor.o(startFocus, "71"),
        I: common_vendor.o(goStudyRoom, "ad"),
        J: common_vendor.p({
          duration: selectedDuration.value,
          category: selectedCategory.value,
          mode: selectedMode.value
        })
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
