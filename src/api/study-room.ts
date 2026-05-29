import { post } from '@/utils/request'

export interface StudyRoomInviteResult {
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
