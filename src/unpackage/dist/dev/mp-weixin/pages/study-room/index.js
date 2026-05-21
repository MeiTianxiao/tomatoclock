"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const stores_user = require("../../stores/user.js");
const defaultAvatar = "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    stores_user.useUserStore();
    const loading = common_vendor.ref(false);
    const roomCode = common_vendor.ref("");
    const currentRoom = common_vendor.ref("");
    const inRoom = common_vendor.ref(false);
    const members = common_vendor.ref([]);
    let pingTimer = null;
    let joinTime = 0;
    function generateRoomCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    async function createRoom() {
      roomCode.value = generateRoomCode();
      await joinRoom();
    }
    async function joinRoom() {
      if (!roomCode.value)
        return common_vendor.index.showToast({ title: "请输入验证码", icon: "none" });
      loading.value = true;
      try {
        const res = await utils_request.post("/study-room/join", { room_code: roomCode.value.toUpperCase() });
        if (res.code === 200) {
          currentRoom.value = roomCode.value.toUpperCase();
          inRoom.value = true;
          joinTime = Date.now();
          startPing();
          common_vendor.index.showToast({ title: "已进入自习室", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "加入失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    }
    async function fetchMembers() {
      if (!inRoom.value || !currentRoom.value)
        return;
      try {
        const res = await utils_request.get(`/study-room/${currentRoom.value}`);
        if (res.data) {
          members.value = res.data;
        }
      } catch (e) {
      }
    }
    async function ping() {
      if (!inRoom.value)
        return;
      try {
        await utils_request.post("/study-room/ping", { room_code: currentRoom.value });
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
              await utils_request.post("/study-room/leave", { room_code: currentRoom.value });
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
    common_vendor.onUnmounted(() => {
      stopPing();
      if (inRoom.value) {
        utils_request.post("/study-room/leave", { room_code: currentRoom.value }).catch(() => {
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !inRoom.value
      }, !inRoom.value ? {
        b: roomCode.value,
        c: common_vendor.o(($event) => roomCode.value = $event.detail.value, "d9"),
        d: loading.value,
        e: common_vendor.o(joinRoom, "39"),
        f: loading.value,
        g: common_vendor.o(createRoom, "e8")
      } : {
        h: common_vendor.t(currentRoom.value),
        i: common_vendor.o(copyCode, "dd"),
        j: common_vendor.t(members.value.length),
        k: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: m.avatar_url || defaultAvatar,
            b: common_vendor.t(m.nickname),
            c: m.id
          };
        }),
        l: common_vendor.o(leaveRoom, "02")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-79847825"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study-room/index.js.map
