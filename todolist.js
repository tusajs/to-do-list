// JSONBin.io конфигурация
const JSONBIN_API_KEY = '$2a$10$rB6rOL9mv7G7jR9mYQStnOqoKIVzmQukSnEkpKQXfrdrV9g1UYNie';

let currentUser = null;
let currentUserId = null;
let userTasksBinId = null;
let tasks = [];
let currentFilter = 'all';
let updateInterval = null;
let selectedTasks = new Set();

// DOM элементы
const currentUserSpan = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const addTaskForm = document.getElementById('add-task-form');
const taskDeadlineType = document.getElementById('task-deadline-type');
const daysInputContainer = document.getElementById('days-input-container');
const dateInputContainer = document.getElementById('date-input-container');
const tasksList = document.getElementById('tasks-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('edit-modal');
const editTaskForm = document.getElementById('edit-task-form');
const cancelEditBtn = document.getElementById('cancel-edit');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');
const selectAllBtn = document.getElementById('select-all-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const resetStatsBtn = document.getElementById('reset-stats-btn');

// Функции для времени
function updateCurrentDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function startClock() {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);
}

function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    currentUser = localStorage.getItem('currentUser');
    currentUserId = localStorage.getItem('currentUserId');
    
    if (!currentUser || !currentUserId) {
        window.location.href = './index.html';
        return;
    }

    // ... остальной код
}

// На это:
async function initApp() {
    currentUser = localStorage.getItem('currentUser');
    currentUserId = localStorage.getItem('currentUserId');
    
    console.log('🔍 Todolist auth check:', { currentUser, currentUserId });
    
    if (!currentUser || !currentUserId) {
        console.log('❌ No auth, redirecting to index...');
        setTimeout(() => {
            window.location.href = './index.html';
        }, 100);
        return;
    }

    console.log('✅ Auth OK, loading app...');
    currentUserSpan.textContent = currentUser;
    
    // ... остальной код без изменений
    startClock();
    setupEventListeners();
    document.getElementById('task-date').value = getTodayDate();
    await setupUserTasksBin();
    await loadTasks();
    startTimer();
    initStats();
}

async function setupUserTasksBin() {
    // Получаем информацию о пользователе чтобы найти его tasksBinId
    const usersResponse = await fetch(`https://api.jsonbin.io/v3/b/675a5b59e41b4d34e4412345/latest`, {
        headers: {
            'X-Master-Key': JSONBIN_API_KEY
        }
    });
    
    if (usersResponse.ok) {
        const data = await usersResponse.json();
        const users = data.record?.users || [];
        const currentUserData = users.find(u => u.id === currentUserId);
        
        if (currentUserData && currentUserData.tasksBinId) {
            userTasksBinId = currentUserData.tasksBinId;
        } else {
            // Создаем новую базу задач для пользователя
            userTasksBinId = await createUserTasksBin();
            
            // Обновляем пользователя с новым tasksBinId
            await updateUserWithTasksBinId(userTasksBinId);
        }
    }
}

async function createUserTasksBin() {
    const initialTasksData = {
        tasks: [],
        userId: currentUserId,
        username: currentUser,
        created: new Date().toISOString()
    };
    
    try {
        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Name': `Tasks - ${currentUser}`
            },
            body: JSON.stringify(initialTasksData)
        });
        
        const data = await response.json();
        return data.metadata.id;
    } catch (error) {
        console.error('Ошибка создания базы задач:', error);
        throw error;
    }
}

async function updateUserWithTasksBinId(tasksBinId) {
    const usersResponse = await fetch(`https://api.jsonbin.io/v3/b/675a5b59e41b4d34e4412345/latest`, {
        headers: {
            'X-Master-Key': JSONBIN_API_KEY
        }
    });
    
    if (usersResponse.ok) {
        const data = await usersResponse.json();
        const users = data.record.users || [];
        
        const userIndex = users.findIndex(u => u.id === currentUserId);
        if (userIndex !== -1) {
            users[userIndex].tasksBinId = tasksBinId;
            
            await fetch(`https://api.jsonbin.io/v3/b/675a5b59e41b4d34e4412345`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify({
                    users: users,
                    metadata: data.record.metadata
                })
            });
        }
    }
}

function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    taskDeadlineType.addEventListener('change', toggleDeadlineInput);
    addTaskForm.addEventListener('submit', addTask);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            setFilter(filter);
        });
    });

    editTaskForm.addEventListener('submit', saveEditedTask);
    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });

    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.add('hidden');
        }
    });

    confirmNo.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    selectAllBtn.addEventListener('click', handleSelectAll);
    deleteAllBtn.addEventListener('click', handleDeleteAll);
    resetStatsBtn.addEventListener('click', handleResetStats);
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    window.location.href = './index.html';
}

function toggleDeadlineInput() {
    const type = taskDeadlineType.value;
    
    if (type === 'days') {
        daysInputContainer.classList.remove('hidden');
        dateInputContainer.classList.add('hidden');
        document.getElementById('task-days').value = 1;
    } else {
        daysInputContainer.classList.add('hidden');
        dateInputContainer.classList.remove('hidden');
        document.getElementById('task-date').value = getTodayDate();
    }
}

function getEndOfDay(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
}

async function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const deadlineType = taskDeadlineType.value;
    
    if (!title) {
        alert('Введите название задачи');
        return;
    }
    
    let deadline;
    if (deadlineType === 'days') {
        const days = parseInt(document.getElementById('task-days').value);
        deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        deadline = getEndOfDay(deadline);
    } else {
        const dateValue = document.getElementById('task-date').value;
        deadline = new Date(dateValue + 'T23:59:59.999');
    }
    
    const task = {
        id: Date.now().toString(),
        title: title,
        deadline: deadline.getTime(),
        completed: false,
        createdAt: Date.now(),
        totalTime: deadline.getTime() - Date.now(),
        userId: currentUserId
    };
    
    try {
        tasks.push(task);
        await saveTasks();
        
        // Сбрасываем форму
        addTaskForm.reset();
        document.getElementById('task-title').value = '';
        document.getElementById('task-days').value = 1;
        document.getElementById('task-date').value = getTodayDate();
        
    } catch (error) {
        console.error('Ошибка добавления задачи:', error);
        alert('Ошибка при добавлении задачи');
        tasks.pop(); // Откатываем изменения
    }
}

async function deleteTask(id) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
            tasks = tasks.filter(task => task.id !== id);
            await saveTasks();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Ошибка при удалении задачи');
        }
    }
}

async function toggleTaskCompletion(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        task.completed = !task.completed;
        
        if (task.completed && !task.completedAt) {
            task.completedAt = Date.now();
        } else if (!task.completed) {
            task.completedAt = null;
        }
        
        try {
            await saveTasks();
            updateStats(document.querySelector('.stats-tab.active').dataset.period);
        } catch (error) {
            console.error('Ошибка обновления:', error);
            alert('Ошибка при обновлении задачи');
            // Откатываем изменения
            task.completed = !task.completed;
            if (task.completedAt) {
                task.completedAt = task.completed ? Date.now() : null;
            }
        }
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        
        const deadline = new Date(task.deadline);
        document.getElementById('edit-task-deadline-type').value = 'date';
        
        const year = deadline.getFullYear();
        const month = String(deadline.getMonth() + 1).padStart(2, '0');
        const day = String(deadline.getDate()).padStart(2, '0');
        document.getElementById('edit-task-date').value = `${year}-${month}-${day}`;
        
        document.getElementById('edit-date-input-container').classList.remove('hidden');
        document.getElementById('edit-days-input-container').classList.add('hidden');
        
        editModal.classList.remove('hidden');
    }
}

async function saveEditedTask(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value.trim();
    const deadlineType = document.getElementById('edit-task-deadline-type').value;
    
    if (!title) {
        alert('Введите название задачи');
        return;
    }
    
    let deadline;
    if (deadlineType === 'days') {
        const days = parseInt(document.getElementById('edit-task-days').value);
        deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        deadline = getEndOfDay(deadline);
    } else {
        const dateValue = document.getElementById('edit-task-date').value;
        deadline = new Date(dateValue + 'T23:59:59.999');
    }
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].title = title;
        tasks[taskIndex].deadline = deadline.getTime();
        tasks[taskIndex].totalTime = deadline.getTime() - tasks[taskIndex].createdAt;
        
        try {
            await saveTasks();
            editModal.classList.add('hidden');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении задачи');
        }
    }
}

// Функции управления задачами
function handleSelectAll() {
    const allSelected = selectedTasks.size === tasks.length;
    
    if (allSelected) {
        selectedTasks.clear();
        selectAllBtn.textContent = 'Выделить все';
    } else {
        selectedTasks.clear();
        tasks.forEach(task => selectedTasks.add(task.id));
        selectAllBtn.textContent = 'Снять выделение';
    }
    
    renderTasks();
}

async function handleDeleteAll() {
    if (tasks.length === 0) {
        alert('Нет задач для удаления');
        return;
    }

    if (selectedTasks.size > 0) {
        showConfirmModal(
            'Удалить выделенные задачи',
            `Вы уверены, что хотите удалить ${selectedTasks.size} выделенных задач?`,
            async () => {
                tasks = tasks.filter(task => !selectedTasks.has(task.id));
                selectedTasks.clear();
                await saveTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    } else {
        showConfirmModal(
            'Удалить все задачи',
            'Вы уверены, что хотите удалить ВСЕ задачи?',
            async () => {
                tasks = [];
                selectedTasks.clear();
                await saveTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    }
}

async function handleResetStats() {
    showConfirmModal(
        'Сбросить статистику',
        'Вы уверены, что хотите удалить ВСЕ ваши задачи?',
        async () => {
            tasks = [];
            selectedTasks.clear();
            await saveTasks();
            selectAllBtn.textContent = 'Выделить все';
            updateStats(document.querySelector('.stats-tab.active').dataset.period);
            alert('Все задачи удалены!');
        }
    );
}

function showConfirmModal(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.classList.remove('hidden');
    
    confirmYes.replaceWith(confirmYes.cloneNode(true));
    const newConfirmYes = document.getElementById('confirm-yes');
    
    newConfirmYes.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        onConfirm();
    });
}

function setFilter(filter) {
    currentFilter = filter;
    
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

// Загрузка задач из JSONBin
async function loadTasks() {
    if (!userTasksBinId) return;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${userTasksBinId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            tasks = data.record?.tasks || [];
            renderTasks();
        }
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
    }
}

// Сохранение задач в JSONBin
async function saveTasks() {
    if (!userTasksBinId) return;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${userTasksBinId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                tasks: tasks,
                userId: currentUserId,
                username: currentUser,
                updated: new Date().toISOString(),
                totalTasks: tasks.length
            })
        });
        
        if (response.ok) {
            renderTasks();
        } else {
            throw new Error('Ошибка сохранения');
        }
    } catch (error) {
        console.error('Ошибка сохранения задач:', error);
        throw error;
    }
}

function renderTasks() {
    let filteredTasks = tasks;
    
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return a.deadline - b.deadline;
    });
    
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">Задачи не найдены</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
    
    if (selectedTasks.size === tasks.length && tasks.length > 0) {
        selectAllBtn.textContent = 'Снять выделение';
    } else {
        selectAllBtn.textContent = 'Выделить все';
    }
}

// Функция для получения оставшегося времени
function getRemainingTime(deadline) {
    const now = new Date();
    const target = new Date(deadline);
    
    const diff = target - now;
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, totalMs: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, totalMs: diff };
}

// Функция для получения информации о прогрессе
function getProgressInfo(task, remainingTime) {
    const totalTime = task.totalTime || (task.deadline - task.createdAt);
    const progressPercentage = Math.min(100, Math.max(0, ((totalTime - remainingTime.totalMs) / totalTime) * 100));
    
    let color, text, textColor, textBg;
    
    if (task.completed) {
        color = 'var(--success)';
        text = 'Выполнено';
        textColor = '#fff';
        textBg = 'var(--success)';
    } else if (remainingTime.totalMs <= 0) {
        color = 'var(--danger)';
        text = 'Просрочено';
        textColor = '#fff';
        textBg = 'var(--danger)';
    } else {
        const timePercentage = (remainingTime.totalMs / totalTime) * 100;
        
        if (timePercentage > 50) {
            color = 'var(--success)';
        } else if (timePercentage > 20) {
            color = 'var(--warning)';
        } else {
            color = 'var(--danger)';
        }
        
        if (remainingTime.days > 0) {
            text = `${remainingTime.days}${getDayText(remainingTime.days)} ${remainingTime.hours}ч`;
        } else if (remainingTime.hours > 0) {
            text = `${remainingTime.hours}ч ${remainingTime.minutes}м`;
        } else {
            text = `${remainingTime.minutes}м`;
        }
        
        textColor = timePercentage < 20 ? '#fff' : '#000';
        textBg = timePercentage < 20 ? 'var(--danger)' : 
                 timePercentage < 50 ? 'var(--warning)' : 'var(--success)';
    }
    
    return {
        width: task.completed ? 100 : progressPercentage,
        color: color,
        text: text,
        textColor: textColor,
        textBg: textBg
    };
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${selectedTasks.has(task.id) ? 'selected' : ''}`;
    taskElement.dataset.taskId = task.id;
    
    const remainingTime = getRemainingTime(task.deadline);
    const progressInfo = getProgressInfo(task, remainingTime);
    
    const formattedDate = new Date(task.deadline).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const isSelected = selectedTasks.has(task.id);
    
    taskElement.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <div class="task-actions">
                <button class="task-action-btn select-btn" title="${isSelected ? 'Снять выделение' : 'Выделить'}">
                    ${isSelected ? '✅' : '⭕'}
                </button>
                <button class="task-action-btn edit-btn" title="Редактировать">
                    ✏️
                </button>
                <button class="task-action-btn complete-btn" title="${task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную'}">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="task-action-btn delete-btn" title="Удалить">
                    🗑️
                </button>
            </div>
        </div>
        <div class="task-deadline">
            <div class="deadline-text">
                <span><strong>Срок:</strong> ${formattedDate}</span>
                <span class="deadline-time" style="color: ${progressInfo.textColor}; background: ${progressInfo.textBg}">
                    ${progressInfo.text}
                </span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressInfo.width}%; background-color: ${progressInfo.color};"></div>
            </div>
        </div>
    `;
    
    const selectBtn = taskElement.querySelector('.select-btn');
    const editBtn = taskElement.querySelector('.edit-btn');
    const completeBtn = taskElement.querySelector('.complete-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');
    
    selectBtn.addEventListener('click', () => toggleTaskSelection(task.id));
    editBtn.addEventListener('click', () => editTask(task.id));
    completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return taskElement;
}

function toggleTaskSelection(taskId) {
    if (selectedTasks.has(taskId)) {
        selectedTasks.delete(taskId);
    } else {
        selectedTasks.add(taskId);
    }
    renderTasks();
}

function updateTaskTimes() {
    const taskElements = document.querySelectorAll('.task-item');
    taskElements.forEach(taskElement => {
        const taskId = taskElement.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        
        if (task && !task.completed) {
            const remainingTime = getRemainingTime(task.deadline);
            const progressInfo = getProgressInfo(task, remainingTime);
            
            const progressFill = taskElement.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${progressInfo.width}%`;
                progressFill.style.backgroundColor = progressInfo.color;
            }
            
            const deadlineTime = taskElement.querySelector('.deadline-time');
            if (deadlineTime) {
                deadlineTime.textContent = progressInfo.text;
                deadlineTime.style.color = progressInfo.textColor;
                deadlineTime.style.background = progressInfo.textBg;
            }
        }
    });
}

function startTimer() {
    updateInterval = setInterval(() => {
        updateTaskTimes();
    }, 60000);
}

// Функции для статистики
function calculateStats(period = 'week') {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'all':
            startDate = new Date(0);
            break;
    }
    
    const periodTasks = tasks.filter(task => 
        new Date(task.createdAt) >= startDate
    );
    
    const completedTasks = periodTasks.filter(task => task.completed);
    const activeTasks = periodTasks.filter(task => !task.completed);
    
    let totalEarlyTime = 0;
    let earlyCompletions = 0;
    let onTimeCompletions = 0;
    let overdueCompletions = 0;
    
    completedTasks.forEach(task => {
        const completionTime = task.completedAt || task.createdAt;
        const deadline = task.deadline;
        const timeDiff = deadline - completionTime;
        
        if (timeDiff > 0) {
            totalEarlyTime += timeDiff;
            earlyCompletions++;
        } else if (timeDiff === 0) {
            onTimeCompletions++;
        } else {
            overdueCompletions++;
        }
    });
    
    const totalTasks = periodTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const avgEarlyHours = earlyCompletions > 0 ? Math.round(totalEarlyTime / (1000 * 60 * 60 * earlyCompletions)) : 0;
    
    return {
        totalTasks,
        completedTasks: completedTasks.length,
        activeTasks: activeTasks.length,
        completionRate,
        avgEarlyHours,
        earlyCompletions,
        onTimeCompletions,
        overdueCompletions
    };
}

function updateStats(period = 'week') {
    const stats = calculateStats(period);
    
    document.getElementById('total-tasks').textContent = stats.totalTasks;
    document.getElementById('completed-tasks').textContent = stats.completedTasks;
    document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
    document.getElementById('avg-early').textContent = `${stats.avgEarlyHours}ч`;
    
    document.getElementById('on-time').textContent = stats.onTimeCompletions;
    document.getElementById('early').textContent = stats.earlyCompletions;
    document.getElementById('overdue').textContent = stats.overdueCompletions;
    document.getElementById('active').textContent = stats.activeTasks;
    
    updatePerformanceMessage(stats);
}

function updatePerformanceMessage(stats) {
    const messageElement = document.getElementById('performance-message');
    let message = '';
    
    if (stats.totalTasks === 0) {
        message = 'Начните добавлять задачи для отслеживания статистики';
    } else if (stats.completionRate >= 80) {
        message = 'Отличная работа! Вы выполняете большинство задач вовремя.';
    } else if (stats.completionRate >= 60) {
        message = 'Хорошие результаты! Продолжайте в том же духе.';
    } else if (stats.completionRate >= 40) {
        message = 'Неплохо, но есть куда стремиться. Попробуйте лучше планировать время.';
    } else {
        message = 'Вам стоит пересмотреть подход к планированию задач.';
    }
    
    if (stats.avgEarlyHours > 0) {
        message += ` Вы в среднем завершаете задачи на ${stats.avgEarlyHours} часов раньше срока!`;
    }
    
    if (stats.overdueCompletions > 0) {
        message += ` Обратите внимание на ${stats.overdueCompletions} просроченных задач.`;
    }
    
    messageElement.textContent = message;
}

function initStats() {
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const period = tab.dataset.period;
            
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            updateStats(period);
        });
    });
    
    updateStats('week');
}

function getDayText(days) {
    if (days % 10 === 1 && days % 100 !== 11) {
        return ' день';
    } else if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) {
        return ' дня';
    } else {
        return ' дней';
    }
}

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});