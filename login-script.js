// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

// Şifre göster/gizle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Hata mesajı göster
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(function () {
        errorDiv.classList.remove('show');
    }, 4000);
}

// Login form submit
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!username || !password) {
        showError('Lütfen tüm alanları doldurun!');
        return;
    }

    // Butonu devre dışı bırak
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş yapılıyor...';

    try {
        console.log('Login denemesi:', username);

        // Supabase'den kullanıcı sorgula - BÜYÜK KÜÇÜK HARF DUYARSIZ
        const response = await fetch(SUPABASE_URL + '/rest/v1/m_users?select=*', {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Veritabanı bağlantı hatası');
        }

        const users = await response.json();
        console.log('Kullanıcılar yüklendi:', users.length);

        // Kullanıcı adını büyük küçük harf duyarsız ara
        const user = users.find(function (u) {
            return u.Kullanıcı && u.Kullanıcı.toLowerCase() === username.toLowerCase();
        });

        if (!user) {
            showError('Kullanıcı adı bulunamadı!');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
            return;
        }

        // Şifre kontrolü
        if (user.Pass !== password) {
            showError('Şifre yanlış!');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
            return;
        }

        // Başarılı giriş
        console.log('Giriş başarılı:', user.Kullanıcı);

        // Kullanıcı bilgisini sessionStorage'a kaydet (Tarayıcı kapanınca silinir)
        sessionStorage.setItem('loggedInUser', user.Kullanıcı);
        sessionStorage.setItem('userId', user.id);

        // Başarı animasyonu
        loginBtn.innerHTML = '<i class="fas fa-check-circle"></i> Giriş Başarılı!';
        loginBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';

        // index.html'e yönlendir
        setTimeout(function () {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Login hatası:', error);
        showError('Bir hata oluştu: ' + error.message);
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
    }
});

// Enter tuşu ile form submit
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
