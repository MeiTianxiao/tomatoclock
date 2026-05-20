let hasShownBaseURLTip = false
let hasRetriedWakeup = false
const DEFAULT_API_BASE_URL = 'https://tomatoclock.onrender.com/api'

function getBaseURLMeta() {
  const wxAny = (globalThis as any).wx
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === 'function'

  if (isWeixinMp) {
    const prod = uni.getStorageSync('PROD_API_BASE_URL')
    if (typeof prod === 'string' && /^https?:\/\//.test(prod)) {
      return { baseURL: prod, needsDevConfig: false }
    }

    return { baseURL: DEFAULT_API_BASE_URL, needsDevConfig: false }
  }

  if (typeof location !== 'undefined') {
    const isDevHost = ['localhost', '127.0.0.1'].includes(location.hostname)
    const baseURL = isDevHost ? 'http://localhost:3000/api' : DEFAULT_API_BASE_URL
    return { baseURL, needsDevConfig: false }
  }

  return { baseURL: DEFAULT_API_BASE_URL, needsDevConfig: false }
}

export interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

export async function request<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: Record<string, any>
    headers?: Record<string, string>
  } = {}
): Promise<ResponseData<T>> {
  const { method = 'GET', data = {}, headers = {} } = options
  
  const token = uni.getStorageSync('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    const { baseURL, needsDevConfig } = getBaseURLMeta()
    if (needsDevConfig) {
      reject(new Error('请先配置接口地址'))
      return
    }

    const fullURL = `${baseURL}${url}`

    uni.request({
      url: fullURL,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 90000,
      success: (res) => {
        const result = res.data as ResponseData<T>
        if (result.code === 200) {
          hasRetriedWakeup = false
          resolve(result)
        } else if (result.code === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.navigateTo({ url: '/pages/auth/index' })
          reject(new Error('登录失效'))
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
          reject(new Error(result.message))
        }
      },
      fail: (err) => {
        const msg = (err as any)?.errMsg || ''
        const isTimeout = msg.includes('timeout')
        const shouldRetry = isTimeout && !hasRetriedWakeup
        if (shouldRetry) {
          hasRetriedWakeup = true
          uni.showToast({ title: '服务唤醒中，正在重试…', icon: 'none' })
          uni.request({
            url: fullURL,
            method,
            data,
            header: {
              'Content-Type': 'application/json',
              ...headers
            },
            timeout: 90000,
            success: (res) => {
              const result = res.data as ResponseData<T>
              if (result.code === 200) {
                hasRetriedWakeup = false
                resolve(result)
              } else if (result.code === 401) {
                uni.removeStorageSync('token')
                uni.removeStorageSync('user')
                uni.navigateTo({ url: '/pages/auth/index' })
                reject(new Error('登录失效'))
              } else {
                uni.showToast({ title: result.message, icon: 'none' })
                reject(new Error(result.message))
              }
            },
            fail: (err2) => {
              uni.showToast({ title: '网络请求失败', icon: 'none' })
              reject(err2)
            }
          })
          return
        }

        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function get<T = any>(url: string, params?: Record<string, any>): Promise<ResponseData<T>> {
  let query = ''
  if (params) {
    query = '?' + new URLSearchParams(params).toString()
  }
  return request<T>(url + query, { method: 'GET' })
}

export function post<T = any>(url: string, data?: Record<string, any>): Promise<ResponseData<T>> {
  return request<T>(url, { method: 'POST', data })
}

export function put<T = any>(url: string, data?: Record<string, any>): Promise<ResponseData<T>> {
  return request<T>(url, { method: 'PUT', data })
}

export function del<T = any>(url: string): Promise<ResponseData<T>> {
  return request<T>(url, { method: 'DELETE' })
}
