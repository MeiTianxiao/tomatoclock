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

export async function getUserInfo(): Promise<User> {
  const res = await get('/users/me')
  return res.data
}

export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const res = await get(`/users/${userId}/weekly-stats`)
  return res.data
}

export async function updateUser(data: Partial<User>): Promise<User> {
  const res = await post('/users/update', data)
  return res.data
}
