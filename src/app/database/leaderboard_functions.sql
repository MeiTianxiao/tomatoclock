-- 排行榜查询函数：以 users 为主表，LEFT JOIN 本周 weekly_stats
-- 在 Supabase SQL Editor 中执行一次即可

CREATE OR REPLACE FUNCTION public.fetch_leaderboard(p_week_start date, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  nickname varchar,
  avatar_url text,
  current_rank varchar,
  total_minutes int,
  total_points int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    COALESCE(ws.current_rank, 'intern')::varchar AS current_rank,
    COALESCE(ws.total_minutes, 0) AS total_minutes,
    COALESCE(ws.total_points, 0) AS total_points
  FROM users u
  LEFT JOIN weekly_stats ws
    ON ws.user_id = u.id AND ws.week_start = p_week_start
  WHERE u.nickname IS NOT NULL AND char_length(trim(u.nickname)) >= 2
  ORDER BY COALESCE(ws.total_points, 0) DESC, COALESCE(ws.total_minutes, 0) DESC
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE OR REPLACE FUNCTION public.fetch_friends_leaderboard(
  p_user_id uuid,
  p_week_start date,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  nickname varchar,
  avatar_url text,
  current_rank varchar,
  total_minutes int,
  total_points int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH member_ids AS (
    SELECT DISTINCT uid
    FROM (
      SELECT p_user_id AS uid
      UNION
      SELECT f.friend_id AS uid
      FROM friends f
      WHERE f.user_id = p_user_id
    ) members
  )
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    COALESCE(ws.current_rank, 'intern')::varchar AS current_rank,
    COALESCE(ws.total_minutes, 0) AS total_minutes,
    COALESCE(ws.total_points, 0) AS total_points
  FROM member_ids m
  JOIN users u ON u.id = m.uid
  LEFT JOIN weekly_stats ws
    ON ws.user_id = u.id AND ws.week_start = p_week_start
  WHERE u.nickname IS NOT NULL AND char_length(trim(u.nickname)) >= 2
  ORDER BY COALESCE(ws.total_points, 0) DESC, COALESCE(ws.total_minutes, 0) DESC
  LIMIT GREATEST(p_limit, 1);
$$;
