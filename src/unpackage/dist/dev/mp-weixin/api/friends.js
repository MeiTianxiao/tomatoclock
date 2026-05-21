"use strict";
const utils_request = require("../utils/request.js");
async function inviteFriend(invite_code) {
  const res = await utils_request.post("/friends/invite", { invite_code });
  return res.data;
}
async function getFriendInvites() {
  const res = await utils_request.get("/friends/invites");
  return res.data;
}
async function acceptFriendInvite(id) {
  const res = await utils_request.post(`/friends/invites/${id}/accept`);
  return res.data;
}
async function rejectFriendInvite(id) {
  const res = await utils_request.post(`/friends/invites/${id}/reject`);
  return res.data;
}
async function getFriends() {
  const res = await utils_request.get("/friends");
  return res.data;
}
exports.acceptFriendInvite = acceptFriendInvite;
exports.getFriendInvites = getFriendInvites;
exports.getFriends = getFriends;
exports.inviteFriend = inviteFriend;
exports.rejectFriendInvite = rejectFriendInvite;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/friends.js.map
