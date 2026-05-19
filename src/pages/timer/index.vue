<template>
  <view class="timer-container">
    <view class="timer-header">
      <text class="timer-category">{{ categoryName }}</text>
      <text class="timer-mode">{{ modeText }}</text>
    </view>

    <view class="timer-display">
      <view class="timer-circle">
        <view class="timer-progress" :style="progressStyle"></view>
        <view class="timer-inner">
          <text class="timer-time">{{ formattedTime }}</text>
          <text class="timer-status">{{ statusText }}</text>
        </view>
      </view>
    </view>

    <view class="timer-info">
      <view class="info-item">
        <text class="info-value">{{ dailyPoints }}</text>
        <text class="info-label">今日积分</text>
      </view>
      <view class="info-item">
        <text class="info-value">{{ rankInfo.icon }}</text>
        <text class="info-label">{{ rankInfo.name }}</text>
      </view>
    </view>

    <view class="timer-controls">
      <button v-if="isPaused" class="control-btn btn-resume" @click="resumeFocus">
        <text class="control-icon">▶</text>
        <text class="control-text">继续</text>
      </button>
      <button v-else class="control-btn btn-pause" @click="pauseFocus">
        <text class="control-icon">⏸</text>
        <text class="control-text">暂停</text>
      </button>
      
      <button class="control-btn btn-stop" @click="showStopConfirm">
        <text class="control-icon">⏹</text>
        <text class="control-text">结束</text>
      </button>
    </view>

    <view class="tips-section">
      <text class="tips-title">💡 小贴士</text>
      <text class="tips-content">{{ currentTip }}</text>
    </view>

    <view v-if="showPromotion && promotionData" class="promotion-overlay">
      <view class="promotion-card">
        <view class="promotion-icon">🎉</view>
        <text class="promotion-title">恭喜升级！</text>
        <view class="promotion-ranks">
          <view class="rank-item">
            <text class="rank-icon">{{ getRankIcon(promotionData.oldRank) }}</text>
            <text class="rank-name">{{ getRankName(promotionData.oldRank) }}</text>
          </view>
          <text class="arrow">→</text>
          <view class="rank-item new">
            <text class="rank-icon">{{ getRankIcon(promotionData.newRank) }}</text>
            <text class="rank-name">{{ getRankName(promotionData.newRank) }}</text>
          </view>
        </view>
        <text class="promotion-points">获得 {{ promotionData.earnedPoints }} 积分</text>
        <button class="btn btn-primary btn-block" @click="closePromotion">
          太棒了！
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { RANK_CONFIG, CATEGORY_CONFIG, type FocusCategory } from '@/types'

const timerStore = useTimerStore()

const showPromotion = ref(false)
const promotionData = ref<{ oldRank: string; newRank: string; earnedPoints: number } | null>(null)

let timerInterval: number | null = null

const isActive = computed(() => timerStore.isActive)
const isPaused = computed(() => timerStore.isPaused)
const timeLeft = computed(() => timerStore.timeLeft)
const totalDuration = computed(() => timerStore.totalDuration)
const dailyPoints = computed(() => timerStore.dailyPoints)
const currentRank = computed(() => timerStore.currentRank)
const currentCategory = computed(() => timerStore.currentCategory)
const currentMode = computed(() => timerStore.currentMode)

const rankInfo = computed(() => RANK_CONFIG[currentRank.value])

const categoryName = computed(() => CATEGORY_CONFIG[currentCategory.value].name)
const modeText = computed(() => currentMode.value === 'strict' ? '专注模式' : '温和模式')

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const statusText = computed(() => {
  if (!isActive.value) return '准备开始'
  if (isPaused.value) return '已暂停'
  return '专注中...'
})

const progressStyle = computed(() => {
  const progress = ((totalDuration.value - timeLeft.value) / totalDuration.value) * 100
  const circumference = 2 * Math.PI * 140
  const offset = circumference - (progress / 100) * circumference
  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: `${offset}`
  }
})

const tips = [
  '保持专注，远离手机干扰',
  '合理休息，保持高效工作',
  '设定清晰目标，提升效率',
  '保持良好的工作环境',
  '多喝水，保持身体健康'
]

const currentTip = computed(() => {
  const index = Math.floor(Date.now() / 30000) % tips.length
  return tips[index]
})

function pauseFocus() {
  timerStore.pauseFocus()
}

function resumeFocus() {
  timerStore.resumeFocus()
}

function showStopConfirm() {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前专注吗？',
    success: (res) => {
      if (res.confirm) {
        stopFocus()
      }
    }
  })
}

function stopFocus() {
  const result = timerStore.stopFocus()
  if (result) {
    promotionData.value = result
    showPromotion.value = true
  }
  uni.navigateBack()
}

function closePromotion() {
  showPromotion.value = false
  promotionData.value = null
}

function getRankIcon(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.icon || '👤'
}

function getRankName(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.name || rank
}

onMounted(() => {
  if (!timerStore.isActive) {
    uni.navigateBack()
    return
  }

  timerInterval = setInterval(() => {
    timerStore.tick()
  }, 1000) as unknown as number
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style lang="scss" scoped>
.timer-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
  padding: 60rpx 40rpx;
  box-sizing: border-box;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
}

.timer-category {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24rpx;
}

.timer-mode {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 60rpx;
}

.timer-circle {
  position: relative;
  width: 320rpx;
  height: 320rpx;
}

.timer-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-progress circle {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 12;
}

.timer-progress circle:last-child {
  stroke: #3b82f6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.timer-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-time {
  font-size: 72rpx;
  font-weight: 700;
  color: #fff;
  font-family: 'SF Mono', Monaco, monospace;
  display: block;
}

.timer-status {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 12rpx;
  display: block;
}

.timer-info {
  display: flex;
  justify-content: center;
  gap: 80rpx;
  margin-bottom: 80rpx;
}

.info-item {
  text-align: center;
}

.info-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
  display: block;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 32rpx;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 32rpx 48rpx;
  border-radius: 24rpx;
  border: none;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.95);
  }
}

.btn-resume, .btn-pause {
  background: rgba(255, 255, 255, 0.2);
  
  .control-icon, .control-text {
    color: #fff;
  }
}

.btn-stop {
  background: rgba(239, 68, 68, 0.3);
  
  .control-icon, .control-text {
    color: #ef4444;
  }
}

.control-icon {
  font-size: 40rpx;
}

.control-text {
  font-size: 26rpx;
  font-weight: 500;
}

.tips-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-top: 60rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12rpx;
  display: block;
}

.tips-content {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.promotion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.promotion-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx;
  margin: 40rpx;
  text-align: center;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.promotion-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.promotion-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 32rpx;
}

.promotion-ranks {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.rank-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 32rpx;
  background: #f3f4f6;
  border-radius: 16rpx;
  
  &.new {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }
}

.rank-icon {
  font-size: 48rpx;
}

.rank-name {
  font-size: 26rpx;
  color: #4b5563;
  margin-top: 8rpx;
}

.arrow {
  font-size: 36rpx;
  color: #9ca3af;
}

.promotion-points {
  font-size: 28rpx;
  color: #f59e0b;
  font-weight: 600;
  display: block;
  margin-bottom: 32rpx;
}
</style>
