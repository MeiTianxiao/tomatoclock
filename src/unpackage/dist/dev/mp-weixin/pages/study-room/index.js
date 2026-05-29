"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const stores_user = require("../../stores/user.js");
const api_friends = require("../../api/friends.js");
const api_studyRoom = require("../../api/study-room.js");
const STUDY_ROOM_INVITE_TMPL_ID = "RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc";
const defaultAvatar = "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const isWeixinMp = !!globalThis.wx && typeof globalThis.wx.getAccountInfoSync === "function";
    const loading = common_vendor.ref(false);
    const roomCode = common_vendor.ref("");
    const currentRoom = common_vendor.ref("");
    const inRoom = common_vendor.ref(false);
    const members = common_vendor.ref([]);
    const pendingAutoJoinCode = common_vendor.ref("");
    const showFriendPicker = common_vendor.ref(false);
    const friends = common_vendor.ref([]);
    const friendsLoading = common_vendor.ref(false);
    const invitingId = common_vendor.ref("");
    let pingTimer = null;
    let joinTime = 0;
    const availableFriends = common_vendor.computed(() => {
      const memberIds = new Set(members.value.map((m) => m.id));
      return friends.value.filter((f) => !memberIds.has(f.id));
    });
    common_vendor.onLoad((options) => {
      const code = (options == null ? void 0 : options.code) || (options == null ? void 0 : options.room_code);
      if (code) {
        pendingAutoJoinCode.value = String(code).toUpperCase();
        roomCode.value = pendingAutoJoinCode.value;
        common_vendor.index.setStorageSync("pending-study-room-code", pendingAutoJoinCode.value);
      }
    });
    async function ensureStudyRoomNotifications() {
      if (!isWeixinMp)
        return;
      try {
        await common_vendor.index.requestSubscribeMessage({ tmplIds: [STUDY_ROOM_INVITE_TMPL_ID] });
      } catch {
      }
    }
    async function loadFriends() {
      friendsLoading.value = true;
      try {
        friends.value = await api_friends.getFriends();
      } catch {
        friends.value = [];
      } finally {
        friendsLoading.value = false;
      }
    }
    async function openFriendPicker() {
      await ensureStudyRoomNotifications();
      showFriendPicker.value = true;
      await loadFriends();
    }
    function closeFriendPicker() {
      showFriendPicker.value = false;
      invitingId.value = "";
    }
    async function inviteFriend(friend) {
      if (!currentRoom.value || invitingId.value)
        return;
      invitingId.value = friend.id;
      try {
        const result = await api_studyRoom.inviteFriendToStudyRoom(currentRoom.value, friend.id);
        if (result.notified) {
          common_vendor.index.showToast({ title: `已通知 ${friend.nickname}`, icon: "success" });
          closeFriendPicker();
        } else {
          common_vendor.index.showModal({
            title: "邀请已记录",
            content: result.notifyMessage || "对方可能未开启自习室通知。请让对方在小程序里授权订阅消息，或复制验证码手动发送。",
            showCancel: false
          });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "邀请失败", icon: "none" });
      } finally {
        invitingId.value = "";
      }
    }
    async function joinRoomByCode(code) {
      const normalized = String(code || "").trim().toUpperCase();
      if (!normalized)
        return false;
      loading.value = true;
      try {
        const res = await utils_request.post("/study-room/join", { code: normalized });
        if (res.code === 200) {
          currentRoom.value = res.data.code;
          members.value = res.data.members || [];
          inRoom.value = true;
          joinTime = Date.now();
          startPing();
          common_vendor.index.showToast({ title: "已进入自习室", icon: "success" });
          return true;
        }
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "加入失败", icon: "none" });
      } finally {
        loading.value = false;
      }
      return false;
    }
    async function createRoom() {
      loading.value = true;
      try {
        const res = await utils_request.post("/study-room/join", {});
        if (res.code === 200) {
          currentRoom.value = res.data.code;
          members.value = res.data.members || [];
          inRoom.value = true;
          joinTime = Date.now();
          startPing();
          common_vendor.index.showToast({ title: "已创建自习室", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "创建失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    }
    async function joinRoom() {
      if (!roomCode.value)
        return common_vendor.index.showToast({ title: "请输入验证码", icon: "none" });
      await joinRoomByCode(roomCode.value);
    }
    async function tryAutoJoin() {
      if (inRoom.value)
        return;
      const code = pendingAutoJoinCode.value || common_vendor.index.getStorageSync("pending-study-room-code");
      if (!code)
        return;
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
        return;
      }
      common_vendor.index.removeStorageSync("pending-study-room-code");
      pendingAutoJoinCode.value = "";
      roomCode.value = String(code).toUpperCase();
      await joinRoomByCode(roomCode.value);
    }
    async function fetchMembers() {
      if (!inRoom.value || !currentRoom.value)
        return;
      try {
        const res = await utils_request.get(`/study-room/${currentRoom.value}`);
        if (res.data) {
          members.value = res.data.members || [];
        }
      } catch (e) {
      }
    }
    async function ping() {
      var _a;
      if (!inRoom.value)
        return;
      try {
        const res = await utils_request.post("/study-room/ping", { code: currentRoom.value });
        if ((_a = res.data) == null ? void 0 : _a.members) {
          members.value = res.data.members;
          return;
        }
        fetchMembers();
      } catch (e) {
      }
    }
    function startPing() {
      fetchMembers();
      pingTimer = setInterval(ping, 5e3);
    }
    function stopPing() {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
    }
    function copyCode() {
      common_vendor.index.setClipboardData({
        data: currentRoom.value,
        success: () => common_vendor.index.showToast({ title: "已复制验证码", icon: "success" })
      });
    }
    async function leaveRoom() {
      common_vendor.index.showModal({
        title: "确认离开",
        content: "离开后将结算本次自习的积分，确定离开吗？",
        success: async (res) => {
          if (res.confirm) {
            stopPing();
            const durationMinutes = Math.floor((Date.now() - joinTime) / 6e4);
            const points = Math.floor(durationMinutes * 1.5);
            try {
              await utils_request.post("/study-room/leave", { code: currentRoom.value });
            } catch (e) {
            }
            inRoom.value = false;
            currentRoom.value = "";
            members.value = [];
            common_vendor.index.showModal({
              title: "自习结束",
              content: `本次自习 ${durationMinutes} 分钟
获得 ${points} 积分`,
              showCancel: false,
              success: () => {
                common_vendor.index.navigateBack();
              }
            });
          }
        }
      });
    }
    common_vendor.onMounted(() => {
      userStore.loadUser();
      tryAutoJoin();
    });
    common_vendor.onShow(() => {
      userStore.loadUser();
      tryAutoJoin();
    });
    common_vendor.onUnmounted(() => {
      stopPing();
      if (inRoom.value) {
        utils_request.post("/study-room/leave", { code: currentRoom.value }).catch(() => {
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !inRoom.value
      }, !inRoom.value ? {
        b: roomCode.value,
        c: common_vendor.o(($event) => roomCode.value = $event.detail.value, "42"),
        d: loading.value,
        e: common_vendor.o(joinRoom, "3c"),
        f: loading.value,
        g: common_vendor.o(createRoom, "77")
      } : {
        h: common_vendor.t(currentRoom.value),
        i: common_vendor.o(copyCode, "72"),
        j: common_vendor.t(members.value.length),
        k: common_vendor.o(openFriendPicker, "9f"),
        l: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: m.avatar_url || defaultAvatar,
            b: common_vendor.t(m.nickname),
            c: m.id
          };
        }),
        m: common_vendor.o(leaveRoom, "87")
      }, {
        n: showFriendPicker.value
      }, showFriendPicker.value ? common_vendor.e({
        o: common_vendor.o(closeFriendPicker, "94"),
        p: friendsLoading.value
      }, friendsLoading.value ? {} : !availableFriends.value.length ? {} : {
        r: common_vendor.f(availableFriends.value, (friend, k0, i0) => {
          return {
            a: friend.avatar_url || defaultAvatar,
            b: common_vendor.t(friend.nickname),
            c: common_vendor.t(invitingId.value === friend.id ? "发送中..." : "邀请"),
            d: friend.id,
            e: common_vendor.o(($event) => inviteFriend(friend), friend.id)
          };
        })
      }, {
        q: !availableFriends.value.length,
        s: common_vendor.o(() => {
        }, "d4"),
        t: common_vendor.o(closeFriendPicker, "c5")
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-79847825"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study-room/index.js.map
