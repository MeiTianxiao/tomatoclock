<template>
  <view class="page">
    <text class="page-title">好友</text>

    <view class="card">
      <view class="card-head">
        <text class="card-title">我的邀请码</text>
        <button class="mini-btn" @click="copyInviteCode" :disabled="!myInviteCode">复制</button>
      </view>
      <view class="code-row">
        <text class="code">{{ myInviteCode || '加载中...' }}</text>
      </view>
      <text class="card-tip">把邀请码发给对方，对方同意后才能互相看到好友榜。</text>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">添加好友</text>
      </view>
      <view class="form-row">
        <input class="input" v-model="inviteInput" placeholder="输入对方邀请码（例如 6位字母数字）" placeholder-class="placeholder" />
        <button class="btn" :disabled="inviteLoading" @click="sendInvite">{{ inviteLoading ? '发送中...' : '发送' }}</button>
      </view>
      <text class="card-tip">需要对方同意才会成为好友。</text>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">收到的申请</text>
        <text class="card-sub">{{ invites.incoming.length }} 条</text>
      </view>
      <view v-if="invites.incoming.length" class="list">
        <view v-for="item in invites.incoming" :key="item.id" class="list-item">
          <view class="avatar">
            <image v-if="item.inviter?.avatar_url" class="avatar-img" :src="item.inviter.avatar_url" mode="aspectFill" />
            <view v-else class="avatar-fallback">👤</view>
          </view>
          <view class="info">
            <text class="name">{{ item.inviter?.nickname || '微信用户' }}</text>
            <text class="meta">{{ item.created_at?.slice(0, 19).replace('T', ' ') }}</text>
          </view>
          <view class="actions">
            <button class="mini-btn primary" :disabled="actionLoadingId === item.id" @click="accept(item.id)">同意</button>
            <button class="mini-btn" :disabled="actionLoadingId === item.id" @click="reject(item.id)">拒绝</button>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        <text class="empty-text">暂无申请</text>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">已发送的申请</text>
        <text class="card-sub">{{ invites.outgoing.length }} 条</text>
      </view>
      <view v-if="invites.outgoing.length" class="list">
        <view v-for="item in invites.outgoing" :key="item.id" class="list-item">
          <view class="avatar">
            <image v-if="item.invitee?.avatar_url" class="avatar-img" :src="item.invitee.avatar_url" mode="aspectFill" />
            <view v-else class="avatar-fallback">👤</view>
          </view>
          <view class="info">
            <text class="name">{{ item.invitee?.nickname || '微信用户' }}</text>
            <text class="meta">等待对方同意</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        <text class="empty-text">暂无已发送申请</text>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">我的好友</text>
        <text class="card-sub">{{ friends.length }} 人</text>
      </view>
      <view v-if="friends.length" class="list">
        <view v-for="u in friends" :key="u.id" class="list-item">
          <view class="avatar">
            <image v-if="u.avatar_url" class="avatar-img" :src="u.avatar_url" mode="aspectFill" />
            <view v-else class="avatar-fallback">👤</view>
          </view>
          <view class="info">
            <text class="name">{{ u.nickname || '微信用户' }}</text>
            <text class="meta">{{ u.invite_code || '' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        <text class="empty-text">暂无好友</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUserInfo } from '@/api/user'
import { inviteFriend, getFriendInvites, acceptFriendInvite, rejectFriendInvite, getFriends, type FriendInviteRecord } from '@/api/friends'
import type { User } from '@/types'

const userStore = useUserStore()

const inviteInput = ref('')
const inviteLoading = ref(false)
const actionLoadingId = ref('')

const invites = ref<{ incoming: FriendInviteRecord[]; outgoing: FriendInviteRecord[] }>({ incoming: [], outgoing: [] })
const friends = ref<User[]>([])

const myInviteCode = computed(() => (userStore.user as any)?.invite_code || '')

async function refreshUser() {
  try {
    const u = await getUserInfo()
    userStore.user = u as any
    uni.setStorageSync('user', JSON.stringify(u))
  } catch {
  }
}

async function loadAll() {
  try {
    invites.value = await getFriendInvites()
  } catch {
    invites.value = { incoming: [], outgoing: [] }
  }

  try {
    friends.value = await getFriends()
  } catch {
    friends.value = []
  }
}

function copyInviteCode() {
  if (!myInviteCode.value) return
  uni.setClipboardData({
    data: myInviteCode.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' })
  })
}

async function sendInvite() {
  const code = inviteInput.value.trim().toUpperCase()
  if (!code) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' })
    return
  }
  inviteLoading.value = true
  try {
    await inviteFriend(code)
    inviteInput.value = ''
    uni.showToast({ title: '已发送申请', icon: 'success' })
    await loadAll()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '发送失败', icon: 'none' })
  } finally {
    inviteLoading.value = false
  }
}

async function accept(id: string) {
  actionLoadingId.value = id
  try {
    await acceptFriendInvite(id)
    uni.showToast({ title: '已同意', icon: 'success' })
    await loadAll()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  } finally {
    actionLoadingId.value = ''
  }
}

async function reject(id: string) {
  actionLoadingId.value = id
  try {
    await rejectFriendInvite(id)
    uni.showToast({ title: '已拒绝', icon: 'success' })
    await loadAll()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  } finally {
    actionLoadingId.value = ''
  }
}

onMounted(async () => {
  userStore.loadUser()
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/auth/index' })
    return
  }
  await refreshUser()
  await loadAll()
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
  margin-bottom: 18rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 900;
  color: #0f172a;
}

.card-sub {
  font-size: 22rpx;
  color: #64748b;
}

.card-tip {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.code-row {
  padding: 22rpx;
  background: #f8fafc;
  border-radius: 18rpx;
}

.code {
  font-size: 42rpx;
  font-weight: 900;
  color: #111827;
  letter-spacing: 4rpx;
}

.form-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.input {
  flex: 1;
  height: 86rpx;
  border-radius: 18rpx;
  border: 2rpx solid #e5e7eb;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  background: #fff;
}

.placeholder {
  color: #9ca3af;
}

.btn {
  width: 160rpx;
  height: 86rpx;
  border-radius: 18rpx;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}

.mini-btn {
  height: 64rpx;
  border-radius: 16rpx;
  border: none;
  background: #f3f4f6;
  color: #374151;
  font-size: 24rpx;
  font-weight: 800;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-btn.primary {
  background: #3b82f6;
  color: #fff;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 18rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  margin-right: 16rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-fallback {
  font-size: 32rpx;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 22rpx;
  color: #64748b;
  display: block;
  margin-top: 4rpx;
}

.actions {
  display: flex;
  gap: 10rpx;
}

.empty {
  padding: 30rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 24rpx;
  color: #94a3b8;
}
</style>

