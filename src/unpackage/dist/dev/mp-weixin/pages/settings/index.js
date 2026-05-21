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
      soundType: "rain",
      darkMode: false,
      privacyMode: false,
      dailyGoal: 120,
      theme: "business"
    });
    const soundOptions = [
      { id: "none", name: "无声音" },
      { id: "rain", name: "下雨声" },
      { id: "wave", name: "海浪声" },
      { id: "bird", name: "鸟叫声" }
    ];
    const currentSoundName = common_vendor.computed(() => {
      var _a;
      return ((_a = soundOptions.find((s) => s.id === settings.value.soundType)) == null ? void 0 : _a.name) || "下雨声";
    });
    function onSoundChange(e) {
      const index = e.detail.value;
      const picked = soundOptions[index];
      if (picked) {
        settings.value.soundType = picked.id;
        saveSettings();
      }
    }
    const user = common_vendor.computed(() => userStore.user);
    const hasRealNickname = common_vendor.computed(() => {
      var _a;
      const name = ((_a = user.value) == null ? void 0 : _a.nickname) || "";
      if (!name)
        return false;
      return !name.startsWith("微信用户");
    });
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
    const goalValues = Array.from({ length: 12 }, (_, i) => (i + 1) * 30);
    const goalOptions = goalValues.map((v) => `${v} 分钟`);
    function onGoalChange(e) {
      const index = e.detail.value;
      const picked = goalValues[index];
      if (picked) {
        settings.value.dailyGoal = picked;
        saveSettings();
        common_vendor.index.showToast({ title: "设置成功", icon: "success" });
      }
    }
    function editProfile() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function goFriends() {
      common_vendor.index.navigateTo({ url: "/pages/friends/index" });
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
      var _a, _b, _c;
      return common_vendor.e({
        a: (_a = user.value) == null ? void 0 : _a.avatar_url
      }, ((_b = user.value) == null ? void 0 : _b.avatar_url) ? {
        b: user.value.avatar_url
      } : common_vendor.unref(isWeixinMp) ? {} : {
        d: common_vendor.t(rankIcon.value)
      }, {
        c: common_vendor.unref(isWeixinMp),
        e: rankColor.value,
        f: hasRealNickname.value
      }, hasRealNickname.value ? {
        g: common_vendor.t((_c = user.value) == null ? void 0 : _c.nickname)
      } : common_vendor.unref(isWeixinMp) ? {} : {}, {
        h: common_vendor.unref(isWeixinMp),
        i: common_vendor.t(rankName.value),
        j: common_vendor.o(editProfile, "b2"),
        k: common_vendor.o(goFriends, "c2"),
        l: settings.value.notifications,
        m: common_vendor.o(($event) => toggleSetting("notifications"), "00"),
        n: settings.value.soundEnabled,
        o: common_vendor.o(($event) => toggleSetting("soundEnabled"), "2b"),
        p: settings.value.soundEnabled
      }, settings.value.soundEnabled ? {
        q: common_vendor.t(currentSoundName.value),
        r: soundOptions.map((s) => s.name),
        s: common_vendor.o(onSoundChange, "38")
      } : {}, {
        t: settings.value.privacyMode,
        v: common_vendor.o(($event) => toggleSetting("privacyMode"), "8d"),
        w: common_vendor.t(settings.value.dailyGoal),
        x: common_vendor.unref(goalOptions),
        y: common_vendor.o(onGoalChange, "13"),
        z: common_vendor.o(showAbout, "35"),
        A: common_vendor.o(showFeedback, "31"),
        B: common_vendor.o(handleLogout, "8e")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a11b3e9a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/settings/index.js.map
