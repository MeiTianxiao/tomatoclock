<template>
  <view class="page">
    <text class="page-title">数据统计</text>

    <view class="grid">
      <view class="metric">
        <text class="metric-icon">🕒</text>
        <text class="metric-value">{{ totalMinutes }}</text>
        <text class="metric-label">累计分钟</text>
      </view>
      <view class="metric">
        <text class="metric-icon">🎯</text>
        <text class="metric-value">{{ totalSessions }}</text>
        <text class="metric-label">完成任务</text>
      </view>
      <view class="metric">
        <text class="metric-icon">🏆</text>
        <text class="metric-value">{{ totalPoints }}</text>
        <text class="metric-label">累计积分</text>
      </view>
      <view class="metric">
        <text class="metric-icon">🎖️</text>
        <text class="metric-value">{{ dailyPoints }}</text>
        <text class="metric-label">今日积分</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">本周专注时长</text>
      <view class="trend">
        <view v-for="(day, index) in weekData" :key="index" class="day">
          <view class="bar">
            <view class="fill" :style="{ height: day.percentage + '%', background: day.color }"></view>
          </view>
          <text class="day-label">{{ day.label }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">今日记录</text>
      <view v-if="recentSessions.length === 0" class="empty">
        <text class="empty-icon">🕒</text>
        <text class="empty-text">还没有完成任何专注任务</text>
        <text class="empty-sub">开始第一个专注吧！</text>
      </view>
      <view v-else class="history">
        <view v-for="session in recentSessions.slice(0, 10)" :key="session.id" class="history-item">
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
        <button class="more-btn" @click="viewAllHistory">查看全部</button>
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
.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 140rpx;
  box-sizing: border-box;
  background: #f2f5ff;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 900;
  color: #0f172a;
  text-align: center;
  margin: 10rpx 0 26rpx;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.metric {
  background: #fff;
  border-radius: 22rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.08);
  text-align: center;
}

.metric-icon {
  display: block;
  font-size: 42rpx;
}

.metric-value {
  display: block;
  margin-top: 12rpx;
  font-size: 46rpx;
  font-weight: 900;
  color: #0f172a;
}

.metric-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #64748b;
}

.card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.08);
  margin-top: 26rpx;
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}

.trend {
  margin-top: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 240rpx;
  gap: 10rpx;
}

.day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.bar {
  width: 100%;
  max-width: 56rpx;
  height: 200rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.fill {
  width: 100%;
  border-radius: 999rpx;
}

.day-label {
  font-size: 22rpx;
  color: #64748b;
}

.empty {
  margin-top: 28rpx;
  border-radius: 22rpx;
  background: #f8fafc;
  padding: 60rpx 22rpx;
  text-align: center;
}

.empty-icon {
  display: block;
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
}

.empty-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64748b;
}

.history {
  margin-top: 22rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 16rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  margin-top: 14rpx;
}

.history-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.history-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.history-name {
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
}

.history-time {
  font-size: 22rpx;
  color: #64748b;
}

.history-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.history-points {
  font-size: 28rpx;
  font-weight: 900;
  color: #3b82f6;
}

.history-duration {
  font-size: 22rpx;
  color: #64748b;
}

.more-btn {
  margin-top: 20rpx;
  height: 88rpx;
  border-radius: 22rpx;
  border: none;
  width: 100%;
  background: #f3f4f6;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}
</style>
