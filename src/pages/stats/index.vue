<template>
  <view class="stats-container">
    <view class="header">
      <text class="title">📊 统计数据</text>
      <text class="subtitle">查看你的专注记录</text>
    </view>

    <view class="summary-cards">
      <view class="summary-card">
        <view class="card-icon">⏱️</view>
        <view class="card-content">
          <text class="card-value">{{ totalMinutes }}</text>
          <text class="card-label">总专注时长（分钟）</text>
        </view>
      </view>
      <view class="summary-card">
        <view class="card-icon">🎯</view>
        <view class="card-content">
          <text class="card-value">{{ totalSessions }}</text>
          <text class="card-label">完成任务数</text>
        </view>
      </view>
      <view class="summary-card">
        <view class="card-icon">⭐</view>
        <view class="card-content">
          <text class="card-value">{{ totalPoints }}</text>
          <text class="card-label">累计积分</text>
        </view>
      </view>
      <view class="summary-card">
        <view class="card-icon">👑</view>
        <view class="card-content">
          <text class="card-value">{{ currentRankInfo.icon }} {{ currentRankInfo.name }}</text>
          <text class="card-label">当前等级</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">本周趋势</text>
      </view>
      <view class="trend-chart">
        <view class="chart-bars">
          <view
            v-for="(day, index) in weekData"
            :key="index"
            class="bar-item"
          >
            <view class="bar-container">
              <view
                class="bar-fill"
                :style="{ height: day.percentage + '%', background: day.color }"
              ></view>
            </view>
            <text class="bar-label">{{ day.label }}</text>
            <text class="bar-value">{{ day.points }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">分类统计</text>
      </view>
      <view class="category-stats">
        <view
          v-for="(stat, category) in categoryStats"
          :key="category"
          class="category-item"
        >
          <view class="category-header">
            <view class="category-icon" :style="{ background: stat.color }">
              {{ stat.icon }}
            </view>
            <text class="category-name">{{ stat.name }}</text>
          </view>
          <view class="category-bar">
            <view
              class="category-fill"
              :style="{ width: stat.percentage + '%', background: stat.color }"
            ></view>
          </view>
          <view class="category-info">
            <text class="category-time">{{ stat.minutes }}分钟</text>
            <text class="category-percent">{{ stat.percentage }}%</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">最近记录</text>
        <text class="view-all" @click="viewAllHistory">查看全部</text>
      </view>
      <view class="history-list">
        <view
          v-for="session in recentSessions"
          :key="session.id"
          class="history-item"
        >
          <view class="history-left">
            <view class="history-icon" :style="{ background: getCategoryColor(session.category) }">
              {{ getCategoryIcon(session.category) }}
            </view>
            <view class="history-info">
              <text class="history-name">{{ getCategoryName(session.category) }}</text>
              <text class="history-time">{{ formatTime(session.startTime) }}</text>
            </view>
          </view>
          <view class="history-right">
            <text class="history-points">+{{ session.points }}</text>
            <text class="history-duration">{{ session.duration }}分钟</text>
          </view>
        </view>

        <view v-if="recentSessions.length === 0" class="empty-history">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无记录</text>
        </view>
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

const sessions = computed(() => timerStore.sessions)
const dailyPoints = computed(() => timerStore.dailyPoints)
const currentRank = computed(() => timerStore.currentRank)

const currentRankInfo = computed(() => RANK_CONFIG[currentRank.value])

const totalMinutes = computed(() => {
  return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0)
})

const totalSessions = computed(() => {
  return sessions.value.filter(s => s.completed).length
})

const totalPoints = computed(() => {
  return sessions.value.reduce((sum, s) => sum + (s.completed ? s.points : 0), 0)
})

const weekData = computed(() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const now = new Date()
  const today = now.getDay() || 7
  
  const data = []
  let maxPoints = 1
  
  for (let i = 0; i < 7; i++) {
    const dayOffset = i - (today - 1)
    const date = new Date(now)
    date.setDate(date.getDate() + dayOffset)
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    
    const daySessions = sessions.value.filter(s => {
      return s.startTime >= dayStart && s.startTime < dayEnd && s.completed
    })
    
    const points = daySessions.reduce((sum, s) => sum + s.points, 0)
    maxPoints = Math.max(maxPoints, points)
    
    data.push({
      label: days[i],
      points,
      percentage: 0,
      color: i === today - 1 ? '#3b82f6' : '#9ca3af'
    })
  }
  
  data.forEach(d => {
    d.percentage = (d.points / maxPoints) * 100
  })
  
  return data
})

const categoryStats = computed(() => {
  const stats: Record<string, { minutes: number; points: number; icon: string; name: string; color: string }> = {}
  
  Object.keys(CATEGORY_CONFIG).forEach(key => {
    stats[key] = {
      minutes: 0,
      points: 0,
      icon: CATEGORY_CONFIG[key as FocusCategory].icon,
      name: CATEGORY_CONFIG[key as FocusCategory].name,
      color: CATEGORY_CONFIG[key as FocusCategory].color
    }
  })
  
  sessions.value.forEach(s => {
    if (s.completed) {
      stats[s.category].minutes += s.duration
      stats[s.category].points += s.points
    }
  })
  
  const totalMinutes = Object.values(stats).reduce((sum, s) => sum + s.minutes, 0) || 1
  
  return Object.entries(stats).reduce((acc, [key, value]) => {
    acc[key] = {
      ...value,
      percentage: ((value.minutes / totalMinutes) * 100).toFixed(1)
    }
    return acc
  }, {} as Record<string, { minutes: number; points: number; icon: string; name: string; color: string; percentage: string }>)
})

const recentSessions = computed(() => {
  return sessions.value.filter(s => s.completed).slice(-10).reverse()
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

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

function viewAllHistory() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
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
.stats-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 60rpx 40rpx 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin: -30rpx 30rpx 24rpx;
}

.summary-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-icon {
  font-size: 40rpx;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.card-label {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  display: block;
}

.section {
  background: #fff;
  margin: 0 30rpx 24rpx;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.view-all {
  font-size: 26rpx;
  color: #3b82f6;
}

.trend-chart {
  padding: 16rpx 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200rpx;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-container {
  width: 36rpx;
  height: 140rpx;
  background: #f3f4f6;
  border-radius: 18rpx;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 18rpx;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 12rpx;
}

.bar-value {
  font-size: 22rpx;
  font-weight: 600;
  color: #374151;
  margin-top: 4rpx;
}

.category-stats {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.category-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.category-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
}

.category-bar {
  height: 12rpx;
  background: #f3f4f6;
  border-radius: 6rpx;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.category-info {
  display: flex;
  justify-content: space-between;
}

.category-time {
  font-size: 24rpx;
  color: #6b7280;
}

.category-percent {
  font-size: 24rpx;
  font-weight: 600;
  color: #374151;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f9fafb;
  border-radius: 16rpx;
}

.history-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.history-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
  display: block;
}

.history-time {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  display: block;
}

.history-right {
  text-align: right;
}

.history-points {
  font-size: 26rpx;
  font-weight: 600;
  color: #10b981;
  display: block;
}

.history-duration {
  font-size: 22rpx;
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
