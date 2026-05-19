import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { RANKS } from '../constants';
import { db } from '../services/database';

interface LeaderboardPageProps {
  currentUserId: string;
}

export function LeaderboardPage({ currentUserId }: LeaderboardPageProps) {
  const [activeTab, setActiveTab] = useState<'week'>('week');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await db.getLeaderboard(20);
      setLeaderboard(data);
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">本周排行榜</h1>
          <button
            onClick={loadLeaderboard}
            className="p-2 rounded-lg bg-white shadow hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 text-purple-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="text-center text-sm text-gray-600">
            <p>每周一凌晨自动清零，公平竞争</p>
            <p className="mt-1 text-xs text-gray-500">排行榜每分钟自动更新</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">还没有人上榜</p>
            <p className="text-sm text-gray-400">开始专注，成为第一名吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const rankData = RANKS[entry.current_rank] || RANKS.intern;
              const isCurrentUser = entry.id === currentUserId;

              return (
                <div
                  key={entry.id}
                  className={`bg-white rounded-xl shadow p-4 transition-all ${
                    isCurrentUser ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  } ${
                    entry.position === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12">
                      {entry.position <= 3 ? (
                        getMedalIcon(entry.position)
                      ) : (
                        <div className="text-xl font-bold text-gray-400">
                          {entry.position}
                        </div>
                      )}
                    </div>

                    <img
                      src={entry.avatar_url || rankData.image}
                      alt={entry.nickname}
                      className="w-14 h-14 rounded-full object-cover border-2"
                      style={{ borderColor: rankData.color }}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-gray-800">
                          {entry.nickname}
                        </div>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-xs">
                            我
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: rankData.color }}
                        >
                          {rankData.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.floor(entry.total_minutes / 60)}h {entry.total_minutes % 60}m
                        </div>
                      </div>
                    </div>

                    {entry.position === 1 && (
                      <div className="text-2xl animate-bounce">👑</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {leaderboard.length > 0 && '再加把劲，冲刺更高名次！'}
          </p>
        </div>
      </div>
    </div>
  );
}
