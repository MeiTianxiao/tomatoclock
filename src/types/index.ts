export interface User {
  id: string
  nickname: string
  avatar_url?: string
  wechat_openid?: string
  invite_code?: string
  phone_number?: string
  total_focus_minutes: number
  total_sessions: number
  created_at: string
  last_login: string
}

export interface WeeklyStats {
  id: string
  user_id: string
  week_start: string
  week_end: string
  total_minutes: number
  total_points: number
  current_rank: string
  highest_rank: string
  sessions_completed: number
  created_at?: string
  updated_at?: string
}

export interface FocusSession {
  id: string
  user_id: string
  category: FocusCategory
  duration_minutes: number
  points_earned: number
  mode: 'strict' | 'gentle'
  rank_before: string
  rank_after: string
  started_at: string
  completed_at: string
}

export type FocusCategory = 'study' | 'work' | 'exam' | 'reading' | 'exercise' | 'other'

export type RankType = 'intern' | 'junior' | 'middle' | 'senior' | 'expert' | 'master'

export interface RankInfo {
  name: string
  points: number
  color: string
  icon: string
  avatar: string
}

export interface SessionRecord {
  id: string
  category: FocusCategory
  duration: number
  points: number
  completed: boolean
  startTime: number
}

export interface PromotionData {
  oldRank: string
  newRank: string
  earnedPoints: number
}

export const RANK_CONFIG: Record<RankType, RankInfo> = {
  intern: { name: '实习生', points: 0, color: '#9ca3af', icon: '👶', avatar: 'https://tomatoclock.onrender.com/static/ranks/intern.png' },
  junior: { name: '科员', points: 100, color: '#10b981', icon: '🧑‍�', avatar: 'https://tomatoclock.onrender.com/static/ranks/junior.png' },
  middle: { name: '科长', points: 300, color: '#3b82f6', icon: '�', avatar: 'https://tomatoclock.onrender.com/static/ranks/middle.png' },
  senior: { name: '处长', points: 600, color: '#8b5cf6', icon: '🏢', avatar: 'https://tomatoclock.onrender.com/static/ranks/senior.png' },
  expert: { name: '副局长', points: 1000, color: '#f59e0b', icon: '⭐', avatar: 'https://tomatoclock.onrender.com/static/ranks/expert.png' },
  master: { name: '局长', points: 1500, color: '#ef4444', icon: '👑', avatar: 'https://tomatoclock.onrender.com/static/ranks/master.png' }
}

export const CATEGORY_CONFIG: Record<FocusCategory, { name: string; color: string; icon: string }> = {
  study: { name: '学习', color: '#3b82f6', icon: '📚' },
  work: { name: '工作', color: '#10b981', icon: '💼' },
  exam: { name: '备考', color: '#f59e0b', icon: '📝' },
  reading: { name: '阅读', color: '#8b5cf6', icon: '📖' },
  exercise: { name: '运动', color: '#ec4899', icon: '🏃' },
  other: { name: '其他', color: '#6b7280', icon: '📌' }
}
