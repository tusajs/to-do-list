// Простая локальная база для задач
const TASKS_KEY = 'todoAppTasks';
let currentUser = null;
let currentUserId = null;
let tasks = [];
let currentFilter = 'all';
let updateInterval = null;
let selectedTasks = new Set();

// DOM элементы
const currentUserSpan = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const addTaskForm = document.getElementById('add-task-form');
const taskCategory = document.getElementById('task-category');
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

function initApp() {
    currentUser = localStorage.getItem('currentUser');
    currentUserId = localStorage.getItem('currentUserId');
    
    console.log('🔍 Todolist auth check:', { currentUser, currentUserId });
    
    if (!currentUser || !currentUserId) {
        console.log('❌ No auth, redirecting to index...');
        window.location.href = './index.html';
        return;
    }

    console.log('✅ Auth OK, loading app...');
    currentUserSpan.textContent = currentUser;
    
    // Запускаем часы
    startClock();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Инициализируем дату по умолчанию
    document.getElementById('task-date').value = getTodayDate();
    
    // Загрузка задач
    loadTasks();
    
    // Запуск таймера
    startTimer();
    
    // Инициализация статистики
    initStats();
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

function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const category = document.getElementById('task-category').value;
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
        category: category,
        deadline: deadline.getTime(),
        completed: false,
        createdAt: Date.now(),
        totalTime: deadline.getTime() - Date.now(),
        userId: currentUserId
    };
    
    tasks.push(task);
    saveTasks();
    
    // Сбрасываем форму
    addTaskForm.reset();
    document.getElementById('task-title').value = '';
    document.getElementById('task-category').value = 'work';
    document.getElementById('task-days').value = 1;
    document.getElementById('task-date').value = getTodayDate();
    toggleDeadlineInput();
}

function deleteTask(id) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
    }
}

function toggleTaskCompletion(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        
        if (task.completed && !task.completedAt) {
            task.completedAt = Date.now();
        } else if (!task.completed) {
            task.completedAt = null;
        }
        
        saveTasks();
        updateStats(document.querySelector('.stats-tab.active').dataset.period);
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-category').value = task.category;
        
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

function saveEditedTask(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value.trim();
    const category = document.getElementById('edit-task-category').value;
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
    
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.title = title;
        task.category = category;
        task.deadline = deadline.getTime();
        task.totalTime = deadline.getTime() - task.createdAt;
        
        saveTasks();
        editModal.classList.add('hidden');
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

function handleDeleteAll() {
    if (tasks.length === 0) {
        alert('Нет задач для удаления');
        return;
    }

    if (selectedTasks.size > 0) {
        showConfirmModal(
            'Удалить выделенные задачи',
            `Вы уверены, что хотите удалить ${selectedTasks.size} выделенных задач?`,
            () => {
                tasks = tasks.filter(task => !selectedTasks.has(task.id));
                selectedTasks.clear();
                saveTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    } else {
        showConfirmModal(
            'Удалить все задачи',
            'Вы уверены, что хотите удалить ВСЕ задачи?',
            () => {
                tasks = [];
                selectedTasks.clear();
                saveTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    }
}

function handleResetStats() {
    showConfirmModal(
        'Сбросить статистику',
        'Вы уверены, что хотите удалить ВСЕ ваши задачи?',
        () => {
            tasks = [];
            selectedTasks.clear();
            saveTasks();
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

// Загрузка и сохранение задач
function loadTasks() {
    try {
        const allTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
        tasks = allTasks.filter(task => task.userId === currentUserId);
        console.log('✅ Tasks loaded:', tasks.length);
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

function saveTasks() {
    try {
        // Загружаем все задачи
        const allTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
        
        // Удаляем старые задачи текущего пользователя
        const otherTasks = allTasks.filter(task => task.userId !== currentUserId);
        
        // Добавляем текущие задачи
        const updatedTasks = [...otherTasks, ...tasks];
        
        localStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
        console.log('✅ Tasks saved');
        renderTasks();
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

function renderTasks() {
    let filteredTasks = tasks;
    
    if (currentFilter === 'work') {
        filteredTasks = tasks.filter(task => task.category === 'work');
    } else if (currentFilter === 'home') {
        filteredTasks = tasks.filter(task => task.category === 'home');
    } else if (currentFilter === 'active') {
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
    taskElement.className = `task-item ${task.category} ${task.completed ? 'completed' : ''} ${selectedTasks.has(task.id) ? 'selected' : ''}`;
    taskElement.dataset.taskId = task.id;
    
    const remainingTime = getRemainingTime(task.deadline);
    const progressInfo = getProgressInfo(task, remainingTime);
    
    const formattedDate = new Date(task.deadline).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const isSelected = selectedTasks.has(task.id);
    const categoryIcon = task.category === 'work' ? '💼' : '🏠';
    const categoryText = task.category === 'work' ? 'Рабочая' : 'Бытовые';
    
    taskElement.innerHTML = `
        <div class="task-header">
            <div style="display: flex; align-items: center; flex: 1;">
                <span class="task-title">${task.title}</span>
                <span class="task-category ${task.category}">${categoryIcon} ${categoryText}</span>
            </div>
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
    const workTasks = periodTasks.filter(task => task.category === 'work');
    const homeTasks = periodTasks.filter(task => task.category === 'home');
    
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
        workTasks: workTasks.length,
        homeTasks: homeTasks.length,
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
    document.getElementById('work-home-ratio').textContent = `${stats.workTasks}/${stats.homeTasks}`;
    
    document.getElementById('work-tasks').textContent = stats.workTasks;
    document.getElementById('home-tasks').textContent = stats.homeTasks;
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
    
    // Добавляем информацию о балансе
    if (stats.workTasks > 0 && stats.homeTasks > 0) {
        const workPercentage = Math.round((stats.workTasks / stats.totalTasks) * 100);
        const homePercentage = Math.round((stats.homeTasks / stats.totalTasks) * 100);
        message += ` Баланс: ${workPercentage}% рабочих / ${homePercentage}% бытовых задач.`;
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