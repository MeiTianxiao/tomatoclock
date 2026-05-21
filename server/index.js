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
let friendInvites = [];
let friends = [];

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

async function sendWechatSubscribeMessage(openid, template_id, page, data) {
  const accessToken = await getWeChatAccessToken();
  if (!accessToken) return { ok: false, message: '获取 access_token 失败' };

  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(accessToken)}`;
  const body = {
    touser: openid,
    template_id,
    page: page || 'pages/home/index',
    data: data
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await resp.json();
    if (json.errcode === 0) {
      return { ok: true };
    } else {
      console.error('发送微信订阅消息失败:', json);
      return { ok: false, message: json.errmsg, data: json };
    }
  } catch (e) {
    console.error('发送微信订阅消息异常:', e);
    return { ok: false, message: e.message };
  }
}

// 内存中存储自习室信息
// key: 房间验证码, value: { code, created_at, members: Map(userId -> { user, joined_at, last_ping }) }
const studyRooms = new Map();

// 清理超时的自习室成员 (比如 30 秒没 ping 视为掉线)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of studyRooms.entries()) {
    for (const [userId, member] of room.members.entries()) {
      if (now - member.last_ping > 30000) {
        room.members.delete(userId);
      }
    }
    if (room.members.size === 0) {
      studyRooms.delete(code);
    }
  }
}, 10000);

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
    const { data: existed, error: existedError } = await supabase
      .from('weekly_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (existedError) {
      return { ok: false, message: existedError.message };
    }
    if (existed) {
      return { ok: true };
    }

    const { error: insertError } = await supabase.from('weekly_stats').insert({
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      total_minutes: 0,
      total_points: 0,
      current_rank: 'intern',
      highest_rank: 'intern',
      sessions_completed: 0
    });
    return insertError ? { ok: false, message: insertError.message } : { ok: true };
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

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function generateUniqueInviteCode() {
  for (let i = 0; i < 20; i++) {
    const code = makeInviteCode();
    if (supabase) {
      const { data, error } = await supabase.from('users').select('id').eq('invite_code', code).maybeSingle();
      if (!error && !data) return code;
      continue;
    }
    if (!users.some(u => u.invite_code === code)) return code;
  }
  return `${makeInviteCode()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

function getToken(req) {
  const raw = req.headers.authorization || '';
  const parts = raw.split(' ');
  return parts.length === 2 ? parts[1] : '';
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
        if (!existed.invite_code) updatePayload.invite_code = await generateUniqueInviteCode();

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
      const inviteCode = await generateUniqueInviteCode();

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname: finalNickname,
          avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
          wechat_openid: openid,
          invite_code: inviteCode,
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
    if (!existed.invite_code) existed.invite_code = await generateUniqueInviteCode();
    return res.json({ code: 200, message: '登录成功', data: { user: existed, token: existed.id } });
  }

  const finalNickname = typeof nickname === 'string' && nickname.length >= 2 ? nickname : '微信用户';
  const inviteCode = await generateUniqueInviteCode();
  const newUser = {
    id: uuidv4(),
    nickname: finalNickname,
    avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
    wechat_openid: openid,
    invite_code: inviteCode,
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
      const inviteCode = await generateUniqueInviteCode();
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname,
          avatar_url: null,
          invite_code: inviteCode,
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
    invite_code: await generateUniqueInviteCode(),
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

      const now = new Date().toISOString();
      const updatePayload = { last_login: now };
      if (!user.invite_code) updatePayload.invite_code = await generateUniqueInviteCode();

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id)
        .select('*')
        .single();

      if (updateError) {
        return res.status(500).json({ code: 500, message: updateError.message });
      }

      return res.json({ code: 200, message: '登录成功', data: { user: updated, token: updated.id } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
  
  const user = users.find(u => u.nickname === nickname);
  if (!user) {
    return res.status(400).json({ code: 400, message: '用户不存在，请先注册' });
  }
  
  user.last_login = new Date().toISOString();
  if (!user.invite_code) user.invite_code = await generateUniqueInviteCode();
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

app.post('/api/focus/end', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });

  const { duration_minutes, points, rank_after } = req.body;
  if (typeof duration_minutes !== 'number' || typeof points !== 'number') {
    return res.status(400).json({ code: 400, message: '参数错误' });
  }

  if (supabase) {
    try {
      const weekStart = getWeekStart();
      const { data: stats, error: statsError } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', token)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (statsError) throw statsError;

      if (stats) {
        const newTotalMinutes = stats.total_minutes + duration_minutes;
        const newTotalPoints = stats.total_points + points;
        const newSessionsCompleted = stats.sessions_completed + 1;
        const newRank = rank_after || stats.current_rank;

        await supabase
          .from('weekly_stats')
          .update({
            total_minutes: newTotalMinutes,
            total_points: newTotalPoints,
            current_rank: newRank,
            sessions_completed: newSessionsCompleted
          })
          .eq('id', stats.id);
      } else {
        await supabase
          .from('weekly_stats')
          .insert({
            user_id: token,
            week_start: weekStart,
            week_end: getWeekEnd(),
            total_minutes: duration_minutes,
            total_points: points,
            current_rank: rank_after || 'intern',
            highest_rank: rank_after || 'intern',
            sessions_completed: 1
          });
      }

      await supabase.rpc('increment_user_stats', {
        x_user_id: token,
        x_minutes: duration_minutes,
        x_sessions: 1
      });

      // 发送专注完成微信通知
      const { data: u } = await supabase.from('users').select('wechat_openid, nickname').eq('id', token).maybeSingle();
      if (u && u.wechat_openid) {
        // 注意：这里的 thing1, time2 等字段必须和你在微信公众平台申请的模板详情中的字段名完全一致！
        // 如果字段名不对，会报 47003 错误
        sendWechatSubscribeMessage(u.wechat_openid, 'Q_caCI_KtwEuo1xG8JgyUU4pkdVHsnN4JUsZFB52uTo', 'pages/home/index', {
          thing1: { value: '专注学习' }, // 习惯名称 (需按模板要求)
          thing2: { value: '已完成本次专注' }, // 完成情况
          time3: { value: new Date().toLocaleString('zh-CN', { hour12: false }) } // 完成时间
        });
      }

      return res.json({ code: 200, message: '记录成功' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  return res.json({ code: 200, message: '本地已忽略同步' });
});

app.post('/api/friends/invite', async (req, res) => {
  const token = getToken(req);
  const { invite_code } = req.body || {};
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  if (!invite_code || typeof invite_code !== 'string') {
    return res.status(400).json({ code: 400, message: '缺少邀请码' });
  }

  if (supabase) {
    try {
      const { data: invitee, error: inviteeError } = await supabase
        .from('users')
        .select('id,nickname,avatar_url,invite_code,wechat_openid')
        .eq('invite_code', invite_code.trim().toUpperCase())
        .maybeSingle();

      if (inviteeError) {
        return res.status(500).json({ code: 500, message: inviteeError.message });
      }
      if (!invitee) {
        return res.status(400).json({ code: 400, message: '邀请码无效' });
      }
      if (invitee.id === token) {
        return res.status(400).json({ code: 400, message: '不能添加自己' });
      }

      const { data: existedFriend, error: friendError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', token)
        .eq('friend_id', invitee.id)
        .maybeSingle();
      if (friendError) {
        return res.status(500).json({ code: 500, message: friendError.message });
      }
      if (existedFriend) {
        return res.status(400).json({ code: 400, message: '你们已经是好友了' });
      }

      const { data: forwardPending, error: forwardError } = await supabase
        .from('friend_invites')
        .select('id')
        .eq('inviter_id', token)
        .eq('invitee_id', invitee.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (forwardError) {
        return res.status(500).json({ code: 500, message: forwardError.message });
      }
      if (forwardPending) {
        return res.status(400).json({ code: 400, message: '已发送过好友申请，请等待对方同意' });
      }

      const { data: backwardPending, error: backwardError } = await supabase
        .from('friend_invites')
        .select('id')
        .eq('inviter_id', invitee.id)
        .eq('invitee_id', token)
        .eq('status', 'pending')
        .maybeSingle();
      if (backwardError) {
        return res.status(500).json({ code: 500, message: backwardError.message });
      }
      if (backwardPending) {
        return res.status(400).json({ code: 400, message: '对方已向你发起申请，请到“收到的申请”里同意' });
      }

      const { data: created, error: createError } = await supabase
        .from('friend_invites')
        .insert({
          inviter_id: token,
          invitee_id: invitee.id,
          status: 'pending'
        })
        .select('*')
        .single();

      if (createError) {
        return res.status(500).json({ code: 500, message: createError.message });
      }

      // 发送好友申请微信通知
      const { data: inviterUser } = await supabase.from('users').select('nickname').eq('id', token).maybeSingle();
      if (invitee.wechat_openid && inviterUser) {
        sendWechatSubscribeMessage(invitee.wechat_openid, 't_isd35azCSmKHjy5crOhlLaGntp8Z-h-_9xQqaWsjU', 'pages/friends/index', {
          thing1: { value: '好友申请' }, // 申请类型或提示
          name2: { value: inviterUser.nickname.slice(0, 10) }, // 申请人昵称 (限制长度)
          time3: { value: new Date().toLocaleString('zh-CN', { hour12: false }) } // 申请时间
        });
      }

      return res.json({ code: 200, message: 'success', data: { invite: created, invitee } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const invitee = users.find(u => (u.invite_code || '').toUpperCase() === invite_code.trim().toUpperCase());
  if (!invitee) {
    return res.status(400).json({ code: 400, message: '邀请码无效' });
  }
  if (invitee.id === token) {
    return res.status(400).json({ code: 400, message: '不能添加自己' });
  }
  if (friends.some(f => f.user_id === token && f.friend_id === invitee.id)) {
    return res.status(400).json({ code: 400, message: '你们已经是好友了' });
  }
  if (friendInvites.some(i => i.inviter_id === token && i.invitee_id === invitee.id && i.status === 'pending')) {
    return res.status(400).json({ code: 400, message: '已发送过好友申请，请等待对方同意' });
  }
  if (friendInvites.some(i => i.inviter_id === invitee.id && i.invitee_id === token && i.status === 'pending')) {
    return res.status(400).json({ code: 400, message: '对方已向你发起申请，请到“收到的申请”里同意' });
  }

  const now = new Date().toISOString();
  const created = {
    id: uuidv4(),
    inviter_id: token,
    invitee_id: invitee.id,
    status: 'pending',
    created_at: now,
    responded_at: null
  };
  friendInvites.push(created);
  return res.json({ code: 200, message: 'success', data: { invite: created, invitee } });
});

app.get('/api/friends/invites', async (req, res) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const { data: incoming, error: incomingError } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('invitee_id', token)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (incomingError) {
        return res.status(500).json({ code: 500, message: incomingError.message });
      }

      const { data: outgoing, error: outgoingError } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('inviter_id', token)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (outgoingError) {
        return res.status(500).json({ code: 500, message: outgoingError.message });
      }

      const inviterIds = Array.from(new Set((incoming || []).map(i => i.inviter_id)));
      const inviteeIds = Array.from(new Set((outgoing || []).map(i => i.invitee_id)));

      const { data: inviterUsers, error: inviterUsersError } = inviterIds.length
        ? await supabase.from('users').select('id,nickname,avatar_url,invite_code').in('id', inviterIds)
        : { data: [], error: null };
      if (inviterUsersError) {
        return res.status(500).json({ code: 500, message: inviterUsersError.message });
      }

      const { data: inviteeUsers, error: inviteeUsersError } = inviteeIds.length
        ? await supabase.from('users').select('id,nickname,avatar_url,invite_code').in('id', inviteeIds)
        : { data: [], error: null };
      if (inviteeUsersError) {
        return res.status(500).json({ code: 500, message: inviteeUsersError.message });
      }

      const inviterMap = new Map((inviterUsers || []).map(u => [u.id, u]));
      const inviteeMap = new Map((inviteeUsers || []).map(u => [u.id, u]));

      return res.json({
        code: 200,
        message: 'success',
        data: {
          incoming: (incoming || []).map(i => ({ ...i, inviter: inviterMap.get(i.inviter_id) || null })),
          outgoing: (outgoing || []).map(i => ({ ...i, invitee: inviteeMap.get(i.invitee_id) || null }))
        }
      });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const incoming = friendInvites
    .filter(i => i.invitee_id === token && i.status === 'pending')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(i => ({ ...i, inviter: users.find(u => u.id === i.inviter_id) || null }));
  const outgoing = friendInvites
    .filter(i => i.inviter_id === token && i.status === 'pending')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(i => ({ ...i, invitee: users.find(u => u.id === i.invitee_id) || null }));
  return res.json({ code: 200, message: 'success', data: { incoming, outgoing } });
});

app.post('/api/friends/invites/:id/accept', async (req, res) => {
  const token = getToken(req);
  const { id } = req.params;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('id', id)
        .eq('invitee_id', token)
        .eq('status', 'pending')
        .maybeSingle();
      if (inviteError) {
        return res.status(500).json({ code: 500, message: inviteError.message });
      }
      if (!invite) {
        return res.status(400).json({ code: 400, message: '申请不存在或已处理' });
      }

      const { error: updateError } = await supabase
        .from('friend_invites')
        .update({ status: 'accepted', responded_at: now })
        .eq('id', invite.id);
      if (updateError) {
        return res.status(500).json({ code: 500, message: updateError.message });
      }

      const { error: upsertError } = await supabase.from('friends').upsert(
        [
          { user_id: token, friend_id: invite.inviter_id },
          { user_id: invite.inviter_id, friend_id: token }
        ],
        { onConflict: 'user_id,friend_id' }
      );
      if (upsertError) {
        return res.status(500).json({ code: 500, message: upsertError.message });
      }

      return res.json({ code: 200, message: 'success', data: { ok: true } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const invite = friendInvites.find(i => i.id === id && i.invitee_id === token && i.status === 'pending');
  if (!invite) {
    return res.status(400).json({ code: 400, message: '申请不存在或已处理' });
  }
  invite.status = 'accepted';
  invite.responded_at = now;
  friends.push({ id: uuidv4(), user_id: token, friend_id: invite.inviter_id, created_at: now });
  friends.push({ id: uuidv4(), user_id: invite.inviter_id, friend_id: token, created_at: now });
  return res.json({ code: 200, message: 'success', data: { ok: true } });
});

app.post('/api/friends/invites/:id/reject', async (req, res) => {
  const token = getToken(req);
  const { id } = req.params;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('friend_invites')
        .select('id')
        .eq('id', id)
        .eq('invitee_id', token)
        .eq('status', 'pending')
        .maybeSingle();
      if (inviteError) {
        return res.status(500).json({ code: 500, message: inviteError.message });
      }
      if (!invite) {
        return res.status(400).json({ code: 400, message: '申请不存在或已处理' });
      }

      const { error: updateError } = await supabase
        .from('friend_invites')
        .update({ status: 'rejected', responded_at: now })
        .eq('id', id);
      if (updateError) {
        return res.status(500).json({ code: 500, message: updateError.message });
      }

      return res.json({ code: 200, message: 'success', data: { ok: true } });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const invite = friendInvites.find(i => i.id === id && i.invitee_id === token && i.status === 'pending');
  if (!invite) {
    return res.status(400).json({ code: 400, message: '申请不存在或已处理' });
  }
  invite.status = 'rejected';
  invite.responded_at = now;
  return res.json({ code: 200, message: 'success', data: { ok: true } });
});

app.get('/api/friends', async (req, res) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const { data: rels, error: relError } = await supabase.from('friends').select('friend_id').eq('user_id', token);
      if (relError) {
        return res.status(500).json({ code: 500, message: relError.message });
      }

      const ids = (rels || []).map(r => r.friend_id).filter(Boolean);
      if (!ids.length) {
        return res.json({ code: 200, message: 'success', data: [] });
      }

      const { data: list, error: listError } = await supabase
        .from('users')
        .select('id,nickname,avatar_url,invite_code')
        .in('id', ids);
      if (listError) {
        return res.status(500).json({ code: 500, message: listError.message });
      }

      return res.json({ code: 200, message: 'success', data: list || [] });
    } catch {
      return res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  const ids = friends.filter(f => f.user_id === token).map(f => f.friend_id);
  const list = users.filter(u => ids.includes(u.id)).map(u => ({ id: u.id, nickname: u.nickname, avatar_url: u.avatar_url, invite_code: u.invite_code }));
  return res.json({ code: 200, message: 'success', data: list });
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

app.get('/api/leaderboard/friends', async (req, res) => {
  const token = getToken(req);
  const limit = parseInt(req.query.limit) || 50;
  const weekStart = getWeekStart();
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  if (supabase) {
    try {
      const { data: rels, error: relError } = await supabase.from('friends').select('friend_id').eq('user_id', token);
      if (relError) {
        return res.status(500).json({ code: 500, message: relError.message });
      }

      const ids = Array.from(new Set([token, ...(rels || []).map(r => r.friend_id).filter(Boolean)]));
      if (!ids.length) {
        return res.json({ code: 200, message: 'success', data: [] });
      }

      const { data, error } = await supabase
        .from('weekly_stats')
        .select('user_id,current_rank,total_minutes,total_points,users!weekly_stats_user_id_fkey(id,nickname,avatar_url)')
        .eq('week_start', weekStart)
        .in('user_id', ids)
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

  const ids = Array.from(
    new Set([token, ...friends.filter(f => f.user_id === token).map(f => f.friend_id).filter(Boolean)])
  );
  const thisWeekStats = weeklyStats.filter(s => s.week_start === weekStart && ids.includes(s.user_id));
  const leaderboard = thisWeekStats
    .map(s => {
      const user = users.find(u => u.id === s.user_id);
      return user
        ? {
            id: user.id,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            current_rank: s.current_rank,
            total_minutes: s.total_minutes,
            total_points: s.total_points
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.total_points - a.total_points) || (b.total_minutes - a.total_minutes))
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

  return res.json({ code: 200, message: 'success', data: leaderboard });
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

// =====================================
// 自习室 API (Study Room)
// =====================================

app.post('/api/study-room/join', async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });

  const roomCodeFromBody = req.body?.code || req.body?.room_code;
  let roomCode = roomCodeFromBody;

  // 获取用户信息
  let user = null;
  if (supabase) {
    const { data } = await supabase.from('users').select('id,nickname,avatar_url').eq('id', token).maybeSingle();
    user = data;
  } else {
    user = users.find(u => u.id === token);
  }
  if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });

  // 如果没有传 code，则是创建新房间
  if (!roomCode) {
    roomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    studyRooms.set(roomCode, {
      code: roomCode,
      created_at: Date.now(),
      members: new Map()
    });
  }

  const room = studyRooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ code: 404, message: '自习室不存在或已关闭' });
  }

  // 加入房间
  room.members.set(user.id, {
    user,
    joined_at: Date.now(),
    last_ping: Date.now()
  });

  const membersList = Array.from(room.members.values()).map(m => m.user);

  return res.json({
    code: 200,
    message: 'success',
    data: {
      code: roomCode,
      members: membersList
    }
  });
});

app.post('/api/study-room/ping', async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });

  const roomCode = req.body?.code || req.body?.room_code;
  const room = studyRooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ code: 404, message: '自习室不存在或已关闭' });
  }

  const member = room.members.get(token);
  if (!member) {
    return res.status(404).json({ code: 404, message: '您不在该自习室中' });
  }

  // 更新最后心跳时间
  member.last_ping = Date.now();

  const membersList = Array.from(room.members.values()).map(m => m.user);

  return res.json({
    code: 200,
    message: 'success',
    data: {
      code: room.code,
      members: membersList
    }
  });
});

app.post('/api/study-room/leave', async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });

  const roomCode = req.body?.code || req.body?.room_code;
  const room = studyRooms.get(roomCode);
  if (room) {
    room.members.delete(token);
    if (room.members.size === 0) {
      studyRooms.delete(roomCode);
    }
  }

  return res.json({ code: 200, message: '已离开' });
});

app.get('/api/study-room/:code', async (req, res) => {
  const { code } = req.params;
  const room = studyRooms.get(code);
  if (!room) {
    return res.status(404).json({ code: 404, message: '自习室不存在' });
  }
  
  const membersList = Array.from(room.members.values()).map(m => m.user);
  return res.json({
    code: 200,
    message: 'success',
    data: {
      code: room.code,
      members: membersList
    }
  });
});

const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
  console.log(supabase ? 'Supabase enabled' : 'Supabase disabled');
});
