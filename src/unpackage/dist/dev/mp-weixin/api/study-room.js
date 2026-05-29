"use strict";
const utils_request = require("../utils/request.js");
async function inviteFriendToStudyRoom(code, friend_id) {
  const res = await utils_request.post("/study-room/invite", { code, friend_id });
  return res.data;
}
exports.inviteFriendToStudyRoom = inviteFriendToStudyRoom;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/study-room.js.map
