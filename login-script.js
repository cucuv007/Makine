// Supabase Configuration
var SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzY3NzIsImV4cCI6MjA1MzU1Mjc3Mn0.5_2ypx7vZEKYOt-2hqxqJqxWJYqxqJqxqJqxqJqxqJo';

// Toggle Password Visibility
function togglePassword() {
    var passwordInput = document.getElementById('password');
    var toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Login Form Submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    var errorMessage = document.getElementById('errorMessage');
    var loginBtn = document.getElementById('loginBtn');
    
    // Clear previous error
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş yapılıyor...';
    
    try {
        // Fetch user from Supabase (case-insensitive username)
        var response = await fetch(
            SUPABASE_URL + '/rest/v1/m_users?select=*',
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Sunucuya bağlanılamadı');
        }
        
        var users = await response.json();
        
        // Find user (case-insensitive)
        var user = users.find(function(u) {
            return u.Kullanici && u.Kullanici.toLowerCase() === username.toLowerCase();
        });
        
        if (!user) {
            throw new Error('Kullanıcı adı bulunamadı');
        }
        
        // Check password
        if (user.Pass !== password) {
            throw new Error('Şifre hatalı');
        }
        
        // Login successful
        localStorage.setItem('loggedInUser', user.Kullanici);
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.add('show');
        
        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
    }
});
