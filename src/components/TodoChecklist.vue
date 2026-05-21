<template>
  <view class="todo-card">
    <view class="todo-header">
      <view class="todo-title-row">
        <view class="todo-icon">
          <text class="todo-icon-text">≡</text>
        </view>
        <text class="todo-title">待办清单</text>
      </view>
      <text class="todo-clear" @click="openCleared">清除完成</text>
    </view>

    <view class="todo-accent"></view>

    <view class="todo-list">
      <view v-if="activeTodos.length === 0" class="todo-empty">
        <text class="todo-empty-text">还没有任务，先添加一个吧</text>
      </view>

      <view v-for="item in activeTodos" :key="item.id" class="todo-item">
        <view class="todo-check" :class="{ done: item.status === 'done' }" @click="toggleDone(item.id)">
          <text v-if="item.status === 'done'" class="todo-check-icon">✓</text>
        </view>

        <view class="todo-main" @click="item.status === 'active' ? startFocusForTodo(item.id) : null">
          <text class="todo-text" :class="{ done: item.status === 'done' }">{{ item.title }}</text>
          <text v-if="item.status === 'done' && item.lastSessionSeconds" class="todo-meta">
            本次 {{ formatSeconds(item.lastSessionSeconds) }}
          </text>
        </view>

        <button
          v-if="item.status === 'active'"
          class="todo-start"
          :disabled="disabledStart"
          @click.stop="startFocusForTodo(item.id)"
        >
          ▶
        </button>
      </view>
    </view>

    <view class="todo-input-row">
      <input class="todo-input" v-model="newTitle" placeholder="输入新任务..." @confirm="addTodo" />
      <button class="todo-add" @click="addTodo">+</button>
    </view>

    <view v-if="showCleared" class="overlay" @click="closeCleared">
      <view class="cleared-panel" @click.stop>
        <view class="cleared-header">
          <text class="cleared-title">已清除完成</text>
          <button class="cleared-close" @click="closeCleared">关闭</button>
        </view>

        <view class="cleared-list">
          <view v-if="clearedTodos.length === 0" class="cleared-empty">
            <text class="cleared-empty-text">暂无记录</text>
          </view>

          <view v-for="c in clearedTodos" :key="c.id" class="cleared-item">
            <view class="cleared-left">
              <text class="cleared-text">{{ c.title }}</text>
              <text v-if="c.lastSessionSeconds" class="cleared-meta">本次 {{ formatSeconds(c.lastSessionSeconds) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useTodoStore } from '@/stores/todo'
import type { FocusCategory } from '@/types'

const props = defineProps<{
  duration: number
  category: FocusCategory
  mode: 'strict' | 'gentle'
}>()

const timerStore = useTimerStore()
const todoStore = useTodoStore()

const newTitle = ref('')
const showCleared = ref(false)

const activeTodos = computed(() => todoStore.activeTodos)
const clearedTodos = computed(() => todoStore.clearedTodos)
const disabledStart = computed(() => timerStore.isActive)

onMounted(() => {
  todoStore.loadFromStorage()
})

function addTodo() {
  todoStore.addTodo(newTitle.value)
  newTitle.value = ''
}

function toggleDone(id: string) {
  todoStore.toggleDone(id)
}

function openCleared() {
  todoStore.clearDoneToCleared()
  showCleared.value = true
}

function closeCleared() {
  showCleared.value = false
}

function formatSeconds(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function startFocusForTodo(id: string) {
  if (timerStore.isActive) return
  todoStore.startTodoFocus(id)
  timerStore.startFocus(props.duration, props.category, props.mode)
  uni.navigateTo({ url: '/pages/timer/index' })
}
</script>

<style lang="scss" scoped>
.todo-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.todo-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: rgba(59, 130, 246, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-icon-text {
  color: #3b82f6;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1;
}

.todo-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}

.todo-clear {
  font-size: 26rpx;
  color: #94a3b8;
}

.todo-accent {
  height: 10rpx;
  width: 280rpx;
  border-radius: 999rpx;
  margin-top: 18rpx;
  background: #0f172a;
  opacity: 0.85;
}

.todo-list {
  margin-top: 26rpx;
}

.todo-empty {
  padding: 26rpx 0;
}

.todo-empty-text {
  font-size: 26rpx;
  color: #94a3b8;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx dashed rgba(148, 163, 184, 0.4);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 999rpx;
  border: 2rpx solid rgba(148, 163, 184, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-check.done {
  border-color: #0f172a;
  background: #0f172a;
}

.todo-check-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1;
}

.todo-main {
  flex: 1;
  min-width: 0;
}

.todo-text {
  font-size: 30rpx;
  color: #0f172a;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-text.done {
  color: #94a3b8;
}

.todo-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #94a3b8;
  display: block;
}

.todo-start {
  width: 70rpx;
  height: 70rpx;
  border-radius: 18rpx;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  font-size: 28rpx;
  line-height: 70rpx;
  padding: 0;
  margin: 0;
}

.todo-start[disabled] {
  opacity: 0.4;
}

.todo-start::after {
  display: none;
}

.todo-input-row {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: #f8fafc;
  border-radius: 18rpx;
  padding: 16rpx 16rpx;
}

.todo-input {
  flex: 1;
  font-size: 28rpx;
  padding: 0 6rpx;
}

.todo-add {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 36rpx;
  line-height: 64rpx;
  padding: 0;
  margin: 0;
}

.todo-add::after {
  display: none;
}

.overlay {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: flex-end;
}

.cleared-panel {
  width: 560rpx;
  height: 100%;
  background: #fff;
  padding: 32rpx;
  box-sizing: border-box;
}

.cleared-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cleared-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #0f172a;
}

.cleared-close {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  padding: 0 18rpx;
  border-radius: 16rpx;
  background: #f1f5f9;
  color: #475569;
  margin: 0;
}

.cleared-close::after {
  display: none;
}

.cleared-list {
  margin-top: 26rpx;
}

.cleared-empty {
  padding: 30rpx 0;
}

.cleared-empty-text {
  color: #94a3b8;
  font-size: 26rpx;
}

.cleared-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.25);
}

.cleared-item:last-child {
  border-bottom: none;
}

.cleared-text {
  font-size: 28rpx;
  color: #0f172a;
  display: block;
}

.cleared-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #94a3b8;
  display: block;
}
</style>

