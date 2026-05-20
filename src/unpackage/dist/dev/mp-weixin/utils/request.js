"use strict";
const common_vendor = require("../common/vendor.js");
let hasRetriedWakeup = false;
const DEFAULT_API_BASE_URL = "https://tomatoclock.onrender.com/api";
function getBaseURLMeta() {
  const wxAny = globalThis.wx;
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === "function";
  if (isWeixinMp) {
    const prod = common_vendor.index.getStorageSync("PROD_API_BASE_URL");
    if (typeof prod === "string" && /^https?:\/\//.test(prod)) {
      return { baseURL: prod, needsDevConfig: false };
    }
    return { baseURL: DEFAULT_API_BASE_URL, needsDevConfig: false };
  }
  if (typeof location !== "undefined") {
    const isDevHost = ["localhost", "127.0.0.1"].includes(location.hostname);
    const baseURL = isDevHost ? "http://localhost:3000/api" : DEFAULT_API_BASE_URL;
    return { baseURL, needsDevConfig: false };
  }
  return { baseURL: DEFAULT_API_BASE_URL, needsDevConfig: false };
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
    const fullURL = `${baseURL}${url}`;
    common_vendor.index.request({
      url: fullURL,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...headers
      },
      timeout: 9e4,
      success: (res) => {
        const result = res.data;
        if (result.code === 200) {
          hasRetriedWakeup = false;
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
        const msg = (err == null ? void 0 : err.errMsg) || "";
        const isTimeout = msg.includes("timeout");
        const shouldRetry = isTimeout && !hasRetriedWakeup;
        if (shouldRetry) {
          hasRetriedWakeup = true;
          common_vendor.index.showToast({ title: "服务唤醒中，正在重试…", icon: "none" });
          common_vendor.index.request({
            url: fullURL,
            method,
            data,
            header: {
              "Content-Type": "application/json",
              ...headers
            },
            timeout: 9e4,
            success: (res) => {
              const result = res.data;
              if (result.code === 200) {
                hasRetriedWakeup = false;
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
            fail: (err2) => {
              common_vendor.index.showToast({ title: "网络请求失败", icon: "none" });
              reject(err2);
            }
          });
          return;
        }
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
