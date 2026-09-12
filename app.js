const STORAGE_KEY = "codex-todo-list-v1";

const state = {
  todos: loadTodos(),
  filter: "all",
};

const elements = {
  form: document.querySelector("#todo-form"),
  input: document.querySelector("#todo-input"),
  dueDate: document.querySelector("#todo-due-date"),
  list: document.querySelector("#todo-list"),
  emptyState: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyDescription: document.querySelector("#empty-description"),
  totalCount: document.querySelector("#total-count"),
  completedCount: document.querySelector("#completed-count"),
  pendingCount: document.querySelector("#pending-count"),
  filters: [...document.querySelectorAll("[data-filter]")],
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.input.value.trim();

  if (!title) return;

  state.todos.unshift({
    id: createId(),
    title,
    completed: false,
    dueDate: elements.dueDate.value || null,
    createdAt: new Date().toISOString(),
  });

  saveTodos();
  elements.form.reset();
  render();
  elements.input.focus();
});

elements.list.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const item = actionButton.closest("[data-id]");
  const todo = state.todos.find(({ id }) => id === item?.dataset.id);
  if (!todo) return;

  if (actionButton.dataset.action === "toggle") {
    todo.completed = !todo.completed;
  }

  if (actionButton.dataset.action === "delete") {
    state.todos = state.todos.filter(({ id }) => id !== todo.id);
  }

  saveTodos();
  render();
});

elements.filters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    state.filter = filterButton.dataset.filter;
    elements.filters.forEach((button) => {
      button.classList.toggle("is-active", button === filterButton);
    });
    render();
  });
});

function render() {
  const visibleTodos = getVisibleTodos();
  const completed = state.todos.filter(({ completed }) => completed).length;

  elements.totalCount.textContent = state.todos.length;
  elements.completedCount.textContent = completed;
  elements.pendingCount.textContent = state.todos.length - completed;
  elements.list.replaceChildren(...visibleTodos.map(createTodoElement));

  const hasTodos = visibleTodos.length > 0;
  elements.emptyState.hidden = hasTodos;

  if (!hasTodos) {
    const emptyCopy = getEmptyCopy();
    elements.emptyTitle.textContent = emptyCopy.title;
    elements.emptyDescription.textContent = emptyCopy.description;
  }
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  const overdue = isOverdue(todo);
  item.className = `todo-item${todo.completed ? " is-complete" : ""}${overdue ? " is-overdue" : ""}`;
  item.dataset.id = todo.id;

  const toggleButton = document.createElement("button");
  toggleButton.className = "check-button";
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute("aria-label", todo.completed ? `恢复任务：${todo.title}` : `完成任务：${todo.title}`);
  toggleButton.setAttribute("aria-pressed", String(todo.completed));

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.title;

  const content = document.createElement("div");
  content.className = "todo-content";
  content.append(text);

  if (todo.dueDate) {
    const meta = document.createElement("div");
    meta.className = "todo-meta";
    const dueDate = document.createElement("time");
    dueDate.dateTime = todo.dueDate;
    dueDate.textContent = `截止 ${formatDueDate(todo.dueDate)}${overdue ? " · 已逾期" : ""}`;
    meta.append(dueDate);
    content.append(meta);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `删除任务：${todo.title}`);
  deleteButton.textContent = "删除";

  item.append(toggleButton, content, deleteButton);
  return item;
}

function getVisibleTodos() {
  if (state.filter === "active") return state.todos.filter(({ completed }) => !completed);
  if (state.filter === "completed") return state.todos.filter(({ completed }) => completed);
  return state.todos;
}

function getEmptyCopy() {
  if (state.filter === "active") {
    return { title: "进行中列表是空的", description: "太棒了，当前没有未完成的任务。" };
  }

  if (state.filter === "completed") {
    return { title: "还没有完成的任务", description: "完成一个任务后，它会出现在这里。" };
  }

  return { title: "还没有任务", description: "先添加一件小事，给今天一个轻盈的开始。" };
}

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function isOverdue(todo) {
  return Boolean(todo.dueDate && !todo.completed && todo.dueDate < getTodayISO());
}

function formatDueDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}

function getTodayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

render();

