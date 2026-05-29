<template>
  <view class="page">
    <view class="header">
      <text class="title">自习室</text>
      <text class="subtitle">与好友一起专注，共同进步</text>
    </view>

    <view v-if="!inRoom && pendingInvites.length" class="card invite-inbox-card">
      <text class="label">收到的自习邀请</text>
      <view v-for="item in pendingInvites" :key="item.id" class="invite-inbox-item">
        <text class="invite-inbox-text">{{ item.inviter?.nickname || '好友' }} 邀请你加入（{{ item.room_code }}）</text>
        <view class="invite-inbox-actions">
          <button class="mini-btn primary" @click="acceptInvite(item)">加入</button>
          <button class="mini-btn" @click="rejectInvite(item)">忽略</button>
        </view>
      </view>
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
        <view class="members-head">
          <text class="label">当前成员 ({{ members.length }}人)</text>
          <view class="add-btn" @click="openFriendPicker">
            <text class="add-icon">+</text>
          </view>
        </view>
        <view class="members-grid">
          <view class="member" v-for="m in members" :key="m.id">
            <image class="avatar" :src="m.avatar_url || defaultAvatar" mode="aspectFill" />
            <text class="name">{{ m.nickname }}</text>
            <text class="status">专注中...</text>
          </view>
        </view>
        <text class="invite-tip">点 + 邀请好友。对方打开小程序首页或本页即可看到邀请；若已授权订阅，还会收到微信通知。</text>
      </view>

      <view class="action-section">
        <button class="btn primary-btn" @click="leaveRoom">离开自习室</button>
      </view>
    </view>

    <view v-if="showFriendPicker" class="picker-mask" @click="closeFriendPicker">
      <view class="picker-panel" @click.stop>
        <view class="picker-head">
          <text class="picker-title">邀请好友</text>
          <text class="picker-close" @click="closeFriendPicker">×</text>
        </view>
        <view v-if="friendsLoading" class="picker-empty">加载中...</view>
        <view v-else-if="!availableFriends.length" class="picker-empty">暂无好友可邀请</view>
        <scroll-view v-else scroll-y class="picker-list">
          <view
            v-for="friend in availableFriends"
            :key="friend.id"
            class="picker-item"
            @click="inviteFriend(friend)"
          >
            <image class="picker-avatar" :src="friend.avatar_url || defaultAvatar" mode="aspectFill" />
            <text class="picker-name">{{ friend.nickname }}</text>
            <text class="picker-action">{{ invitingId === friend.id ? '发送中...' : '邀请' }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { post, get } from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { getFriends } from '@/api/friends'
import {
  inviteFriendToStudyRoom,
  getPendingStudyRoomInvites,
  acceptStudyRoomInvite,
  rejectStudyRoomInvite,
  requestStudyRoomSubscribeMessage,
  type StudyRoomInviteRecord
} from '@/api/study-room'
import type { User } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const roomCode = ref('')
const currentRoom = ref('')
const inRoom = ref(false)
const members = ref<any[]>([])
const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const pendingAutoJoinCode = ref('')
const showFriendPicker = ref(false)
const friends = ref<User[]>([])
const friendsLoading = ref(false)
const invitingId = ref('')
const pendingInvites = ref<StudyRoomInviteRecord[]>([])
let pingTimer: any = null
let joinTime: number = 0

const availableFriends = computed(() => {
  const memberIds = new Set(members.value.map(m => m.id))
  return friends.value.filter(f => !memberIds.has(f.id))
})

onLoad((options: any) => {
  const code = options?.code || options?.room_code
  if (code) {
    pendingAutoJoinCode.value = String(code).toUpperCase()
    roomCode.value = pendingAutoJoinCode.value
    uni.setStorageSync('pending-study-room-code', pendingAutoJoinCode.value)
  }
})

async function loadPendingInvites() {
  if (!userStore.isLoggedIn || inRoom.value) {
    pendingInvites.value = []
    return
  }
  try {
    pendingInvites.value = await getPendingStudyRoomInvites()
  } catch {
    pendingInvites.value = []
  }
}

async function acceptInvite(item: StudyRoomInviteRecord) {
  try {
    const { room_code } = await acceptStudyRoomInvite(item.id)
    await loadPendingInvites()
    await joinRoomByCode(room_code)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加入失败', icon: 'none' })
    loadPendingInvites()
  }
}

async function rejectInvite(item: StudyRoomInviteRecord) {
  try {
    await rejectStudyRoomInvite(item.id)
    await loadPendingInvites()
  } catch {
  }
}

async function loadFriends() {
  friendsLoading.value = true
  try {
    friends.value = await getFriends()
  } catch {
    friends.value = []
  } finally {
    friendsLoading.value = false
  }
}

async function openFriendPicker() {
  await requestStudyRoomSubscribeMessage()
  showFriendPicker.value = true
  await loadFriends()
}

function closeFriendPicker() {
  showFriendPicker.value = false
  invitingId.value = ''
}

async function inviteFriend(friend: User) {
  if (!currentRoom.value || invitingId.value) return
  invitingId.value = friend.id
  try {
    const result = await inviteFriendToStudyRoom(currentRoom.value, friend.id)
    const title = result.notified
      ? `已通知 ${friend.nickname}`
      : `已邀请 ${friend.nickname}（打开小程序可见）`
    uni.showToast({ title, icon: 'success' })
    closeFriendPicker()
  } catch (e: any) {
    const msg = String(e?.message || '邀请失败')
    if (msg.includes('接口不存在')) {
      uni.showModal({
        title: '后端未更新',
        content: '邀请接口尚未部署到线上服务器。请重新部署 Render 后端，或在开发配置里改用本地接口地址。',
        showCancel: false
      })
      return
    }
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    invitingId.value = ''
  }
}

async function joinRoomByCode(code: string) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return false
  loading.value = true
  try {
    const res = await post('/study-room/join', { code: normalized })
    if (res.code === 200) {
      currentRoom.value = res.data.code
      members.value = res.data.members || []
      inRoom.value = true
      joinTime = Date.now()
      startPing()
      uni.showToast({ title: '已进入自习室', icon: 'success' })
      return true
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加入失败', icon: 'none' })
  } finally {
    loading.value = false
  }
  return false
}

async function createRoom() {
  loading.value = true
  try {
    const res = await post('/study-room/join', {})
    if (res.code === 200) {
      currentRoom.value = res.data.code
      members.value = res.data.members || []
      inRoom.value = true
      joinTime = Date.now()
      startPing()
      uni.showToast({ title: '已创建自习室', icon: 'success' })
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '创建失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function joinRoom() {
  if (!roomCode.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
  await joinRoomByCode(roomCode.value)
}

async function tryAutoJoin() {
  if (inRoom.value) return

  const code = pendingAutoJoinCode.value || uni.getStorageSync('pending-study-room-code')
  if (!code) return

  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
    return
  }

  uni.removeStorageSync('pending-study-room-code')
  pendingAutoJoinCode.value = ''
  roomCode.value = String(code).toUpperCase()
  await joinRoomByCode(roomCode.value)
}

async function fetchMembers() {
  if (!inRoom.value || !currentRoom.value) return
  try {
    const res = await get(`/study-room/${currentRoom.value}`)
    if (res.data) {
      members.value = res.data.members || []
    }
  } catch (e) {}
}

async function ping() {
  if (!inRoom.value) return
  try {
    const res = await post('/study-room/ping', { code: currentRoom.value })
    if (res.data?.members) {
      members.value = res.data.members
      return
    }
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
        const points = Math.floor(durationMinutes * 1.5)
        
        try {
          await post('/study-room/leave', { code: currentRoom.value })
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

onMounted(() => {
  userStore.loadUser()
  tryAutoJoin()
  loadPendingInvites()
})

onShow(() => {
  userStore.loadUser()
  tryAutoJoin()
  loadPendingInvites()
  requestStudyRoomSubscribeMessage()
})

onUnmounted(() => {
  stopPing()
  if (inRoom.value) {
    post('/study-room/leave', { code: currentRoom.value }).catch(() => {})
  }
})
</script>

<style lang="scss" scoped>
.invite-inbox-card {
  margin-bottom: 24rpx;
}

.invite-inbox-item {
  padding: 20rpx 0;
  border-top: 1rpx solid #e2e8f0;
}

.invite-inbox-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.invite-inbox-text {
  font-size: 26rpx;
  color: #334155;
  display: block;
  margin-bottom: 16rpx;
}

.invite-inbox-actions {
  display: flex;
  gap: 16rpx;
}

.mini-btn.primary {
  background: #3b82f6;
  color: #fff;
}

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
.members-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
  .label {
    margin-bottom: 0;
  }
}
.add-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.25);
}
.add-icon {
  color: #fff;
  font-size: 44rpx;
  line-height: 1;
  font-weight: 300;
  margin-top: -4rpx;
}
.invite-tip {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1.5;
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
.action-section {
  margin-top: 60rpx;
}
.picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}
.picker-panel {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding: 28rpx 24rpx 40rpx;
  box-sizing: border-box;
}
.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.picker-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}
.picker-close {
  font-size: 44rpx;
  color: #94a3b8;
  line-height: 1;
  padding: 0 8rpx;
}
.picker-list {
  max-height: 52vh;
}
.picker-item {
  display: flex;
  align-items: center;
  padding: 20rpx 12rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.picker-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
}
.picker-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}
.picker-action {
  font-size: 26rpx;
  color: #3b82f6;
  font-weight: 700;
}
.picker-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 26rpx;
  padding: 60rpx 0;
}
</style>
