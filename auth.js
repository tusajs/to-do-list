// JSONBin.io конфигурация
const JSONBIN_API_KEY = '$2a$10$rB6rOL9mv7G7jR9mYQStnOqoKIVzmQukSnEkpKQXfrdrV9g1UYNie';
const JSONBIN_BIN_ID = '675a5b59e41b4d34e4412345'; // Фиксированный ID для пользователей

// Глобальные переменные
let users = [];

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.getElementById('auth-tabs');
    const authTitle = document.getElementById('auth-title');

    authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        }
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Загружаем пользователей при старте
    loadUsers();
    checkAuthStatus();
});

async function loadUsers() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            users = data.record?.users || [];
            console.log('Загружено пользователей:', users.length);
        } else {
            // Создаем новую базу если не существует
            await createInitialDatabase();
        }
    } catch (error) {
        console.log('Создаем новую базу...');
        await createInitialDatabase();
    }
}

async function createInitialDatabase() {
    const initialData = {
        users: [],
        metadata: {
            created: new Date().toISOString()
        }
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
        
        if (response.ok) {
            users = [];
            console.log('Создана новая база данных');
        }
    } catch (error) {
        console.error('Ошибка создания базы:', error);
        alert('Ошибка подключения к базе данных');
    }
}

async function saveUsers() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                users: users,
                metadata: {
                    updated: new Date().toISOString(),
                    totalUsers: users.length
                }
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', user.username);
        localStorage.setItem('currentUserId', user.id);
        window.location.href = './todolist.html';
    } else {
        alert('Неверный логин или пароль');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

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
        createdAt: new Date().toISOString(),
        tasksBinId: null // будет создан при первом входе
    };

    users.push(newUser);
    const saved = await saveUsers();

    if (saved) {
        alert('Регистрация успешна! Теперь вы можете войти.');
        switchAuthTab('login');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = '';
    } else {
        alert('Ошибка при регистрации');
    }
}

function switchAuthTab(tab) {
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
    if (currentUser) {
        window.location.href = './todolist.html';
    }
}