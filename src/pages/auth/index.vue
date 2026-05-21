<template>
  <view class="auth-page">
    <view class="card">
      <view v-if="!needProfile">
        <view class="header">
          <view class="logo">
            <text class="logo-icon">✦</text>
          </view>
          <text class="title">你好局长</text>
          <text class="subtitle">专注换晋升，开启您的职场之旅</text>
        </view>

        <view v-if="isWeixinMp" class="wechat-login">
          <button class="wechat-btn" :disabled="wechatLoading" @click="handleWechatLogin">
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

      <!-- 补充资料表单（头像昵称填写能力） -->
      <view v-else class="profile-form">
        <view class="header">
          <text class="title">完善个人资料</text>
          <text class="subtitle">请设置您的专属头像和昵称</text>
        </view>
        <button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image class="avatar" :src="avatarUrl || defaultAvatarUrl" mode="aspectFill"></image>
        </button>
        <form @submit="onProfileSubmit">
          <view class="row">
            <text class="text1">昵称：</text>
            <input type="nickname" class="weui-input" name="nickname" placeholder="点击获取微信昵称" />
          </view>
          <button class="submit-btn" form-type="submit" :disabled="profileLoading">
            {{ profileLoading ? '保存中...' : '完成登录' }}
          </button>
        </form>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const wechatLoading = ref(false)
const profileLoading = ref(false)

const needProfile = ref(false)
const avatarUrl = ref('')
const avatarBase64 = ref('')
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

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

function getWechatCode(): Promise<string> {
  return new Promise((resolve, reject) => {
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
}

async function handleWechatLogin() {
  if (!isWeixinMp) return
  wechatLoading.value = true
  try {
    const code = await getWechatCode()
    if (!code) throw new Error('未获取到微信登录 code')
    
    await userStore.wechatLoginUser({ code })
    
    const user = userStore.user
    // 如果是新用户或者没有设置过真实头像昵称，则进入资料填写步骤
    if (user && (!user.avatar_url || user.nickname === '微信用户' || user.avatar_url.includes('thirdwx.qlogo.cn'))) {
      needProfile.value = true
    } else {
      uni.showToast({ title: '登录成功', icon: 'success' })
      goHome()
    }
  } catch (error: any) {
    uni.showToast({ title: error?.message || '登录失败', icon: 'none' })
  } finally {
    wechatLoading.value = false
  }
}

function onChooseAvatar(e: any) {
  const tmpUrl = e.detail.avatarUrl
  avatarUrl.value = tmpUrl
  
  // 将临时文件转为 base64，以便一并传给后端
  uni.getFileSystemManager().readFile({
    filePath: tmpUrl,
    encoding: 'base64',
    success: (res: any) => {
      avatarBase64.value = `data:image/jpeg;base64,${res.data}`
    },
    fail: () => {
      uni.showToast({ title: '读取头像失败', icon: 'none' })
    }
  })
}

async function onProfileSubmit(e: any) {
  const nick = e.detail.value.nickname
  if (!avatarBase64.value && !avatarUrl.value) {
    return uni.showToast({ title: '请选择头像', icon: 'none' })
  }
  if (!nick || nick.trim().length === 0) {
    return uni.showToast({ title: '请输入昵称', icon: 'none' })
  }
  
  profileLoading.value = true
  try {
    // 获取一个新的 code 再次调用登录接口，后端会更新资料
    const code = await getWechatCode()
    await userStore.wechatLoginUser({
      code,
      nickname: nick.trim(),
      avatar_url: avatarBase64.value || undefined
    })
    
    uni.showToast({ title: '设置成功', icon: 'success' })
    goHome()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    profileLoading.value = false
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  box-shadow: 0 12rpx 36rpx rgba(16, 185, 129, 0.3);
  &::after { display: none; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.7; }
}

.profile-form {
  padding: 20rpx 0;
}

.avatar-wrapper {
  padding: 0;
  width: 160rpx !important;
  height: 160rpx !important;
  border-radius: 80rpx;
  margin: 40rpx auto 60rpx;
  background-color: #f3f4f6;
  border: 4rpx solid #e5e7eb;
  &::after { border: none; }
}

.avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 80rpx;
}

.row {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border-radius: 24rpx;
  padding: 0 32rpx;
  height: 100rpx;
  margin-bottom: 60rpx;
}

.text1 {
  width: 120rpx;
  font-size: 32rpx;
  color: #4b5563;
}

.weui-input {
  flex: 1;
  font-size: 32rpx;
  color: #111827;
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  box-shadow: 0 12rpx 36rpx rgba(59, 130, 246, 0.3);
  &::after { display: none; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.7; }
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
