<template>
  <view class="page">
    <view class="header">
      <text class="title">双人自习室</text>
      <text class="subtitle">与好友一起专注，共同进步</text>
    </view>

    <view class="card" v-if="!inRoom">
      <view class="input-group">
        <text class="label">加入自习室</text>
        <view class="input-row">
          <input class="input" v-model="roomCode" placeholder="输入自习室验证码" />
          <button class="btn primary-btn" :disabled="loading" @click="joinRoom">加入</button>
        </view>
      </view>
      
      <view class="divider">
        <text class="divider-text">或者</text>
      </view>
      
      <button class="btn secondary-btn" :disabled="loading" @click="createRoom">创建自习室</button>
    </view>

    <view class="card room-card" v-else>
      <view class="room-header">
        <view>
          <text class="label">自习室验证码</text>
          <text class="room-code">{{ currentRoom }}</text>
        </view>
        <button class="mini-btn" @click="copyCode">复制</button>
      </view>
      
      <view class="members-section">
        <text class="label">当前成员 ({{ members.length }}人)</text>
        <view class="members-grid">
          <view class="member" v-for="m in members" :key="m.id">
            <image class="avatar" :src="m.avatar_url || defaultAvatar" mode="aspectFill" />
            <text class="name">{{ m.nickname }}</text>
            <text class="status">专注中...</text>
          </view>
        </view>
      </view>

      <view class="action-section">
        <button class="btn primary-btn" @click="leaveRoom">离开自习室</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { post, get } from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const roomCode = ref('')
const currentRoom = ref('')
const inRoom = ref(false)
const members = ref<any[]>([])
const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
let pingTimer: any = null
let joinTime: number = 0

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createRoom() {
  roomCode.value = generateRoomCode()
  await joinRoom()
}

async function joinRoom() {
  if (!roomCode.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
  loading.value = true
  try {
    const res = await post('/study-room/join', { room_code: roomCode.value.toUpperCase() })
    if (res.code === 200) {
      currentRoom.value = roomCode.value.toUpperCase()
      inRoom.value = true
      joinTime = Date.now()
      startPing()
      uni.showToast({ title: '已进入自习室', icon: 'success' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加入失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function fetchMembers() {
  if (!inRoom.value || !currentRoom.value) return
  try {
    const res = await get(`/study-room/${currentRoom.value}`)
    if (res.data) {
      members.value = res.data
    }
  } catch (e) {}
}

async function ping() {
  if (!inRoom.value) return
  try {
    await post('/study-room/ping', { room_code: currentRoom.value })
    fetchMembers()
  } catch (e) {}
}

function startPing() {
  fetchMembers()
  pingTimer = setInterval(ping, 5000)
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
  }
}

function copyCode() {
  uni.setClipboardData({
    data: currentRoom.value,
    success: () => uni.showToast({ title: '已复制验证码', icon: 'success' })
  })
}

async function leaveRoom() {
  uni.showModal({
    title: '确认离开',
    content: '离开后将结算本次自习的积分，确定离开吗？',
    success: async (res) => {
      if (res.confirm) {
        stopPing()
        const durationMinutes = Math.floor((Date.now() - joinTime) / 60000)
        const points = Math.floor(durationMinutes * 1.5) // 自习室积分1.5倍
        
        try {
          await post('/study-room/leave', { room_code: currentRoom.value })
        } catch (e) {}

        inRoom.value = false
        currentRoom.value = ''
        members.value = []

        uni.showModal({
          title: '自习结束',
          content: `本次自习 ${durationMinutes} 分钟\n获得 ${points} 积分`,
          showCancel: false,
          success: () => {
            uni.navigateBack()
          }
        })
      }
    }
  })
}

onUnmounted(() => {
  stopPing()
  if (inRoom.value) {
    post('/study-room/leave', { room_code: currentRoom.value }).catch(() => {})
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40rpx;
}
.header {
  margin-bottom: 60rpx;
  .title {
    font-size: 48rpx;
    font-weight: 900;
    color: #0f172a;
    display: block;
  }
  .subtitle {
    font-size: 28rpx;
    color: #64748b;
    margin-top: 10rpx;
    display: block;
  }
}
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
}
.label {
  font-size: 28rpx;
  color: #475569;
  font-weight: bold;
  margin-bottom: 20rpx;
  display: block;
}
.input-row {
  display: flex;
  gap: 20rpx;
  .input {
    flex: 1;
    background: #f1f5f9;
    height: 88rpx;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
  }
}
.btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin: 0;
  &::after { display: none; }
}
.primary-btn {
  background: #3b82f6;
  color: #fff;
}
.secondary-btn {
  background: #f1f5f9;
  color: #3b82f6;
  width: 100%;
}
.mini-btn {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  background: #f1f5f9;
  color: #475569;
  margin: 0;
  padding: 0 30rpx;
  border-radius: 30rpx;
  &::after { display: none; }
}
.divider {
  text-align: center;
  margin: 40rpx 0;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background: #e2e8f0;
  }
  .divider-text {
    background: #fff;
    padding: 0 20rpx;
    position: relative;
    color: #94a3b8;
    font-size: 24rpx;
  }
}
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 40rpx;
  .room-code {
    font-size: 40rpx;
    font-weight: 900;
    color: #3b82f6;
    letter-spacing: 4rpx;
    display: block;
  }
}
.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 40rpx;
  justify-content: flex-start;
  padding: 20rpx 0;
}
.member {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160rpx;
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    border: 4rpx solid #3b82f6;
    margin-bottom: 16rpx;
  }
  .avatar-empty {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    background: #f1f5f9;
    color: #94a3b8;
    font-size: 48rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 16rpx;
    border: 4rpx dashed #cbd5e1;
  }
  .name {
    font-size: 26rpx;
    font-weight: bold;
    color: #334155;
    text-align: center;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .status {
    font-size: 22rpx;
    color: #10b981;
    margin-top: 4rpx;
  }
}
.member.empty .name {
  color: #94a3b8;
}
.action-section {
  margin-top: 60rpx;
}
</style>