"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_timer = require("../../stores/timer.js");
const stores_user = require("../../stores/user.js");
const stores_todo = require("../../stores/todo.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const timerStore = stores_timer.useTimerStore();
    const userStore = stores_user.useUserStore();
    const todoStore = stores_todo.useTodoStore();
    const userAvatar = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.user) == null ? void 0 : _a.avatar_url) || "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
    });
    const showPromotion = common_vendor.ref(false);
    const promotionData = common_vendor.ref(null);
    const todoFinish = common_vendor.ref(null);
    let timerInterval = null;
    let audioCtx = null;
    const SOUND_URLS = {
      rain: "https://tomatoclock.onrender.com/static/audio/rain.mp3",
      wave: "https://tomatoclock.onrender.com/static/audio/wave.mp3",
      bird: "https://tomatoclock.onrender.com/static/audio/bird.mp3"
    };
    function initAudio() {
      stopAudio();
      const settingsStr = common_vendor.index.getStorageSync("app-settings");
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr);
          if (settings.soundEnabled && settings.soundType && settings.soundType !== "none") {
            const url = SOUND_URLS[settings.soundType];
            if (url) {
              audioCtx = common_vendor.index.createInnerAudioContext();
              audioCtx.loop = true;
              if (typeof audioCtx.onError === "function") {
                audioCtx.onError(() => {
                  stopAudio();
                  common_vendor.index.showToast({ title: "白噪音播放失败，请检查音频文件", icon: "none" });
                });
              }
              const playSrc = (src) => {
                if (!audioCtx)
                  return;
                audioCtx.src = src;
                audioCtx.play();
              };
              if (/^https?:\/\//.test(url)) {
                common_vendor.index.downloadFile({
                  url,
                  success: (res) => {
                    if (res.statusCode === 200 && res.tempFilePath) {
                      playSrc(res.tempFilePath);
                    } else {
                      playSrc(url);
                      common_vendor.index.showToast({ title: `白噪音下载失败(${res.statusCode})，已尝试直连播放`, icon: "none" });
                    }
                  },
                  fail: (err) => {
                    playSrc(url);
                    const msg = (err == null ? void 0 : err.errMsg) || "下载失败";
                    common_vendor.index.showToast({ title: `${msg}，已尝试直连播放`, icon: "none" });
                  }
                });
              } else {
                playSrc(url);
              }
            }
          }
        } catch (e) {
        }
      }
    }
    function stopAudio() {
      if (audioCtx) {
        audioCtx.stop();
        audioCtx.destroy();
        audioCtx = null;
      }
    }
    const isActive = common_vendor.computed(() => timerStore.isActive);
    const isPaused = common_vendor.computed(() => timerStore.isPaused);
    const timeLeft = common_vendor.computed(() => timerStore.timeLeft);
    const totalDuration = common_vendor.computed(() => timerStore.totalDuration);
    const dailyPoints = common_vendor.computed(() => timerStore.dailyPoints);
    const currentRank = common_vendor.computed(() => timerStore.currentRank);
    const currentCategory = common_vendor.computed(() => timerStore.currentCategory);
    const currentMode = common_vendor.computed(() => timerStore.currentMode);
    const rankInfo = common_vendor.computed(() => types_index.RANK_CONFIG[currentRank.value]);
    const categoryName = common_vendor.computed(() => types_index.CATEGORY_CONFIG[currentCategory.value].name);
    const modeText = common_vendor.computed(() => {
      if (timerStore.timerType === "countup")
        return "计时模式";
      return currentMode.value === "strict" ? "专注模式" : "温和模式";
    });
    const todoTitle = common_vendor.computed(() => {
      var _a;
      const id = todoStore.activeTodoId;
      if (!id)
        return "";
      return ((_a = todoStore.todos.find((t) => t.id === id)) == null ? void 0 : _a.title) || "";
    });
    const headerTitle = common_vendor.computed(() => todoTitle.value || categoryName.value);
    const formattedTime = common_vendor.computed(() => {
      const secondsValue = timerStore.timerType === "countup" ? timerStore.elapsedSeconds : timeLeft.value;
      const minutes = Math.floor(secondsValue / 60);
      const seconds = secondsValue % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    });
    function handleQuit(reason) {
      if (!timerStore.isActive)
        return;
      const beforePenalty = timerStore.gentlePenalty;
      const res = timerStore.registerQuit();
      if (res.mode === "strict" && res.strictQuitTriggered) {
        todoStore.clearActiveFocus();
        stopAudio();
        if (reason !== "hide") {
          common_vendor.index.showToast({ title: "严格模式退出：积分已清零", icon: "none" });
        }
        return;
      }
      if (res.mode === "gentle" && !beforePenalty && res.gentlePenalty) {
        if (reason !== "hide") {
          common_vendor.index.showToast({ title: "温和模式已退出3次，本次结算积分减半", icon: "none" });
        }
      }
    }
    common_vendor.onHide(() => handleQuit("hide"));
    common_vendor.onShow(() => {
      if (!timerStore.isActive) {
        common_vendor.index.switchTab({ url: "/pages/home/index" });
      }
    });
    common_vendor.onUnload(() => handleQuit("unload"));
    common_vendor.onBackPress(() => {
      handleQuit("back");
      return false;
    });
    const statusText = common_vendor.computed(() => {
      if (!isActive.value)
        return "准备开始";
      if (isPaused.value)
        return "已暂停";
      return "专注中...";
    });
    const progressStyle = common_vendor.computed(() => {
      if (timerStore.timerType === "countup" || totalDuration.value <= 0)
        return {};
      const progress = (totalDuration.value - timeLeft.value) / totalDuration.value * 100;
      const circumference = 2 * Math.PI * 140;
      const offset = circumference - progress / 100 * circumference;
      return {
        strokeDasharray: `${circumference} ${circumference}`,
        strokeDashoffset: `${offset}`
      };
    });
    const tips = [
      "保持专注，远离手机干扰",
      "合理休息，保持高效工作",
      "设定清晰目标，提升效率",
      "保持良好的工作环境",
      "多喝水，保持身体健康"
    ];
    const currentTip = common_vendor.computed(() => {
      const index = Math.floor(Date.now() / 3e4) % tips.length;
      return tips[index];
    });
    function pauseFocus() {
      timerStore.pauseFocus();
      if (audioCtx) {
        audioCtx.pause();
      }
    }
    function resumeFocus() {
      timerStore.resumeFocus();
      if (audioCtx) {
        audioCtx.play();
      }
    }
    function showStopConfirm() {
      common_vendor.index.showModal({
        title: "确认结束",
        content: "确定要结束当前专注吗？",
        success: (res) => {
          if (res.confirm) {
            endFocus();
          }
        }
      });
    }
    function endFocus() {
      stopAudio();
      const elapsedSeconds = timerStore.timerType === "countup" ? timerStore.elapsedSeconds : Math.max(0, totalDuration.value - timeLeft.value);
      const finished = todoStore.finishActiveFocus(elapsedSeconds);
      todoFinish.value = finished ? { title: finished.title, seconds: finished.seconds } : null;
      const result = timerStore.stopFocus();
      if (result) {
        promotionData.value = result;
        showPromotion.value = true;
      } else {
        if (todoFinish.value) {
          promotionData.value = {
            oldRank: currentRank.value,
            newRank: currentRank.value,
            earnedPoints: 0,
            wasPromoted: false
          };
          showPromotion.value = true;
        } else {
          common_vendor.index.switchTab({ url: "/pages/home/index" });
        }
      }
    }
    function closePromotion() {
      showPromotion.value = false;
      promotionData.value = null;
      todoFinish.value = null;
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    }
    function formatSeconds(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const mm = Math.floor(s / 60);
      const ss = s % 60;
      return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    }
    function getRankName(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.name) || rank;
    }
    function getRankAvatar(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.avatar) || userAvatar.value;
    }
    common_vendor.onMounted(() => {
      if (!timerStore.isActive) {
        common_vendor.index.navigateBack();
        return;
      }
      initAudio();
      timerInterval = setInterval(() => {
        timerStore.tick();
        if (timerStore.timerType === "countdown" && timeLeft.value === 0 && isActive.value) {
          endFocus();
        }
      }, 1e3);
    });
    common_vendor.onUnmounted(() => {
      stopAudio();
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(headerTitle.value),
        b: common_vendor.t(modeText.value),
        c: common_vendor.s(progressStyle.value),
        d: common_vendor.t(formattedTime.value),
        e: common_vendor.t(statusText.value),
        f: common_vendor.t(dailyPoints.value),
        g: common_vendor.t(rankInfo.value.icon),
        h: common_vendor.t(rankInfo.value.name),
        i: isPaused.value
      }, isPaused.value ? {
        j: common_vendor.o(resumeFocus, "45")
      } : {
        k: common_vendor.o(pauseFocus, "04")
      }, {
        l: common_vendor.o(showStopConfirm, "49"),
        m: common_vendor.t(currentTip.value),
        n: showPromotion.value && promotionData.value
      }, showPromotion.value && promotionData.value ? common_vendor.e({
        o: promotionData.value.wasPromoted
      }, promotionData.value.wasPromoted ? {
        p: getRankAvatar(promotionData.value.oldRank),
        q: common_vendor.t(getRankName(promotionData.value.oldRank)),
        r: getRankAvatar(promotionData.value.newRank),
        s: common_vendor.t(getRankName(promotionData.value.newRank)),
        t: common_vendor.t(getRankName(promotionData.value.newRank))
      } : {}, {
        v: common_vendor.t(promotionData.value.earnedPoints),
        w: todoFinish.value
      }, todoFinish.value ? {
        x: common_vendor.t(todoFinish.value.title),
        y: common_vendor.t(formatSeconds(todoFinish.value.seconds))
      } : {}, {
        z: common_vendor.o(closePromotion, "0d")
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-706ada7f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/timer/index.js.map
