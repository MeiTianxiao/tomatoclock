<template>
  <view class="page">
    <view class="card">
      <text class="title">开发环境接口地址</text>
      <text class="desc">真机调试时，接口需要指向电脑的局域网 IP（手机与电脑同一网络）。</text>

      <view class="field">
        <text class="label">接口地址（URL 或 IP）</text>
        <input
          v-model="value"
          class="input"
          placeholder="例如 192.168.49.5 或 http://192.168.49.5:3000/api"
          placeholder-class="placeholder"
          confirm-type="done"
          @confirm="save"
        />
      </view>

      <view class="actions">
        <button class="btn secondary" @click="useLocalhost">使用 localhost（仅模拟器）</button>
        <button class="btn secondary" :disabled="!canSave" @click="test">测试连接</button>
        <button class="btn primary" :disabled="!canSave" @click="save">保存并返回</button>
      </view>

      <text class="tip">保存后会写入 DEV_MP_API_BASE_URL，下次自动使用。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const value = ref('')

onLoad(() => {
  const stored = uni.getStorageSync('DEV_MP_API_BASE_URL')
  if (typeof stored === 'string' && stored) value.value = stored
})

const canSave = computed(() => value.value.trim().length > 0)

function normalize(input: string) {
  const v = input.trim()
  if (!v) return ''
  if (/^https?:\/\//.test(v)) return v
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return `http://${v}:3000/api`
  return ''
}

function buildHealthURL(baseURL: string) {
  const u = baseURL.replace(/\/+$/, '')
  return `${u}/health`
}

function useLocalhost() {
  value.value = 'http://localhost:3000/api'
  save()
}

function test() {
  const baseURL = normalize(value.value)
  if (!baseURL) {
    uni.showToast({ title: '请输入正确的 IP 或 URL', icon: 'none' })
    return
  }

  uni.showLoading({ title: '测试中...' })
  uni.request({
    url: buildHealthURL(baseURL),
    method: 'GET',
    success: (res) => {
      uni.hideLoading()
      if ((res as any)?.statusCode === 200) {
        uni.showToast({ title: '连接成功', icon: 'success' })
      } else {
        const statusCode = (res as any)?.statusCode || '未知'
        const body = (() => {
          try {
            return JSON.stringify((res as any)?.data ?? null)
          } catch {
            return ''
          }
        })()
        uni.showModal({
          title: `连接失败(${statusCode})`,
          content: body ? body.slice(0, 1500) : '无响应内容',
          showCancel: false
        })
      }
    },
    fail: (err) => {
      uni.hideLoading()
      const msg = (err as any)?.errMsg || '连接失败'
      uni.showModal({ title: '连接失败', content: msg, showCancel: false })
    }
  })
}

function save() {
  const url = normalize(value.value)
  if (!url) {
    uni.showToast({ title: '请输入正确的 IP 或 URL', icon: 'none' })
    return
  }
  uni.setStorageSync('DEV_MP_API_BASE_URL', url)
  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}
</script>

<style lang="scss" scoped>
.page {
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

.title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #111827;
}

.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
}

.field {
  margin-top: 40rpx;
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
  font-size: 30rpx;
  box-sizing: border-box;
  background: #fff;
}

.placeholder {
  color: #9ca3af;
}

.actions {
  margin-top: 36rpx;
  display: flex;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 96rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 800;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary {
  color: #fff;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
}

.secondary {
  color: #374151;
  background: #f3f4f6;
}

.btn[disabled] {
  opacity: 0.5;
}

.tip {
  display: block;
  margin-top: 28rpx;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>

