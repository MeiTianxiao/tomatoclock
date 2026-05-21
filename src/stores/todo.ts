import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type TodoStatus = 'active' | 'done' | 'cleared'

export interface TodoItem {
  id: string
  title: string
  status: TodoStatus
  createdAt: number
  doneAt?: number
  clearedAt?: number
  lastSessionSeconds?: number
  totalFocusSeconds?: number
}

const STORAGE_KEY = 'todo-store'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<TodoItem[]>([])
  const activeTodoId = ref<string | null>(null)

  const activeTodos = computed(() => todos.value.filter(t => t.status !== 'cleared'))
  const clearedTodos = computed(() => todos.value.filter(t => t.status === 'cleared'))
  const doneTodos = computed(() => todos.value.filter(t => t.status === 'done'))

  function loadFromStorage() {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        todos.value = Array.isArray(parsed?.todos) ? parsed.todos : []
        activeTodoId.value = parsed?.activeTodoId || null
      } catch {
        todos.value = []
        activeTodoId.value = null
        saveToStorage()
      }
    }
  }

  function saveToStorage() {
    uni.setStorageSync(
      STORAGE_KEY,
      JSON.stringify({
        todos: todos.value,
        activeTodoId: activeTodoId.value
      })
    )
  }

  function addTodo(title: string) {
    const trimmed = (title || '').trim()
    if (!trimmed) return
    const item: TodoItem = {
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      status: 'active',
      createdAt: Date.now()
    }
    todos.value.unshift(item)
    saveToStorage()
  }

  function toggleDone(id: string) {
    const item = todos.value.find(t => t.id === id)
    if (!item) return
    if (item.status === 'cleared') return
    if (item.status === 'done') {
      item.status = 'active'
      item.doneAt = undefined
      item.lastSessionSeconds = undefined
    } else {
      item.status = 'done'
      item.doneAt = Date.now()
    }
    saveToStorage()
  }

  function clearDoneToCleared() {
    const now = Date.now()
    for (const item of todos.value) {
      if (item.status === 'done') {
        item.status = 'cleared'
        item.clearedAt = now
      }
    }
    saveToStorage()
  }

  function startTodoFocus(id: string) {
    activeTodoId.value = id
    saveToStorage()
  }

  function clearActiveFocus() {
    activeTodoId.value = null
    saveToStorage()
  }

  function finishActiveFocus(elapsedSeconds: number) {
    if (!activeTodoId.value) return null
    const item = todos.value.find(t => t.id === activeTodoId.value)
    if (!item) {
      clearActiveFocus()
      return null
    }

    const seconds = Math.max(0, Math.floor(elapsedSeconds || 0))
    item.status = 'done'
    item.doneAt = Date.now()
    item.lastSessionSeconds = seconds
    item.totalFocusSeconds = (item.totalFocusSeconds || 0) + seconds

    const title = item.title
    clearActiveFocus()
    saveToStorage()
    return { id: item.id, title, seconds }
  }

  return {
    todos,
    activeTodoId,
    activeTodos,
    doneTodos,
    clearedTodos,
    loadFromStorage,
    saveToStorage,
    addTodo,
    toggleDone,
    clearDoneToCleared,
    startTodoFocus,
    clearActiveFocus,
    finishActiveFocus
  }
})

