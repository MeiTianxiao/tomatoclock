import { get, post } from '@/utils/request'
import type { User } from '@/types'

export interface FriendInviteRecord {
  id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'canceled'
  created_at: string
  responded_at?: string | null
  inviter?: User | null
  invitee?: User | null
}

export async function inviteFriend(invite_code: string): Promise<{ invite: FriendInviteRecord; invitee: User }> {
  const res = await post('/friends/invite', { invite_code })
  return res.data
}

export async function getFriendInvites(): Promise<{ incoming: FriendInviteRecord[]; outgoing: FriendInviteRecord[] }> {
  const res = await get('/friends/invites')
  return res.data
}

export async function acceptFriendInvite(id: string): Promise<{ ok: true }> {
  const res = await post(`/friends/invites/${id}/accept`)
  return res.data
}

export async function rejectFriendInvite(id: string): Promise<{ ok: true }> {
  const res = await post(`/friends/invites/${id}/reject`)
  return res.data
}

export async function getFriends(): Promise<User[]> {
  const res = await get('/friends')
  return res.data
}

