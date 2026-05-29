"use strict";
const common_vendor = require("../common/vendor.js");
const stores_timer = require("../stores/timer.js");
const stores_todo = require("../stores/todo.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "TodoChecklist",
  props: {
    duration: {},
    category: {},
    mode: {}
  },
  setup(__props) {
    const props = __props;
    const timerStore = stores_timer.useTimerStore();
    const todoStore = stores_todo.useTodoStore();
    const newTitle = common_vendor.ref("");
    const showCleared = common_vendor.ref(false);
    const activeTodos = common_vendor.computed(() => todoStore.activeTodos);
    const clearedTodos = common_vendor.computed(() => todoStore.clearedTodos);
    const disabledStart = common_vendor.computed(() => timerStore.isActive);
    common_vendor.onMounted(() => {
      todoStore.loadFromStorage();
    });
    function addTodo() {
      todoStore.addTodo(newTitle.value);
      newTitle.value = "";
    }
    function toggleDone(id) {
      todoStore.toggleDone(id);
    }
    function openCleared() {
      todoStore.clearDoneToCleared();
      showCleared.value = true;
    }
    function closeCleared() {
      showCleared.value = false;
    }
    function formatSeconds(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const mm = Math.floor(s / 60);
      const ss = s % 60;
      return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    }
    function startFocusForTodo(id) {
      if (timerStore.isActive)
        return;
      todoStore.startTodoFocus(id);
      timerStore.startCountup(props.category, props.mode);
      common_vendor.index.navigateTo({ url: "/pages/timer/index" });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openCleared, "47"),
        b: activeTodos.value.length === 0
      }, activeTodos.value.length === 0 ? {} : {}, {
        c: common_vendor.f(activeTodos.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.status === "done"
          }, item.status === "done" ? {} : {}, {
            b: item.status === "done" ? 1 : "",
            c: common_vendor.o(($event) => toggleDone(item.id), item.id),
            d: common_vendor.t(item.title),
            e: item.status === "done" ? 1 : "",
            f: item.status === "done" && item.lastSessionSeconds
          }, item.status === "done" && item.lastSessionSeconds ? {
            g: common_vendor.t(formatSeconds(item.lastSessionSeconds))
          } : {}, {
            h: common_vendor.o(($event) => item.status === "active" ? startFocusForTodo(item.id) : null, item.id),
            i: item.status === "active"
          }, item.status === "active" ? {
            j: disabledStart.value ? 1 : "",
            k: disabledStart.value,
            l: common_vendor.o(($event) => startFocusForTodo(item.id), item.id)
          } : {}, {
            m: item.id
          });
        }),
        d: common_vendor.o(addTodo, "a7"),
        e: newTitle.value,
        f: common_vendor.o(($event) => newTitle.value = $event.detail.value, "cd"),
        g: common_vendor.o(addTodo, "0b"),
        h: showCleared.value
      }, showCleared.value ? common_vendor.e({
        i: common_vendor.o(closeCleared, "7d"),
        j: clearedTodos.value.length === 0
      }, clearedTodos.value.length === 0 ? {} : {}, {
        k: common_vendor.f(clearedTodos.value, (c, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(c.title),
            b: c.lastSessionSeconds
          }, c.lastSessionSeconds ? {
            c: common_vendor.t(formatSeconds(c.lastSessionSeconds))
          } : {}, {
            d: c.id
          });
        }),
        l: common_vendor.o(() => {
        }, "15"),
        m: common_vendor.o(closeCleared, "98")
      }) : {});
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6c96e131"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/TodoChecklist.js.map
