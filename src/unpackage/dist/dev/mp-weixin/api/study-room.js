"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("../utils/request.js");
const STUDY_ROOM_INVITE_TMPL_ID = "RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc";
async function inviteFriendToStudyRoom(code, friend_id) {
  const res = await utils_request.post("/study-room/invite", { code, friend_id });
  return res.data;
}
async function getPendingStudyRoomInvites() {
  const res = await utils_request.get("/study-room/invites");
  return res.data;
}
async function acceptStudyRoomInvite(id) {
  const res = await utils_request.post(`/study-room/invites/${id}/accept`);
  return res.data;
}
async function rejectStudyRoomInvite(id) {
  await utils_request.post(`/study-room/invites/${id}/reject`);
}
async function requestStudyRoomSubscribeMessage() {
  const wxAny = globalThis.wx;
  if (!wxAny || typeof wxAny.requestSubscribeMessage !== "function")
    return;
  const settingsStr = common_vendor.index.getStorageSync("app-settings");
  if (settingsStr) {
    try {
      const settings = JSON.parse(settingsStr);
      if (settings.notifications === false)
        return;
    } catch {
    }
  }
  try {
    await common_vendor.index.requestSubscribeMessage({ tmplIds: [STUDY_ROOM_INVITE_TMPL_ID] });
  } catch {
  }
}
exports.acceptStudyRoomInvite = acceptStudyRoomInvite;
exports.getPendingStudyRoomInvites = getPendingStudyRoomInvites;
exports.inviteFriendToStudyRoom = inviteFriendToStudyRoom;
exports.rejectStudyRoomInvite = rejectStudyRoomInvite;
exports.requestStudyRoomSubscribeMessage = requestStudyRoomSubscribeMessage;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/study-room.js.map
