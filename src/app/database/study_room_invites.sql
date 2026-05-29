-- 自习室邀请表（在 Supabase SQL Editor 执行一次）
CREATE TABLE IF NOT EXISTS study_room_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT study_room_invites_no_self CHECK (inviter_id <> invitee_id),
  CONSTRAINT study_room_invites_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_study_room_invites_invitee ON study_room_invites(invitee_id, status, created_at);
