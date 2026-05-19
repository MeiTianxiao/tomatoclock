import { useState, useEffect, useCallback, useRef } from 'react';
import { FocusCategory, RankLevel } from '../types';
import { RANKS } from '../constants';

export function useFocusTimer(onComplete?: (result: any) => void) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [category, setCategory] = useState<FocusCategory>('study');
  const [mode, setMode] = useState<'strict' | 'gentle'>('gentle');
  const [exitCount, setExitCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [dailyPoints, setDailyPoints] = useState(0);
  const [currentRank, setCurrentRank] = useState<RankLevel>('intern');
  const [sessions, setSessions] = useState<any[]>([]);

  const calculateRank = useCallback((points: number): RankLevel => {
    const rankLevels = Object.values(RANKS).sort((a, b) => b.points - a.points);
    for (const rank of rankLevels) {
      if (points >= rank.points) {
        return rank.id as RankLevel;
      }
    }
    return 'intern';
  }, []);

  const startFocus = useCallback((duration: number, cat: FocusCategory, focusMode: 'strict' | 'gentle') => {
    setTotalDuration(duration * 60);
    setTimeLeft(duration * 60);
    setCategory(cat);
    setMode(focusMode);
    setIsActive(true);
    setIsPaused(false);
    setExitCount(0);
  }, []);

  const pauseFocus = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeFocus = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopFocus = useCallback(() => {
    if (mode === 'strict') {
      setDailyPoints(0);
    } else {
      setExitCount(prev => {
        const newCount = prev + 1;
        if (newCount > 2) {
          setDailyPoints(prev => Math.floor(prev * 0.5));
        }
        return newCount;
      });
    }
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [mode]);

  const completeFocus = useCallback(() => {
    const earnedPoints = Math.floor(totalDuration / 60);
    const bonusPoints = mode === 'strict' ? Math.floor(earnedPoints * 0.2) : 0;
    const totalPoints = earnedPoints + bonusPoints;

    const newDailyPoints = dailyPoints + totalPoints;
    setDailyPoints(newDailyPoints);

    const newRank = calculateRank(newDailyPoints);
    const oldRank = currentRank;
    setCurrentRank(newRank);

    const session = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - totalDuration * 1000),
      endTime: new Date(),
      duration: totalDuration / 60,
      category,
      points: totalPoints,
      mode,
      completed: true,
      interrupted: false,
      rankBefore: oldRank,
      rankAfter: newRank
    };

    setSessions(prev => [...prev, session]);

    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);

    const result = { earnedPoints: totalPoints, newRank, oldRank, promoted: newRank !== oldRank };

    if (onComplete) {
      onComplete(result);
    }

    return result;
  }, [totalDuration, mode, dailyPoints, category, currentRank, calculateRank, onComplete]);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            setTimeout(() => completeFocus(), 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft, completeFocus]);

  const resetDaily = useCallback(() => {
    setDailyPoints(0);
    setCurrentRank('intern');
    setSessions([]);
  }, []);

  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const nextRank = Object.values(RANKS).find(r => r.points > dailyPoints);
  const pointsToNextRank = nextRank ? nextRank.points - dailyPoints : 0;

  return {
    isActive,
    isPaused,
    timeLeft,
    totalDuration,
    category,
    mode,
    exitCount,
    dailyPoints,
    currentRank,
    sessions,
    progress,
    nextRank,
    pointsToNextRank,
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    completeFocus,
    resetDaily
  };
}
