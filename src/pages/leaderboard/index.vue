<template>
  <view class="page">
    <text class="page-title">排行榜</text>

    <view class="board-tabs">
      <view class="board-tab" :class="{ active: activeBoard === 'all' }" @click="activeBoard = 'all'">全站榜</view>
      <view class="board-tab" :class="{ active: activeBoard === 'friend' }" @click="activeBoard = 'friend'">好友榜</view>
    </view>

    <view v-if="activeBoard === 'all'">
      <view class="card podium-card">
        <view class="card-head">
          <text class="card-title">本周荣誉榜</text>
          <text class="card-sub">🏆 前三名</text>
        </view>

        <view class="podium">
        <view class="podium-item second">
          <view class="podium-avatar">
            <image v-if="leaderboard[1]?.avatar_url" class="podium-avatar-img" :src="leaderboard[1].avatar_url" mode="aspectFill" />
            <text v-else class="podium-avatar-fallback">🥈</text>
          </view>
          <text class="podium-name">{{ leaderboard[1]?.nickname || '---' }}</text>
          <view class="podium-score">
            <text class="podium-points">{{ leaderboard[1]?.total_points || 0 }}</text>
            <text class="podium-label">积分</text>
          </view>
          <view class="podium-stand" style="height: 100rpx;">2</view>
        </view>
        
        <view class="podium-item first">
          <view class="crown">👑</view>
          <view class="podium-avatar">
            <image v-if="leaderboard[0]?.avatar_url" class="podium-avatar-img" :src="leaderboard[0].avatar_url" mode="aspectFill" />
            <text v-else class="podium-avatar-fallback">🥇</text>
          </view>
          <text class="podium-name">{{ leaderboard[0]?.nickname || '---' }}</text>
          <view class="podium-score">
            <text class="podium-points">{{ leaderboard[0]?.total_points || 0 }}</text>
            <text class="podium-label">积分</text>
          </view>
          <view class="podium-stand" style="height: 160rpx;">1</view>
        </view>
        
        <view class="podium-item third">
          <view class="podium-avatar">
            <image v-if="leaderboard[2]?.avatar_url" class="podium-avatar-img" :src="leaderboard[2].avatar_url" mode="aspectFill" />
            <text v-else class="podium-avatar-fallback">🥉</text>
          </view>
          <text class="podium-name">{{ leaderboard[2]?.nickname || '---' }}</text>
          <view class="podium-score">
            <text class="podium-points">{{ leaderboard[2]?.total_points || 0 }}</text>
            <text class="podium-label">积分</text>
          </view>
          <view class="podium-stand" style="height: 60rpx;">3</view>
        </view>
        </view>
      </view>

      <view class="card list-card">
        <view class="list-header">
          <text class="list-title">完整榜单</text>
          <text class="list-count">共 {{ leaderboard.length }} 人</text>
        </view>

        <view class="list-content">
          <view
            v-for="(item, index) in leaderboard.slice(3)"
            :key="item.id"
            class="list-item"
            :class="{ 'is-current': item.id === currentUserId }"
          >
            <view class="item-position">
              <text class="position-number">{{ index + 4 }}</text>
            </view>
            <view class="item-avatar" :style="{ background: getRankColor(item.current_rank) }">
              <image v-if="item.avatar_url" class="item-avatar-img" :src="item.avatar_url" mode="aspectFill" />
              <text v-else class="item-avatar-fallback">{{ getRankIcon(item.current_rank) }}</text>
            </view>
            <view class="item-info">
              <text class="item-name">{{ item.nickname }}</text>
              <text class="item-rank">{{ getRankName(item.current_rank) }}</text>
            </view>
            <view class="item-stats">
              <text class="item-points">{{ item.total_points }}分</text>
              <text class="item-minutes">{{ item.total_minutes }}分钟</text>
            </view>
          </view>

          <view v-if="loading" class="loading-more">
            <text class="loading-text">加载中...</text>
          </view>

          <view v-if="leaderboard.length === 0 && !loading" class="empty-state">
            <text class="empty-icon">📊</text>
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="card friend-card">
      <view class="friend-head">
        <text class="friend-title">好友榜</text>
        <text class="friend-sub">仅展示使用过本小程序的微信好友</text>
      </view>
      <view class="friend-body">
        <text class="friend-tip">微信小程序无法直接读取通讯录或好友列表。要做“好友榜”，需要接入开放数据域能力（好友云存储）或在应用内做好友关系（邀请码/互相关注）。</text>
        <button class="btn btn-primary btn-block" @click="activeBoard = 'all'">先看全站榜</button>
      </view>
    </view>

    <view class="card my-rank-card">
        <view class="my-rank-header">
          <view class="my-user">
            <view class="my-avatar">
              <image v-if="userStore.user?.avatar_url" class="my-avatar-img" :src="userStore.user.avatar_url" mode="aspectFill" />
              <open-data v-else-if="isWeixinMp" class="my-avatar-img" type="userAvatarUrl" />
              <view v-else class="my-avatar-fallback">{{ userStore.user?.nickname?.slice(0, 1) || '你' }}</view>
            </view>
            <view class="my-user-info">
              <text v-if="userStore.user?.nickname" class="my-user-name">{{ userStore.user.nickname }}</text>
              <open-data v-else-if="isWeixinMp" class="my-user-name" type="userNickName" />
              <text v-else class="my-user-name">微信用户</text>
              <text class="my-user-sub">我的排名</text>
            </view>
          </view>
          <view class="my-position" v-if="myRank">
            <text class="position-num">{{ myRank.position }}</text>
            <text class="position-label">名</text>
          </view>
          <view class="my-position" v-else>
            <text class="position-num">-</text>
            <text class="position-label">未上榜</text>
          </view>
        </view>
        <view class="my-stats">
          <view class="my-stat">
            <text class="stat-value">{{ dailyPoints }}</text>
            <text class="stat-label">本周积分</text>
          </view>
          <view class="my-stat">
            <text class="stat-value">{{ totalMinutes }}</text>
            <text class="stat-label">专注时长</text>
          </view>
          <view class="my-stat">
            <text class="stat-value">{{ sessions.length }}</text>
            <text class="stat-label">完成任务</text>
          </view>
        </view>
        <button class="btn btn-primary btn-block" @click="goToFocus">
          开始专注提升排名
        </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTimerStore } from '@/stores/timer'
import { getLeaderboard, type LeaderboardItem } from '@/api/leaderboard'
import { RANK_CONFIG } from '@/types'

const userStore = useUserStore()
const timerStore = useTimerStore()

const leaderboard = ref<LeaderboardItem[]>([])
const loading = ref(false)
const activeBoard = ref<'all' | 'friend'>('all')

const wxAny = (globalThis as any).wx
const isWeixinMp = !!wxAny && typeof wxAny.login === 'function'

const currentUserId = computed(() => userStore.user?.id || '')
const dailyPoints = computed(() => timerStore.dailyPoints)
const sessions = computed(() => timerStore.sessions)

const totalMinutes = computed(() => {
  return sessions.value.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0)
})

const myRank = computed(() => {
  return leaderboard.value.find(item => item.id === currentUserId.value)
})

function getRankColor(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.color || '#9ca3af'
}

function getRankIcon(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.icon || '👤'
}

function getRankName(rank: string) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG]?.name || rank
}

async function loadLeaderboard() {
  loading.value = true
  try {
    const data = await getLeaderboard(20)
    leaderboard.value = data
  } catch (error) {
    console.error('加载排行榜失败:', error)
  } finally {
    loading.value = false
  }
}

function goToFocus() {
  uni.switchTab({ url: '/pages/home/index' })
}

onMounted(() => {
  userStore.loadUser()
  timerStore.loadFromStorage()
  
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
    return
  }
  
  loadLeaderboard()
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

.board-tabs {
  background: #fff;
  border-radius: 999rpx;
  padding: 10rpx;
  display: flex;
  gap: 10rpx;
  margin-bottom: 26rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.08);
}

.board-tab {
  flex: 1;
  height: 68rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 900;
  color: #64748b;
  background: transparent;

  &.active {
    background: #3b82f6;
    color: #fff;
  }
}

.card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.08);
  margin-bottom: 26rpx;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}

.card-sub {
  font-size: 24rpx;
  color: #64748b;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 32rpx;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-item.first {
  order: 2;
}

.podium-item.second {
  order: 1;
}

.podium-item.third {
  order: 3;
}

.crown {
  font-size: 40rpx;
  position: absolute;
  top: -20rpx;
}

.podium-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 12rpx 40rpx rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.podium-avatar-img {
  width: 100%;
  height: 100%;
}

.podium-avatar-fallback {
  font-size: 48rpx;
}

.podium-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
  margin-top: 12rpx;
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-score {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-top: 8rpx;
}

.podium-points {
  font-size: 32rpx;
  font-weight: 700;
  color: #f59e0b;
}

.podium-label {
  font-size: 20rpx;
  color: #9ca3af;
}

.podium-stand {
  width: 100rpx;
  background: linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 8rpx 8rpx 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #6b7280;
  margin-top: 8rpx;
}

.podium-item.first .podium-stand {
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.podium-item.second .podium-stand {
  background: linear-gradient(180deg, #f3f4f6 0%, #d1d5db 100%);
  color: #6b7280;
}

.podium-item.third .podium-stand {
  background: linear-gradient(180deg, #fef3c7 0%, #fed7aa 100%);
  color: #b45309;
}

.list-section {
  margin: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.list-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.list-count {
  font-size: 24rpx;
  color: #9ca3af;
}

.list-content {
  background: transparent;
  border-radius: 24rpx;
  padding: 0;
  box-shadow: none;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 20rpx 18rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  margin-bottom: 12rpx;

  &.is-current {
    background: #eff6ff;
  }
}

.item-position {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.position-number {
  font-size: 24rpx;
  font-weight: 600;
  color: #6b7280;
}

.item-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 20rpx;
  overflow: hidden;
}

.item-avatar-img {
  width: 100%;
  height: 100%;
}

.item-avatar-fallback {
  font-size: 32rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2937;
  display: block;
}

.item-rank {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  display: block;
}

.item-stats {
  text-align: right;
}

.item-points {
  font-size: 28rpx;
  font-weight: 600;
  color: #f59e0b;
  display: block;
}

.item-minutes {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  display: block;
}

.loading-more {
  padding: 32rpx;
  text-align: center;
}

.loading-text {
  font-size: 26rpx;
  color: #9ca3af;
}

.empty-state {
  padding: 60rpx;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
}

.friend-card {
  background: #fff;
}

.friend-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.friend-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}

.friend-sub {
  font-size: 22rpx;
  color: #64748b;
}

.friend-tip {
  display: block;
  font-size: 26rpx;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.my-rank-card {
  background: #111827;
}

.my-rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.my-user {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.my-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.my-avatar-img {
  width: 72rpx;
  height: 72rpx;
  display: block;
}

.my-avatar-fallback {
  font-size: 32rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
}

.my-user-name {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
  display: block;
  max-width: 280rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-user-sub {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
  display: block;
  margin-top: 4rpx;
}

.my-position {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.position-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.position-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.my-stats {
  display: flex;
  gap: 40rpx;
  margin-bottom: 24rpx;
}

.my-stat {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

.my-rank-card .btn-primary {
  background: rgba(255, 255, 255, 0.2);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  
  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>
