import { get, post } from '@/utils/request'
import type { FocusSession, FocusCategory } from '@/types'

export async function saveSession(data: {
  category: FocusCategory
  duration_minutes: number
  points_earned: number
  mode: 'strict' | 'gentle'
  rank_before: string
  rank_after: string
  started_at: string
  completed_at: string
}): Promise<FocusSession> {
  const res = await post('/sessions', data)
  return res.data
}

export async function getSessions(userId: string): Promise<FocusSession[]> {
  const res = await get(`/sessions?user_id=${userId}`)
  return res.data
}

export async function getTodaySessions(): Promise<FocusSession[]> {
  const res = await get('/sessions/today')
  return res.data
}
