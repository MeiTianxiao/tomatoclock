import { useState } from 'react';
import { Clock, Zap, Sparkles } from 'lucide-react';
import { FOCUS_DURATIONS, FOCUS_CATEGORIES, RANKS } from '../constants';
import { FocusCategory } from '../types';
import { RankCard } from './RankCard';
import { getGreeting, getTimeBasedGreeting, getWeekProgress } from '../utils/greetings';

interface HomePageProps {
  currentRank: any;
  dailyPoints: number;
  totalMinutes: number;
  onStartFocus: (duration: number, category: FocusCategory, mode: 'strict' | 'gentle') => void;
}

export function HomePage({ currentRank, dailyPoints, totalMinutes, onStartFocus }: HomePageProps) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>('study');
  const [selectedMode, setSelectedMode] = useState<'strict' | 'gentle'>('gentle');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('30');

  const handleStart = () => {
    const duration = showCustomDuration ? parseInt(customMinutes) : selectedDuration;
    if (duration >= 10 && duration <= 120) {
      onStartFocus(duration, selectedCategory, selectedMode);
    }
  };

  const rankData = RANKS[currentRank];
  const greeting = getGreeting(currentRank);
  const timeGreeting = getTimeBasedGreeting();
  const weekProgress = getWeekProgress(totalMinutes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={rankData.image}
              alt={rankData.name}
              className="w-16 h-16 rounded-full object-cover border-3"
              style={{ borderColor: rankData.color }}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                你好，{rankData.name}！
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </h1>
              <p className="text-gray-600 text-sm mt-1">{timeGreeting}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-3">
            <p className="text-gray-700 text-center font-medium">{greeting}</p>
          </div>

          <div className="text-center text-sm text-gray-500">
            {weekProgress}
          </div>
        </div>

        <RankCard rank={currentRank} points={dailyPoints} />

        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            选择专注时长
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {FOCUS_DURATIONS.map((duration) => (
              <button
                key={duration.minutes}
                onClick={() => {
                  setSelectedDuration(duration.minutes);
                  setShowCustomDuration(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !showCustomDuration && selectedDuration === duration.minutes
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl font-bold text-gray-800">
                  {duration.minutes}
                </div>
                <div className="text-xs text-gray-500">分钟</div>
                <div className="text-xs text-gray-400 mt-1">{duration.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustomDuration(!showCustomDuration)}
            className={`w-full p-3 rounded-xl border-2 transition-all mb-4 ${
              showCustomDuration
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-sm font-semibold text-gray-700">
              自定义时长 (10-120分钟)
            </span>
          </button>

          {showCustomDuration && (
            <div className="mb-4">
              <input
                type="number"
                min="10"
                max="120"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-500 text-center text-2xl font-bold"
                placeholder="输入分钟数"
              />
            </div>
          )}

          <h3 className="font-semibold text-gray-800 mb-3">选择专注事项</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {FOCUS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as FocusCategory)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-sm font-semibold text-gray-700">
                  {cat.label}
                </div>
              </button>
            ))}
          </div>

          <h3 className="font-semibold text-gray-800 mb-3">选择专注模式</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedMode('gentle')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedMode === 'gentle'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="font-bold text-gray-800 mb-1">温和模式</div>
              <div className="text-xs text-gray-500">
                允许退出2次，第3次退出扣除一半积分
              </div>
            </button>
            <button
              onClick={() => setSelectedMode('strict')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedMode === 'strict'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                严格模式
              </div>
              <div className="text-xs text-gray-500">
                退出则清零当日所有积分
              </div>
            </button>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            开始工作
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          每日24:00职位和积分自动清零
        </div>
      </div>
    </div>
  );
}
