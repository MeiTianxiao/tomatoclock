"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const isWeixinMp = !!globalThis.wx && typeof globalThis.wx.getAccountInfoSync === "function";
    const settings = common_vendor.ref({
      notifications: true,
      soundEnabled: true,
      darkMode: false,
      privacyMode: false,
      dailyGoal: 120,
      theme: "business"
    });
    const themeNames = {
      business: "商务蓝",
      nature: "自然绿",
      sunset: "日落橙",
      ocean: "海洋蓝"
    };
    const user = common_vendor.computed(() => userStore.user);
    const rankInfo = common_vendor.computed(() => {
      var _a;
      const points = parseInt(((_a = common_vendor.index.getStorageSync("timer")) == null ? void 0 : _a.dailyPoints) || "0") || 0;
      let rank = "intern";
      if (points >= 1500)
        rank = "master";
      else if (points >= 1e3)
        rank = "expert";
      else if (points >= 600)
        rank = "senior";
      else if (points >= 300)
        rank = "middle";
      else if (points >= 100)
        rank = "junior";
      return types_index.RANK_CONFIG[rank];
    });
    const rankColor = common_vendor.computed(() => rankInfo.value.color);
    const rankIcon = common_vendor.computed(() => rankInfo.value.icon);
    const rankName = common_vendor.computed(() => rankInfo.value.name);
    function toggleSetting(key) {
      settings.value[key] = !settings.value[key];
      saveSettings();
    }
    function saveSettings() {
      common_vendor.index.setStorageSync("app-settings", JSON.stringify(settings.value));
    }
    function loadSettings() {
      const stored = common_vendor.index.getStorageSync("app-settings");
      if (stored) {
        try {
          settings.value = JSON.parse(stored);
        } catch {
        }
      }
    }
    function editProfile() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function goFriends() {
      common_vendor.index.navigateTo({ url: "/pages/friends/index" });
    }
    function showGoalSettings() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function showThemeSettings() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function exportData() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function clearData() {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有数据吗？此操作不可恢复。",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("timer");
            common_vendor.index.removeStorageSync("app-settings");
            common_vendor.index.showToast({ title: "数据已清空", icon: "success" });
          }
        }
      });
    }
    function showAbout() {
      common_vendor.index.showModal({
        title: "关于应用",
        content: "专注软件开发需求 v1.0.0\n\n一款帮助开发者提升专注效率的应用",
        showCancel: false
      });
    }
    function showFeedback() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function handleLogout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            userStore.logout();
            common_vendor.index.redirectTo({ url: "/pages/auth/index" });
          }
        }
      });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      loadSettings();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d;
      return common_vendor.e({
        a: (_a = user.value) == null ? void 0 : _a.avatar_url
      }, ((_b = user.value) == null ? void 0 : _b.avatar_url) ? {
        b: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        d: common_vendor.t(rankIcon.value)
      }, {
        c: common_vendor.unref(isWeixinMp),
        e: rankColor.value,
        f: (_c = user.value) == null ? void 0 : _c.nickname
      }, ((_d = user.value) == null ? void 0 : _d.nickname) ? {
        g: common_vendor.t(user.value.nickname)
      } : common_vendor.unref(isWeixinMp) ? {} : {}, {
        h: common_vendor.unref(isWeixinMp),
        i: common_vendor.t(rankName.value),
        j: common_vendor.o(editProfile, "da"),
        k: common_vendor.o(goFriends, "4b"),
        l: settings.value.notifications,
        m: common_vendor.o(($event) => toggleSetting("notifications"), "bd"),
        n: settings.value.soundEnabled,
        o: common_vendor.o(($event) => toggleSetting("soundEnabled"), "43"),
        p: settings.value.darkMode,
        q: common_vendor.o(($event) => toggleSetting("darkMode"), "d6"),
        r: settings.value.privacyMode,
        s: common_vendor.o(($event) => toggleSetting("privacyMode"), "30"),
        t: common_vendor.t(settings.value.dailyGoal),
        v: common_vendor.o(showGoalSettings, "2b"),
        w: common_vendor.t(themeNames[settings.value.theme]),
        x: common_vendor.o(showThemeSettings, "5a"),
        y: common_vendor.o(exportData, "32"),
        z: common_vendor.o(clearData, "18"),
        A: common_vendor.o(showAbout, "b0"),
        B: common_vendor.o(showFeedback, "22"),
        C: common_vendor.o(handleLogout, "c0")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a11b3e9a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/settings/index.js.map
