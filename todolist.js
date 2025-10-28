// Основные переменные приложения
let currentUser = null;
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

// Функции для обновления даты и времени
function updateCurrentDateTime() {
    const now = new Date();
    
    // Форматируем дату
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Форматируем время
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Функция для запуска часов
function startClock() {
    // Обновляем сразу при запуске
    updateCurrentDateTime();
    
    // Обновляем каждую секунду
    setInterval(updateCurrentDateTime, 1000);
}

// Функция для получения корректной сегодняшней даты
function getTodayDate() {
    const now = new Date();
    
    // Получаем дату в локальном времени
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function getCurrentDate() {
    const now = new Date();
    return {
        date: now.toLocaleDateString('ru-RU'),
        time: now.toLocaleTimeString('ru-RU'),
        timestamp: now.getTime()
    };
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Проверяем авторизацию
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    currentUserSpan.textContent = currentUser;
    
    // Запускаем часы
    startClock();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Инициализируем дату по умолчанию КОРРЕКТНО
    document.getElementById('task-date').value = getTodayDate();
    
    console.log('Инициализирована дата по умолчанию:', {
        today: getTodayDate(),
        localDate: new Date().toLocaleDateString('ru-RU'),
        UTC: new Date().toISOString()
    });
    
    // Загрузка задач
    loadTasks();
    
    // Запуск таймера для обновления времени
    startTimer();
    
    // Инициализация статистики
    initStats();
    
    console.log('Приложение инициализировано. Текущая дата:', getCurrentDate());
}

function setupEventListeners() {
    // Выход из системы
    logoutBtn.addEventListener('click', handleLogout);

    // Переключение типа срока выполнения
    taskDeadlineType.addEventListener('change', toggleDeadlineInput);
    
    // Добавление новой задачи
    addTaskForm.addEventListener('submit', addTask);

    // Фильтрация задач
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            setFilter(filter);
        });
    });

    // Редактирование задачи
    editTaskForm.addEventListener('submit', saveEditedTask);
    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    // Закрытие модальных окон
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

    // Управление задачами
    selectAllBtn.addEventListener('click', handleSelectAll);
    deleteAllBtn.addEventListener('click', handleDeleteAll);
    resetStatsBtn.addEventListener('click', handleResetStats);
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
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
        
        // Устанавливаем минимальную дату - сегодня
        const today = getTodayDate();
        document.getElementById('task-date').min = today;
        
        // Устанавливаем дату по умолчанию - СЕГОДНЯ (корректно)
        document.getElementById('task-date').value = today;
        
        console.log('Установлена дата по умолчанию:', {
            today: today,
            localDate: new Date().toLocaleDateString('ru-RU')
        });
    }
}

// Функция для получения конца дня
function getEndOfDay(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
}

function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const deadlineType = taskDeadlineType.value;
    
    console.log('Создание задачи:', {
        title,
        deadlineType,
        currentLocalDate: new Date().toLocaleDateString('ru-RU'),
        currentUTC: new Date().toISOString()
    });
    
    let deadline;
    if (deadlineType === 'days') {
        const days = parseInt(document.getElementById('task-days').value);
        deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        deadline = getEndOfDay(deadline);
        
        console.log('Расчет по дням:', {
            days,
            calculatedDate: deadline.toLocaleDateString('ru-RU'),
            calculatedUTC: deadline.toISOString()
        });
    } else {
        const dateValue = document.getElementById('task-date').value;
        
        // Создаем дату из значения input (уже в правильном формате)
        deadline = new Date(dateValue + 'T23:59:59.999'); // Прямо устанавливаем конец дня
        
        console.log('Расчет по дате:', {
            selectedDate: dateValue,
            calculatedDate: deadline.toLocaleDateString('ru-RU'),
            calculatedUTC: deadline.toISOString()
        });
    }
    
    const task = {
        id: Date.now().toString(),
        title,
        deadline: deadline.getTime(),
        completed: false,
        createdAt: Date.now(),
        totalTime: deadline.getTime() - Date.now()
    };
    
    console.log('Созданная задача:', {
        deadlineLocal: new Date(task.deadline).toLocaleString('ru-RU'),
        deadlineUTC: new Date(task.deadline).toISOString()
    });
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    
    // Сбрасываем форму
    addTaskForm.reset();
    document.getElementById('task-title').value = '';
    document.getElementById('task-days').value = 1;
    
    // Переустанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('task-date').value = getTodayDate();
}

function deleteTask(id) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
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
        renderTasks();
        updateStats(document.querySelector('.stats-tab.active').dataset.period);
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        
        const deadline = new Date(task.deadline);
        
        // Всегда показываем дату как приоритет
        document.getElementById('edit-task-deadline-type').value = 'date';
        
        // Устанавливаем дату из задачи в правильном формате
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
    const title = document.getElementById('edit-task-title').value;
    const deadlineType = document.getElementById('edit-task-deadline-type').value;
    
    let deadline;
    if (deadlineType === 'days') {
        const days = parseInt(document.getElementById('edit-task-days').value);
        deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        deadline = getEndOfDay(deadline);
    } else {
        const dateValue = document.getElementById('edit-task-date').value;
        // Прямо устанавливаем конец выбранного дня
        deadline = new Date(dateValue + 'T23:59:59.999');
    }
    
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.title = title;
        task.deadline = deadline.getTime();
        task.totalTime = deadline.getTime() - task.createdAt;
        saveTasks();
        renderTasks();
        editModal.classList.add('hidden');
    }
}

// Функции для управления задачами
function handleSelectAll() {
    const allSelected = selectedTasks.size === tasks.length;
    
    if (allSelected) {
        // Если все уже выделены - снимаем выделение
        selectedTasks.clear();
        selectAllBtn.textContent = 'Выделить все';
    } else {
        // Выделяем все задачи
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
        // Удаляем только выделенные задачи
        showConfirmModal(
            'Удалить выделенные задачи',
            `Вы уверены, что хотите удалить ${selectedTasks.size} выделенных задач?`,
            () => {
                tasks = tasks.filter(task => !selectedTasks.has(task.id));
                selectedTasks.clear();
                saveTasks();
                renderTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    } else {
        // Удаляем все задачи
        showConfirmModal(
            'Удалить все задачи',
            'Вы уверены, что хотите удалить ВСЕ задачи? Это действие нельзя отменить.',
            () => {
                tasks = [];
                selectedTasks.clear();
                saveTasks();
                renderTasks();
                selectAllBtn.textContent = 'Выделить все';
            }
        );
    }
}

function handleResetStats() {
    showConfirmModal(
        'Сбросить статистику',
        'Вы уверены, что хотите сбросить всю статистику? Это действие нельзя отменить.',
        () => {
            // Удаляем все задачи текущего пользователя
            tasks = [];
            selectedTasks.clear();
            saveTasks();
            renderTasks();
            selectAllBtn.textContent = 'Выделить все';
            
            // Обновляем статистику
            updateStats(document.querySelector('.stats-tab.active').dataset.period);
            
            alert('Статистика успешно сброшена!');
        }
    );
}

function showConfirmModal(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.classList.remove('hidden');
    
    // Удаляем старые обработчики
    confirmYes.replaceWith(confirmYes.cloneNode(true));
    const newConfirmYes = document.getElementById('confirm-yes');
    
    // Добавляем новый обработчик
    newConfirmYes.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        onConfirm();
    });
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Обновляем активную кнопку фильтра
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

function renderTasks() {
    // Фильтруем задачи в зависимости от текущего фильтра
    let filteredTasks = tasks;
    
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    // Сортируем задачи: сначала невыполненные, затем выполненные
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return a.deadline - b.deadline;
    });
    
    // Очищаем список задач
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">Задачи не найдены</p>';
        return;
    }
    
    // Добавляем задачи в список
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
    
    // Обновляем текст кнопки выделения
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
    
    // Разница в миллисекундах
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
        // Рассчитываем цвет на основе процента оставшегося времени
        const timePercentage = (remainingTime.totalMs / totalTime) * 100;
        
        if (timePercentage > 50) {
            color = 'var(--success)'; // Зеленый
        } else if (timePercentage > 20) {
            color = 'var(--warning)'; // Желтый
        } else {
            color = 'var(--danger)'; // Красный
        }
        
        // Текст с оставшимся временем
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
    
    // Форматируем дату для отображения
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
            <div class="debug-info">
                Создано: ${new Date(task.createdAt).toLocaleString('ru-RU')} | 
                Дедлайн: ${new Date(task.deadline).toLocaleString('ru-RU')} |
                Сейчас: ${new Date().toLocaleString('ru-RU')}
            </div>
        </div>
    `;
    
    // Добавляем обработчики событий для кнопок
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
            
            // Обновляем прогресс-бар
            const progressFill = taskElement.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${progressInfo.width}%`;
                progressFill.style.backgroundColor = progressInfo.color;
            }
            
            // Обновляем текст времени
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
    // Обновляем время каждую минуту
    updateInterval = setInterval(() => {
        updateTaskTimes();
    }, 60000); // 1 минута
}

function loadTasks() {
    const savedTasks = localStorage.getItem(`tasks_${currentUser}`);
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
    
    // Обновляем общее время для старых задач
    tasks.forEach(task => {
        if (!task.totalTime) {
            task.totalTime = task.deadline - task.createdAt;
        }
    });
    
    renderTasks();
}

function saveTasks() {
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
}

// Функции для статистики
function calculateStats(period = 'week') {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'week':
            // Начало недели (понедельник)
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            // Начало месяца
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'all':
            // Все время (очень старая дата)
            startDate = new Date(0);
            break;
    }
    
    const periodTasks = tasks.filter(task => 
        new Date(task.createdAt) >= startDate
    );
    
    const completedTasks = periodTasks.filter(task => task.completed);
    const activeTasks = periodTasks.filter(task => !task.completed);
    
    // Расчет времени выполнения
    let totalEarlyTime = 0;
    let earlyCompletions = 0;
    let onTimeCompletions = 0;
    let overdueCompletions = 0;
    
    completedTasks.forEach(task => {
        const completionTime = task.completedAt || task.createdAt;
        const deadline = task.deadline;
        const timeDiff = deadline - completionTime;
        
        if (timeDiff > 0) {
            // Задача завершена досрочно
            totalEarlyTime += timeDiff;
            earlyCompletions++;
        } else if (timeDiff === 0) {
            // Задача завершена вовремя
            onTimeCompletions++;
        } else {
            // Задача просрочена
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
    
    // Обновляем основные показатели
    document.getElementById('total-tasks').textContent = stats.totalTasks;
    document.getElementById('completed-tasks').textContent = stats.completedTasks;
    document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
    document.getElementById('avg-early').textContent = `${stats.avgEarlyHours}ч`;
    
    // Обновляем детальную статистику
    document.getElementById('on-time').textContent = stats.onTimeCompletions;
    document.getElementById('early').textContent = stats.earlyCompletions;
    document.getElementById('overdue').textContent = stats.overdueCompletions;
    document.getElementById('active').textContent = stats.activeTasks;
    
    // Обновляем сообщение о производительности
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
    
    // Добавляем информацию о времени, если есть данные
    if (stats.avgEarlyHours > 0) {
        message += ` Вы в среднем завершаете задачи на ${stats.avgEarlyHours} часов раньше срока!`;
    }
    
    if (stats.overdueCompletions > 0) {
        message += ` Обратите внимание на ${stats.overdueCompletions} просроченных задач.`;
    }
    
    messageElement.textContent = message;
}

// Функция инициализации статистики
function initStats() {
    // Обработчики для вкладок статистики
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const period = tab.dataset.period;
            
            // Обновляем активные вкладки
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Обновляем статистику
            updateStats(period);
        });
    });
    
    // Первоначальное обновление статистики
    updateStats('week');
}

// Вспомогательная функция для правильного склонения
function getDayText(days) {
    if (days % 10 === 1 && days % 100 !== 11) {
        return ' день';
    } else if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) {
        return ' дня';
    } else {
        return ' дней';
    }
}

// Функция для отладки дат
function debugDates() {
    console.log('=== ОТЛАДКА ДАТ ===');
    console.log('Локальная дата:', new Date().toLocaleDateString('ru-RU'));
    console.log('UTC дата:', new Date().toISOString());
    console.log('Input value:', document.getElementById('task-date').value);
    console.log('Сегодня через getTodayDate():', getTodayDate());
    
    tasks.forEach((task, index) => {
        const deadline = new Date(task.deadline);
        console.log(`Задача ${index + 1}:`, {
            title: task.title,
            created: new Date(task.createdAt).toLocaleString('ru-RU'),
            deadline: deadline.toLocaleString('ru-RU'),
            deadlineUTC: deadline.toISOString()
        });
    });
    console.log('==================');
}

// Очистка таймера при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});