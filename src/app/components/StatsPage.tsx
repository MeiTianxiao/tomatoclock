import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Clock, Target, Award } from 'lucide-react';
import { FOCUS_CATEGORIES } from '../constants';

interface StatsPageProps {
  sessions: any[];
  dailyPoints: number;
  totalMinutes: number;
}

export function StatsPage({ sessions, dailyPoints, totalMinutes }: StatsPageProps) {
  const completedSessions = sessions.filter(s => s.completed);
  const todaysSessions = completedSessions.filter(s => {
    const sessionDate = new Date(s.startTime).toDateString();
    const today = new Date().toDateString();
    return sessionDate === today;
  });

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();

    const dayTotal = completedSessions
      .filter(s => new Date(s.startTime).toDateString() === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      id: `day-${i}`,
      day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      minutes: dayTotal
    };
  });

  const categoryData = FOCUS_CATEGORIES.map(cat => {
    const total = completedSessions
      .filter(s => s.category === cat.id)
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      id: cat.id,
      name: cat.label,
      value: total,
      icon: cat.icon
    };
  }).filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

  const bureauChiefCount = completedSessions.filter(s => s.rankAfter === 'bureau_chief').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">数据统计</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{totalMinutes}</div>
            <div className="text-sm text-gray-500">累计分钟</div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{completedSessions.length}</div>
            <div className="text-sm text-gray-500">完成任务</div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{bureauChiefCount}</div>
            <div className="text-sm text-gray-500">当上局长</div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{dailyPoints}</div>
            <div className="text-sm text-gray-500">今日积分</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">本周专注时长</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="minutes" fill="#3b82f6" radius={[8, 8, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {categoryData.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">专注事项分布</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-800 mb-4">今日记录</h2>
          {todaysSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>还没有完成任何专注任务</p>
              <p className="text-sm mt-1">开始第一个专注吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysSessions.map((session) => {
                const cat = FOCUS_CATEGORIES.find(c => c.id === session.category);
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{cat?.icon}</div>
                      <div>
                        <div className="font-semibold text-gray-800">{cat?.label}</div>
                        <div className="text-sm text-gray-500">
                          {session.duration} 分钟 · +{session.points} 积分
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(session.endTime).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
