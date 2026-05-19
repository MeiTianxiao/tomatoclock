import { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RANKS } from '../constants';
import { RankLevel } from '../types';

interface PromotionCelebrationProps {
  oldRank: RankLevel;
  newRank: RankLevel;
  earnedPoints: number;
  onClose: () => void;
}

export function PromotionCelebration({
  oldRank,
  newRank,
  earnedPoints,
  onClose
}: PromotionCelebrationProps) {
  const newRankData = RANKS[newRank];
  const oldRankData = RANKS[oldRank];
  const isPromoted = newRank !== oldRank;
  const isBureauChief = newRank === 'bureau_chief';
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    setShowSparkles(true);

    if (isBureauChief && isPromoted) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#fbbf24', '#f59e0b', '#ea580c']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#fbbf24', '#f59e0b', '#ea580c']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    } else if (isPromoted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [newRankData.color]
      });
    } else {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: [newRankData.color, '#60a5fa', '#8b5cf6']
      });
    }

    const audio = new Audio();
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, [isBureauChief, isPromoted, newRankData.color]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative animate-scaleIn overflow-hidden">
        {/* 背景装饰粒子 */}
        {showSparkles && (
          <>
            <div className="absolute top-10 left-10 animate-ping">
              <Sparkles className="w-4 h-4 text-yellow-400 opacity-60" />
            </div>
            <div className="absolute top-20 right-12 animate-ping delay-100">
              <Sparkles className="w-3 h-3 text-blue-400 opacity-60" />
            </div>
            <div className="absolute bottom-24 left-16 animate-ping delay-200">
              <Sparkles className="w-3 h-3 text-purple-400 opacity-60" />
            </div>
            <div className="absolute bottom-32 right-10 animate-ping delay-150">
              <Sparkles className="w-4 h-4 text-pink-400 opacity-60" />
            </div>
          </>
        )}

        {isBureauChief && isPromoted && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-lg animate-bounce" />
          </div>
        )}

        <div className="mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 mb-4">
            <Star className="w-4 h-4" />
            <span className="font-semibold">
              {isPromoted ? '恭喜晋升！' : '专注完成！'}
            </span>
          </div>

          {isPromoted ? (
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <img
                  src={oldRankData.image}
                  alt={oldRankData.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-300 mb-2 grayscale opacity-60"
                />
                <div className="text-sm text-gray-500">{oldRankData.name}</div>
              </div>

              <div className="text-3xl text-gray-400 animate-pulse">→</div>

              <div className="text-center">
                <div className="relative">
                  <img
                    src={newRankData.image}
                    alt={newRankData.name}
                    className="w-24 h-24 rounded-full object-cover border-4 mb-2 animate-pulse shadow-xl"
                    style={{ borderColor: newRankData.color, boxShadow: `0 0 30px ${newRankData.color}40` }}
                  />
                  {isBureauChief && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-spin-slow">
                      <Star className="w-6 h-6 text-white" fill="white" />
                    </div>
                  )}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: newRankData.color }}
                >
                  {newRankData.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative inline-block">
                <img
                  src={newRankData.image}
                  alt={newRankData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 mb-4 shadow-2xl"
                  style={{ borderColor: newRankData.color, boxShadow: `0 0 30px ${newRankData.color}40` }}
                />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
                  <Star className="w-6 h-6 text-white" fill="white" />
                </div>
              </div>
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: newRankData.color }}
              >
                当前职位：{newRankData.name}
              </div>
            </div>
          )}

          {isBureauChief && isPromoted ? (
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-yellow-500 mb-2 animate-pulse">
                🎉 局长万岁！
              </h2>
              <p className="text-gray-600">
                今天的表现非常出色！<br />
                您已经达到今日最高职位！
              </p>
            </div>
          ) : isPromoted ? (
            <div className="mb-6">
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: newRankData.color }}
              >
                恭喜您成为 {newRankData.name}！
              </h2>
              <p className="text-gray-600">
                您的努力得到了回报，继续保持专注！
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                干得漂亮！
              </h2>
              <p className="text-gray-600">
                再接再厉，向更高职位进发！
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 shadow-inner">
            <div className="text-sm text-gray-600 mb-1">本次获得</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              +{earnedPoints}
            </div>
            <div className="text-sm text-gray-500">积分</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          style={{ backgroundColor: newRankData.color }}
        >
          {isPromoted ? '继续加油！' : '返回继续专注'}
        </button>
      </div>
    </div>
  );
}
