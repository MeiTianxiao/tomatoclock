import { get } from '@/utils/request'

export interface LeaderboardItem {
  id: string
  nickname: string
  avatar_url?: string
  current_rank: string
  total_minutes: number
  total_points: number
  position: number
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardItem[]> {
  const res = await get(`/leaderboard?limit=${limit}`)
  return res.data
}
