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
    function goDevConfig() {
      common_vendor.index.navigateTo({ url: "/pages/dev-api/index" });
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
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/home/index",
            fail: () => {
              common_vendor.index.reLaunch({ url: "/pages/home/index" });
            }
          });
        }, 300);
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "操作失败，请重试", icon: "none" });
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _cache) => {
      return {
        a: mode.value === "login" ? 1 : "",
        b: common_vendor.o(($event) => mode.value = "login", "d2"),
        c: mode.value === "register" ? 1 : "",
        d: common_vendor.o(($event) => mode.value = "register", "fc"),
        e: common_vendor.t(mode.value === "register" ? "设置昵称" : "输入昵称"),
        f: common_vendor.o(submit, "ac"),
        g: nickname.value,
        h: common_vendor.o(($event) => nickname.value = $event.detail.value, "88"),
        i: common_vendor.t(mode.value === "register" ? "昵称将显示在排行榜上，至少2个字符" : "使用注册时的昵称登录"),
        j: common_vendor.t(loading.value ? "处理中..." : mode.value === "register" ? "创建账户并开始" : "登录"),
        k: loading.value || nickname.value.trim().length < 2,
        l: common_vendor.o(submit, "0e"),
        m: common_vendor.o(goDevConfig, "b2")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3f748249"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/index.js.map
