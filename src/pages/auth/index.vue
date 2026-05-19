<template>
  <view class="auth-page">
    <view class="card">
      <view class="header">
        <view class="logo">
          <text class="logo-icon">✦</text>
        </view>
        <text class="title">你好局长</text>
        <text class="subtitle">专注换晋升，开启您的职场之旅</text>
      </view>

      <view class="mode-tabs">
        <button
          class="tab-btn"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >
          <text class="tab-icon">→</text>
          登录
        </button>
        <button
          class="tab-btn"
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >
          <text class="tab-icon">＋</text>
          注册
        </button>
      </view>

      <view class="form">
        <view class="field">
          <text class="label">{{ mode === 'register' ? '设置昵称' : '输入昵称' }}</text>
          <input
            v-model="nickname"
            type="text"
            class="input"
            placeholder="请输入您的昵称"
            placeholder-class="placeholder"
            maxlength="20"
            @confirm="submit"
          />
          <text class="hint">
            {{ mode === 'register' ? '昵称将显示在排行榜上，至少2个字符' : '使用注册时的昵称登录' }}
          </text>
        </view>

        <button class="submit" :disabled="loading || nickname.trim().length < 2" @click="submit">
          {{ loading ? '处理中...' : mode === 'register' ? '创建账户并开始' : '登录' }}
        </button>

        <button class="link-btn" @click="goDevConfig">接口配置</button>

        <view class="privacy">
          <text>本应用使用Supabase安全存储您的数据</text>
          <text class="privacy-sub">我们不会收集任何敏感个人信息</text>
        </view>

        <view class="features">
          <text class="features-title">功能亮点</text>
          <view class="feature">
            <text class="check blue">✓</text>
            <text class="feature-text">云端同步，跨设备访问您的数据</text>
          </view>
          <view class="feature">
            <text class="check purple">✓</text>
            <text class="feature-text">每周清零，公平竞争排行榜</text>
          </view>
          <view class="feature">
            <text class="check pink">✓</text>
            <text class="feature-text">10级职位晋升，专注即可升级</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const nickname = ref('')
const loading = ref(false)
const mode = ref<'login' | 'register'>('login')

function goDevConfig() {
  uni.navigateTo({ url: '/pages/dev-api/index' })
}

async function submit() {
  if (nickname.value.trim().length < 2) {
    uni.showToast({ title: '昵称至少需要2个字符', icon: 'none' })
    return
  }

  loading.value = true
  try {
    if (mode.value === 'register') {
      await userStore.registerUser(nickname.value.trim())
      uni.showToast({ title: '注册成功', icon: 'success' })
    } else {
      await userStore.loginUser(nickname.value.trim())
      uni.showToast({ title: '登录成功', icon: 'success' })
    }
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/home/index',
        fail: () => {
          uni.reLaunch({ url: '/pages/home/index' })
        }
      })
    }, 300)
  } catch (error: any) {
    uni.showToast({ title: error?.message || '操作失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  padding: 48rpx;
  box-sizing: border-box;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 100%;
  background: #fff;
  border-radius: 36rpx;
  padding: 56rpx;
  box-shadow: 0 40rpx 120rpx rgba(0, 0, 0, 0.2);
}

.header {
  text-align: center;
  margin-bottom: 44rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin: 0 auto 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.logo-icon {
  color: #fff;
  font-size: 72rpx;
  font-weight: 700;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  color: #111827;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
}

.mode-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 36rpx;
}

.tab-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 24rpx;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: none;

  &.active {
    color: #fff;
    background: #3b82f6;
    box-shadow: 0 16rpx 44rpx rgba(59, 130, 246, 0.35);
  }
}

.tab-icon {
  font-size: 34rpx;
}

.form {
  width: 100%;
}

.field {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #374151;
  margin-bottom: 14rpx;
}

.input {
  width: 100%;
  height: 96rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  border: 4rpx solid #e5e7eb;
  font-size: 32rpx;
  box-sizing: border-box;
  background: #fff;
}

.placeholder {
  color: #9ca3af;
}

.hint {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 14rpx;
}

.submit {
  width: 100%;
  height: 104rpx;
  border-radius: 26rpx;
  color: #fff;
  font-size: 34rpx;
  font-weight: 800;
  border: none;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 18rpx 52rpx rgba(59, 130, 246, 0.32);
}

.submit[disabled] {
  opacity: 0.5;
}

.link-btn {
  margin-top: 20rpx;
  width: 100%;
  height: 84rpx;
  border-radius: 22rpx;
  border: none;
  background: #f3f4f6;
  color: #374151;
  font-size: 28rpx;
  font-weight: 700;
}

.privacy {
  margin-top: 32rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}

.privacy-sub {
  display: block;
  margin-top: 8rpx;
}

.features {
  margin-top: 44rpx;
  padding-top: 36rpx;
  border-top: 2rpx solid #e5e7eb;
}

.features-title {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #374151;
  margin-bottom: 22rpx;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.feature-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.check {
  font-size: 30rpx;
  font-weight: 900;
  margin-top: 2rpx;
}

.blue {
  color: #3b82f6;
}

.purple {
  color: #8b5cf6;
}

.pink {
  color: #ec4899;
}
</style>
