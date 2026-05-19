"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const nickname = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const mode = common_vendor.ref("login");
    const wechatLoading = common_vendor.ref(false);
    const needsPhoneBind = common_vendor.ref(false);
    const wxAny = globalThis.wx;
    const isWeixinMp = !!wxAny && typeof wxAny.login === "function";
    function goDevConfig() {
      common_vendor.index.navigateTo({ url: "/pages/dev-api/index" });
    }
    function goHome() {
      setTimeout(() => {
        common_vendor.index.switchTab({
          url: "/pages/home/index",
          fail: () => {
            common_vendor.index.reLaunch({ url: "/pages/home/index" });
          }
        });
      }, 200);
    }
    async function wechatOneTap() {
      var _a, _b;
      if (!isWeixinMp)
        return;
      wechatLoading.value = true;
      try {
        const profile = await new Promise((resolve, reject) => {
          if (typeof common_vendor.index.getUserProfile !== "function") {
            resolve(null);
            return;
          }
          ;
          common_vendor.index.getUserProfile({
            desc: "用于完善头像与昵称",
            success: (res) => resolve(res),
            fail: () => resolve(null)
          });
        });
        const code = await new Promise((resolve, reject) => {
          var _a2;
          const wxLogin = (_a2 = globalThis.wx) == null ? void 0 : _a2.login;
          if (typeof wxLogin === "function") {
            wxLogin({
              timeout: 1e4,
              success: (res) => resolve((res == null ? void 0 : res.code) || ""),
              fail: (err) => reject(err)
            });
            return;
          }
          common_vendor.index.login({
            provider: "weixin",
            success: (res) => resolve((res == null ? void 0 : res.code) || ""),
            fail: (err) => reject(err)
          });
        });
        if (!code) {
          throw new Error("未获取到微信登录 code，请确认在微信小程序环境并已配置正确的接口地址");
        }
        const nickName = (_a = profile == null ? void 0 : profile.userInfo) == null ? void 0 : _a.nickName;
        const avatarUrl = (_b = profile == null ? void 0 : profile.userInfo) == null ? void 0 : _b.avatarUrl;
        await userStore.wechatLoginUser({
          code,
          nickname: typeof nickName === "string" ? nickName : void 0,
          avatar_url: typeof avatarUrl === "string" ? avatarUrl : void 0
        });
        needsPhoneBind.value = true;
        common_vendor.index.showToast({ title: "微信登录成功", icon: "success" });
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "微信登录失败", icon: "none" });
      } finally {
        wechatLoading.value = false;
      }
    }
    async function onGetPhoneNumber(e) {
      var _a;
      const code = (_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.code;
      if (!code) {
        common_vendor.index.showToast({ title: "未获取到手机号授权", icon: "none" });
        return;
      }
      try {
        await userStore.bindPhone(code);
        needsPhoneBind.value = false;
        common_vendor.index.showToast({ title: "手机号绑定成功", icon: "success" });
        goHome();
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "手机号绑定失败", icon: "none" });
      }
    }
    async function submit() {
      if (nickname.value.trim().length < 2) {
        common_vendor.index.showToast({ title: "昵称至少需要2个字符", icon: "none" });
        return;
      }
      loading.value = true;
      try {
        if (mode.value === "register") {
          await userStore.registerUser(nickname.value.trim());
          common_vendor.index.showToast({ title: "注册成功", icon: "success" });
        } else {
          await userStore.loginUser(nickname.value.trim());
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
        }
        goHome();
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "操作失败，请重试", icon: "none" });
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? common_vendor.e({
        b: common_vendor.t(wechatLoading.value ? "微信登录中..." : "微信一键登录"),
        c: wechatLoading.value,
        d: common_vendor.o(wechatOneTap, "11"),
        e: needsPhoneBind.value
      }, needsPhoneBind.value ? {
        f: common_vendor.o(onGetPhoneNumber, "1a"),
        g: common_vendor.o(goHome, "dc")
      } : {}) : {}, {
        h: mode.value === "login" ? 1 : "",
        i: common_vendor.o(($event) => mode.value = "login", "ae"),
        j: mode.value === "register" ? 1 : "",
        k: common_vendor.o(($event) => mode.value = "register", "34"),
        l: common_vendor.t(mode.value === "register" ? "设置昵称" : "输入昵称"),
        m: common_vendor.o(submit, "7a"),
        n: nickname.value,
        o: common_vendor.o(($event) => nickname.value = $event.detail.value, "1e"),
        p: common_vendor.t(mode.value === "register" ? "昵称将显示在排行榜上，至少2个字符" : "使用注册时的昵称登录"),
        q: common_vendor.t(loading.value ? "处理中..." : mode.value === "register" ? "创建账户并开始" : "登录"),
        r: loading.value || nickname.value.trim().length < 2,
        s: common_vendor.o(submit, "9f"),
        t: common_vendor.o(goDevConfig, "d8")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3f748249"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/index.js.map
