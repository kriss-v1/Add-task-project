"use strict";

const storageKey = "taskflow-tasks";
const themeKey = "taskflow-theme";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const inputError = document.querySelector("#input-error");
const themeToggle = document.querySelector("#theme-toggle");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let currentFilter = "all";

// Load saved data defensively so malformed storage never breaks the page.
function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((task) => !task.completed);
  if (currentFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.innerHTML = "";

  visibleTasks.forEach((task) => taskList.append(createTaskElement(task)));
  emptyState.hidden = visibleTasks.length !== 0;

  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;
  item.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.className = "task-checkbox";
  checkbox.id = `task-${task.id}`;
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.completed ? "active" : "complete"}`);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const checkLabel = document.createElement("label");
  checkLabel.className = "check-label";
  checkLabel.htmlFor = checkbox.id;
  checkLabel.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "x";
  deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
  deleteButton.title = "Delete task";
  deleteButton.addEventListener("click", () => deleteTask(task.id, item));

  item.append(checkbox, checkLabel, text, deleteButton);
  return item;
}

function addTask(text) {
  tasks.unshift({ id: Date.now().toString(), text, completed: false });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

function deleteTask(id, item) {
  item.classList.add("is-leaving");
  item.addEventListener("transitionend", () => {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  }, { once: true });
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "Light" : "Dark";
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  localStorage.setItem(themeKey, theme);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    inputError.textContent = "Please enter a task before adding it.";
    taskInput.focus();
    return;
  }
  addTask(text);
  taskInput.value = "";
  inputError.textContent = "";
  taskInput.focus();
});

taskInput.addEventListener("input", () => { inputError.textContent = ""; });

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filter) => filter.classList.toggle("is-active", filter === button));
    renderTasks();
  });
});

themeToggle.addEventListener("click", () => {
  setTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

setTheme(localStorage.getItem(themeKey) || "light");
renderTasks();
