const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      const ms = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

app.get('/', (req, res) => {
  res.type('text/plain').send('OK. Try /api/leaderboard');
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          transport: WebSocket
        }
      })
    : null;

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      supabaseEnabled: !!supabase,
      time: new Date().toISOString()
    }
  });
});

let users = [];
let sessions = [];
let weeklyStats = [];

function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getWeekEnd() {
  const weekStart = new Date(getWeekStart());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd.toISOString().split('T')[0];
}

app.post('/api/users/register', async (req, res) => {
  const { nickname } = req.body;
  
  if (!nickname || nickname.length < 2) {
    return res.status(400).json({ code: 400, message: '昵称至少2个字符' });
  }

  if (supabase) {
    try {
      const { data: existed, error: existedError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .maybeSingle();

      if (existedError) {
        return res.status(500).json({ code: 500, message: existedError.message });
      }
      if (existed) {
        return res.status(400).json({ code: 400, message: '该昵称已被使用' });
      }

      const now = new Date().toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname,
          avatar_url: null,
          total_focus_minutes: 0,
          total_sessions: 0,
          last_login: now
        })
        .select('*')
        .single();

      if (insertError) {
        return res.status(500).json({ code: 500, message: insertError.message });
      }

      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      const { error: statsError } = await supabase
        .from('weekly_stats')
        .upsert(
          {
            user_id: newUser.id,
            week_start: weekStart,
            week_end: weekEnd,
            total_minutes: 0,
            total_points: 0,
            current_rank: 'intern',
            highest_rank: 'intern',
            sessions_completed: 0
          },
          { onConflict: 'user_id,week_start' }
        );

      if (statsError) {
        return res.status(500).json({ code: 500, message: statsError.message });
      }

      return res.json({ code: 200, message: '注册成功', data: newUser });
    } catch (e) {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const existingUser = users.find(u => u.nickname === nickname);
  if (existingUser) {
    return res.status(400).json({ code: 400, message: '该昵称已被使用' });
  }
  
  const newUser = {
    id: uuidv4(),
    nickname,
    avatar_url: null,
    total_focus_minutes: 0,
    total_sessions: 0,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };
  
  users.push(newUser);
  
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  weeklyStats.push({
    id: uuidv4(),
    user_id: newUser.id,
    week_start: weekStart,
    week_end: weekEnd,
    total_minutes: 0,
    total_points: 0,
    current_rank: 'intern',
    highest_rank: 'intern',
    sessions_completed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  res.json({ code: 200, message: '注册成功', data: newUser });
});

app.post('/api/users/login', async (req, res) => {
  const { nickname } = req.body;

  if (supabase) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }
      if (!user) {
        return res.status(400).json({ code: 400, message: '用户不存在，请先注册' });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        return res.status(500).json({ code: 500, message: updateError.message });
      }

      return res.json({ code: 200, message: '登录成功', data: { user, token: user.id } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const user = users.find(u => u.nickname === nickname);
  if (!user) {
    return res.status(400).json({ code: 400, message: '用户不存在，请先注册' });
  }
  
  user.last_login = new Date().toISOString();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
  }
  
  res.json({ code: 200, message: '登录成功', data: { user, token: user.id } });
});

app.get('/api/users/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const { data: user, error } = await supabase.from('users').select('*').eq('id', token).maybeSingle();
      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }
      if (!user) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }
      return res.json({ code: 200, message: 'success', data: user });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const user = users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户不存在' });
  }
  
  res.json({ code: 200, message: 'success', data: user });
});

app.get('/api/users/:userId/weekly-stats', async (req, res) => {
  const { userId } = req.params;
  const weekStart = getWeekStart();

  if (supabase) {
    try {
      const { data: stats, error } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }

      if (stats) {
        return res.json({ code: 200, message: 'success', data: stats });
      }

      const weekEnd = getWeekEnd();
      const { data: created, error: createError } = await supabase
        .from('weekly_stats')
        .insert({
          user_id: userId,
          week_start: weekStart,
          week_end: weekEnd,
          total_minutes: 0,
          total_points: 0,
          current_rank: 'intern',
          highest_rank: 'intern',
          sessions_completed: 0
        })
        .select('*')
        .single();

      if (createError) {
        return res.status(500).json({ code: 500, message: createError.message });
      }

      return res.json({ code: 200, message: 'success', data: created });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  let stats = weeklyStats.find(s => s.user_id === userId && s.week_start === weekStart);
  
  if (!stats) {
    stats = {
      id: uuidv4(),
      user_id: userId,
      week_start: weekStart,
      week_end: getWeekEnd(),
      total_minutes: 0,
      total_points: 0,
      current_rank: 'intern',
      highest_rank: 'intern',
      sessions_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    weeklyStats.push(stats);
  }
  
  res.json({ code: 200, message: 'success', data: stats });
});

app.post('/api/sessions', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', token).maybeSingle();
      if (userError) {
        return res.status(500).json({ code: 500, message: userError.message });
      }
      if (!user) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }

      const { category, duration_minutes, points_earned, mode, rank_before, rank_after, started_at, completed_at } =
        req.body;

      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();

      const { data: createdSession, error: sessionError } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          category,
          duration_minutes,
          points_earned,
          mode,
          rank_before,
          rank_after,
          started_at,
          completed_at,
          completed: true
        })
        .select('*')
        .single();

      if (sessionError) {
        return res.status(500).json({ code: 500, message: sessionError.message });
      }

      const nextTotalMinutes = (user.total_focus_minutes || 0) + (duration_minutes || 0);
      const nextTotalSessions = (user.total_sessions || 0) + 1;
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ total_focus_minutes: nextTotalMinutes, total_sessions: nextTotalSessions })
        .eq('id', user.id);

      if (userUpdateError) {
        return res.status(500).json({ code: 500, message: userUpdateError.message });
      }

      const { data: stats, error: statsError } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (statsError) {
        return res.status(500).json({ code: 500, message: statsError.message });
      }

      if (stats) {
        const { error: statsUpdateError } = await supabase
          .from('weekly_stats')
          .update({
            total_minutes: (stats.total_minutes || 0) + (duration_minutes || 0),
            total_points: (stats.total_points || 0) + (points_earned || 0),
            current_rank: rank_after,
            highest_rank: stats.highest_rank || rank_after,
            sessions_completed: (stats.sessions_completed || 0) + 1,
            week_end: stats.week_end || weekEnd
          })
          .eq('id', stats.id);

        if (statsUpdateError) {
          return res.status(500).json({ code: 500, message: statsUpdateError.message });
        }
      } else {
        const { error: statsCreateError } = await supabase.from('weekly_stats').insert({
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          total_minutes: duration_minutes || 0,
          total_points: points_earned || 0,
          current_rank: rank_after,
          highest_rank: rank_after,
          sessions_completed: 1
        });

        if (statsCreateError) {
          return res.status(500).json({ code: 500, message: statsCreateError.message });
        }
      }

      return res.json({ code: 200, message: '保存成功', data: createdSession });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const user = users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户不存在' });
  }
  
  const { category, duration_minutes, points_earned, mode, rank_before, rank_after, started_at, completed_at } = req.body;
  
  const newSession = {
    id: uuidv4(),
    user_id: user.id,
    category,
    duration_minutes,
    points_earned,
    mode,
    rank_before,
    rank_after,
    started_at,
    completed_at
  };
  
  sessions.push(newSession);
  
  user.total_focus_minutes += duration_minutes;
  user.total_sessions += 1;
  
  const weekStart = getWeekStart();
  let stats = weeklyStats.find(s => s.user_id === user.id && s.week_start === weekStart);
  if (stats) {
    stats.total_minutes += duration_minutes;
    stats.total_points += points_earned;
    stats.current_rank = rank_after;
    if (rank_after > stats.highest_rank) {
      stats.highest_rank = rank_after;
    }
    stats.sessions_completed += 1;
    stats.updated_at = new Date().toISOString();
  }
  
  res.json({ code: 200, message: '保存成功', data: newSession });
});

app.get('/api/sessions', async (req, res) => {
  const { user_id } = req.query;
  if (supabase) {
    try {
      const query = supabase.from('focus_sessions').select('*');
      const { data, error } = user_id ? await query.eq('user_id', user_id) : await query;
      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }
      return res.json({ code: 200, message: 'success', data: data || [] });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  let filtered = sessions;
  if (user_id) filtered = sessions.filter(s => s.user_id === user_id);
  res.json({ code: 200, message: 'success', data: filtered });
});

app.get('/api/sessions/today', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', token)
        .gte('completed_at', start.toISOString())
        .lt('completed_at', end.toISOString());

      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }

      return res.json({ code: 200, message: 'success', data: data || [] });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const userSessions = sessions.filter(s => s.user_id === token && s.completed_at.startsWith(today));
  res.json({ code: 200, message: 'success', data: userSessions });
});

app.get('/api/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const weekStart = getWeekStart();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('weekly_stats')
        .select('user_id,current_rank,total_minutes,total_points,users!weekly_stats_user_id_fkey(id,nickname,avatar_url)')
        .eq('week_start', weekStart)
        .order('total_points', { ascending: false })
        .order('total_minutes', { ascending: false })
        .limit(limit);

      if (error) {
        return res.status(500).json({ code: 500, message: error.message });
      }

      const leaderboard = (data || [])
        .map((row, index) => ({
          id: row.users?.id || row.user_id,
          nickname: row.users?.nickname || '',
          avatar_url: row.users?.avatar_url || null,
          current_rank: row.current_rank,
          total_minutes: row.total_minutes,
          total_points: row.total_points,
          position: index + 1
        }))
        .filter(e => e.nickname);

      return res.json({ code: 200, message: 'success', data: leaderboard });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const thisWeekStats = weeklyStats.filter(s => s.week_start === weekStart);
  
  const leaderboard = thisWeekStats
    .map(s => {
      const user = users.find(u => u.id === s.user_id);
      return user ? {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        current_rank: s.current_rank,
        total_minutes: s.total_minutes,
        total_points: s.total_points
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.total_points - a.total_points) || (b.total_minutes - a.total_minutes))
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      position: index + 1
    }));
  
  res.json({ code: 200, message: 'success', data: leaderboard });
});

const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
  console.log(supabase ? 'Supabase enabled' : 'Supabase disabled');
});
