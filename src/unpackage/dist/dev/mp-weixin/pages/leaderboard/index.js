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
        common_vendor.index.__f__("error", "at pages/leaderboard/index.vue:171", "加载排行榜失败:", error);
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
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      return common_vendor.e({
        a: (_a = leaderboard.value[1]) == null ? void 0 : _a.avatar_url
      }, ((_b = leaderboard.value[1]) == null ? void 0 : _b.avatar_url) ? {
        b: leaderboard.value[1].avatar_url
      } : {}, {
        c: common_vendor.t(((_c = leaderboard.value[1]) == null ? void 0 : _c.nickname) || "---"),
        d: common_vendor.t(((_d = leaderboard.value[1]) == null ? void 0 : _d.total_points) || 0),
        e: (_e = leaderboard.value[0]) == null ? void 0 : _e.avatar_url
      }, ((_f = leaderboard.value[0]) == null ? void 0 : _f.avatar_url) ? {
        f: leaderboard.value[0].avatar_url
      } : {}, {
        g: common_vendor.t(((_g = leaderboard.value[0]) == null ? void 0 : _g.nickname) || "---"),
        h: common_vendor.t(((_h = leaderboard.value[0]) == null ? void 0 : _h.total_points) || 0),
        i: (_i = leaderboard.value[2]) == null ? void 0 : _i.avatar_url
      }, ((_j = leaderboard.value[2]) == null ? void 0 : _j.avatar_url) ? {
        j: leaderboard.value[2].avatar_url
      } : {}, {
        k: common_vendor.t(((_k = leaderboard.value[2]) == null ? void 0 : _k.nickname) || "---"),
        l: common_vendor.t(((_l = leaderboard.value[2]) == null ? void 0 : _l.total_points) || 0),
        m: common_vendor.t(leaderboard.value.length),
        n: common_vendor.f(leaderboard.value.slice(3), (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 4),
            b: item.avatar_url
          }, item.avatar_url ? {
            c: item.avatar_url
          } : {
            d: common_vendor.t(getRankIcon(item.current_rank))
          }, {
            e: getRankColor(item.current_rank),
            f: common_vendor.t(item.nickname),
            g: common_vendor.t(getRankName(item.current_rank)),
            h: common_vendor.t(item.total_points),
            i: common_vendor.t(item.total_minutes),
            j: item.id,
            k: item.id === currentUserId.value ? 1 : ""
          });
        }),
        o: loading.value
      }, loading.value ? {} : {}, {
        p: leaderboard.value.length === 0 && !loading.value
      }, leaderboard.value.length === 0 && !loading.value ? {} : {}, {
        q: myRank.value
      }, myRank.value ? {
        r: common_vendor.t(myRank.value.position)
      } : {}, {
        s: common_vendor.t(dailyPoints.value),
        t: common_vendor.t(totalMinutes.value),
        v: common_vendor.t(sessions.value.length),
        w: common_vendor.o(goToFocus, "b1")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1b46c6ec"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/leaderboard/index.js.map
