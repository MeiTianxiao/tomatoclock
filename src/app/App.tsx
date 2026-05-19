import { useState, useEffect, useCallback } from 'react';
import { Home, BarChart3, TrendingUp, Settings } from 'lucide-react';
import { useFocusTimer } from './hooks/useFocusTimer';
import { HomePage } from './components/HomePage';
import { FocusTimer } from './components/FocusTimer';
import { PromotionCelebration } from './components/PromotionCelebration';
import { LeaderboardPage } from './components/LeaderboardPage';
import { StatsPage } from './components/StatsPage';
import { SettingsPage } from './components/SettingsPage';
import { HealthReminder } from './components/HealthReminder';
import { AuthPage } from './components/AuthPage';
import { FocusCategory } from './types';
import { db, User } from './services/database';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'leaderboard' | 'stats' | 'settings'>('home');
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionData, setPromotionData] = useState<any>(null);
  const [healthReminderType, setHealthReminderType] = useState<'rest' | 'sleep' | 'move' | null>(null);
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);
  const [settings, setSettings] = useState({
    theme: 'business',
    soundEnabled: true,
    promotionSoundEnabled: true,
    whiteNoiseEnabled: false,
    whiteNoiseType: 'office',
    privacyMode: false
  });

  const handleTimerComplete = async (result: any) => {
    if (result && currentUser) {
      setPromotionData(result);
      setShowPromotion(true);

      // 保存到数据库
      try {
        await db.saveFocusSession({
          user_id: currentUser.id,
          category: timer.category,
          duration_minutes: result.earnedPoints / 1.2,
          points_earned: result.earnedPoints,
          mode: timer.mode,
          rank_before: result.oldRank,
          rank_after: result.newRank,
          started_at: new Date(Date.now() - timer.totalDuration * 1000).toISOString(),
          completed_at: new Date().toISOString()
        });

        // 更新周统计
        await db.updateWeeklyStats(currentUser.id, {
          total_minutes: timer.dailyPoints,
          total_points: timer.dailyPoints,
          current_rank: result.newRank,
          highest_rank: result.newRank,
          sessions_completed: timer.sessions.length + 1
        });
      } catch (error) {
        console.error('保存专注记录失败:', error);
      }
    }
  };

  const timer = useFocusTimer(handleTimerComplete);

  // 检查用户登录状态
  useEffect(() => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    setIsAuthChecked(true);

    const savedSettings = localStorage.getItem('nihao-juzhang-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const getWeekStartDate = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString();
    };

    const checkWeekReset = () => {
      const lastReset = localStorage.getItem('nihao-juzhang-last-reset');
      const currentWeekStart = getWeekStartDate();

      if (lastReset !== currentWeekStart) {
        timer.resetDaily();
        localStorage.setItem('nihao-juzhang-last-reset', currentWeekStart);
      }
    };

    checkWeekReset();
    const interval = setInterval(checkWeekReset, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (nickname: string, isNewUser: boolean) => {
    try {
      const user = isNewUser
        ? await db.registerUser(nickname)
        : await db.loginUser(nickname);

      setCurrentUser(user);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    timer.resetDaily();
  };

  useEffect(() => {
    localStorage.setItem('nihao-juzhang-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const data = {
      dailyPoints: timer.dailyPoints,
      currentRank: timer.currentRank,
      sessions: timer.sessions
    };
    localStorage.setItem('nihao-juzhang-timer', JSON.stringify(data));
  }, [timer.dailyPoints, timer.currentRank, timer.sessions]);

  const handleStartFocus = (duration: number, category: FocusCategory, mode: 'strict' | 'gentle') => {
    timer.startFocus(duration, category, mode);
    setFocusStartTime(Date.now());
  };

  const showHealthReminder = useCallback((type: 'rest' | 'sleep' | 'move') => {
    if (!timer.isActive) return;
    setHealthReminderType(type);
  }, [timer.isActive]);

  useEffect(() => {
    if (!timer.isActive || !focusStartTime) return;

    const checkReminders = () => {
      const now = Date.now();
      const focusDuration = (now - focusStartTime) / 1000 / 60;
      const hour = new Date().getHours();

      if (hour >= 23 || hour < 6) {
        showHealthReminder('sleep');
      } else if (focusDuration >= 60) {
        const hoursPassed = Math.floor(focusDuration / 60);
        if (focusDuration % 60 < 1 && hoursPassed > 0) {
          showHealthReminder('rest');
        }
      }
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  }, [timer.isActive, focusStartTime, showHealthReminder]);

  const totalMinutes = timer.sessions.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0);

  const navigationItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'leaderboard', label: '排行榜', icon: TrendingUp },
    { id: 'stats', label: '统计', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings }
  ];

  // 显示加载状态
  if (!isAuthChecked) {
    return (
      <div className="size-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold">加载中...</div>
        </div>
      </div>
    );
  }

  // 显示登录/注册页面
  if (!currentUser) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="size-full bg-gray-50">
      {timer.isActive ? (
        <FocusTimer
          timeLeft={timer.timeLeft}
          totalDuration={timer.totalDuration}
          currentRank={timer.currentRank}
          nextRank={timer.nextRank}
          pointsToNextRank={timer.pointsToNextRank}
          onPause={timer.pauseFocus}
          onResume={timer.resumeFocus}
          onStop={timer.stopFocus}
          isPaused={timer.isPaused}
        />
      ) : (
        <>
          {currentPage === 'home' && (
            <HomePage
              currentRank={timer.currentRank}
              dailyPoints={timer.dailyPoints}
              totalMinutes={totalMinutes}
              onStartFocus={handleStartFocus}
            />
          )}

          {currentPage === 'leaderboard' && (
            <LeaderboardPage currentUserId="current-user" />
          )}

          {currentPage === 'stats' && (
            <StatsPage
              sessions={timer.sessions}
              dailyPoints={timer.dailyPoints}
              totalMinutes={totalMinutes}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={setSettings}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}

          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-2xl mx-auto flex">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as any)}
                    className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                      isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {showPromotion && promotionData && (
        <PromotionCelebration
          oldRank={promotionData.oldRank}
          newRank={promotionData.newRank}
          earnedPoints={promotionData.earnedPoints}
          onClose={() => setShowPromotion(false)}
        />
      )}

      {healthReminderType && (
        <HealthReminder
          type={healthReminderType}
          onClose={() => setHealthReminderType(null)}
        />
      )}
    </div>
  );
}