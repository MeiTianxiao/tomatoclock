<template>
  <view class="home-container">
    <view class="header">
      <view class="greeting">
        <text class="greeting-text">{{ greeting }}，{{ user?.nickname }}</text>
        <text class="date-text">{{ currentDate }}</text>
      </view>
      <view class="rank-badge" :style="{ background: rankInfo.color }">
        <text class="rank-icon">{{ rankInfo.icon }}</text>
        <text class="rank-name">{{ rankInfo.name }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ dailyPoints }}</text>
        <text class="stat-label">今日积分</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ totalMinutes }}<text class="stat-unit">min</text></text>
        <text class="stat-label">专注时长</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ sessions.length }}</text>
        <text class="stat-label">完成任务</text>
      </view>
    </view>

    <view class="progress-card">
      <view class="progress-header">
        <text class="progress-title">等级进度</text>
        <text class="progress-next">下一级：{{ nextRank?.name || '已满级' }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressToNextRank + '%', background: rankInfo.color }"></view>
      </view>
      <view class="progress-info">
        <text class="progress-current">{{ dailyPoints }} 积分</text>
        <text class="progress-required">/{{ nextRank?.points || RANK_CONFIG.master.points }} 积分</text>
      </view>
    </view>

    <view class="start-section">
      <text class="section-title">开始专注</text>
      
      <view class="duration-options">
        <button
          v-for="duration in durationOptions"
          :key="duration.value"
          class="duration-btn"
          :class="{ active: selectedDuration === duration.value }"
          @click="selectedDuration = duration.value"
        >
          <text class="duration-value">{{ duration.value }}</text>
          <text class="duration-unit">分钟</text>
        </button>
      </view>

      <view class="mode-options">
        <button
          class="mode-btn"
          :class="{ active: selectedMode === 'strict' }"
          @click="selectedMode = 'strict'"
        >
          <text class="mode-icon">⚡</text>
          <text class="mode-text">专注模式</text>
        </button>
        <button
          class="mode-btn"
          :class="{ active: selectedMode === 'gentle' }"
          @click="selectedMode = 'gentle'"
        >
          <text class="mode-icon">🌿</text>
          <text class="mode-text">温和模式</text>
        </button>
      </view>

      <view class="category-options">
        <button
          v-for="(config, key) in CATEGORY_CONFIG"
          :key="key"
          class="category-btn"
          :class="{ active: selectedCategory === key }"
          :style="{ '--category-color': config.color }"
          @click="selectedCategory = key as FocusCategory"
        >
          <text class="category-icon">{{ config.icon }}</text>
          <text class="category-name">{{ config.name }}</text>
        </button>
      </view>

      <button class="btn btn-primary btn-block btn-lg start-btn" @click="startFocus">
        <text class="start-icon">🎯</text>
        <text class="start-text">开始专注</text>
      </button>
    </view>

    <view class="history-section">
      <view class="section-header">
        <text class="section-title">今日记录</text>
        <text class="view-all" @click="goToStats">查看全部</text>
      </view>
      
      <view v-if="todaySessions.length > 0" class="history-list">
        <view v-for="session in todaySessions" :key="session.id" class="history-item">
          <view class="history-category" :style="{ background: getCategoryColor(session.category) }">
            {{ getCategoryIcon(session.category) }}
          </view>
          <view class="history-info">
            <text class="history-name">{{ getCategoryName(session.category) }}</text>
            <text class="history-time">{{ session.duration }}分钟 · +{{ session.points }}积分</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-history">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无记录，开始今日专注吧！</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTimerStore } from '@/stores/timer'
import { RANK_CONFIG, CATEGORY_CONFIG, type FocusCategory } from '@/types'

const userStore = useUserStore()
const timerStore = useTimerStore()

const selectedDuration = ref(25)
const selectedMode = ref<'strict' | 'gentle'>('strict')
const selectedCategory = ref<FocusCategory>('study')

const durationOptions = [
  { value: 15, label: '15分钟' },
  { value: 25, label: '25分钟' },
  { value: 45, label: '45分钟' },
  { value: 60, label: '60分钟' }
]

const user = computed(() => userStore.user)
const dailyPoints = computed(() => timerStore.dailyPoints)
const currentRank = computed(() => timerStore.currentRank)
const sessions = computed(() => timerStore.sessions)
const nextRank = computed(() => timerStore.nextRank)
const progressToNextRank = computed(() => timerStore.progressToNextRank)

const rankInfo = computed(() => RANK_CONFIG[currentRank.value])

const totalMinutes = computed(() => {
  return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0)
})

const todaySessions = computed(() => {
  return sessions.value.slice(-3).reverse()
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
})

function getCategoryColor(category: FocusCategory) {
  return CATEGORY_CONFIG[category].color
}

function getCategoryIcon(category: FocusCategory) {
  return CATEGORY_CONFIG[category].icon
}

function getCategoryName(category: FocusCategory) {
  return CATEGORY_CONFIG[category].name
}

function startFocus() {
  timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value)
  uni.navigateTo({ url: '/pages/timer/index' })
}

function goToStats() {
  uni.switchTab({ url: '/pages/stats/index' })
}

onMounted(() => {
  userStore.loadUser()
  timerStore.loadFromStorage()
  
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
  }
})
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.header {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.greeting-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  display: block;
}

.date-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

.rank-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.2);
}

.rank-icon {
  font-size: 36rpx;
}

.rank-name {
  font-size: 22rpx;
  color: #fff;
  margin-top: 4rpx;
}

.stats-card {
  display: flex;
  background: #fff;
  margin: -30rpx 30rpx 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.stat-unit {
  font-size: 24rpx;
  font-weight: 400;
  color: #6b7280;
}

.stat-label {
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 8rpx;
  display: block;
}

.stat-divider {
  width: 2rpx;
  background: #e5e7eb;
  margin: 0 20rpx;
}

.progress-card {
  background: #fff;
  margin: 0 30rpx 24rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.progress-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.progress-next {
  font-size: 24rpx;
  color: #6b7280;
}

.progress-bar {
  height: 16rpx;
  background: #f3f4f6;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.progress-current {
  font-size: 24rpx;
  font-weight: 600;
  color: #3b82f6;
}

.progress-required {
  font-size: 24rpx;
  color: #9ca3af;
}

.start-section {
  background: #fff;
  margin: 0 30rpx 24rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24rpx;
  display: block;
}

.duration-options {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.duration-btn {
  flex: 1;
  padding: 20rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  transition: all 0.3s;
  
  &.active {
    background: #eff6ff;
    border-color: #3b82f6;
  }
}

.duration-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  display: block;
}

.duration-unit {
  font-size: 22rpx;
  color: #9ca3af;
}

.mode-options {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.mode-btn {
  flex: 1;
  padding: 24rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: all 0.3s;
  
  &.active {
    background: #eff6ff;
    border-color: #3b82f6;
  }
}

.mode-icon {
  font-size: 32rpx;
}

.mode-text {
  font-size: 28rpx;
  color: #1f2937;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.category-btn {
  width: calc(33.33% - 12rpx);
  padding: 20rpx 16rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transition: all 0.3s;
  
  &.active {
    border-color: var(--category-color);
    background: #ffffff;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }
}

.category-icon {
  font-size: 36rpx;
}

.category-name {
  font-size: 24rpx;
  color: #4b5563;
}

.start-btn {
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.start-icon {
  font-size: 36rpx;
}

.start-text {
  font-size: 32rpx;
  font-weight: 600;
}

.history-section {
  background: #fff;
  margin: 0 30rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.view-all {
  font-size: 26rpx;
  color: #3b82f6;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.history-category {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2937;
  display: block;
}

.history-time {
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  display: block;
}

.empty-history {
  text-align: center;
  padding: 40rpx;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #9ca3af;
}
</style>
