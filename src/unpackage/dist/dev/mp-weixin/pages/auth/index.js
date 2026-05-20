"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const wechatLoading = common_vendor.ref(false);
    const wxAny = globalThis.wx;
    const isWeixinMp = !!wxAny && typeof wxAny.login === "function";
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
          var _a2;
          const wxProfile = (_a2 = globalThis.wx) == null ? void 0 : _a2.getUserProfile;
          if (typeof wxProfile === "function") {
            wxProfile({
              desc: "用于完善头像与昵称",
              success: (res) => resolve(res),
              fail: () => resolve(null)
            });
            return;
          }
          const uniProfile = common_vendor.index.getUserProfile;
          if (typeof uniProfile === "function") {
            uniProfile({
              desc: "用于完善头像与昵称",
              success: (res) => resolve(res),
              fail: () => resolve(null)
            });
            return;
          }
          resolve(null);
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
        common_vendor.index.showToast({ title: "微信登录成功", icon: "success" });
        goHome();
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "微信登录失败", icon: "none" });
      } finally {
        wechatLoading.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {
        b: common_vendor.t(wechatLoading.value ? "微信登录中..." : "微信一键登录"),
        c: wechatLoading.value,
        d: common_vendor.o(wechatOneTap, "11")
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3f748249"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/index.js.map
