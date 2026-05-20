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
    const activeBoard = common_vendor.ref("all");
    const wxAny = globalThis.wx;
    const isWeixinMp = !!wxAny && typeof wxAny.login === "function";
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
        common_vendor.index.__f__("error", "at pages/leaderboard/index.vue:204", "加载排行榜失败:", error);
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
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
      return common_vendor.e({
        a: activeBoard.value === "all" ? 1 : "",
        b: common_vendor.o(($event) => activeBoard.value = "all", "c6"),
        c: activeBoard.value === "friend" ? 1 : "",
        d: common_vendor.o(($event) => activeBoard.value = "friend", "a9"),
        e: activeBoard.value === "all"
      }, activeBoard.value === "all" ? common_vendor.e({
        f: (_a = leaderboard.value[1]) == null ? void 0 : _a.avatar_url
      }, ((_b = leaderboard.value[1]) == null ? void 0 : _b.avatar_url) ? {
        g: leaderboard.value[1].avatar_url
      } : {}, {
        h: common_vendor.t(((_c = leaderboard.value[1]) == null ? void 0 : _c.nickname) || "---"),
        i: common_vendor.t(((_d = leaderboard.value[1]) == null ? void 0 : _d.total_points) || 0),
        j: (_e = leaderboard.value[0]) == null ? void 0 : _e.avatar_url
      }, ((_f = leaderboard.value[0]) == null ? void 0 : _f.avatar_url) ? {
        k: leaderboard.value[0].avatar_url
      } : {}, {
        l: common_vendor.t(((_g = leaderboard.value[0]) == null ? void 0 : _g.nickname) || "---"),
        m: common_vendor.t(((_h = leaderboard.value[0]) == null ? void 0 : _h.total_points) || 0),
        n: (_i = leaderboard.value[2]) == null ? void 0 : _i.avatar_url
      }, ((_j = leaderboard.value[2]) == null ? void 0 : _j.avatar_url) ? {
        o: leaderboard.value[2].avatar_url
      } : {}, {
        p: common_vendor.t(((_k = leaderboard.value[2]) == null ? void 0 : _k.nickname) || "---"),
        q: common_vendor.t(((_l = leaderboard.value[2]) == null ? void 0 : _l.total_points) || 0),
        r: common_vendor.t(leaderboard.value.length),
        s: common_vendor.f(leaderboard.value.slice(3), (item, index, i0) => {
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
        t: loading.value
      }, loading.value ? {} : {}, {
        v: leaderboard.value.length === 0 && !loading.value
      }, leaderboard.value.length === 0 && !loading.value ? {} : {}) : {
        w: common_vendor.o(($event) => activeBoard.value = "all", "c6")
      }, {
        x: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {} : ((_m = common_vendor.unref(userStore).user) == null ? void 0 : _m.avatar_url) ? {
        z: common_vendor.unref(userStore).user.avatar_url
      } : {
        A: common_vendor.t(((_o = (_n = common_vendor.unref(userStore).user) == null ? void 0 : _n.nickname) == null ? void 0 : _o.slice(0, 1)) || "你")
      }, {
        y: (_p = common_vendor.unref(userStore).user) == null ? void 0 : _p.avatar_url,
        B: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {} : {
        C: common_vendor.t(((_q = common_vendor.unref(userStore).user) == null ? void 0 : _q.nickname) || "微信用户")
      }, {
        D: myRank.value
      }, myRank.value ? {
        E: common_vendor.t(myRank.value.position)
      } : {}, {
        F: common_vendor.t(dailyPoints.value),
        G: common_vendor.t(totalMinutes.value),
        H: common_vendor.t(sessions.value.length),
        I: common_vendor.o(goToFocus, "a3")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1b46c6ec"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/leaderboard/index.js.map
