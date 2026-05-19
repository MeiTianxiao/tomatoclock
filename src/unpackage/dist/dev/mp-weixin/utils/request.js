"use strict";
const common_vendor = require("../common/vendor.js");
let hasShownBaseURLTip = false;
function getBaseURLMeta() {
  const wxAny = globalThis.wx;
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === "function";
  if (isWeixinMp) {
    const sys = common_vendor.index.getSystemInfoSync();
    const prod = common_vendor.index.getStorageSync("PROD_API_BASE_URL");
    if (typeof prod === "string" && /^https?:\/\//.test(prod)) {
      return { baseURL: prod, needsDevConfig: false };
    }
    const stored = common_vendor.index.getStorageSync("DEV_MP_API_BASE_URL");
    if (typeof stored === "string" && /^https?:\/\//.test(stored)) {
      return { baseURL: stored, needsDevConfig: false };
    }
    if (sys.platform === "devtools") {
      return { baseURL: "http://localhost:3000/api", needsDevConfig: false };
    }
    if (!hasShownBaseURLTip) {
      hasShownBaseURLTip = true;
      common_vendor.index.navigateTo({ url: "/pages/dev-api/index" });
    }
    return { baseURL: "", needsDevConfig: true };
  }
  if (typeof location !== "undefined") {
    const isDevHost = ["localhost", "127.0.0.1"].includes(location.hostname);
    const baseURL = isDevHost ? "http://localhost:3000/api" : "http://localhost:3000/api";
    return { baseURL, needsDevConfig: false };
  }
  return { baseURL: "http://localhost:3000/api", needsDevConfig: false };
}
async function request(url, options = {}) {
  const { method = "GET", data = {}, headers = {} } = options;
  const token = common_vendor.index.getStorageSync("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    const { baseURL, needsDevConfig } = getBaseURLMeta();
    if (needsDevConfig) {
      reject(new Error("请先配置接口地址"));
      return;
    }
    common_vendor.index.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...headers
      },
      success: (res) => {
        const result = res.data;
        if (result.code === 200) {
          resolve(result);
        } else if (result.code === 401) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("user");
          common_vendor.index.navigateTo({ url: "/pages/auth/index" });
          reject(new Error("登录失效"));
        } else {
          common_vendor.index.showToast({ title: result.message, icon: "none" });
          reject(new Error(result.message));
        }
      },
      fail: (err) => {
        common_vendor.index.showToast({ title: "网络请求失败", icon: "none" });
        reject(err);
      }
    });
  });
}
function get(url, params) {
  let query = "";
  if (params) {
    query = "?" + new URLSearchParams(params).toString();
  }
  return request(url + query, { method: "GET" });
}
function post(url, data) {
  return request(url, { method: "POST", data });
}
exports.get = get;
exports.post = post;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
