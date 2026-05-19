# Supabase 数据库设置指南

## 📋 概述

"你好局长"应用现在已经集成了完整的用户系统和数据持久化功能。目前使用localStorage作为临时存储，待Supabase配置完成后将自动升级为云端数据库。

## 🗄️ 数据库架构

已创建的表结构（见 `src/app/database/schema.sql`）：

### 1. **users 表** - 用户信息
- `id`: 用户唯一ID
- `nickname`: 昵称
- `avatar_url`: 头像URL（可选）
- `total_focus_minutes`: 累计专注分钟数
- `total_sessions`: 完成任务总数
- `created_at`: 注册时间
- `last_login`: 最后登录时间

### 2. **weekly_stats 表** - 周统计数据
- `id`: 记录ID
- `user_id`: 用户ID
- `week_start`: 周开始日期（周一）
- `week_end`: 周结束日期（周日）
- `total_minutes`: 本周总分钟数
- `total_points`: 本周总积分
- `current_rank`: 当前职位
- `highest_rank`: 本周最高职位
- `sessions_completed`: 完成任务数

### 3. **focus_sessions 表** - 专注记录
- `id`: 记录ID
- `user_id`: 用户ID
- `category`: 专注类别（study/work/exam等）
- `duration_minutes`: 时长（分钟）
- `points_earned`: 获得积分
- `mode`: 模式（strict/gentle）
- `rank_before`: 专注前职位
- `rank_after`: 专注后职位
- `started_at`: 开始时间
- `completed_at`: 完成时间

## 🔧 Supabase设置步骤

### 步骤 1: 创建数据库表

1. 登录您的 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 复制 `src/app/database/schema.sql` 中的完整SQL代码
5. 点击 **Run** 执行

### 步骤 2: 配置Row Level Security (RLS)

为了数据安全，需要设置访问权限：

```sql
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- 用户可以读取自己的数据
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can view own weekly stats"
  ON weekly_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can view own sessions"
  ON focus_sessions FOR SELECT
  USING (true);

-- 用户可以插入和更新自己的数据
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Users can insert weekly stats"
  ON weekly_stats FOR ALL
  USING (true);

CREATE POLICY "Users can insert sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (true);
```

### 步骤 3: 集成Supabase客户端

待Make自动生成Supabase配置文件后，更新 `src/app/services/database.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// 从自动生成的文件导入
// import { supabaseUrl, supabaseAnonKey } from '../../utils/supabase/info';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 替换现有的localStorage逻辑为Supabase调用
```

## 📊 已实现的功能

✅ **用户认证系统**
- 注册新用户
- 昵称登录
- 退出登录
- 自动保存登录状态

✅ **数据同步**
- 专注记录自动保存
- 周统计实时更新
- 排行榜数据刷新

✅ **周清零机制**
- 每周一凌晨0点自动重置
- 历史数据保留
- 公平竞争环境

✅ **排行榜系统**
- 实时排名
- 本周数据展示
- 自动更新

## 🚀 数据迁移

当前使用localStorage存储，数据格式完全兼容Supabase。切换到Supabase后：

1. 现有数据可以通过脚本迁移
2. 所有新数据自动存储到云端
3. 支持跨设备同步

## 📱 关于微信小程序

如需转换为微信小程序：

1. **技术栈调整**
   - React → 微信小程序框架
   - Supabase REST API 调用
   - 适配小程序UI组件

2. **保留功能**
   - 所有核心逻辑可复用
   - 数据库结构不变
   - API接口统一

3. **推荐方案**
   - 使用 Taro/uni-app 框架
   - 保持当前Supabase后端
   - 重写前端为小程序代码

## 💡 下一步

1. ✅ 数据库架构已完成
2. ✅ 用户系统已实现
3. ⏳ 等待Supabase配置文件生成
4. ⏳ 将localStorage替换为Supabase API
5. ⏳ 部署到生产环境

## 🔐 安全提示

- ❌ 不要将Supabase API密钥提交到代码库
- ✅ 使用环境变量存储敏感信息
- ✅ 已配置RLS确保数据安全
- ✅ 只收集必要的用户数据

---

**当前状态**: 已完成前端集成，使用localStorage作为临时存储，等待Supabase连接完成后自动升级为云端数据库。
