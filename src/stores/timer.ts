import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SessionRecord, FocusCategory, RankType, PromotionData } from '@/types'
import { RANK_CONFIG } from '@/types'
import { syncFocusEnd, getWeeklyStats } from '@/api/user'
import { useUserStore } from './user'

const RANK_ORDER: RankType[] = ['intern', 'junior', 'middle', 'senior', 'expert', 'master']

export const useTimerStore = defineStore('timer', () => {
  const dailyPoints = ref(0)
  const currentRank = ref<RankType>('intern')
  const sessions = ref<SessionRecord[]>([])
  const isActive = ref(false)
  const isPaused = ref(false)
  const timerType = ref<'countdown' | 'countup'>('countdown')
  const timeLeft = ref(0)
  const totalDuration = ref(0)
  const targetTime = ref(0)
  const focusStartTime = ref(0)
  const pausedMs = ref(0)
  const pauseStartedAt = ref(0)
  const elapsedSeconds = ref(0)
  const currentCategory = ref<FocusCategory>('study')
  const currentMode = ref<'strict' | 'gentle'>('strict')
  const quitCount = ref(0)
  const gentlePenalty = ref(false)
  const strictQuitTriggered = ref(false)

  function getWeekStartTs() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday.getTime()
  }

  function getLocalWeekSummary() {
    const weekStartTs = getWeekStartTs()
    const weekSessions = sessions.value.filter(s => s.completed && (s.startTime || 0) >= weekStartTs)
    const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const totalPoints = weekSessions.reduce((sum, s) => sum + (s.points || 0), 0)
    return { totalMinutes, totalPoints }
  }

  function recalcFromSessions() {
    const { totalPoints } = getLocalWeekSummary()
    dailyPoints.value = totalPoints
    currentRank.value = calculateRank()
  }

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
        recalcFromSessions()
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
    timerType.value = 'countdown'
    totalDuration.value = duration * 60
    timeLeft.value = duration * 60
    targetTime.value = Date.now() + duration * 60 * 1000
    focusStartTime.value = Date.now()
    pausedMs.value = 0
    pauseStartedAt.value = 0
    elapsedSeconds.value = 0
    currentCategory.value = category
    currentMode.value = mode
    quitCount.value = 0
    gentlePenalty.value = false
    strictQuitTriggered.value = false
    isActive.value = true
    isPaused.value = false
  }

  function startCountup(category: FocusCategory, mode: 'strict' | 'gentle') {
    timerType.value = 'countup'
    totalDuration.value = 0
    timeLeft.value = 0
    targetTime.value = 0
    focusStartTime.value = Date.now()
    pausedMs.value = 0
    pauseStartedAt.value = 0
    elapsedSeconds.value = 0
    currentCategory.value = category
    currentMode.value = mode
    quitCount.value = 0
    gentlePenalty.value = false
    strictQuitTriggered.value = false
    isActive.value = true
    isPaused.value = false
  }

  function registerQuit() {
    if (!isActive.value) {
      return { mode: currentMode.value, quitCount: quitCount.value, gentlePenalty: gentlePenalty.value, strictQuitTriggered: strictQuitTriggered.value }
    }

    quitCount.value += 1
    if (currentMode.value === 'strict') {
      strictQuitTriggered.value = true
      isActive.value = false
      isPaused.value = false
      resetDaily()
      return { mode: currentMode.value, quitCount: quitCount.value, gentlePenalty: gentlePenalty.value, strictQuitTriggered: strictQuitTriggered.value }
    }

    if (quitCount.value >= 3) {
      gentlePenalty.value = true
    }

    return { mode: currentMode.value, quitCount: quitCount.value, gentlePenalty: gentlePenalty.value, strictQuitTriggered: strictQuitTriggered.value }
  }

  function pauseFocus() {
    if (isPaused.value) return
    isPaused.value = true
    if (timerType.value === 'countup') {
      pauseStartedAt.value = Date.now()
    }
  }

  function resumeFocus() {
    if (!isPaused.value) return
    isPaused.value = false
    if (timerType.value === 'countdown') {
      targetTime.value = Date.now() + timeLeft.value * 1000
      return
    }
    if (pauseStartedAt.value > 0) {
      pausedMs.value += Date.now() - pauseStartedAt.value
      pauseStartedAt.value = 0
    }
  }

  function stopFocus(): PromotionData & { wasPromoted: boolean } | null {
    isActive.value = false
    isPaused.value = false
    
    const completedSeconds =
      timerType.value === 'countup' ? elapsedSeconds.value : Math.max(0, totalDuration.value - timeLeft.value)
    const minutes = Math.floor(completedSeconds / 60)

    if (currentMode.value === 'strict' && strictQuitTriggered.value) {
      return null
    }
    
    if (minutes < 1) {
      return null
    }

    let points = minutes
    if (currentMode.value === 'gentle' && gentlePenalty.value) {
      points = Math.floor(points * 0.5)
    }
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
      startTime: focusStartTime.value || Date.now() - completedSeconds * 1000
    }
    sessions.value.push(session)
    saveToStorage()

    // 异步同步到后端，确保排行榜数据能实时更新
    syncFocusEnd({
      duration_minutes: minutes,
      points: points,
      rank_after: newRank
    }).catch(console.error)

    return {
      oldRank,
      newRank,
      earnedPoints: points,
      wasPromoted
    }
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
    if (isActive.value && !isPaused.value) {
      if (timerType.value === 'countdown') {
        const remaining = Math.max(0, Math.ceil((targetTime.value - Date.now()) / 1000))
        timeLeft.value = remaining
        elapsedSeconds.value = Math.max(0, totalDuration.value - timeLeft.value)
        return
      }

      const seconds = Math.max(0, Math.floor((Date.now() - focusStartTime.value - pausedMs.value) / 1000))
      elapsedSeconds.value = seconds
    }
  }

  function resetDaily() {
    dailyPoints.value = 0
    currentRank.value = 'intern'
    sessions.value = []
    saveToStorage()
  }

  async function syncWithServer() {
    const userStore = useUserStore()
    if (!userStore.user?.id) return
    
    try {
      const stats = await getWeeklyStats(userStore.user.id)
      if (stats) {
        const local = getLocalWeekSummary()
        const serverPoints = stats.total_points || 0
        const serverMinutes = stats.total_minutes || 0

        if (local.totalPoints > serverPoints || local.totalMinutes > serverMinutes) {
          const deltaPoints = Math.max(0, local.totalPoints - serverPoints)
          const deltaMinutes = Math.max(0, local.totalMinutes - serverMinutes)
          if (deltaPoints > 0 || deltaMinutes > 0) {
            await syncFocusEnd({
              duration_minutes: deltaMinutes,
              points: deltaPoints,
              rank_after: currentRank.value
            })
          }
        }

        const latest = await getWeeklyStats(userStore.user.id)
        if (latest) {
          dailyPoints.value = latest.total_points || 0
          if (latest.current_rank) {
            currentRank.value = latest.current_rank as RankType
          }
          saveToStorage()
        }
      }
    } catch (e) {
      console.error('Sync failed:', e)
    }
  }

  return {
    dailyPoints,
    currentRank,
    sessions,
    isActive,
    isPaused,
    timerType,
    timeLeft,
    totalDuration,
    elapsedSeconds,
    currentCategory,
    currentMode,
    quitCount,
    gentlePenalty,
    strictQuitTriggered,
    nextRank,
    pointsToNextRank,
    progressToNextRank,
    startFocus,
    startCountup,
    registerQuit,
    pauseFocus,
    resumeFocus,
    stopFocus,
    tick,
    resetDaily,
    loadFromStorage,
    saveToStorage,
    syncWithServer
  }
})
