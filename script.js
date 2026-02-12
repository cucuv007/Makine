// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

let busData = [];
let filteredData = [];
let currentLimit = 50;
let currentStatusFilter = 'all';

// Login kontrolü - Sayfa yüklendiğinde
function checkLogin() {
    const sessionValid = sessionStorage.getItem('session_valid');
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    // Eğer session_valid tokenı yoksa veya kullanıcı adı yoksa
    if (!sessionValid || !loggedInUser) {
        sessionStorage.clear();
        window.location.href = 'login.html';
        return false;
    }

    // Token varsa, bu sayfa yüklemesi için kullanıldı.
    // Yenileme (Refresh) durumunda tekrar kullanılmaması için siliyoruz.
    sessionStorage.removeItem('session_valid');

    // Kullanıcı adını göster
    document.getElementById('loggedUsername').textContent = loggedInUser;
    return true;
}

// Supabase'den veri cekme fonksiyonu
async function fetchDataFromSupabase() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="11" class="no-data"><i class="fas fa-spinner fa-spin"></i><br>Veriler yukleniyor...</td></tr>';

    try {
        console.log('Supabase baglantisi baslatiliyor...');

        const response = await fetch(SUPABASE_URL + '/rest/v1/md_data?select=*&order=Giriş_Tarihi.desc', {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Hatasi:', errorText);
            throw new Error('HTTP ' + response.status + ': ' + errorText);
        }

        const data = await response.json();
        console.log('Gelen veri:', data);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="no-data"><i class="fas fa-inbox"></i><br>Tabloda kayit bulunamadi</td></tr>';
            document.getElementById('totalCount').textContent = '0';
            document.getElementById('displayedCount').textContent = '0';
            return;
        }

        busData = data;

        // Toplam Kayıt = md_data'daki TÜM kayıtlar
        document.getElementById('totalCount').textContent = busData.length;

        // Otobüs istatistiklerini hesapla
        calculateBusStats(busData);

        applyFilters();

        console.log('Toplam kayit yuklendi:', busData.length);
    } catch (error) {
        console.error('Supabase baglanti hatasi:', error);
        tbody.innerHTML = '<tr><td colspan="11" class="no-data" style="color: var(--accent-red);"><i class="fas fa-exclamation-triangle"></i><br><strong>Hata:</strong> ' + error.message + '<br><small>Konsolu kontrol edin (F12)</small></td></tr>';
    }
}

// Tarih formatlama
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR');
    } catch (e) {
        return dateStr;
    }
}

// Saat formatlama
function formatTime(timeStr) {
    if (!timeStr) return '-';
    try {
        return timeStr.substring(0, 5);
    } catch (e) {
        return timeStr;
    }
}

// Ariza durumuna gore badge class - SADECE YEŞİL VE KIRMIZI
function getStatusClass(arizaDurumu) {
    if (!arizaDurumu) return 'status-breakdown';

    const durum = arizaDurumu.toLowerCase().trim();

    // Yapıldı = Yeşil
    if (durum === 'yapildi' || durum === 'yapıldı' || durum === 'yapilmis' || durum === 'yapılmış') {
        return 'status-active';
    }

    // Arızalı = Kırmızı (default)
    return 'status-breakdown';
}

// Tüm filtreleri uygula
function applyFilters() {
    const seriNo = document.getElementById('searchSeriNo').value.trim();
    const plaka = document.getElementById('searchPlaka').value.trim();
    const ariza = document.getElementById('searchAriza').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    console.log('Filtreler:', { seriNo: seriNo, plaka: plaka, ariza: ariza, startDate: startDate, endDate: endDate, statusFilter: currentStatusFilter });

    filteredData = busData.filter(function (item) {
        // Seri No filtresi - En az 3 karakter
        let seriNoMatch = true;
        if (seriNo.length >= 3) {
            seriNoMatch = item.Seri_No && item.Seri_No.toString().toLowerCase().includes(seriNo.toLowerCase());
        }

        // Plaka filtresi - En az 3 karakter
        let plakaMatch = true;
        if (plaka.length >= 3) {
            plakaMatch = item.Plaka && item.Plaka.toLowerCase().includes(plaka.toLowerCase());
        }

        // Ariza filtresi - En az 3 karakter
        let arizaMatch = true;
        if (ariza.length >= 3) {
            arizaMatch = item.Arıza && item.Arıza.toLowerCase().includes(ariza.toLowerCase());
        }

        // Tarih filtresi
        let dateMatch = true;
        if (startDate || endDate) {
            if (item.Giriş_Tarihi) {
                const itemDate = new Date(item.Giriş_Tarihi);
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (itemDate < start) dateMatch = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (itemDate > end) dateMatch = false;
                }
            } else {
                dateMatch = false;
            }
        }

        // Durum filtresi - BAĞIMSIZ
        let statusMatch = true;
        if (currentStatusFilter === 'arizali') {
            const durum = item.Arıza_Durumu ? item.Arıza_Durumu.toLowerCase().trim() : '';
            statusMatch = durum !== 'yapildi' && durum !== 'yapıldı' && durum !== 'yapilmis' && durum !== 'yapılmış';
        } else if (currentStatusFilter === 'yapilanlar') {
            const durum = item.Arıza_Durumu ? item.Arıza_Durumu.toLowerCase().trim() : '';
            statusMatch = durum === 'yapildi' || durum === 'yapıldı' || durum === 'yapilmis' || durum === 'yapılmış';
        }

        return seriNoMatch && plakaMatch && arizaMatch && dateMatch && statusMatch;
    });

    console.log('Filtrelenmis veri sayisi:', filteredData.length);
    renderTable(filteredData);
}

// Tablo render fonksiyonu - TEK TIKLAMA
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const displayedCount = document.getElementById('displayedCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data"><i class="fas fa-inbox"></i><br>Kayit bulunamadi</td></tr>';
        displayedCount.textContent = '0';
        return;
    }

    // Limit uygula - HER BUTON BAĞIMSIZ
    const limitedData = currentLimit === 'all' ? data : data.slice(0, currentLimit);

    tbody.innerHTML = limitedData.map(function (item) {
        const statusClass = getStatusClass(item.Arıza_Durumu);
        const recordId = item.id || '';
        return '<tr onclick="showRecordDetails(' + recordId + ')" style="cursor: pointer;">' +
            '<td><strong>' + (item.id || '-') + '</strong></td>' +
            '<td><strong>' + (item.Seri_No || '-') + '</strong></td>' +
            '<td>' + (item.Plaka || '-') + '</td>' +
            '<td>' + (item.Tip || '-') + '</td>' +
            '<td>' + formatDate(item.Giriş_Tarihi) + '</td>' +
            '<td>' + formatTime(item.Giriş_Saati) + '</td>' +
            '<td>' + (item.Arıza || '-') + '</td>' +
            '<td>' + (item.Formu_Açan || '-') + '</td>' +
            '<td>' + (item.Arızayı_Kapatan || '-') + '</td>' +
            '<td>' + formatDate(item.Çıkış_Tarihi) + '</td>' +
            '<td>' + formatTime(item.Çıkış_Saati) + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + (item.Arıza_Durumu || '-') + '</span></td>' +
            '</tr>';
    }).join('');

    // Gösterilen = Filtrelenmiş kayıtlar (limit uygulanmış)
    displayedCount.textContent = limitedData.length;
}
// ID'ye göre kayıt detaylarını göster - TOPLAM BAKIM SÜRESİ DÜZELTİLDİ
function showRecordDetails(recordId) {
    if (!recordId) return;

    console.log('Kayit detaylari aciliyor - ID:', recordId);

    // ID'ye göre kaydı bul
    const record = busData.find(function (item) {
        return item.id === recordId;
    });

    if (!record) {
        console.error('Kayit bulunamadi:', recordId);
        return;
    }

    const plaka = record.Plaka;

    // Plakaya ait tüm kayıtları bul (Giriş_Tarihi'ne göre sıralı)
    const plateRecords = busData.filter(function (item) {
        return item.Plaka === plaka;
    }).sort(function (a, b) {
        const dateA = new Date(a.Giriş_Tarihi || '1900-01-01');
        const dateB = new Date(b.Giriş_Tarihi || '1900-01-01');
        return dateB - dateA; // Yeniden eskiye
    });

    const latestRecord = plateRecords[0]; // En güncel kayıt

    // 1. Kaç Gündür Arızalı
    let daysInRepair = 'Araç Arızalı Değil';
    let currentRepairDays = 0;
    if (latestRecord.Giriş_Tarihi && !latestRecord.Çıkış_Tarihi) {
        const entryDate = new Date(latestRecord.Giriş_Tarihi);
        const today = new Date();
        const diffTime = Math.abs(today - entryDate);
        currentRepairDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysInRepair = currentRepairDays + ' Gün';
    }

    // 2. En Son Ne Zaman Bakıma Girdi
    const lastEntry = latestRecord.Giriş_Tarihi ? formatDate(latestRecord.Giriş_Tarihi) : '-';

    // 3. En Son Çıkış Tarihi
    const lastExit = latestRecord.Çıkış_Tarihi ? formatDate(latestRecord.Çıkış_Tarihi) : '-';

    // 4. En Son Arızası
    const lastFault = latestRecord.Arıza || '-';

    // 5. Kaç Kere Bakıma Geldi
    const repairCount = plateRecords.length;

    // 6. Toplam Bakımda Bekleme Süresi = Tamamlanan bakımlar + Şu anki arıza süresi
    let totalDays = 0;
    plateRecords.forEach(function (record) {
        if (record.Giriş_Tarihi && record.Çıkış_Tarihi) {
            // Tamamlanmış bakımlar
            const entry = new Date(record.Giriş_Tarihi);
            const exit = new Date(record.Çıkış_Tarihi);
            const diff = Math.abs(exit - entry);
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            totalDays += days;
        }
    });

    // Şu anki arıza süresini de ekle
    totalDays += currentRepairDays;

    // Popup içeriği - SADECE PLAKA İSTATİSTİKLERİ
    const popupContent = '<div class="popup-header">' +
        '<h2>' + plaka + '</h2>' +
        '<button class="popup-close" onclick="closePopup()"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<div class="popup-body">' +
        '<div class="popup-item">' +
        '<span class="popup-label"><strong><em>Kaç Gündür Arızalı:</em></strong></span>' +
        '<span class="popup-value">' + daysInRepair + '</span>' +
        '</div>' +
        '<div class="popup-item">' +
        '<span class="popup-label">En Son Ne Zaman Bakıma Girdi:</span>' +
        '<span class="popup-value">' + lastEntry + '</span>' +
        '</div>' +
        '<div class="popup-item">' +
        '<span class="popup-label">En Son Çıkış Tarihi:</span>' +
        '<span class="popup-value">' + lastExit + '</span>' +
        '</div>' +
        '<div class="popup-item">' +
        '<span class="popup-label">En Son Arızası:</span>' +
        '<span class="popup-value">' + lastFault + '</span>' +
        '</div>' +
        '<div class="popup-item">' +
        '<span class="popup-label">Kaç Kere Bakıma Geldi:</span>' +
        '<span class="popup-value">' + repairCount + ' Kez</span>' +
        '</div>' +
        '<div class="popup-item">' +
        '<span class="popup-label">Toplam Bakımda Bekleme Süresi:</span>' +
        '<span class="popup-value">' + totalDays + ' Gün</span>' +
        '</div>' +
        '</div>';

    document.getElementById('popupContent').innerHTML = popupContent;
    document.getElementById('platePopup').style.display = 'flex';
}

// Popup kapat
function closePopup() {
    document.getElementById('platePopup').style.display = 'none';
}

// Filtreleri temizleme
function clearFilters() {
    document.getElementById('searchSeriNo').value = '';
    document.getElementById('searchPlaka').value = '';
    document.getElementById('searchAriza').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentStatusFilter = 'all';
    currentLimit = 50;
    updateLimitButtons();
    applyFilters();
}

// Limit degistirme - BAĞIMSIZ
function setLimit(limit) {
    currentLimit = limit;
    currentStatusFilter = 'all'; // Durum filtresini sıfırla
    updateLimitButtons();
    renderTable(filteredData);
}

// Durum filtresi - BAĞIMSIZ
function setStatusFilter(status) {
    currentStatusFilter = status;
    currentLimit = 'all'; // Limit'i sıfırla, tüm kayıtları göster
    updateLimitButtons();
    applyFilters();
}

// Limit butonlarini guncelle
function updateLimitButtons() {
    // Tum butonlari pasif yap
    document.querySelectorAll('.limit-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });

    // Aktif butonu isle
    if (currentStatusFilter === 'arizali') {
        document.getElementById('btn-arizali').classList.add('active');
    } else if (currentStatusFilter === 'yapilanlar') {
        document.getElementById('btn-yapilanlar').classList.add('active');
    } else {
        if (currentLimit === 50) {
            document.getElementById('btn-50').classList.add('active');
        } else if (currentLimit === 100) {
            document.getElementById('btn-100').classList.add('active');
        } else if (currentLimit === 1000) {
            document.getElementById('btn-1000').classList.add('active');
        } else if (currentLimit === 'all') {
            document.getElementById('btn-all').classList.add('active');
        }
    }
}

// Tema degistirme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Aydinlik Mod';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Karanlik Mod';
    }

    localStorage.setItem('theme', newTheme);
}

// Şifre değiştirme popup aç
function openChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'flex';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordError').classList.remove('show');
    document.getElementById('passwordSuccess').classList.remove('show');
}

// Şifre değiştirme popup kapat
function closeChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'none';
}

// Şifre değiştirme hata mesajı
function showPasswordError(message) {
    const errorDiv = document.getElementById('passwordError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(function () {
        errorDiv.classList.remove('show');
    }, 4000);
}

// Şifre değiştirme başarı mesajı
function showPasswordSuccess(message) {
    const successDiv = document.getElementById('passwordSuccess');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    setTimeout(function () {
        successDiv.classList.remove('show');
    }, 4000);
}
// Sayfa yuklendiginde
window.addEventListener('DOMContentLoaded', function () {
    console.log('Sayfa yuklendi');

    // Login kontrolü
    if (!checkLogin()) {
        return;
    }

    // Tema yukle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Aydinlik Mod';
    }

    // Supabase'den veri cek
    fetchDataFromSupabase();

    // Gercek zamanli arama - En az 3 karakter
    document.getElementById('searchSeriNo').addEventListener('input', function () {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    document.getElementById('searchPlaka').addEventListener('input', function () {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    document.getElementById('searchAriza').addEventListener('input', function () {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    // Tarih degisikliklerinde filtrele
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);

    // Limit butonlarini guncelle
    updateLimitButtons();

    // Popup dışına tıklanınca kapat
    document.getElementById('platePopup').addEventListener('click', function (e) {
        if (e.target.id === 'platePopup') {
            closePopup();
        }
    });

    // Şifre değiştirme popup dışına tıklanınca kapat
    document.getElementById('changePasswordPopup').addEventListener('click', function (e) {
        if (e.target.id === 'changePasswordPopup') {
            closeChangePasswordPopup();
        }
    });
});

// Şifre değiştirme form submit
document.addEventListener('DOMContentLoaded', function () {
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const changePasswordBtn = document.getElementById('changePasswordBtn');

            // Validasyon
            if (!currentPassword || !newPassword || !confirmPassword) {
                showPasswordError('Lütfen tüm alanları doldurun!');
                return;
            }

            if (newPassword !== confirmPassword) {
                showPasswordError('Yeni şifreler eşleşmiyor!');
                return;
            }

            if (newPassword.length < 4) {
                showPasswordError('Yeni şifre en az 4 karakter olmalı!');
                return;
            }

            // Butonu devre dışı bırak
            changePasswordBtn.disabled = true;
            changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Değiştiriliyor...';

            try {
                const loggedInUser = sessionStorage.getItem('loggedInUser');
                // userId artık gerekli değil çünkü kullanıcı adına göre işlem yapacağız
                // const userId = sessionStorage.getItem('userId');

                if (!loggedInUser) {
                    throw new Error('Oturum bilgisi bulunamadı');
                }

                console.log('Şifre değiştirme işlemi başlatıldı. Kullanıcı:', loggedInUser);

                // Kullanıcıyı Supabase'den çek - Kullanıcı adına göre
                const getUserResponse = await fetch(SUPABASE_URL + '/rest/v1/m_users?Kullanıcı=eq.' + loggedInUser, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json'
                    }
                });


                if (!getUserResponse.ok) {
                    throw new Error('Kullanıcı bilgisi alınamadı');
                }

                const users = await getUserResponse.json();

                if (users.length === 0) {
                    throw new Error('Kullanıcı bulunamadı');
                }

                const user = users[0];
                // id kolonu yokmuş, o yüzden Kullanıcı adını kullanacağız

                // Mevcut şifre kontrolü
                if (user.Pass !== currentPassword) {
                    showPasswordError('Mevcut şifre yanlış!');
                    changePasswordBtn.disabled = false;
                    changePasswordBtn.innerHTML = '<i class="fas fa-save"></i> Şifreyi Değiştir';
                    return;
                }

                // Şifreyi güncelle - Kullanıcı adına göre güncelleme yapıyoruz
                // EncodeURIComponent kullanarak özel karakter sorunlarını engelliyoruz
                const updateResponse = await fetch(SUPABASE_URL + '/rest/v1/m_users?Kullanıcı=eq.' + encodeURIComponent(user.Kullanıcı), {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        Pass: newPassword
                    })
                });

                if (!updateResponse.ok) {
                    const errorDetails = await updateResponse.text();
                    console.error('Supabase Update Error:', updateResponse.status, errorDetails);
                    throw new Error('Şifre güncellenemedi: ' + updateResponse.status + ' - ' + errorDetails);
                }

                console.log('Şifre başarıyla değiştirildi');

                // Başarı mesajı
                showPasswordSuccess('Şifre başarıyla değiştirildi!');
                changePasswordBtn.innerHTML = '<i class="fas fa-check-circle"></i> Değiştirildi!';
                changePasswordBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';

                // Formu temizle ve popup'ı kapat
                setTimeout(function () {
                    closeChangePasswordPopup();
                    changePasswordBtn.disabled = false;
                    changePasswordBtn.innerHTML = '<i class="fas fa-save"></i> Şifreyi Değiştir';
                    changePasswordBtn.style.background = '';
                }, 2000);

            } catch (error) {
                console.error('Şifre değiştirme hatası:', error);
                showPasswordError('Bir hata oluştu: ' + error.message);
                changePasswordBtn.disabled = false;
                changePasswordBtn.innerHTML = '<i class="fas fa-save"></i> Şifreyi Değiştir';
            }
        });
    }
});

// Çıkış Yapma Fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        sessionStorage.removeItem('loggedInUser');
        sessionStorage.removeItem('userId');
        window.location.href = 'login.html';
    }
}
