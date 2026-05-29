"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const api_user = require("../../api/user.js");
const api_friends = require("../../api/friends.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const isWeixinMp = !!globalThis.wx && typeof globalThis.wx.getAccountInfoSync === "function";
    const inviteInput = common_vendor.ref("");
    const inviteLoading = common_vendor.ref(false);
    const actionLoadingId = common_vendor.ref("");
    const invites = common_vendor.ref({ incoming: [], outgoing: [] });
    const friends = common_vendor.ref([]);
    const myInviteCode = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.user) == null ? void 0 : _a.invite_code) || "";
    });
    async function enableFriendNotifications() {
      if (!isWeixinMp)
        return;
      const settingsStr = common_vendor.index.getStorageSync("app-settings");
      const notificationsEnabled = (() => {
        if (!settingsStr)
          return true;
        try {
          const s = JSON.parse(settingsStr);
          return s.notifications !== false;
        } catch {
          return true;
        }
      })();
      if (!notificationsEnabled) {
        common_vendor.index.showToast({ title: "已关闭提醒通知", icon: "none" });
        return;
      }
      try {
        const res = await common_vendor.index.requestSubscribeMessage({
          tmplIds: [
            "t_isd35azCSmKHjy5crOhlLaGntp8Z-h-_9xQqaWsjU",
            "83FIcdSm2TPFAiP4g8xLB1Ez86j3svdAnbsS60NHvAU",
            "RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc"
          ]
        });
        const ok = (res == null ? void 0 : res["t_isd35azCSmKHjy5crOhlLaGntp8Z-h-_9xQqaWsjU"]) === "accept" || (res == null ? void 0 : res["83FIcdSm2TPFAiP4g8xLB1Ez86j3svdAnbsS60NHvAU"]) === "accept" || (res == null ? void 0 : res["RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc"]) === "accept";
        common_vendor.index.showToast({ title: ok ? "已开启通知" : "未开启通知", icon: "none" });
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.errMsg) || "开启失败", icon: "none" });
      }
    }
    function goBack() {
      common_vendor.index.navigateBack();
    }
    async function refreshUser() {
      try {
        const u = await api_user.getUserInfo();
        userStore.user = u;
        common_vendor.index.setStorageSync("user", JSON.stringify(u));
      } catch {
      }
    }
    async function loadAll() {
      try {
        invites.value = await api_friends.getFriendInvites();
      } catch {
        invites.value = { incoming: [], outgoing: [] };
      }
      try {
        friends.value = await api_friends.getFriends();
      } catch {
        friends.value = [];
      }
    }
    function copyInviteCode() {
      if (!myInviteCode.value)
        return;
      common_vendor.index.setClipboardData({
        data: myInviteCode.value,
        success: () => common_vendor.index.showToast({ title: "已复制", icon: "success" }),
        fail: () => common_vendor.index.showToast({ title: "复制失败", icon: "none" })
      });
    }
    async function sendInvite() {
      const code = inviteInput.value.trim().toUpperCase();
      if (!code) {
        common_vendor.index.showToast({ title: "请输入邀请码", icon: "none" });
        return;
      }
      const performSend = async () => {
        inviteLoading.value = true;
        try {
          await api_friends.inviteFriend(code);
          inviteInput.value = "";
          common_vendor.index.showToast({ title: "已发送申请", icon: "success" });
          await loadAll();
        } catch (e) {
          common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "发送失败", icon: "none" });
        } finally {
          inviteLoading.value = false;
        }
      };
      if (isWeixinMp) {
        const settingsStr = common_vendor.index.getStorageSync("app-settings");
        const notificationsEnabled = (() => {
          if (!settingsStr)
            return true;
          try {
            const s = JSON.parse(settingsStr);
            return s.notifications !== false;
          } catch {
            return true;
          }
        })();
        if (!notificationsEnabled) {
          performSend();
          return;
        }
        common_vendor.index.requestSubscribeMessage({
          tmplIds: [
            "t_isd35azCSmKHjy5crOhlLaGntp8Z-h-_9xQqaWsjU",
            "83FIcdSm2TPFAiP4g8xLB1Ez86j3svdAnbsS60NHvAU",
            "RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc"
          ],
          complete: () => {
            performSend();
          }
        });
      } else {
        performSend();
      }
    }
    async function accept(id) {
      actionLoadingId.value = id;
      try {
        await api_friends.acceptFriendInvite(id);
        common_vendor.index.showToast({ title: "已同意", icon: "success" });
        await loadAll();
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "操作失败", icon: "none" });
      } finally {
        actionLoadingId.value = "";
      }
    }
    async function reject(id) {
      actionLoadingId.value = id;
      try {
        await api_friends.rejectFriendInvite(id);
        common_vendor.index.showToast({ title: "已拒绝", icon: "success" });
        await loadAll();
      } catch (e) {
        common_vendor.index.showToast({ title: (e == null ? void 0 : e.message) || "操作失败", icon: "none" });
      } finally {
        actionLoadingId.value = "";
      }
    }
    common_vendor.onMounted(async () => {
      userStore.loadUser();
      if (!userStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/auth/index" });
        return;
      }
      await refreshUser();
      await loadAll();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack, "5b"),
        b: common_vendor.unref(isWeixinMp)
      }, common_vendor.unref(isWeixinMp) ? {
        c: common_vendor.o(enableFriendNotifications, "9b")
      } : {}, {
        d: common_vendor.o(copyInviteCode, "6c"),
        e: !myInviteCode.value,
        f: common_vendor.t(myInviteCode.value || "加载中..."),
        g: inviteInput.value,
        h: common_vendor.o(($event) => inviteInput.value = $event.detail.value, "48"),
        i: common_vendor.t(inviteLoading.value ? "发送中..." : "发送"),
        j: inviteLoading.value,
        k: common_vendor.o(sendInvite, "22"),
        l: common_vendor.t(invites.value.incoming.length),
        m: invites.value.incoming.length
      }, invites.value.incoming.length ? {
        n: common_vendor.f(invites.value.incoming, (item, k0, i0) => {
          var _a, _b, _c, _d;
          return common_vendor.e({
            a: (_a = item.inviter) == null ? void 0 : _a.avatar_url
          }, ((_b = item.inviter) == null ? void 0 : _b.avatar_url) ? {
            b: item.inviter.avatar_url
          } : {}, {
            c: common_vendor.t(((_c = item.inviter) == null ? void 0 : _c.nickname) || "微信用户"),
            d: common_vendor.t((_d = item.created_at) == null ? void 0 : _d.slice(0, 19).replace("T", " ")),
            e: actionLoadingId.value === item.id,
            f: common_vendor.o(($event) => accept(item.id), item.id),
            g: actionLoadingId.value === item.id,
            h: common_vendor.o(($event) => reject(item.id), item.id),
            i: item.id
          });
        })
      } : {}, {
        o: common_vendor.t(invites.value.outgoing.length),
        p: invites.value.outgoing.length
      }, invites.value.outgoing.length ? {
        q: common_vendor.f(invites.value.outgoing, (item, k0, i0) => {
          var _a, _b, _c;
          return common_vendor.e({
            a: (_a = item.invitee) == null ? void 0 : _a.avatar_url
          }, ((_b = item.invitee) == null ? void 0 : _b.avatar_url) ? {
            b: item.invitee.avatar_url
          } : {}, {
            c: common_vendor.t(((_c = item.invitee) == null ? void 0 : _c.nickname) || "微信用户"),
            d: item.id
          });
        })
      } : {}, {
        r: common_vendor.t(friends.value.length),
        s: friends.value.length
      }, friends.value.length ? {
        t: common_vendor.f(friends.value, (u, k0, i0) => {
          return common_vendor.e({
            a: u.avatar_url
          }, u.avatar_url ? {
            b: u.avatar_url
          } : {}, {
            c: common_vendor.t(u.nickname || "微信用户"),
            d: common_vendor.t(u.invite_code || ""),
            e: u.id
          });
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-78842521"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/friends/index.js.map
