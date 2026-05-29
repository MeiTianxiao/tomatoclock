-- 你好局长 数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  wechat_openid TEXT UNIQUE,
  invite_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_focus_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  CONSTRAINT nickname_length CHECK (char_length(nickname) >= 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);

-- 周统计表（每周一自动创建新记录）
CREATE TABLE IF NOT EXISTS weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_rank VARCHAR(50) DEFAULT 'intern',
  highest_rank VARCHAR(50) DEFAULT 'intern',
  sessions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- 专注记录表
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_stats_id UUID REFERENCES weekly_stats(id) ON DELETE SET NULL,
  category VARCHAR(20) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  mode VARCHAR(10) NOT NULL,
  rank_before VARCHAR(50),
  rank_after VARCHAR(50),
  completed BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_category CHECK (category IN ('study', 'work', 'exam', 'reading', 'exercise', 'other')),
  CONSTRAINT valid_mode CHECK (mode IN ('strict', 'gentle'))
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON weekly_stats(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_week ON focus_sessions(week_stats_id);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_week_start ON weekly_stats(week_start);

CREATE TABLE IF NOT EXISTS friend_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT friend_invites_no_self CHECK (inviter_id <> invitee_id),
  CONSTRAINT friend_invites_status CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_friend_invites_invitee ON friend_invites(invitee_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_friend_invites_inviter ON friend_invites(inviter_id, status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_invites_unique_pending ON friend_invites(inviter_id, invitee_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friends_no_self CHECK (user_id <> friend_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_unique_pair ON friends(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);

-- 自习室邀请（小程序内通知，不依赖一次性订阅消息）
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

-- 创建视图：本周排行榜
CREATE OR REPLACE VIEW current_week_leaderboard AS
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  ws.current_rank,
  ws.total_minutes,
  ws.total_points,
  RANK() OVER (ORDER BY ws.total_points DESC, ws.total_minutes DESC) as position
FROM users u
JOIN weekly_stats ws ON u.id = ws.user_id
WHERE ws.week_start = date_trunc('week', CURRENT_DATE)::DATE
ORDER BY position;

-- 自动更新updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weekly_stats_updated_at
  BEFORE UPDATE ON weekly_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 获取或创建本周统计的函数
CREATE OR REPLACE FUNCTION get_or_create_weekly_stats(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_stats_id UUID;
BEGIN
  -- 计算本周一和周日
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := v_week_start + INTERVAL '6 days';

  -- 尝试获取现有记录
  SELECT id INTO v_stats_id
  FROM weekly_stats
  WHERE user_id = p_user_id AND week_start = v_week_start;

  -- 如果不存在则创建
  IF v_stats_id IS NULL THEN
    INSERT INTO weekly_stats (user_id, week_start, week_end)
    VALUES (p_user_id, v_week_start, v_week_end)
    RETURNING id INTO v_stats_id;
  END IF;

  RETURN v_stats_id;
END;
$$ LANGUAGE plpgsql;
