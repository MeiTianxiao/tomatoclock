"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_timer = require("../../stores/timer.js");
const types_index = require("../../types/index.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const timerStore = stores_timer.useTimerStore();
    const showPromotion = common_vendor.ref(false);
    const promotionData = common_vendor.ref(null);
    let timerInterval = null;
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
    const modeText = common_vendor.computed(() => currentMode.value === "strict" ? "专注模式" : "温和模式");
    const formattedTime = common_vendor.computed(() => {
      const minutes = Math.floor(timeLeft.value / 60);
      const seconds = timeLeft.value % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    });
    const statusText = common_vendor.computed(() => {
      if (!isActive.value)
        return "准备开始";
      if (isPaused.value)
        return "已暂停";
      return "专注中...";
    });
    const progressStyle = common_vendor.computed(() => {
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
    }
    function resumeFocus() {
      timerStore.resumeFocus();
    }
    function showStopConfirm() {
      common_vendor.index.showModal({
        title: "确认结束",
        content: "确定要结束当前专注吗？",
        success: (res) => {
          if (res.confirm) {
            stopFocus();
          }
        }
      });
    }
    function stopFocus() {
      const result = timerStore.stopFocus();
      if (result) {
        promotionData.value = result;
        showPromotion.value = true;
      }
      common_vendor.index.navigateBack();
    }
    function closePromotion() {
      showPromotion.value = false;
      promotionData.value = null;
    }
    function getRankIcon(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.icon) || "👤";
    }
    function getRankName(rank) {
      var _a;
      return ((_a = types_index.RANK_CONFIG[rank]) == null ? void 0 : _a.name) || rank;
    }
    common_vendor.onMounted(() => {
      if (!timerStore.isActive) {
        common_vendor.index.navigateBack();
        return;
      }
      timerInterval = setInterval(() => {
        timerStore.tick();
      }, 1e3);
    });
    common_vendor.onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(categoryName.value),
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
        k: common_vendor.o(pauseFocus, "68")
      }, {
        l: common_vendor.o(showStopConfirm, "e4"),
        m: common_vendor.t(currentTip.value),
        n: showPromotion.value && promotionData.value
      }, showPromotion.value && promotionData.value ? {
        o: common_vendor.t(getRankIcon(promotionData.value.oldRank)),
        p: common_vendor.t(getRankName(promotionData.value.oldRank)),
        q: common_vendor.t(getRankIcon(promotionData.value.newRank)),
        r: common_vendor.t(getRankName(promotionData.value.newRank)),
        s: common_vendor.t(promotionData.value.earnedPoints),
        t: common_vendor.o(closePromotion, "40")
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-706ada7f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/timer/index.js.map
