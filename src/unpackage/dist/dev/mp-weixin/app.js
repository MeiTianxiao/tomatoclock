"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/auth/index.js";
  "./pages/dev-api/index.js";
  "./pages/home/index.js";
  "./pages/timer/index.js";
  "./pages/leaderboard/index.js";
  "./pages/stats/index.js";
  "./pages/settings/index.js";
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "App",
  setup(__props) {
    common_vendor.onLaunch(() => {
      common_vendor.index.__f__("log", "at App.vue:5", "App Launch");
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at App.vue:9", "App Show");
    });
    common_vendor.onHide(() => {
      common_vendor.index.__f__("log", "at App.vue:13", "App Hide");
    });
    return () => {
    };
  }
});
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
