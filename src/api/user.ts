import { get, post } from '@/utils/request'
import type { User, WeeklyStats } from '@/types'

export async function register(nickname: string): Promise<User> {
  const res = await post('/users/register', { nickname })
  return res.data
}

export async function login(nickname: string): Promise<{ user: User; token: string }> {
  const res = await post('/users/login', { nickname })
  return res.data
}

export async function wechatLogin(payload: { code: string; nickname?: string; avatar_url?: string }): Promise<{ user: User; token: string }> {
  const res = await post('/wechat/login', payload)
  return res.data
}

export async function bindWeChatPhone(code: string): Promise<{ phone_number: string; user?: User }> {
  const res = await post('/wechat/phone', { code })
  return res.data
}

export async function getUserInfo(): Promise<User> {
  const res = await get('/users/me')
  return res.data
}

export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const res = await get(`/users/${userId}/weekly-stats`)
  return res.data
}

export async function syncFocusEnd(data: { duration_minutes: number; points: number; rank_after: string }) {
  const res = await post('/focus/end', data)
  return res.data
}
