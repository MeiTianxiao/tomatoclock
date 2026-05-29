"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_timer = require("../../stores/timer.js");
const stores_todo = require("../../stores/todo.js");
const types_index = require("../../types/index.js");
const api_studyRoom = require("../../api/study-room.js");
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
    const pendingStudyInvites = common_vendor.ref([]);
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
      const settingsStr = common_vendor.index.getStorageSync("app-settings");
      const notificationsEnabled = (() => {
        if (!settingsStr)
          return true;
        try {
          const s = JSON.parse(settingsStr);
          return s.notifications !== false;
        } catch {
          return true;
        }
      })();
      if (isWeixinMp) {
        if (notificationsEnabled) {
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
      } else {
        timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value);
        common_vendor.index.navigateTo({ url: "/pages/timer/index" });
      }
    }
    function goStudyRoom() {
      common_vendor.index.navigateTo({ url: "/pages/study-room/index" });
    }
    async function loadStudyInvites() {
      if (!userStore.isLoggedIn) {
        pendingStudyInvites.value = [];
        return;
      }
      try {
        pendingStudyInvites.value = await api_studyRoom.getPendingStudyRoomInvites();
      } catch {
        pendingStudyInvites.value = [];
      }
    }
    async function joinStudyInvite(item) {
      try {
        const { room_code } = await api_studyRoom.acceptStudyRoomInvite(item.id);
        await loadStudyInvites();
        common_vendor.index.navigateTo({ url: `/pages/study-room/index?code=${room_code}` });
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "加入失败", icon: "none" });
        loadStudyInvites();
      }
    }
    async function dismissStudyInvite(item) {
      try {
        await api_studyRoom.rejectStudyRoomInvite(item.id);
        await loadStudyInvites();
      } catch {
      }
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
        loadStudyInvites();
        api_studyRoom.requestStudyRoomSubscribeMessage();
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
        a: pendingStudyInvites.value.length
      }, pendingStudyInvites.value.length ? {
        b: common_vendor.f(pendingStudyInvites.value, (item, k0, i0) => {
          var _a2;
          return common_vendor.e({
            a: common_vendor.t(((_a2 = item.inviter) == null ? void 0 : _a2.nickname) || "好友"),
            b: item.room_closed
          }, item.room_closed ? {} : {}, {
            c: item.room_closed
          }, item.room_closed ? {} : {}, {
            d: !item.room_closed
          }, !item.room_closed ? {
            e: common_vendor.o(($event) => joinStudyInvite(item), item.id)
          } : {}, {
            f: common_vendor.o(($event) => dismissStudyInvite(item), item.id),
            g: item.id
          });
        })
      } : {}, {
        c: (_a = user.value) == null ? void 0 : _a.avatar_url
      }, ((_b = user.value) == null ? void 0 : _b.avatar_url) ? {
        d: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        f: common_vendor.t(((_d = (_c = user.value) == null ? void 0 : _c.nickname) == null ? void 0 : _d.slice(0, 1)) || "你")
      }, {
        e: common_vendor.unref(isWeixinMp),
        g: common_vendor.t(greeting.value),
        h: hasRealNickname.value
      }, hasRealNickname.value ? {
        i: common_vendor.t((_e = user.value) == null ? void 0 : _e.nickname)
      } : common_vendor.unref(isWeixinMp) ? {} : {}, {
        j: common_vendor.unref(isWeixinMp),
        k: common_vendor.t((totalMinutes.value / 60).toFixed(1)),
        l: common_vendor.t(pointsToNextRank.value),
        m: showFireworks.value
      }, showFireworks.value ? {
        n: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : {}, {
        o: (_f = user.value) == null ? void 0 : _f.avatar_url
      }, ((_g = user.value) == null ? void 0 : _g.avatar_url) ? {
        p: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        r: common_vendor.t(((_i = (_h = user.value) == null ? void 0 : _h.nickname) == null ? void 0 : _i.slice(0, 1)) || "你")
      }, {
        q: common_vendor.unref(isWeixinMp),
        s: common_vendor.t(rankInfo.value.name),
        t: rankInfo.value.color,
        v: common_vendor.t(dailyPoints.value),
        w: common_vendor.t(pointsToNextRank.value),
        x: progressToNextRank.value + "%",
        y: rankInfo.value.color,
        z: common_vendor.f(durationOptions, (duration, k0, i0) => {
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
        A: common_vendor.t(isCustomDuration.value ? selectedDuration.value : "10-120"),
        B: isCustomDuration.value ? 1 : "",
        C: common_vendor.unref(customOptions),
        D: common_vendor.o(onCustomDurationChange, "0e"),
        E: common_vendor.f(common_vendor.unref(types_index.CATEGORY_CONFIG), (config, key, i0) => {
          return {
            a: common_vendor.t(config.icon),
            b: config.color,
            c: common_vendor.t(config.name),
            d: key,
            e: selectedCategory.value === key ? 1 : "",
            f: common_vendor.o(($event) => selectedCategory.value = key, key)
          };
        }),
        F: selectedMode.value === "gentle" ? 1 : "",
        G: common_vendor.o(($event) => selectedMode.value = "gentle", "43"),
        H: selectedMode.value === "strict" ? 1 : "",
        I: common_vendor.o(($event) => selectedMode.value = "strict", "61"),
        J: common_vendor.o(startFocus, "a5"),
        K: common_vendor.o(goStudyRoom, "ea"),
        L: common_vendor.p({
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
