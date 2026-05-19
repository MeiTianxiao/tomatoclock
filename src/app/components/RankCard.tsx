import { RANKS } from '../constants';
import { RankLevel } from '../types';

interface RankCardProps {
  rank: RankLevel;
  points: number;
  showProgress?: boolean;
}

export function RankCard({ rank, points, showProgress = true }: RankCardProps) {
  const currentRankData = RANKS[rank];
  const rankLevels = Object.values(RANKS).sort((a, b) => a.points - b.points);
  const nextRank = rankLevels.find(r => r.points > points);

  const progressPercent = nextRank
    ? ((points - currentRankData.points) / (nextRank.points - currentRankData.points)) * 100
    : 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="relative inline-block mb-4">
        <div
          className="w-32 h-32 rounded-full overflow-hidden border-4"
          style={{ borderColor: currentRankData.color }}
        >
          <img
            src={currentRankData.image}
            alt={currentRankData.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg"
          style={{ backgroundColor: currentRankData.color }}
        >
          {currentRankData.name}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-gray-600 text-sm mb-1">当前积分</div>
        <div className="text-3xl font-bold" style={{ color: currentRankData.color }}>
          {points}
        </div>
      </div>

      {showProgress && nextRank && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>距离 {nextRank.name}</span>
            <span>{nextRank.points - points} 分</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: currentRankData.color
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
