"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_KEY = "todo-store";
const useTodoStore = common_vendor.defineStore("todo", () => {
  const todos = common_vendor.ref([]);
  const activeTodoId = common_vendor.ref(null);
  const activeTodos = common_vendor.computed(() => todos.value.filter((t) => t.status !== "cleared"));
  const clearedTodos = common_vendor.computed(() => todos.value.filter((t) => t.status === "cleared"));
  const doneTodos = common_vendor.computed(() => todos.value.filter((t) => t.status === "done"));
  function loadFromStorage() {
    const stored = common_vendor.index.getStorageSync(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        todos.value = Array.isArray(parsed == null ? void 0 : parsed.todos) ? parsed.todos : [];
        activeTodoId.value = (parsed == null ? void 0 : parsed.activeTodoId) || null;
      } catch {
        todos.value = [];
        activeTodoId.value = null;
        saveToStorage();
      }
    }
  }
  function saveToStorage() {
    common_vendor.index.setStorageSync(
      STORAGE_KEY,
      JSON.stringify({
        todos: todos.value,
        activeTodoId: activeTodoId.value
      })
    );
  }
  function addTodo(title) {
    const trimmed = (title || "").trim();
    if (!trimmed)
      return;
    const item = {
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      status: "active",
      createdAt: Date.now()
    };
    todos.value.unshift(item);
    saveToStorage();
  }
  function toggleDone(id) {
    const item = todos.value.find((t) => t.id === id);
    if (!item)
      return;
    if (item.status === "cleared")
      return;
    if (item.status === "done") {
      item.status = "active";
      item.doneAt = void 0;
      item.lastSessionSeconds = void 0;
    } else {
      item.status = "done";
      item.doneAt = Date.now();
    }
    saveToStorage();
  }
  function clearDoneToCleared() {
    const now = Date.now();
    for (const item of todos.value) {
      if (item.status === "done") {
        item.status = "cleared";
        item.clearedAt = now;
      }
    }
    saveToStorage();
  }
  function startTodoFocus(id) {
    activeTodoId.value = id;
    saveToStorage();
  }
  function clearActiveFocus() {
    activeTodoId.value = null;
    saveToStorage();
  }
  function finishActiveFocus(elapsedSeconds) {
    if (!activeTodoId.value)
      return null;
    const item = todos.value.find((t) => t.id === activeTodoId.value);
    if (!item) {
      clearActiveFocus();
      return null;
    }
    const seconds = Math.max(0, Math.floor(elapsedSeconds || 0));
    item.status = "done";
    item.doneAt = Date.now();
    item.lastSessionSeconds = seconds;
    item.totalFocusSeconds = (item.totalFocusSeconds || 0) + seconds;
    const title = item.title;
    clearActiveFocus();
    saveToStorage();
    return { id: item.id, title, seconds };
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
  };
});
exports.useTodoStore = useTodoStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/todo.js.map
