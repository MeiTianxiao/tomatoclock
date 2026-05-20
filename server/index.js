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

const wechatAppId = process.env.WECHAT_APPID || '';
const wechatSecret = process.env.WECHAT_SECRET || '';

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

app.get('/api/version', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      commit: process.env.RENDER_GIT_COMMIT || '',
      serviceId: process.env.RENDER_SERVICE_ID || '',
      node: process.version,
      wechatConfigured: !!wechatAppId && !!wechatSecret,
      supabaseEnabled: !!supabase,
      time: new Date().toISOString()
    }
  });
});

app.get('/api/routes', (req, res) => {
  const stack = app?._router?.stack || [];
  const routes = [];
  for (const layer of stack) {
    if (!layer?.route) continue;
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods || {}).filter(m => layer.route.methods[m]);
    routes.push({ path, methods });
  }
  res.json({ code: 200, message: 'ok', data: routes });
});

let users = [];
let sessions = [];
let weeklyStats = [];

let wechatAccessToken = { token: '', expiresAt: 0 };

async function getWeChatAccessToken() {
  if (!wechatAppId || !wechatSecret) {
    return null;
  }

  const now = Date.now();
  if (wechatAccessToken.token && wechatAccessToken.expiresAt > now + 60_000) {
    return wechatAccessToken.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(
    wechatAppId
  )}&secret=${encodeURIComponent(wechatSecret)}`;

  const resp = await fetch(url);
  const json = await resp.json();
  if (json?.access_token) {
    wechatAccessToken = {
      token: json.access_token,
      expiresAt: now + (json.expires_in || 7200) * 1000
    };
    return wechatAccessToken.token;
  }
  return null;
}

async function wechatJscode2session(code) {
  if (!wechatAppId || !wechatSecret) {
    return { ok: false, message: '未配置微信 AppID/Secret' };
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(
    wechatAppId
  )}&secret=${encodeURIComponent(wechatSecret)}&js_code=${encodeURIComponent(
    code
  )}&grant_type=authorization_code`;

  const resp = await fetch(url);
  const json = await resp.json();
  if (json?.errcode) {
    return { ok: false, message: json.errmsg || '微信登录失败', data: json };
  }
  if (!json?.openid) {
    return { ok: false, message: '微信登录失败(openid为空)', data: json };
  }
  return { ok: true, data: json };
}

async function ensureWeeklyStats(userId) {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  if (supabase) {
    const { error } = await supabase.from('weekly_stats').upsert(
      {
        user_id: userId,
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
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const existed = weeklyStats.find(s => s.user_id === userId && s.week_start === weekStart);
  if (!existed) {
    weeklyStats.push({
      id: uuidv4(),
      user_id: userId,
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
  }
  return { ok: true };
}

async function pickUniqueNickname(preferred) {
  const base = (preferred || '').trim();
  const raw = base.length >= 2 ? base : `微信用户${Math.random().toString(16).slice(2, 6)}`;

  const existsByNickname = async nickname => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('id').eq('nickname', nickname).maybeSingle();
      if (error) return true;
      return !!data;
    }
    return users.some(u => u.nickname === nickname);
  };

  let nickname = raw;
  for (let i = 0; i < 20; i++) {
    const exists = await existsByNickname(nickname);
    if (!exists) return nickname;
    nickname = `${raw}${Math.floor(10 + Math.random() * 90)}`;
  }
  return `${raw}${Date.now().toString().slice(-4)}`;
}

app.post('/api/wechat/login', async (req, res) => {
  const { code, nickname, avatar_url } = req.body || {};
  if (!code) {
    return res.status(400).json({ code: 400, message: '缺少微信 code' });
  }

  const sessionResult = await wechatJscode2session(code);
  if (!sessionResult.ok) {
    return res.status(400).json({ code: 400, message: sessionResult.message, data: sessionResult.data || null });
  }

  const openid = sessionResult.data.openid;
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data: existed, error: existedError } = await supabase
        .from('users')
        .select('*')
        .eq('wechat_openid', openid)
        .maybeSingle();

      if (existedError) {
        return res.status(500).json({ code: 500, message: existedError.message });
      }

      if (existed) {
        const updatePayload = { last_login: now };
        if (typeof avatar_url === 'string' && avatar_url) updatePayload.avatar_url = avatar_url;
        if (typeof nickname === 'string' && nickname.length >= 2) updatePayload.nickname = nickname;

        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', existed.id)
          .select('*')
          .single();

        if (updateError) {
          return res.status(500).json({ code: 500, message: updateError.message });
        }

        const stats = await ensureWeeklyStats(updated.id);
        if (!stats.ok) {
          return res.status(500).json({ code: 500, message: stats.message });
        }

        return res.json({ code: 200, message: '登录成功', data: { user: updated, token: updated.id } });
      }

      const finalNickname = typeof nickname === 'string' && nickname.length >= 2 ? nickname : '微信用户';

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname: finalNickname,
          avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
          wechat_openid: openid,
          phone_number: null,
          total_focus_minutes: 0,
          total_sessions: 0,
          last_login: now
        })
        .select('*')
        .single();

      if (insertError) {
        return res.status(500).json({ code: 500, message: insertError.message });
      }

      const stats = await ensureWeeklyStats(newUser.id);
      if (!stats.ok) {
        return res.status(500).json({ code: 500, message: stats.message });
      }

      return res.json({ code: 200, message: '登录成功', data: { user: newUser, token: newUser.id } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const existed = users.find(u => u.wechat_openid === openid);
  if (existed) {
    existed.last_login = now;
    if (typeof avatar_url === 'string' && avatar_url) existed.avatar_url = avatar_url;
    if (typeof nickname === 'string' && nickname.length >= 2) existed.nickname = nickname;
    return res.json({ code: 200, message: '登录成功', data: { user: existed, token: existed.id } });
  }

  const finalNickname = typeof nickname === 'string' && nickname.length >= 2 ? nickname : '微信用户';
  const newUser = {
    id: uuidv4(),
    nickname: finalNickname,
    avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
    wechat_openid: openid,
    phone_number: null,
    total_focus_minutes: 0,
    total_sessions: 0,
    created_at: now,
    last_login: now
  };
  users.push(newUser);
  await ensureWeeklyStats(newUser.id);
  return res.json({ code: 200, message: '登录成功', data: { user: newUser, token: newUser.id } });
});

app.post('/api/wechat/phone', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { code } = req.body || {};
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  if (!code) {
    return res.status(400).json({ code: 400, message: '缺少手机号 code' });
  }

  const accessToken = await getWeChatAccessToken();
  if (!accessToken) {
    return res.status(500).json({ code: 500, message: '获取微信 access_token 失败，请检查 AppID/Secret' });
  }

  const resp = await fetch(
    `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    }
  );
  const json = await resp.json();
  if (json?.errcode) {
    return res.status(400).json({ code: 400, message: json.errmsg || '获取手机号失败', data: json });
  }

  const phoneNumber = json?.phone_info?.phoneNumber || '';
  if (!phoneNumber) {
    return res.status(400).json({ code: 400, message: '获取手机号失败(号码为空)', data: json });
  }

  if (supabase) {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ phone_number: phoneNumber })
      .eq('id', token)
      .select('*')
      .maybeSingle();
    if (error) {
      return res.status(500).json({ code: 500, message: error.message });
    }
    return res.json({ code: 200, message: 'success', data: { phone_number: phoneNumber, user: updated } });
  }

  const user = users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户不存在' });
  }
  user.phone_number = phoneNumber;
  return res.json({ code: 200, message: 'success', data: { phone_number: phoneNumber, user } });
});

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
