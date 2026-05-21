"use strict";
const utils_request = require("../utils/request.js");
async function register(nickname) {
  const res = await utils_request.post("/users/register", { nickname });
  return res.data;
}
async function login(nickname) {
  const res = await utils_request.post("/users/login", { nickname });
  return res.data;
}
async function wechatLogin(payload) {
  const res = await utils_request.post("/wechat/login", payload);
  return res.data;
}
async function bindWeChatPhone(code) {
  const res = await utils_request.post("/wechat/phone", { code });
  return res.data;
}
async function getUserInfo() {
  const res = await utils_request.get("/users/me");
  return res.data;
}
exports.bindWeChatPhone = bindWeChatPhone;
exports.getUserInfo = getUserInfo;
exports.login = login;
exports.register = register;
exports.wechatLogin = wechatLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/user.js.map
