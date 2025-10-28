// JSONBin.io конфигурация
const JSONBIN_API_KEY = '$2a$10$rB6rOL9mv7G7jR9mYQStnOqoKIVzmQukSnEkpKQXfrdrV9g1UYNie';
const JSONBIN_BIN_ID = '675a5b59e41b4d34e4412345';

let users = [];
let authChecked = false; // Флаг чтобы избежать зацикливания

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Auth script loaded');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.getElementById('auth-tabs');

    console.log('Login form:', loginForm);
    console.log('Register form:', registerForm);
    
    authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        }
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Загружаем пользователей и проверяем авторизацию
    loadUsers().then(() => {
        checkAuthStatus();
    });
});

async function loadUsers() {
    try {
        console.log('📡 Loading users from JSONBin...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            users = data.record?.users || [];
            console.log('✅ Users loaded:', users.length);
        } else {
            console.log('❌ Response not OK, creating new database...');
            await createInitialDatabase();
        }
    } catch (error) {
        console.error('💥 Error loading users:', error);
        users = [];
    }
}

async function createInitialDatabase() {
    console.log('🆕 Creating initial database...');
    const initialData = { 
        users: [],
        created: new Date().toISOString()
    };
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(initialData)
        });
        
        console.log('🔄 Create database response:', response.status);
        
        if (response.ok) {
            users = [];
            console.log('✅ Database created successfully');
        }
    } catch (error) {
        console.error('💥 Error creating database:', error);
    }
}

async function saveUsers() {
    console.log('💾 Saving users:', users.length);
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ 
                users: users,
                updated: new Date().toISOString()
            })
        });
        
        console.log('📨 Save response status:', response.status);
        return response.ok;
    } catch (error) {
        console.error('💥 Save error:', error);
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
        authChecked = true;
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
    console.log('📋 Users array now:', users.length);

    const saved = await saveUsers();

    if (saved) {
        console.log('✅ Registration successful');
        alert('Регистрация успешна! Теперь вы можете войти.');
        switchAuthTab('login');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = '';
    } else {
        console.log('❌ Registration failed - save error');
        users = users.filter(u => u.username !== username);
        alert('Ошибка при регистрации. Попробуйте еще раз.');
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
    if (authChecked) return; // Уже проверяли
    
    const currentUser = localStorage.getItem('currentUser');
    const currentPage = window.location.pathname;
    
    console.log('🔍 Auth check - user:', currentUser, 'page:', currentPage);
    
    if (currentUser && currentPage.includes('index.html')) {
        console.log('🔑 Redirecting to todolist...');
        authChecked = true;
        setTimeout(() => {
            window.location.href = './todolist.html';
        }, 100);
    } else if (!currentUser && currentPage.includes('todolist.html')) {
        console.log('🔒 Redirecting to index...');
        authChecked = true;
        setTimeout(() => {
            window.location.href = './index.html';
        }, 100);
    } else {
        console.log('📍 Staying on current page');
    }
}