"use strict";
const common_vendor = require("../common/vendor.js");
const api_user = require("../api/user.js");
const useUserStore = common_vendor.defineStore("user", () => {
  const user = common_vendor.ref(null);
  const token = common_vendor.ref("");
  const isLoggedIn = common_vendor.computed(() => !!user.value && !!token.value);
  async function registerUser(nickname) {
    const result = await api_user.register(nickname);
    user.value = result;
    token.value = result.id;
    common_vendor.index.setStorageSync("token", result.id);
    common_vendor.index.setStorageSync("user", JSON.stringify(result));
    return result;
  }
  async function loginUser(nickname) {
    const result = await api_user.login(nickname);
    user.value = result.user;
    token.value = result.token;
    common_vendor.index.setStorageSync("token", result.token);
    common_vendor.index.setStorageSync("user", JSON.stringify(result.user));
    return result.user;
  }
  async function wechatLoginUser(payload) {
    const result = await api_user.wechatLogin(payload);
    user.value = result.user;
    token.value = result.token;
    common_vendor.index.setStorageSync("token", result.token);
    common_vendor.index.setStorageSync("user", JSON.stringify(result.user));
    return result.user;
  }
  async function bindPhone(code) {
    const result = await api_user.bindWeChatPhone(code);
    if (result.user) {
      user.value = result.user;
      common_vendor.index.setStorageSync("user", JSON.stringify(result.user));
    } else if (user.value) {
      user.value = { ...user.value, phone_number: result.phone_number };
      common_vendor.index.setStorageSync("user", JSON.stringify(user.value));
    }
    return result.phone_number;
  }
  async function loadUser() {
    const storedToken = common_vendor.index.getStorageSync("token");
    const storedUser = common_vendor.index.getStorageSync("user");
    if (storedToken && storedUser) {
      token.value = storedToken;
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        user.value = null;
      }
    }
  }
  function logout() {
    user.value = null;
    token.value = "";
    common_vendor.index.removeStorageSync("token");
    common_vendor.index.removeStorageSync("user");
    common_vendor.index.removeStorageSync("timer");
  }
  return {
    user,
    token,
    isLoggedIn,
    registerUser,
    loginUser,
    wechatLoginUser,
    bindPhone,
    loadUser,
    logout
  };
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/user.js.map
