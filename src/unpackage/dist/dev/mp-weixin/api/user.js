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
exports.login = login;
exports.register = register;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/user.js.map
