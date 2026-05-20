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

      <view v-if="isWeixinMp" class="wechat-login">
        <button class="wechat-btn" :disabled="wechatLoading" @click="wechatOneTap">
          {{ wechatLoading ? '微信登录中...' : '微信一键登录' }}
        </button>
      </view>
      <view v-else class="wechat-login">
        <view class="wechat-tip">请在微信小程序中打开以使用微信登录</view>
      </view>

      <view class="form">
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
const wechatLoading = ref(false)

const wxAny = (globalThis as any).wx
const isWeixinMp = !!wxAny && typeof wxAny.login === 'function'

function goHome() {
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/home/index',
      fail: () => {
        uni.reLaunch({ url: '/pages/home/index' })
      }
    })
  }, 200)
}

async function wechatOneTap() {
  if (!isWeixinMp) return
  wechatLoading.value = true
  try {
    const profile = await new Promise<any>((resolve, reject) => {
      const wxProfile = (globalThis as any).wx?.getUserProfile
      if (typeof wxProfile === 'function') {
        wxProfile({
          desc: '用于完善头像与昵称',
          success: (res: any) => resolve(res),
          fail: () => resolve(null)
        })
        return
      }

      const uniProfile = (uni as any).getUserProfile
      if (typeof uniProfile === 'function') {
        uniProfile({
          desc: '用于完善头像与昵称',
          success: (res: any) => resolve(res),
          fail: () => resolve(null)
        })
        return
      }

      resolve(null)
    })

    const code = await new Promise<string>((resolve, reject) => {
      const wxLogin = (globalThis as any).wx?.login
      if (typeof wxLogin === 'function') {
        wxLogin({
          timeout: 10000,
          success: (res: any) => resolve(res?.code || ''),
          fail: (err: any) => reject(err)
        })
        return
      }

      uni.login({
        provider: 'weixin',
        success: (res) => resolve((res as any)?.code || ''),
        fail: (err) => reject(err)
      })
    })

    if (!code) {
      throw new Error('未获取到微信登录 code，请确认在微信小程序环境并已配置正确的接口地址')
    }

    const nickName = profile?.userInfo?.nickName
    const avatarUrl = profile?.userInfo?.avatarUrl
    await userStore.wechatLoginUser({
      code,
      nickname: typeof nickName === 'string' ? nickName : undefined,
      avatar_url: typeof avatarUrl === 'string' ? avatarUrl : undefined
    })

    uni.showToast({ title: '微信登录成功', icon: 'success' })
    goHome()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '微信登录失败', icon: 'none' })
  } finally {
    wechatLoading.value = false
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

.wechat-login {
  margin-bottom: 36rpx;
}

.wechat-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  border: none;
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(90deg, #06c755 0%, #22c55e 100%);
  box-shadow: 0 16rpx 44rpx rgba(34, 197, 94, 0.35);
}

.wechat-phone {
  margin-top: 18rpx;
  display: flex;
  gap: 16rpx;
}

.phone-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 22rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
  background: #111827;
}

.skip-btn {
  width: 220rpx;
  height: 88rpx;
  border-radius: 22rpx;
  border: none;
  font-size: 26rpx;
  font-weight: 700;
  color: #374151;
  background: #f3f4f6;
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
