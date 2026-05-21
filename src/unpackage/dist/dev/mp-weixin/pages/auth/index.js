"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const defaultAvatarUrl = "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const wechatLoading = common_vendor.ref(false);
    const profileLoading = common_vendor.ref(false);
    const needProfile = common_vendor.ref(false);
    const avatarUrl = common_vendor.ref("");
    const avatarBase64 = common_vendor.ref("");
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
    function getWechatCode() {
      return new Promise((resolve, reject) => {
        var _a;
        const wxLogin = (_a = globalThis.wx) == null ? void 0 : _a.login;
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
    }
    async function handleWechatLogin() {
      if (!isWeixinMp)
        return;
      wechatLoading.value = true;
      try {
        const code = await getWechatCode();
        if (!code)
          throw new Error("未获取到微信登录 code");
        await userStore.wechatLoginUser({ code });
        const user = userStore.user;
        if (user && (!user.avatar_url || user.nickname === "微信用户" || user.avatar_url.includes("thirdwx.qlogo.cn"))) {
          needProfile.value = true;
        } else {
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          goHome();
        }
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "登录失败", icon: "none" });
      } finally {
        wechatLoading.value = false;
      }
    }
    function onChooseAvatar(e) {
      const tmpUrl = e.detail.avatarUrl;
      avatarUrl.value = tmpUrl;
      common_vendor.index.getFileSystemManager().readFile({
        filePath: tmpUrl,
        encoding: "base64",
        success: (res) => {
          avatarBase64.value = `data:image/jpeg;base64,${res.data}`;
        },
        fail: () => {
          common_vendor.index.showToast({ title: "读取头像失败", icon: "none" });
        }
      });
    }
    async function onProfileSubmit(e) {
      const nick = e.detail.value.nickname;
      if (!avatarBase64.value && !avatarUrl.value) {
        return common_vendor.index.showToast({ title: "请选择头像", icon: "none" });
      }
      if (!nick || nick.trim().length === 0) {
        return common_vendor.index.showToast({ title: "请输入昵称", icon: "none" });
      }
      profileLoading.value = true;
      try {
        const code = await getWechatCode();
        await userStore.wechatLoginUser({
          code,
          nickname: nick.trim(),
          avatar_url: avatarBase64.value || void 0
        });
        common_vendor.index.showToast({ title: "设置成功", icon: "success" });
        goHome();
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "保存失败", icon: "none" });
      } finally {
        profileLoading.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !needProfile.value
      }, !needProfile.value ? common_vendor.e({
        b: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {
        c: common_vendor.t(wechatLoading.value ? "微信登录中..." : "微信一键登录"),
        d: wechatLoading.value,
        e: common_vendor.o(handleWechatLogin, "05")
      } : {}) : {
        f: avatarUrl.value || defaultAvatarUrl,
        g: common_vendor.o(onChooseAvatar, "1b"),
        h: common_vendor.t(profileLoading.value ? "保存中..." : "完成登录"),
        i: profileLoading.value,
        j: common_vendor.o(onProfileSubmit, "25")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3f748249"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/index.js.map
