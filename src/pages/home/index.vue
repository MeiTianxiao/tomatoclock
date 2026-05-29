<template>
  <view class="page">
    <view v-if="pendingStudyInvites.length" class="card study-invite-card">
      <text class="study-invite-title">自习室邀请</text>
      <view v-for="item in pendingStudyInvites" :key="item.id" class="study-invite-item">
        <view class="study-invite-text-row">
          <text class="study-invite-text">{{ item.inviter?.nickname || '好友' }} 邀请你一起自习</text>
          <text v-if="item.room_closed" class="study-invite-closed-badge">已关闭</text>
        </view>
        <text v-if="item.room_closed" class="study-invite-closed-tip">自习室已结束，无法加入</text>
        <view class="study-invite-actions">
          <button v-if="!item.room_closed" class="study-invite-btn primary" @click="joinStudyInvite(item)">加入</button>
          <button class="study-invite-btn" @click="dismissStudyInvite(item)">忽略</button>
        </view>
      </view>
    </view>

    <view class="card greeting-card">
      <view class="greeting-row">
        <view class="avatar">
          <image v-if="user?.avatar_url" class="avatar-img" :src="user.avatar_url" mode="aspectFill" />
          <open-data v-else-if="isWeixinMp" class="avatar-img" type="userAvatarUrl" />
          <view v-else class="avatar-fallback">{{ user?.nickname?.slice(0, 1) || '你' }}</view>
        </view>
        <view class="greeting-texts">
          <view class="greeting-title-row">
            <text class="greeting-title">{{ greeting }}，</text>
            <text v-if="hasRealNickname" class="greeting-title">{{ user?.nickname }}</text>
            <open-data v-else-if="isWeixinMp" class="greeting-title" type="userNickName" />
            <text v-else class="greeting-title">同学</text>
            <text class="greeting-title">！</text>
          </view>
          <text class="greeting-subtitle">下午好！保持专注，冲刺今日目标！</text>
        </view>
      </view>
      <view class="greeting-banner">保持专注，你一定能做到！</view>
      <text class="greeting-meta">本周已专注 {{ (totalMinutes / 60).toFixed(1) }} 小时，距离下一职级还需 {{ pointsToNextRank }} 分</text>
    </view>

    <!-- 烟花特效 -->
    <view v-if="showFireworks" class="fireworks-container">
      <view class="firework" v-for="i in 5" :key="i"></view>
      <view class="celebration-text">🎯 恭喜达成每日目标！</view>
    </view>

    <view class="card points-card">
      <view class="points-avatar">
        <view class="avatar lg">
          <image v-if="user?.avatar_url" class="avatar-img" :src="user.avatar_url" mode="aspectFill" />
          <open-data v-else-if="isWeixinMp" class="avatar-img" type="userAvatarUrl" />
          <view v-else class="avatar-fallback">{{ user?.nickname?.slice(0, 1) || '你' }}</view>
        </view>
        <view class="rank-pill" :style="{ background: rankInfo.color }">{{ rankInfo.name }}</view>
      </view>
      <text class="points-label">当前积分</text>
      <text class="points-value">{{ dailyPoints }}</text>
      <view class="points-progress">
        <text class="progress-left">距离下一职级</text>
        <text class="progress-right">{{ pointsToNextRank }} 分</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressToNextRank + '%', background: rankInfo.color }"></view>
      </view>
    </view>

    <view class="card section-card">
      <view class="section-title-row">
        <text class="section-title">选择专注时长</text>
      </view>
      <view class="duration-grid">
        <view
          v-for="duration in durationOptions"
          :key="duration.value"
          class="duration-item"
          :class="{ active: selectedDuration === duration.value && !isCustomDuration }"
          @click="selectedDuration = duration.value; isCustomDuration = false"
        >
          <text class="duration-num">{{ duration.value }}</text>
          <text class="duration-unit">分钟</text>
          <text class="duration-desc">{{ duration.desc }}</text>
        </view>
        <picker mode="selector" :range="customOptions" @change="onCustomDurationChange">
          <view class="duration-item" :class="{ active: isCustomDuration }">
            <text class="duration-custom-title">自定义时长</text>
            <text class="duration-custom-desc">({{ isCustomDuration ? selectedDuration : '10-120' }}分钟)</text>
          </view>
        </picker>
      </view>

      <text class="section-subtitle">选择专注事项</text>
      <view class="category-grid">
        <view
          v-for="(config, key) in CATEGORY_CONFIG"
          :key="key"
          class="category-item"
          :class="{ active: selectedCategory === key }"
          @click="selectedCategory = key as FocusCategory"
        >
          <view class="category-icon" :style="{ color: config.color }">{{ config.icon }}</view>
          <text class="category-name">{{ config.name }}</text>
        </view>
      </view>

      <text class="section-subtitle">选择专注模式</text>
      <view class="mode-grid">
        <view class="mode-item gentle" :class="{ active: selectedMode === 'gentle' }" @click="selectedMode = 'gentle'">
          <text class="mode-title">温和模式</text>
          <text class="mode-desc">允许退出2次，第3次退出扣除一半积分</text>
        </view>
        <view class="mode-item strict" :class="{ active: selectedMode === 'strict' }" @click="selectedMode = 'strict'">
          <text class="mode-title">严格模式</text>
          <text class="mode-desc">退出则清零当日所有积分</text>
        </view>
      </view>

      <view class="action-grid">
        <button class="start-btn" @click="startFocus">开始工作</button>
        <button class="study-room-btn" @click="goStudyRoom">自习室</button>
      </view>
    </view>

    <view class="todo-section">
      <TodoChecklist :duration="selectedDuration" :category="selectedCategory" :mode="selectedMode" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useTimerStore } from '@/stores/timer'
import { useTodoStore } from '@/stores/todo'
import { RANK_CONFIG, CATEGORY_CONFIG, type FocusCategory } from '@/types'
import TodoChecklist from '@/components/TodoChecklist.vue'
import {
  getPendingStudyRoomInvites,
  acceptStudyRoomInvite,
  rejectStudyRoomInvite,
  requestStudyRoomSubscribeMessage,
  type StudyRoomInviteRecord
} from '@/api/study-room'

const userStore = useUserStore()
const timerStore = useTimerStore()
const todoStore = useTodoStore()
const isWeixinMp = !!(globalThis as any).wx && typeof (globalThis as any).wx.getAccountInfoSync === 'function'

const showFireworks = ref(false)
const pendingStudyInvites = ref<StudyRoomInviteRecord[]>([])

const selectedDuration = ref(25)
const selectedMode = ref<'strict' | 'gentle'>('strict')
const selectedCategory = ref<FocusCategory>('study')
const isCustomDuration = ref(false)

const durationOptions = [
  { value: 15, desc: '实习生任务' },
  { value: 30, desc: '科员任务' },
  { value: 45, desc: '科长任务' },
  { value: 60, desc: '处长任务' },
  { value: 90, desc: '局长任务' }
]

const user = computed(() => userStore.user)
const hasRealNickname = computed(() => {
  const name = user.value?.nickname || ''
  if (!name) return false
  return !name.startsWith('微信用户')
})
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

const pointsToNextRank = computed(() => {
  const target = nextRank.value?.points ?? RANK_CONFIG.master.points
  const left = Math.max(0, target - dailyPoints.value)
  return left
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
  todoStore.clearActiveFocus()
  const settingsStr = uni.getStorageSync('app-settings')
  const notificationsEnabled = (() => {
    if (!settingsStr) return true
    try {
      const s = JSON.parse(settingsStr)
      return s.notifications !== false
    } catch {
      return true
    }
  })()

  if (isWeixinMp) {
    if (notificationsEnabled) {
      uni.requestSubscribeMessage({
        tmplIds: ['Q_caCI_KtwEuo1xG8JgyUU4pkdVHsnN4JUsZFB52uTo'],
        complete: () => {
          timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value)
          uni.navigateTo({ url: '/pages/timer/index' })
        }
      })
    } else {
      timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value)
      uni.navigateTo({ url: '/pages/timer/index' })
    }
  } else {
    timerStore.startFocus(selectedDuration.value, selectedCategory.value, selectedMode.value)
    uni.navigateTo({ url: '/pages/timer/index' })
  }
}

function goStudyRoom() {
  uni.navigateTo({ url: '/pages/study-room/index' })
}

async function loadStudyInvites() {
  if (!userStore.isLoggedIn) {
    pendingStudyInvites.value = []
    return
  }
  try {
    pendingStudyInvites.value = await getPendingStudyRoomInvites()
  } catch {
    pendingStudyInvites.value = []
  }
}

async function joinStudyInvite(item: StudyRoomInviteRecord) {
  try {
    const { room_code } = await acceptStudyRoomInvite(item.id)
    await loadStudyInvites()
    uni.navigateTo({ url: `/pages/study-room/index?code=${room_code}` })
  } catch (e: any) {
    const msg = String(e?.message || '加入失败')
    const isClosed = msg.includes('已关闭') || msg.includes('不存在')
    if (isClosed) {
      uni.showModal({
        title: '自习室邀请',
        content: `好友邀请你加入自习室，但该自习室已结束。`,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      uni.showToast({ title: msg, icon: 'none' })
    }
    loadStudyInvites()
  }
}

async function dismissStudyInvite(item: StudyRoomInviteRecord) {
  try {
    await rejectStudyRoomInvite(item.id)
    await loadStudyInvites()
  } catch {
  }
}

const customValues = Array.from({ length: 12 }, (_, i) => (i + 1) * 10)
const customOptions = customValues.map(v => `${v} 分钟`)

function onCustomDurationChange(e: any) {
  const index = e.detail.value
  const picked = customValues[index]
  if (picked) {
    selectedDuration.value = picked
    isCustomDuration.value = true
  }
}

onMounted(() => {
  userStore.loadUser()
  timerStore.loadFromStorage()
  todoStore.loadFromStorage()
  
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
  }
})

onShow(() => {
  if (userStore.isLoggedIn) {
    timerStore.syncWithServer()
    loadStudyInvites()
    requestStudyRoomSubscribeMessage()
  }
  checkDailyGoal()
})

function checkDailyGoal() {
  const settings = uni.getStorageSync('app-settings')
  if (settings) {
    try {
      const parsed = JSON.parse(settings)
      const dailyGoal = parsed.dailyGoal || 120
      if (timerStore.dailyPoints > 0 && totalMinutes.value >= dailyGoal) {
        // 检查今天是否已经庆祝过
        const today = new Date().toDateString()
        const lastCelebration = uni.getStorageSync('last-celebration')
        if (lastCelebration !== today) {
          showFireworks.value = true
          uni.setStorageSync('last-celebration', today)
          setTimeout(() => {
            showFireworks.value = false
          }, 4000)
        }
      }
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 140rpx;
  box-sizing: border-box;
  background: #f2f5ff;
}

.study-invite-card {
  margin-bottom: 24rpx;
  padding: 28rpx;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border: 2rpx solid #bfdbfe;
}

.study-invite-title {
  font-size: 28rpx;
  font-weight: 900;
  color: #1d4ed8;
  display: block;
  margin-bottom: 16rpx;
}

.study-invite-item {
  padding: 16rpx 0;
  border-top: 1rpx solid rgba(59, 130, 246, 0.15);
}

.study-invite-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.study-invite-text {
  font-size: 26rpx;
  color: #334155;
  display: block;
  margin-bottom: 16rpx;
}

.study-invite-text-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.study-invite-text-row .study-invite-text {
  margin-bottom: 0;
}

.study-invite-closed-badge {
  font-size: 20rpx;
  color: #fff;
  background: #94a3b8;
  border-radius: 8rpx;
  padding: 2rpx 10rpx;
  flex-shrink: 0;
}

.study-invite-closed-tip {
  font-size: 22rpx;
  color: #94a3b8;
  display: block;
  margin-bottom: 16rpx;
}

.study-invite-actions {
  display: flex;
  gap: 16rpx;
}

.study-invite-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
  border-radius: 16rpx;
  margin: 0;
  background: #e2e8f0;
  color: #475569;
  &::after { display: none; }
}

.study-invite-btn.primary {
  background: #3b82f6;
  color: #fff;
}

.card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.08);
  margin-bottom: 28rpx;
}

.todo-section {
  margin-bottom: 28rpx;
}

.greeting-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.greeting-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar.lg {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 48rpx;
  display: block;
}

.avatar-fallback {
  font-size: 40rpx;
  font-weight: 900;
  color: #111827;
}

.greeting-texts {
  flex: 1;
}

.greeting-title {
  font-size: 40rpx;
  font-weight: 900;
  color: #0f172a;
  display: block;
}

.greeting-subtitle {
  font-size: 26rpx;
  color: #64748b;
  margin-top: 8rpx;
  display: block;
}

.greeting-banner {
  margin-top: 22rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #f3f4ff;
  color: #334155;
  font-weight: 800;
  font-size: 28rpx;
  text-align: center;
}

.greeting-meta {
  display: block;
  margin-top: 16rpx;
  text-align: center;
  font-size: 24rpx;
  color: #94a3b8;
}

.points-card {
  padding-top: 44rpx;
  text-align: center;
}

/* 烟花特效 */
.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
}

.celebration-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #f59e0b;
  text-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.3);
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.firework {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  box-shadow: 
    0 0 #ef4444, 0 0 #3b82f6, 0 0 #10b981, 0 0 #f59e0b,
    0 0 #8b5cf6, 0 0 #ec4899, 0 0 #06b6d4, 0 0 #f43f5e;
  animation: explode 1s ease-out infinite;
}

.firework:nth-child(1) { top: 30%; left: 30%; animation-delay: 0s; }
.firework:nth-child(2) { top: 40%; left: 70%; animation-delay: 0.2s; }
.firework:nth-child(3) { top: 60%; left: 40%; animation-delay: 0.4s; }
.firework:nth-child(4) { top: 20%; left: 60%; animation-delay: 0.1s; }
.firework:nth-child(5) { top: 70%; left: 60%; animation-delay: 0.3s; }

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes explode {
  0% {
    box-shadow: 
      0 0 #ef4444, 0 0 #3b82f6, 0 0 #10b981, 0 0 #f59e0b,
      0 0 #8b5cf6, 0 0 #ec4899, 0 0 #06b6d4, 0 0 #f43f5e;
    opacity: 1;
  }
  100% {
    box-shadow: 
      -100rpx -100rpx #ef4444, 100rpx -100rpx #3b82f6, 
      100rpx 100rpx #10b981, -100rpx 100rpx #f59e0b,
      0 -120rpx #8b5cf6, 120rpx 0 #ec4899, 
      0 120rpx #06b6d4, -120rpx 0 #f43f5e;
    opacity: 0;
  }
}

.points-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.rank-pill {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.points-label {
  display: block;
  margin-top: 18rpx;
  color: #475569;
  font-size: 26rpx;
  font-weight: 700;
}

.points-value {
  display: block;
  margin-top: 10rpx;
  font-size: 64rpx;
  font-weight: 900;
  color: #94a3b8;
}

.points-progress {
  display: flex;
  justify-content: space-between;
  margin-top: 18rpx;
  font-size: 24rpx;
  color: #64748b;
}

.progress-bar {
  margin-top: 14rpx;
  height: 12rpx;
  background: #e5e7eb;
  border-radius: 999rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
}

.section-card {
  padding: 34rpx 32rpx 40rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #0f172a;
}

.duration-grid {
  margin-top: 22rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.duration-item {
  border-radius: 22rpx;
  border: 2rpx solid #e5e7eb;
  padding: 22rpx 10rpx;
  text-align: center;
  background: #fff;
}

.duration-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.duration-num {
  display: block;
  font-size: 44rpx;
  font-weight: 900;
  color: #0f172a;
}

.duration-unit {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.duration-desc {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 10rpx;
}

.duration-custom-title {
  display: block;
  font-size: 26rpx;
  font-weight: 900;
  color: #0f172a;
  margin-top: 10rpx;
}

.duration-custom-desc {
  display: block;
  margin-top: 10rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.section-subtitle {
  display: block;
  margin-top: 30rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: #0f172a;
}

.category-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.category-item {
  border-radius: 22rpx;
  border: 2rpx solid #e5e7eb;
  padding: 22rpx 10rpx;
  background: #fff;
  text-align: center;
}

.category-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.category-icon {
  font-size: 40rpx;
  font-weight: 700;
}

.category-name {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 800;
}

.mode-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.mode-item {
  border-radius: 22rpx;
  padding: 24rpx 22rpx;
  border: 2rpx solid #e5e7eb;
  background: #fff;
}

.mode-item.gentle {
  border-color: rgba(34, 197, 94, 0.45);
}

.mode-item.gentle.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.mode-item.strict.active {
  border-color: #111827;
  background: #f3f4f6;
}

.mode-title {
  display: block;
  font-size: 28rpx;
  font-weight: 900;
  color: #0f172a;
}

.mode-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.5;
}

.action-grid {
  display: flex;
  gap: 20rpx;
  margin-top: 48rpx;
}

.start-btn {
  flex: 2;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 24rpx;
  border: none;
  box-shadow: 0 8rpx 16rpx rgba(59, 130, 246, 0.3);
  padding: 24rpx 0;
  line-height: 1.5;
}

.study-room-btn {
  flex: 1;
  background: #f1f5f9;
  color: #475569;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 24rpx;
  border: none;
  padding: 24rpx 0;
  line-height: 1.5;
}

.start-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 8rpx rgba(59, 130, 246, 0.2);
}
.study-room-btn:active {
  transform: scale(0.98);
  background: #e2e8f0;
}
</style>
