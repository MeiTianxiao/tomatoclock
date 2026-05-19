import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { register, login, getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!user.value && !!token.value)

  async function registerUser(nickname: string) {
    const result = await register(nickname)
    user.value = result
    token.value = result.id
    uni.setStorageSync('token', result.id)
    uni.setStorageSync('user', JSON.stringify(result))
    return result
  }

  async function loginUser(nickname: string) {
    const result = await login(nickname)
    user.value = result.user
    token.value = result.token
    uni.setStorageSync('token', result.token)
    uni.setStorageSync('user', JSON.stringify(result.user))
    return result.user
  }

  async function loadUser() {
    const storedToken = uni.getStorageSync('token')
    const storedUser = uni.getStorageSync('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        user.value = null
      }
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('user')
    uni.removeStorageSync('timer')
  }

  return {
    user,
    token,
    isLoggedIn,
    registerUser,
    loginUser,
    loadUser,
    logout
  }
})
