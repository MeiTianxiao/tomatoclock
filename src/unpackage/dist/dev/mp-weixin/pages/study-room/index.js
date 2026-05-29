"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const stores_user = require("../../stores/user.js");
const api_friends = require("../../api/friends.js");
const api_studyRoom = require("../../api/study-room.js");
const defaultAvatar = "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
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
    const pendingInvites = common_vendor.ref([]);
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
    async function loadPendingInvites() {
      if (!userStore.isLoggedIn || inRoom.value) {
        pendingInvites.value = [];
        return;
      }
      try {
        pendingInvites.value = await api_studyRoom.getPendingStudyRoomInvites();
      } catch {
        pendingInvites.value = [];
      }
    }
    async function acceptInvite(item) {
      try {
        const { room_code } = await api_studyRoom.acceptStudyRoomInvite(item.id);
        await loadPendingInvites();
        await joinRoomByCode(room_code);
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "加入失败", icon: "none" });
        loadPendingInvites();
      }
    }
    async function rejectInvite(item) {
      try {
        await api_studyRoom.rejectStudyRoomInvite(item.id);
        await loadPendingInvites();
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
      await api_studyRoom.requestStudyRoomSubscribeMessage();
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
        const title = result.notified ? `已通知 ${friend.nickname}` : `已邀请 ${friend.nickname}（打开小程序可见）`;
        common_vendor.index.showToast({ title, icon: "success" });
        closeFriendPicker();
      } catch (e) {
        const msg = String((e == null ? void 0 : e.message) || "邀请失败");
        if (msg.includes("接口不存在")) {
          common_vendor.index.showModal({
            title: "后端未更新",
            content: "邀请接口尚未部署到线上服务器。请重新部署 Render 后端，或在开发配置里改用本地接口地址。",
            showCancel: false
          });
          return;
        }
        common_vendor.index.showToast({ title: msg, icon: "none" });
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
        const msg = String((e == null ? void 0 : e.message) || "加入失败");
        const isClosed = msg.includes("已关闭") || msg.includes("不存在");
        if (isClosed && pendingAutoJoinCode.value === "" && code !== roomCode.value) {
          common_vendor.index.showModal({
            title: "自习室邀请",
            content: `好友邀请你加入自习室 ${normalized}，但该自习室已结束。`,
            showCancel: false,
            confirmText: "知道了"
          });
        } else if (isClosed) {
          common_vendor.index.showModal({
            title: "自习室已关闭",
            content: "该自习室已结束，无法加入。",
            showCancel: false,
            confirmText: "知道了"
          });
        } else {
          common_vendor.index.showToast({ title: msg, icon: "none" });
        }
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
      loadPendingInvites();
    });
    common_vendor.onShow(() => {
      userStore.loadUser();
      tryAutoJoin();
      loadPendingInvites();
      api_studyRoom.requestStudyRoomSubscribeMessage();
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
        a: !inRoom.value && pendingInvites.value.length
      }, !inRoom.value && pendingInvites.value.length ? {
        b: common_vendor.f(pendingInvites.value, (item, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: common_vendor.t(((_a = item.inviter) == null ? void 0 : _a.nickname) || "好友"),
            b: common_vendor.t(item.room_code),
            c: item.room_closed
          }, item.room_closed ? {} : {}, {
            d: item.room_closed
          }, item.room_closed ? {} : {}, {
            e: !item.room_closed
          }, !item.room_closed ? {
            f: common_vendor.o(($event) => acceptInvite(item), item.id)
          } : {}, {
            g: common_vendor.o(($event) => rejectInvite(item), item.id),
            h: item.id
          });
        })
      } : {}, {
        c: !inRoom.value
      }, !inRoom.value ? {
        d: roomCode.value,
        e: common_vendor.o(($event) => roomCode.value = $event.detail.value, "32"),
        f: loading.value,
        g: common_vendor.o(joinRoom, "4c"),
        h: loading.value,
        i: common_vendor.o(createRoom, "9f")
      } : {
        j: common_vendor.t(currentRoom.value),
        k: common_vendor.o(copyCode, "ff"),
        l: common_vendor.t(members.value.length),
        m: common_vendor.o(openFriendPicker, "ff"),
        n: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: m.avatar_url || defaultAvatar,
            b: common_vendor.t(m.nickname),
            c: m.id
          };
        }),
        o: common_vendor.o(leaveRoom, "5d")
      }, {
        p: showFriendPicker.value
      }, showFriendPicker.value ? common_vendor.e({
        q: common_vendor.o(closeFriendPicker, "9f"),
        r: friendsLoading.value
      }, friendsLoading.value ? {} : !availableFriends.value.length ? {} : {
        t: common_vendor.f(availableFriends.value, (friend, k0, i0) => {
          return {
            a: friend.avatar_url || defaultAvatar,
            b: common_vendor.t(friend.nickname),
            c: common_vendor.t(invitingId.value === friend.id ? "发送中..." : "邀请"),
            d: friend.id,
            e: common_vendor.o(($event) => inviteFriend(friend), friend.id)
          };
        })
      }, {
        s: !availableFriends.value.length,
        v: common_vendor.o(() => {
        }, "7d"),
        w: common_vendor.o(closeFriendPicker, "5e")
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-79847825"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study-room/index.js.map
