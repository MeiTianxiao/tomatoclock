// 数据库访问层 - 将在Supabase配置完成后实现真实逻辑

export interface User {
  id: string;
  nickname: string;
  avatar_url?: string;
  total_focus_minutes: number;
  total_sessions: number;
  created_at: string;
  last_login: string;
}

export interface WeeklyStats {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_minutes: number;
  total_points: number;
  current_rank: string;
  highest_rank: string;
  sessions_completed: number;
}

export interface FocusSession {
  id: string;
  user_id: string;
  category: string;
  duration_minutes: number;
  points_earned: number;
  mode: 'strict' | 'gentle';
  rank_before: string;
  rank_after: string;
  started_at: string;
  completed_at: string;
}

// 临时使用localStorage模拟，待Supabase配置完成后替换
class DatabaseService {
  private currentUser: User | null = null;

  async registerUser(nickname: string): Promise<User> {
    const users = this.getStoredUsers();

    const existingUser = users.find(u => u.nickname === nickname);
    if (existingUser) {
      throw new Error('该昵称已被使用');
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname,
      total_focus_minutes: 0,
      total_sessions: 0,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('nihao-juzhang-users', JSON.stringify(users));
    this.currentUser = newUser;
    localStorage.setItem('nihao-juzhang-current-user', JSON.stringify(newUser));

    return newUser;
  }

  async loginUser(nickname: string): Promise<User> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.nickname === nickname);

    if (!user) {
      throw new Error('用户不存在，请先注册');
    }

    user.last_login = new Date().toISOString();
    localStorage.setItem('nihao-juzhang-users', JSON.stringify(users));
    this.currentUser = user;
    localStorage.setItem('nihao-juzhang-current-user', JSON.stringify(user));

    return user;
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    const stored = localStorage.getItem('nihao-juzhang-current-user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }

    return null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('nihao-juzhang-current-user');
  }

  async getWeeklyStats(userId: string): Promise<WeeklyStats | null> {
    const stats = this.getStoredWeeklyStats();
    const weekStart = this.getWeekStart();

    return stats.find(s => s.user_id === userId && s.week_start === weekStart) || null;
  }

  async updateWeeklyStats(userId: string, data: Partial<WeeklyStats>): Promise<WeeklyStats> {
    const stats = this.getStoredWeeklyStats();
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();

    let userStats = stats.find(s => s.user_id === userId && s.week_start === weekStart);

    if (!userStats) {
      userStats = {
        id: `stats_${Date.now()}`,
        user_id: userId,
        week_start: weekStart,
        week_end: weekEnd,
        total_minutes: 0,
        total_points: 0,
        current_rank: 'intern',
        highest_rank: 'intern',
        sessions_completed: 0,
        ...data
      };
      stats.push(userStats);
    } else {
      Object.assign(userStats, data);
    }

    localStorage.setItem('nihao-juzhang-weekly-stats', JSON.stringify(stats));
    return userStats;
  }

  async saveFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const sessions = this.getStoredSessions();
    const newSession: FocusSession = {
      id: `session_${Date.now()}`,
      ...session
    };

    sessions.push(newSession);
    localStorage.setItem('nihao-juzhang-sessions', JSON.stringify(sessions));

    // 更新用户总统计
    if (this.currentUser) {
      this.currentUser.total_focus_minutes += session.duration_minutes;
      this.currentUser.total_sessions += 1;
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === this.currentUser!.id);
      if (userIndex !== -1) {
        users[userIndex] = this.currentUser;
        localStorage.setItem('nihao-juzhang-users', JSON.stringify(users));
        localStorage.setItem('nihao-juzhang-current-user', JSON.stringify(this.currentUser));
      }
    }

    return newSession;
  }

  async getLeaderboard(limit: number = 10): Promise<Array<User & { current_rank: string; total_minutes: number; position: number }>> {
    const stats = this.getStoredWeeklyStats();
    const users = this.getStoredUsers();
    const weekStart = this.getWeekStart();

    const thisWeekStats = stats.filter(s => s.week_start === weekStart);

    const leaderboard = thisWeekStats
      .map(s => {
        const user = users.find(u => u.id === s.user_id);
        return user ? {
          ...user,
          current_rank: s.current_rank,
          total_minutes: s.total_minutes,
          total_points: s.total_points
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b!.total_points - a!.total_points) || (b!.total_minutes - a!.total_minutes))
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry!,
        position: index + 1
      }));

    return leaderboard;
  }

  private getStoredUsers(): User[] {
    const stored = localStorage.getItem('nihao-juzhang-users');
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredWeeklyStats(): WeeklyStats[] {
    const stored = localStorage.getItem('nihao-juzhang-weekly-stats');
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredSessions(): FocusSession[] {
    const stored = localStorage.getItem('nihao-juzhang-sessions');
    return stored ? JSON.parse(stored) : [];
  }

  private getWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }

  private getWeekEnd(): string {
    const weekStart = new Date(this.getWeekStart());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd.toISOString().split('T')[0];
  }
}

export const db = new DatabaseService();
