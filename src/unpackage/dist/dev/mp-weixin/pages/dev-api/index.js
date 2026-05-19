"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const value = common_vendor.ref("");
    common_vendor.onLoad(() => {
      const stored = common_vendor.index.getStorageSync("DEV_MP_API_BASE_URL");
      if (typeof stored === "string" && stored)
        value.value = stored;
    });
    const canSave = common_vendor.computed(() => value.value.trim().length > 0);
    function normalize(input) {
      const v = input.trim();
      if (!v)
        return "";
      if (/^https?:\/\//.test(v))
        return v;
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v))
        return `http://${v}:3000/api`;
      return "";
    }
    function buildHealthURL(baseURL) {
      const u = baseURL.replace(/\/+$/, "");
      return `${u}/health`;
    }
    function useLocalhost() {
      value.value = "http://localhost:3000/api";
      save();
    }
    function test() {
      const baseURL = normalize(value.value);
      if (!baseURL) {
        common_vendor.index.showToast({ title: "请输入正确的 IP 或 URL", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "测试中..." });
      common_vendor.index.request({
        url: buildHealthURL(baseURL),
        method: "GET",
        success: (res) => {
          common_vendor.index.hideLoading();
          if ((res == null ? void 0 : res.statusCode) === 200) {
            common_vendor.index.showToast({ title: "连接成功", icon: "success" });
          } else {
            const statusCode = (res == null ? void 0 : res.statusCode) || "未知";
            const body = (() => {
              try {
                return JSON.stringify((res == null ? void 0 : res.data) ?? null);
              } catch {
                return "";
              }
            })();
            common_vendor.index.showModal({
              title: `连接失败(${statusCode})`,
              content: body ? body.slice(0, 1500) : "无响应内容",
              showCancel: false
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          const msg = (err == null ? void 0 : err.errMsg) || "连接失败";
          common_vendor.index.showModal({ title: "连接失败", content: msg, showCancel: false });
        }
      });
    }
    function save() {
      const url = normalize(value.value);
      if (!url) {
        common_vendor.index.showToast({ title: "请输入正确的 IP 或 URL", icon: "none" });
        return;
      }
      common_vendor.index.setStorageSync("DEV_MP_API_BASE_URL", url);
      common_vendor.index.showToast({ title: "已保存", icon: "success" });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 300);
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(save, "b0"),
        b: value.value,
        c: common_vendor.o(($event) => value.value = $event.detail.value, "d4"),
        d: common_vendor.o(useLocalhost, "26"),
        e: !canSave.value,
        f: common_vendor.o(test, "da"),
        g: !canSave.value,
        h: common_vendor.o(save, "89")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-46f748cf"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/dev-api/index.js.map
