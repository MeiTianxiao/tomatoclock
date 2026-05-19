"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
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
      var _a;
      return {
        a: common_vendor.t(rankIcon.value),
        b: rankColor.value,
        c: common_vendor.t((_a = user.value) == null ? void 0 : _a.nickname),
        d: common_vendor.t(rankName.value),
        e: common_vendor.o(editProfile, "59"),
        f: settings.value.notifications,
        g: common_vendor.o(($event) => toggleSetting("notifications"), "a9"),
        h: settings.value.soundEnabled,
        i: common_vendor.o(($event) => toggleSetting("soundEnabled"), "4a"),
        j: settings.value.darkMode,
        k: common_vendor.o(($event) => toggleSetting("darkMode"), "04"),
        l: settings.value.privacyMode,
        m: common_vendor.o(($event) => toggleSetting("privacyMode"), "3d"),
        n: common_vendor.t(settings.value.dailyGoal),
        o: common_vendor.o(showGoalSettings, "a1"),
        p: common_vendor.t(themeNames[settings.value.theme]),
        q: common_vendor.o(showThemeSettings, "31"),
        r: common_vendor.o(exportData, "61"),
        s: common_vendor.o(clearData, "d0"),
        t: common_vendor.o(showAbout, "80"),
        v: common_vendor.o(showFeedback, "13"),
        w: common_vendor.o(handleLogout, "09")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a11b3e9a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/settings/index.js.map
