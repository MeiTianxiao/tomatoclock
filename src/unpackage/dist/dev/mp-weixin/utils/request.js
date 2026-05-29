"use strict";
const common_vendor = require("../common/vendor.js");
let hasRetriedWakeup = false;
const DEFAULT_API_BASE_URL = "https://tomatoclock.onrender.com/api";
function getBaseURLMeta() {
  const wxAny = globalThis.wx;
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === "function";
  if (isWeixinMp) {
    const dev = common_vendor.index.getStorageSync("DEV_MP_API_BASE_URL");
    if (typeof dev === "string" && /^https?:\/\//.test(dev)) {
      return { baseURL: dev, needsDevConfig: false };
    }
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
function resolveErrorMessage(result, statusCode = 200) {
  if (result && typeof result === "object") {
    const message = result.message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  if (typeof result === "string" && result.trim()) {
    return result.trim().slice(0, 80);
  }
  if (statusCode === 404) {
    return "接口不存在，请确认后端已部署最新版本";
  }
  if (statusCode >= 500) {
    return "服务器繁忙，请稍后再试";
  }
  if (statusCode >= 400) {
    return "请求失败，请稍后再试";
  }
  return "操作失败，请稍后再试";
}
function handleApiResponse(res, resolve, reject) {
  const statusCode = res.statusCode || 200;
  const result = res.data;
  if (statusCode >= 400 && (!result || typeof result !== "object" || typeof result.code !== "number")) {
    const msg2 = resolveErrorMessage(result, statusCode);
    common_vendor.index.showToast({ title: msg2, icon: "none" });
    reject(new Error(msg2));
    return;
  }
  if (!result || typeof result !== "object" || typeof result.code !== "number") {
    const msg2 = resolveErrorMessage(result, statusCode);
    common_vendor.index.showToast({ title: msg2, icon: "none" });
    reject(new Error(msg2));
    return;
  }
  const payload = result;
  if (payload.code === 200) {
    hasRetriedWakeup = false;
    resolve(payload);
    return;
  }
  if (payload.code === 401) {
    common_vendor.index.removeStorageSync("token");
    common_vendor.index.removeStorageSync("user");
    common_vendor.index.navigateTo({ url: "/pages/auth/index" });
    reject(new Error("登录失效"));
    return;
  }
  const msg = resolveErrorMessage(payload, statusCode);
  common_vendor.index.showToast({ title: msg, icon: "none" });
  reject(new Error(msg));
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
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        const msg = (err == null ? void 0 : err.errMsg) || "";
        const isNameNotResolved = msg.includes("ERR_NAME_NOT_RESOLVED");
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
              handleApiResponse(res, resolve, reject);
            },
            fail: (err2) => {
              common_vendor.index.showToast({ title: "网络请求失败", icon: "none" });
              reject(err2);
            }
          });
          return;
        }
        if (isNameNotResolved) {
          common_vendor.index.showModal({
            title: "登录失败",
            content: "域名解析失败（ERR_NAME_NOT_RESOLVED）。这通常是当前网络无法解析 onrender 域名导致。\n\n建议：切换网络（手机热点/移动数据）或在“开发配置”里改用可访问的接口域名。",
            confirmText: "去配置",
            cancelText: "知道了",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.navigateTo({ url: "/pages/dev-api/index" });
              }
            }
          });
          reject(err);
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
