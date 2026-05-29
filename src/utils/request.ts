let hasShownBaseURLTip = false
let hasRetriedWakeup = false
const DEFAULT_API_BASE_URL = 'https://tomatoclock.onrender.com/api'

function getBaseURLMeta() {
  const wxAny = (globalThis as any).wx
  const isWeixinMp = !!wxAny && typeof wxAny.getAccountInfoSync === 'function'

  if (isWeixinMp) {
    const dev = uni.getStorageSync('DEV_MP_API_BASE_URL')
    if (typeof dev === 'string' && /^https?:\/\//.test(dev)) {
      return { baseURL: dev, needsDevConfig: false }
    }

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

function resolveErrorMessage(result: unknown, statusCode = 200): string {
  if (result && typeof result === 'object') {
    const message = (result as ResponseData).message
    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }
  if (typeof result === 'string' && result.trim()) {
    return result.trim().slice(0, 80)
  }
  if (statusCode === 404) {
    return '接口不存在，请确认后端已部署最新版本'
  }
  if (statusCode >= 500) {
    return '服务器繁忙，请稍后再试'
  }
  if (statusCode >= 400) {
    return '请求失败，请稍后再试'
  }
  return '操作失败，请稍后再试'
}

function handleApiResponse<T>(
  res: UniApp.RequestSuccessCallbackResult,
  resolve: (value: ResponseData<T>) => void,
  reject: (reason?: unknown) => void
) {
  const statusCode = res.statusCode || 200
  const result = res.data as ResponseData<T> | string | null

  if (statusCode >= 400 && (!result || typeof result !== 'object' || typeof (result as ResponseData).code !== 'number')) {
    const msg = resolveErrorMessage(result, statusCode)
    uni.showToast({ title: msg, icon: 'none' })
    reject(new Error(msg))
    return
  }

  if (!result || typeof result !== 'object' || typeof (result as ResponseData).code !== 'number') {
    const msg = resolveErrorMessage(result, statusCode)
    uni.showToast({ title: msg, icon: 'none' })
    reject(new Error(msg))
    return
  }

  const payload = result as ResponseData<T>
  if (payload.code === 200) {
    hasRetriedWakeup = false
    resolve(payload)
    return
  }

  if (payload.code === 401) {
    uni.removeStorageSync('token')
    uni.removeStorageSync('user')
    uni.navigateTo({ url: '/pages/auth/index' })
    reject(new Error('登录失效'))
    return
  }

  const msg = resolveErrorMessage(payload, statusCode)
  uni.showToast({ title: msg, icon: 'none' })
  reject(new Error(msg))
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
        handleApiResponse<T>(res, resolve, reject)
      },
      fail: (err) => {
        const msg = (err as any)?.errMsg || ''
        const isNameNotResolved = msg.includes('ERR_NAME_NOT_RESOLVED')
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
              handleApiResponse<T>(res, resolve, reject)
            },
            fail: (err2) => {
              uni.showToast({ title: '网络请求失败', icon: 'none' })
              reject(err2)
            }
          })
          return
        }

        if (isNameNotResolved) {
          uni.showModal({
            title: '登录失败',
            content:
              '域名解析失败（ERR_NAME_NOT_RESOLVED）。这通常是当前网络无法解析 onrender 域名导致。\n\n建议：切换网络（手机热点/移动数据）或在“开发配置”里改用可访问的接口域名。',
            confirmText: '去配置',
            cancelText: '知道了',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({ url: '/pages/dev-api/index' })
              }
            }
          })
          reject(err)
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
