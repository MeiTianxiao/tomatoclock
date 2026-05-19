let hasShownBaseURLTip = false

function getBaseURLMeta() {
  const wxAny = (globalThis as any).wx
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === 'function'

  if (isWeixinMp) {
    const sys = uni.getSystemInfoSync()
    const prod = uni.getStorageSync('PROD_API_BASE_URL')
    if (typeof prod === 'string' && /^https?:\/\//.test(prod)) {
      return { baseURL: prod, needsDevConfig: false }
    }

    const stored = uni.getStorageSync('DEV_MP_API_BASE_URL')
    if (typeof stored === 'string' && /^https?:\/\//.test(stored)) {
      return { baseURL: stored, needsDevConfig: false }
    }

    if (sys.platform === 'devtools') {
      return { baseURL: 'http://localhost:3000/api', needsDevConfig: false }
    }

    if (!hasShownBaseURLTip) {
      hasShownBaseURLTip = true
      uni.navigateTo({ url: '/pages/dev-api/index' })
    }

    return { baseURL: '', needsDevConfig: true }
  }

  if (typeof location !== 'undefined') {
    const isDevHost = ['localhost', '127.0.0.1'].includes(location.hostname)
    const baseURL = isDevHost ? 'http://localhost:3000/api' : 'http://localhost:3000/api'
    return { baseURL, needsDevConfig: false }
  }

  return { baseURL: 'http://localhost:3000/api', needsDevConfig: false }
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

    uni.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...headers
      },
      success: (res) => {
        const result = res.data as ResponseData<T>
        if (result.code === 200) {
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
