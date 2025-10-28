// Обработчики событий для страницы авторизации
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.getElementById('auth-tabs');
    const authTitle = document.getElementById('auth-title');

    // Переключение между вкладками входа и регистрации
    authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        }
    });

    // Обработка формы входа
    loginForm.addEventListener('submit', handleLogin);

    // Обработка формы регистрации
    registerForm.addEventListener('submit', handleRegister);

    // Проверяем, не авторизован ли пользователь
    checkAuthStatus();
});

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    // Обновляем активные вкладки
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');

    // Показываем соответствующую форму
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

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Проверяем существование пользователя
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username] && users[username] === password) {
        // Сохраняем текущего пользователя
        localStorage.setItem('currentUser', username);
        
        // Перенаправляем на страницу с задачами
        window.location.href = 'todolist.html';
    } else {
        alert('Неверный логин или пароль');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    // Проверяем, не занят ли логин
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username]) {
        alert('Пользователь с таким логином уже существует');
        return;
    }

    // Сохраняем нового пользователя
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Регистрация успешна! Теперь вы можете войти.');
    switchAuthTab('login');
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = '';
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'todolist.html';
    }
}