import { useEffect, useState } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { RANKS } from '../constants';
import { RankLevel } from '../types';

interface FocusTimerProps {
  timeLeft: number;
  totalDuration: number;
  currentRank: RankLevel;
  nextRank: any;
  pointsToNextRank: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isPaused: boolean;
}

export function FocusTimer({
  timeLeft,
  totalDuration,
  currentRank,
  nextRank,
  pointsToNextRank,
  onPause,
  onResume,
  onStop,
  isPaused
}: FocusTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const rankData = RANKS[currentRank];

  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const minutesToNextRank = nextRank ? Math.ceil(pointsToNextRank) : 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{
        background: `linear-gradient(135deg, ${rankData.color}15 0%, ${rankData.color}05 100%)`
      }}
    >
      <div className="absolute top-6 left-6 right-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img
              src={rankData.image}
              alt={rankData.name}
              className="w-12 h-12 rounded-full object-cover border-2"
              style={{ borderColor: rankData.color }}
            />
            <div>
              <div className="text-sm text-gray-600">当前职位</div>
              <div className="font-bold" style={{ color: rankData.color }}>
                {rankData.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowStopConfirm(true)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {nextRank && (
          <div className="bg-white/80 backdrop-blur rounded-xl p-3">
            <div className="text-xs text-gray-600 mb-1">
              距离 {nextRank.name} 还需
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(progress * (totalDuration / 60 / pointsToNextRank), 100)}%`,
                  backgroundColor: rankData.color
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              约 {minutesToNextRank} 分钟
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="relative mb-8">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke={rankData.color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold" style={{ color: rankData.color }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-gray-500 mt-2">
                {isPaused ? '已暂停' : '专注中...'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={isPaused ? onResume : onPause}
            className="px-8 py-3 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            style={{ backgroundColor: rankData.color }}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5" />
                继续
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" />
                暂停
              </>
            )}
          </button>
        </div>
      </div>

      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">确认退出？</h3>
            <p className="text-gray-600 text-sm mb-6">
              退出专注将中断当前任务，可能会影响今日积分
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowStopConfirm(false);
                  onStop();
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
