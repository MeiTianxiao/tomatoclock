"use strict";
const utils_request = require("../utils/request.js");
async function getLeaderboard(limit = 10) {
  const res = await utils_request.get(`/leaderboard?limit=${limit}`);
  return res.data;
}
async function getFriendLeaderboard(limit = 50) {
  const res = await utils_request.get(`/leaderboard/friends?limit=${limit}`);
  return res.data;
}
exports.getFriendLeaderboard = getFriendLeaderboard;
exports.getLeaderboard = getLeaderboard;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/leaderboard.js.map
