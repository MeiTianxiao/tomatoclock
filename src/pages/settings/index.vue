<template>
  <view class="settings-container">
    <view class="header">
      <text class="title">⚙️ 设置</text>
    </view>

    <view class="user-card">
      <view class="user-avatar" :style="{ background: rankColor }">
        <open-data v-if="isWeixinMp" class="user-avatar-img" type="userAvatarUrl" />
        <text v-else>{{ rankIcon }}</text>
      </view>
      <view class="user-info">
        <open-data v-if="isWeixinMp" class="user-name" type="userNickName" />
        <text v-else class="user-name">{{ user?.nickname }}</text>
        <text class="user-rank">{{ rankName }}</text>
      </view>
      <button class="edit-btn" @click="editProfile">
        <text class="edit-icon">✏️</text>
      </button>
    </view>

    <view class="settings-section">
      <view class="section-title">通用设置</view>
      
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔔</text>
          <text class="setting-label">提醒通知</text>
        </view>
        <switch
          :checked="settings.notifications"
          @change="toggleSetting('notifications')"
          color="#3b82f6"
        />
      </view>

      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔊</text>
          <text class="setting-label">音效</text>
        </view>
        <switch
          :checked="settings.soundEnabled"
          @change="toggleSetting('soundEnabled')"
          color="#3b82f6"
        />
      </view>

      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🌙</text>
          <text class="setting-label">深色模式</text>
        </view>
        <switch
          :checked="settings.darkMode"
          @change="toggleSetting('darkMode')"
          color="#3b82f6"
        />
      </view>

      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔒</text>
          <text class="setting-label">隐私模式</text>
        </view>
        <switch
          :checked="settings.privacyMode"
          @change="toggleSetting('privacyMode')"
          color="#3b82f6"
        />
      </view>
    </view>

    <view class="settings-section">
      <view class="section-title">专注设置</view>
      
      <view class="setting-item" @click="showGoalSettings">
        <view class="setting-left">
          <text class="setting-icon">🎯</text>
          <text class="setting-label">每日目标</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ settings.dailyGoal }}分钟</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>

      <view class="setting-item" @click="showThemeSettings">
        <view class="setting-left">
          <text class="setting-icon">🎨</text>
          <text class="setting-label">主题样式</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ themeNames[settings.theme] }}</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="settings-section">
      <view class="section-title">数据管理</view>
      
      <view class="setting-item" @click="exportData">
        <view class="setting-left">
          <text class="setting-icon">📤</text>
          <text class="setting-label">导出数据</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="clearData">
        <view class="setting-left">
          <text class="setting-icon">🗑️</text>
          <text class="setting-label">清空数据</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <view class="settings-section">
      <view class="section-title">关于</view>
      
      <view class="setting-item" @click="showAbout">
        <view class="setting-left">
          <text class="setting-icon">ℹ️</text>
          <text class="setting-label">关于应用</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="showFeedback">
        <view class="setting-left">
          <text class="setting-icon">💬</text>
          <text class="setting-label">意见反馈</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <view class="logout-section">
      <button class="btn btn-danger btn-block" @click="handleLogout">
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { RANK_CONFIG } from '@/types'

const userStore = useUserStore()
const isWeixinMp = !!(globalThis as any).wx && typeof (globalThis as any).wx.getAccountInfoSync === 'function'

interface Settings {
  notifications: boolean
  soundEnabled: boolean
  darkMode: boolean
  privacyMode: boolean
  dailyGoal: number
  theme: string
}

const settings = ref<Settings>({
  notifications: true,
  soundEnabled: true,
  darkMode: false,
  privacyMode: false,
  dailyGoal: 120,
  theme: 'business'
})

const themeNames: Record<string, string> = {
  business: '商务蓝',
  nature: '自然绿',
  sunset: '日落橙',
  ocean: '海洋蓝'
}

const user = computed(() => userStore.user)

const rankInfo = computed(() => {
  const points = parseInt(uni.getStorageSync('timer')?.dailyPoints || '0') || 0
  let rank = 'intern'
  if (points >= 1500) rank = 'master'
  else if (points >= 1000) rank = 'expert'
  else if (points >= 600) rank = 'senior'
  else if (points >= 300) rank = 'middle'
  else if (points >= 100) rank = 'junior'
  return RANK_CONFIG[rank]
})

const rankColor = computed(() => rankInfo.value.color)
const rankIcon = computed(() => rankInfo.value.icon)
const rankName = computed(() => rankInfo.value.name)

function toggleSetting(key: keyof Settings) {
  settings.value[key] = !settings.value[key]
  saveSettings()
}

function saveSettings() {
  uni.setStorageSync('app-settings', JSON.stringify(settings.value))
}

function loadSettings() {
  const stored = uni.getStorageSync('app-settings')
  if (stored) {
    try {
      settings.value = JSON.parse(stored)
    } catch {
      // ignore
    }
  }
}

function editProfile() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function showGoalSettings() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function showThemeSettings() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function exportData() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function clearData() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有数据吗？此操作不可恢复。',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('timer')
        uni.removeStorageSync('app-settings')
        uni.showToast({ title: '数据已清空', icon: 'success' })
      }
    }
  })
}

function showAbout() {
  uni.showModal({
    title: '关于应用',
    content: '专注软件开发需求 v1.0.0\n\n一款帮助开发者提升专注效率的应用',
    showCancel: false
  })
}

function showFeedback() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.redirectTo({ url: '/pages/auth/index' })
      }
    }
  })
}

onMounted(() => {
  userStore.loadUser()
  loadSettings()
  
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
  }
})
</script>

<style lang="scss" scoped>
.settings-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  padding: 60rpx 40rpx 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.user-card {
  display: flex;
  align-items: center;
  background: #fff;
  margin: -30rpx 30rpx 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  display: block;
}

.user-rank {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 8rpx;
  display: block;
}

.edit-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.edit-icon {
  font-size: 28rpx;
}

.settings-section {
  background: #fff;
  margin: 0 30rpx 24rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.section-title {
  font-size: 24rpx;
  color: #9ca3af;
  padding: 24rpx 28rpx 16rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-bottom: 2rpx solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #f9fafb;
  }
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.setting-icon {
  font-size: 36rpx;
}

.setting-label {
  font-size: 30rpx;
  color: #1f2937;
}

.setting-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.setting-value {
  font-size: 28rpx;
  color: #6b7280;
}

.setting-arrow {
  font-size: 36rpx;
  color: #d1d5db;
}

.logout-section {
  padding: 0 30rpx;
}

.btn-danger {
  background: #ef4444;
  
  &:active {
    background: #dc2626;
  }
}
</style>
