import { get, post } from '@/utils/request'
import type { User } from '@/types'

export const STUDY_ROOM_INVITE_TMPL_ID = 'RTBtfzvBGRjq6g8cRCX6IsN_2spGTMwUMmtJFxsRbSc'

export interface StudyRoomInviteRecord {
  id: string
  inviter_id: string
  invitee_id: string
  room_code: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  responded_at?: string | null
  inviter?: Pick<User, 'id' | 'nickname' | 'avatar_url'> | null
  room_closed?: boolean
}

export interface StudyRoomInviteResult {
  inApp: boolean
  notified: boolean
  notifyMessage?: string
  invitee: { id: string; nickname: string }
}

export async function inviteFriendToStudyRoom(
  code: string,
  friend_id: string
): Promise<StudyRoomInviteResult> {
  const res = await post('/study-room/invite', { code, friend_id })
  return res.data
}

export async function getPendingStudyRoomInvites(): Promise<StudyRoomInviteRecord[]> {
  const res = await get('/study-room/invites')
  return res.data
}

export async function acceptStudyRoomInvite(id: string): Promise<{ room_code: string }> {
  const res = await post(`/study-room/invites/${id}/accept`)
  return res.data
}

export async function rejectStudyRoomInvite(id: string): Promise<void> {
  await post(`/study-room/invites/${id}/reject`)
}

export async function requestStudyRoomSubscribeMessage() {
  const wxAny = (globalThis as any).wx
  if (!wxAny || typeof wxAny.requestSubscribeMessage !== 'function') return
  const settingsStr = uni.getStorageSync('app-settings')
  if (settingsStr) {
    try {
      const settings = JSON.parse(settingsStr)
      if (settings.notifications === false) return
    } catch {
    }
  }
  try {
    await uni.requestSubscribeMessage({ tmplIds: [STUDY_ROOM_INVITE_TMPL_ID] })
  } catch {
  }
}
