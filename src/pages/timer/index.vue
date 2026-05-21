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
        <template v-if="promotionData.wasPromoted">
          <view class="badge-wrapper">
            <view class="badge">
              <text class="badge-icon">☆</text>
              <text class="badge-text">恭喜晋升！</text>
            </view>
          </view>

          <view class="promotion-avatars">
            <view class="avatar-item old">
              <image class="avatar-img grayscale" :src="getRankAvatar(promotionData.oldRank)" mode="aspectFill"></image>
              <text class="avatar-title">{{ getRankName(promotionData.oldRank) }}</text>
            </view>
            
            <view class="arrow-wrapper">
              <text class="arrow">→</text>
            </view>
            
            <view class="avatar-item new">
              <image class="avatar-img highlighted" :src="getRankAvatar(promotionData.newRank)" mode="aspectFill"></image>
              <text class="avatar-title highlighted-text">{{ getRankName(promotionData.newRank) }}</text>
            </view>
          </view>

          <view class="promotion-texts">
            <text class="title-main">恭喜您成为 <text class="highlighted-text">{{ getRankName(promotionData.newRank) }}</text>！</text>
            <text class="title-sub">您的努力得到了回报，继续保持专注！</text>
          </view>
        </template>
        
        <template v-else>
          <view class="promotion-texts" style="margin-top: 40rpx; margin-bottom: 40rpx;">
            <text class="title-main">专注完成！</text>
            <text class="title-sub">您已成功完成本次专注，继续保持！</text>
          </view>
        </template>

        <view class="points-card">
          <text class="points-label">本次获得</text>
          <text class="points-value">+{{ promotionData.earnedPoints }}</text>
          <text class="points-unit">积分</text>
        </view>

        <view v-if="todoFinish" class="todo-finish-card">
          <text class="todo-finish-title">{{ todoFinish.title }}</text>
          <text class="todo-finish-meta">本次完成用时 {{ formatSeconds(todoFinish.seconds) }}</text>
        </view>

        <button class="btn btn-primary btn-block" @click="closePromotion">
          继续加油！
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useUserStore } from '@/stores/user'
import { useTodoStore } from '@/stores/todo'
import { RANK_CONFIG, CATEGORY_CONFIG, type FocusCategory } from '@/types'

const timerStore = useTimerStore()
const userStore = useUserStore()
const todoStore = useTodoStore()

const userAvatar = computed(() => {
  return userStore.user?.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
})

const showPromotion = ref(false)
const promotionData = ref<{ oldRank: string; newRank: string; earnedPoints: number; wasPromoted: boolean } | null>(null)
const todoFinish = ref<{ title: string; seconds: number } | null>(null)
let timerInterval: number | null = null
let audioCtx: any = null

const SOUND_URLS: Record<string, string> = {
  rain: '/static/audio/rain.mp3',
  wave: '/static/audio/wave.mp3',
  bird: '/static/audio/bird.mp3'
}

function initAudio() {
  stopAudio()
  const settingsStr = uni.getStorageSync('app-settings')
  if (settingsStr) {
    try {
      const settings = JSON.parse(settingsStr)
      if (settings.soundEnabled && settings.soundType && settings.soundType !== 'none') {
        const url = SOUND_URLS[settings.soundType]
        if (url) {
          audioCtx = uni.createInnerAudioContext()
          audioCtx.loop = true
          if (typeof audioCtx.onError === 'function') {
            audioCtx.onError(() => {
              stopAudio()
              uni.showToast({ title: '白噪音播放失败，请检查音频文件', icon: 'none' })
            })
          }

          const playSrc = (src: string) => {
            if (!audioCtx) return
            audioCtx.src = src
            audioCtx.play()
          }

          if (/^https?:\/\//.test(url)) {
            uni.downloadFile({
              url,
              success: (res) => {
                if (res.statusCode === 200 && (res as any).tempFilePath) {
                  playSrc((res as any).tempFilePath)
                } else {
                  stopAudio()
                  uni.showToast({ title: '白噪音下载失败', icon: 'none' })
                }
              },
              fail: () => {
                stopAudio()
                uni.showToast({ title: '白噪音下载失败', icon: 'none' })
              }
            })
          } else {
            playSrc(url)
          }
        }
      }
    } catch (e) {}
  }
}

function stopAudio() {
  if (audioCtx) {
    audioCtx.stop()
    audioCtx.destroy()
    audioCtx = null
  }
}

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
  if (audioCtx) {
    audioCtx.pause()
  }
}

function resumeFocus() {
  timerStore.resumeFocus()
  if (audioCtx) {
    audioCtx.play()
  }
}

function showStopConfirm() {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前专注吗？',
    success: (res) => {
      if (res.confirm) {
        endFocus()
      }
    }
  })
}

function endFocus() {
  stopAudio()
  const elapsedSeconds = Math.max(0, totalDuration.value - timeLeft.value)
  const finished = todoStore.finishActiveFocus(elapsedSeconds)
  todoFinish.value = finished ? { title: finished.title, seconds: finished.seconds } : null
  const result = timerStore.stopFocus()
  if (result) {
    promotionData.value = result
    showPromotion.value = true
  } else {
    if (todoFinish.value) {
      promotionData.value = {
        oldRank: currentRank.value,
        newRank: currentRank.value,
        earnedPoints: 0,
        wasPromoted: false
      }
      showPromotion.value = true
    } else {
      uni.switchTab({ url: '/pages/home/index' })
    }
  }
}

function closePromotion() {
  showPromotion.value = false
  promotionData.value = null
  todoFinish.value = null
  uni.switchTab({ url: '/pages/home/index' })
}

function formatSeconds(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function getRankIcon(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.icon || '👤'
}

function getRankName(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.name || rank
}

function getRankAvatar(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.avatar || userAvatar.value
}

onMounted(() => {
  if (!timerStore.isActive) {
    uni.navigateBack()
    return
  }

  initAudio()

  timerInterval = setInterval(() => {
    timerStore.tick()
    if (timeLeft.value === 0 && isActive.value) {
      endFocus()
    }
  }, 1000) as unknown as number
})

onUnmounted(() => {
  stopAudio()
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
  padding: 60rpx 48rpx;
  margin: 40rpx;
  width: 600rpx;
  text-align: center;
  animation: bounce 0.5s ease;
  box-sizing: border-box;
}

@keyframes bounce {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 50rpx;
}

.badge {
  background: rgba(34, 197, 94, 0.1);
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.badge-icon, .badge-text {
  color: #16a34a;
  font-size: 28rpx;
  font-weight: 700;
}

.promotion-avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 50rpx;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-img {
  border-radius: 50%;
  display: block;
}

.avatar-item.old .avatar-img {
  width: 120rpx;
  height: 120rpx;
  border: 4rpx solid #e5e7eb;
  filter: grayscale(100%);
  margin-bottom: 16rpx;
}

.avatar-item.new .avatar-img {
  width: 160rpx;
  height: 160rpx;
  border: 6rpx solid #3b82f6;
  box-shadow: 0 0 30rpx rgba(59, 130, 246, 0.3);
  margin-bottom: 16rpx;
}

.avatar-title {
  font-size: 26rpx;
  color: #6b7280;
}

.highlighted-text {
  color: #3b82f6 !important;
  font-weight: 700;
}

.arrow-wrapper {
  margin: 0 40rpx;
  margin-bottom: 40rpx;
}

.arrow {
  font-size: 40rpx;
  color: #9ca3af;
}

.promotion-texts {
  margin-bottom: 40rpx;
}

.title-main {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 16rpx;
}

.title-sub {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
}

.points-card {
  background: #f8fafc;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
}

.todo-finish-card {
  background: rgba(59, 130, 246, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 40rpx;
}

.todo-finish-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
  display: block;
}

.todo-finish-meta {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #475569;
  display: block;
}

.points-label {
  font-size: 24rpx;
  color: #6b7280;
  display: block;
  margin-bottom: 8rpx;
}

.points-value {
  font-size: 64rpx;
  font-weight: 800;
  color: #8b5cf6;
  display: block;
  margin-bottom: 4rpx;
}

.points-unit {
  font-size: 24rpx;
  color: #6b7280;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  border: none;
  &::after { display: none; }
  &:active { transform: scale(0.98); }
}
</style>
