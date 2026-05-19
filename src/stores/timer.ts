import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SessionRecord, FocusCategory, RankType, PromotionData } from '@/types'
import { RANK_CONFIG } from '@/types'

const RANK_ORDER: RankType[] = ['intern', 'junior', 'middle', 'senior', 'expert', 'master']

export const useTimerStore = defineStore('timer', () => {
  const dailyPoints = ref(0)
  const currentRank = ref<RankType>('intern')
  const sessions = ref<SessionRecord[]>([])
  const isActive = ref(false)
  const isPaused = ref(false)
  const timeLeft = ref(0)
  const totalDuration = ref(0)
  const currentCategory = ref<FocusCategory>('study')
  const currentMode = ref<'strict' | 'gentle'>('strict')

  const nextRank = computed(() => {
    const currentIndex = RANK_ORDER.indexOf(currentRank.value)
    if (currentIndex >= RANK_ORDER.length - 1) return null
    return RANK_CONFIG[RANK_ORDER[currentIndex + 1]]
  })

  const pointsToNextRank = computed(() => {
    const currentIndex = RANK_ORDER.indexOf(currentRank.value)
    if (currentIndex >= RANK_ORDER.length - 1) return 0
    const nextRankPoints = RANK_CONFIG[RANK_ORDER[currentIndex + 1]].points
    return nextRankPoints - dailyPoints.value
  })

  const progressToNextRank = computed(() => {
    if (!nextRank.value) return 100
    const currentIndex = RANK_ORDER.indexOf(currentRank.value)
    const currentRankPoints = RANK_CONFIG[RANK_ORDER[currentIndex]].points
    return Math.min(100, ((dailyPoints.value - currentRankPoints) / (nextRank.value.points - currentRankPoints)) * 100)
  })

  function loadFromStorage() {
    const stored = uni.getStorageSync('timer')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        dailyPoints.value = data.dailyPoints || 0
        currentRank.value = (data.currentRank as RankType) || 'intern'
        sessions.value = data.sessions || []
      } catch {
        resetDaily()
      }
    }
  }

  function saveToStorage() {
    const data = {
      dailyPoints: dailyPoints.value,
      currentRank: currentRank.value,
      sessions: sessions.value
    }
    uni.setStorageSync('timer', JSON.stringify(data))
  }

  function startFocus(duration: number, category: FocusCategory, mode: 'strict' | 'gentle') {
    totalDuration.value = duration * 60
    timeLeft.value = duration * 60
    currentCategory.value = category
    currentMode.value = mode
    isActive.value = true
    isPaused.value = false
  }

  function pauseFocus() {
    isPaused.value = true
  }

  function resumeFocus() {
    isPaused.value = false
  }

  function stopFocus(): PromotionData | null {
    isActive.value = false
    isPaused.value = false
    
    const completedDuration = totalDuration.value - timeLeft.value
    const minutes = Math.floor(completedDuration / 60)
    
    if (minutes < 5) {
      return null
    }

    const points = Math.floor(minutes * 1.2)
    const oldRank = currentRank.value
    dailyPoints.value += points

    const newRank = calculateRank()
    const wasPromoted = newRank !== oldRank
    currentRank.value = newRank

    const session: SessionRecord = {
      id: `session_${Date.now()}`,
      category: currentCategory.value,
      duration: minutes,
      points,
      completed: true,
      startTime: Date.now() - completedDuration * 1000
    }
    sessions.value.push(session)
    saveToStorage()

    if (wasPromoted) {
      return {
        oldRank,
        newRank,
        earnedPoints: points
      }
    }

    return null
  }

  function calculateRank(): RankType {
    const points = dailyPoints.value
    for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
      const rank = RANK_ORDER[i]
      if (points >= RANK_CONFIG[rank].points) {
        return rank
      }
    }
    return 'intern'
  }

  function tick() {
    if (isActive.value && !isPaused.value && timeLeft.value > 0) {
      timeLeft.value--
    }
  }

  function resetDaily() {
    dailyPoints.value = 0
    currentRank.value = 'intern'
    sessions.value = []
    saveToStorage()
  }

  return {
    dailyPoints,
    currentRank,
    sessions,
    isActive,
    isPaused,
    timeLeft,
    totalDuration,
    currentCategory,
    currentMode,
    nextRank,
    pointsToNextRank,
    progressToNextRank,
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    tick,
    resetDaily,
    loadFromStorage,
    saveToStorage
  }
})
