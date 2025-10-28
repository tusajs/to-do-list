// Простая локальная база данных
const DB_KEY = 'todoAppDatabase';
let users = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Auth script loaded');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.getElementById('auth-tabs');

    authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        }
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Загружаем пользователей из localStorage
    loadUsers();
    checkAuthStatus();
});

function loadUsers() {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
        users = db.users || [];
        console.log('✅ Users loaded from localStorage:', users.length);
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
    }
}

function saveUsers() {
    try {
        const db = {
            users: users,
            updated: new Date().toISOString()
        };
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        console.log('✅ Users saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    console.log('👤 Login attempt for:', username);
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        console.log('✅ Login successful');
        localStorage.setItem('currentUser', user.username);
        localStorage.setItem('currentUserId', user.id);
        window.location.href = './todolist.html';
    } else {
        console.log('❌ Login failed - user not found');
        alert('Неверный логин или пароль');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log('📝 Register form submitted');
    
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    console.log('👤 Registration attempt:', username);

    if (username.length < 3) {
        alert('Логин должен содержать минимум 3 символа');
        return;
    }

    if (password.length < 4) {
        alert('Пароль должен содержать минимум 4 символа');
        return;
    }

    if (users.find(u => u.username === username)) {
        alert('Пользователь с таким логином уже существует');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    };

    console.log('🆕 New user:', newUser);
    
    users.push(newUser);
    const saved = saveUsers();

    if (saved) {
        console.log('✅ Registration successful');
        alert('Регистрация успешна! Теперь вы можете войти.');
        switchAuthTab('login');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = '';
    } else {
        console.log('❌ Registration failed');
        alert('Ошибка при регистрации');
    }
}

function switchAuthTab(tab) {
    console.log('🔄 Switching tab to:', tab);
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.textContent = 'Вход';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = 'Регистрация';
    }
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const currentPage = window.location.pathname;
    
    console.log('🔍 Auth check - user:', currentUser, 'page:', currentPage);
    
    if (currentUser && currentPage.includes('index.html')) {
        console.log('🔑 Redirecting to todolist...');
        setTimeout(() => {
            window.location.href = './todolist.html';
        }, 100);
    }
}