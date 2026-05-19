"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_timer = require("../../stores/timer.js");
const api_leaderboard = require("../../api/leaderboard.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const timerStore = stores_timer.useTimerStore();
    const leaderboard = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const currentUserId = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.user) == null ? void 0 : _a.id) || "";
    });
    const dailyPoints = common_vendor.computed(() => timerStore.dailyPoints);
    const sessions = common_vendor.computed(() => timerStore.sessions);
    const totalMinutes = common_vendor.computed(() => {
      return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0);
    });
    const myRank = common_vendor.computed(() => {
      return leaderboard.value.find((item) => item.id === currentUserId.value);
    });
    function getRankColor(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.color) || "#9ca3af";
    }
    function getRankIcon(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.icon) || "👤";
    }
    function getRankName(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.name) || rank;
    }
    async function loadLeaderboard() {
      loading.value = true;
      try {
        const data = await api_leaderboard.getLeaderboard(20);
        leaderboard.value = data;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/leaderboard/index.vue:159", "加载排行榜失败:", error);
      } finally {
        loading.value = false;
      }
    }
    function goToFocus() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      timerStore.loadFromStorage();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
        return;
      }
      loadLeaderboard();
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.t(((_a = leaderboard.value[1]) == null ? void 0 : _a.nickname) || "---"),
        b: common_vendor.t(((_b = leaderboard.value[1]) == null ? void 0 : _b.total_points) || 0),
        c: common_vendor.t(((_c = leaderboard.value[0]) == null ? void 0 : _c.nickname) || "---"),
        d: common_vendor.t(((_d = leaderboard.value[0]) == null ? void 0 : _d.total_points) || 0),
        e: common_vendor.t(((_e = leaderboard.value[2]) == null ? void 0 : _e.nickname) || "---"),
        f: common_vendor.t(((_f = leaderboard.value[2]) == null ? void 0 : _f.total_points) || 0),
        g: common_vendor.t(leaderboard.value.length),
        h: common_vendor.f(leaderboard.value.slice(3), (item, index, i0) => {
          return {
            a: common_vendor.t(index + 4),
            b: common_vendor.t(getRankIcon(item.current_rank)),
            c: getRankColor(item.current_rank),
            d: common_vendor.t(item.nickname),
            e: common_vendor.t(getRankName(item.current_rank)),
            f: common_vendor.t(item.total_points),
            g: common_vendor.t(item.total_minutes),
            h: item.id,
            i: item.id === currentUserId.value ? 1 : ""
          };
        }),
        i: loading.value
      }, loading.value ? {} : {}, {
        j: leaderboard.value.length === 0 && !loading.value
      }, leaderboard.value.length === 0 && !loading.value ? {} : {}, {
        k: myRank.value
      }, myRank.value ? {
        l: common_vendor.t(myRank.value.position)
      } : {}, {
        m: common_vendor.t(dailyPoints.value),
        n: common_vendor.t(totalMinutes.value),
        o: common_vendor.t(sessions.value.length),
        p: common_vendor.o(goToFocus, "a7")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1b46c6ec"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/leaderboard/index.js.map
