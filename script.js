
let busData = [];
let filteredData = [];
let currentLimit = 50;
let currentStatusFilter = 'all';

function checkLogin() {
    const sessionValid = sessionStorage.getItem('session_valid');
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (!sessionValid || !loggedInUser) {
        sessionStorage.clear();
        window.location.href = 'login.html';
        return false;
    }

    sessionStorage.removeItem('session_valid');

    document.getElementById('loggedUsername').textContent = loggedInUser;
    return true;
}

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

        document.getElementById('totalCount').textContent = busData.length;

        calculateBusStats(busData);

        applyFilters();

        console.log('Toplam kayit yuklendi:', busData.length);
    } catch (error) {
        console.error('Supabase baglanti hatasi:', error);
        tbody.innerHTML = '<tr><td colspan="11" class="no-data" style="color: var(--accent-red);"><i class="fas fa-exclamation-triangle"></i><br><strong>Hata:</strong> ' + error.message + '<br><small>Konsolu kontrol edin (F12)</small></td></tr>';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR');
    } catch (e) {
        return dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    try {
        return timeStr.substring(0, 5);
    } catch (e) {
        return timeStr;
    }
}

function getStatusClass(arizaDurumu) {
    if (!arizaDurumu) return 'status-breakdown';

    const durum = arizaDurumu.toLowerCase().trim();

    if (durum === 'yapildi' || durum === 'yapıldı' || durum === 'yapilmis' || durum === 'yapılmış') {
        return 'status-active';
    }

    return 'status-breakdown';
}

function applyFilters() {
    const seriNo = document.getElementById('searchSeriNo').value.trim();
    const plaka = document.getElementById('searchPlaka').value.trim();
    const ariza = document.getElementById('searchAriza').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    console.log('Filtreler:', { seriNo: seriNo, plaka: plaka, ariza: ariza, startDate: startDate, endDate: endDate, statusFilter: currentStatusFilter });

    filteredData = busData.filter(function (item) {

        let seriNoMatch = true;
        if (seriNo.length >= 3) {
            seriNoMatch = item.Seri_No && item.Seri_No.toString().toLowerCase().includes(seriNo.toLowerCase());
        }
  
        let plakaMatch = true;
        if (plaka.length >= 3) {
            plakaMatch = item.Plaka && item.Plaka.toLowerCase().includes(plaka.toLowerCase());
        }

        let arizaMatch = true;
        if (ariza.length >= 3) {
            arizaMatch = item.Arıza && item.Arıza.toLowerCase().includes(ariza.toLowerCase());
        }

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
    calculateBusStats(filteredData);
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const displayedCount = document.getElementById('displayedCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data"><i class="fas fa-inbox"></i><br>Kayit bulunamadi</td></tr>';
        displayedCount.textContent = '0';
        return;
    }

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

    displayedCount.textContent = limitedData.length;
}

function showRecordDetails(recordId) {
    if (!recordId) return;

    console.log('Kayit detaylari aciliyor - ID:', recordId);
    const record = busData.find(function (item) {
        return item.id === recordId;
    });

    if (!record) {
        console.error('Kayit bulunamadi:', recordId);
        return;
    }

    const plaka = record.Plaka;
    const plateRecords = busData.filter(function (item) {
        return item.Plaka === plaka;
    }).sort(function (a, b) {
        const dateA = new Date(a.Giriş_Tarihi || '1900-01-01');
        const dateB = new Date(b.Giriş_Tarihi || '1900-01-01');
        return dateB - dateA;
    });

    const latestRecord = plateRecords[0]; 

    let daysInRepair = 'Araç Arızalı Değil';
    let currentRepairDays = 0;
    if (latestRecord.Giriş_Tarihi && !latestRecord.Çıkış_Tarihi) {
        const entryDate = new Date(latestRecord.Giriş_Tarihi);
        const today = new Date();
        const diffTime = Math.abs(today - entryDate);
        currentRepairDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysInRepair = currentRepairDays + ' Gün';
    }

    const lastEntry = latestRecord.Giriş_Tarihi ? formatDate(latestRecord.Giriş_Tarihi) : '-';
    const lastExit = latestRecord.Çıkış_Tarihi ? formatDate(latestRecord.Çıkış_Tarihi) : '-';
    const lastFault = latestRecord.Arıza || '-';
    const repairCount = plateRecords.length;

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

    totalDays += currentRepairDays;

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

function closePopup() {
    document.getElementById('platePopup').style.display = 'none';
}

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

function setLimit(limit) {
    currentLimit = limit;
    currentStatusFilter = 'all'; 
    updateLimitButtons();
    renderTable(filteredData);
}

function setStatusFilter(status) {
    currentStatusFilter = status;
    currentLimit = 'all'; 
    updateLimitButtons();
    applyFilters();
}

function updateLimitButtons() {
    document.querySelectorAll('.limit-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });

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

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);

    const icon = document.getElementById('theme-icon');
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }

    localStorage.setItem('theme', newTheme);
}

function calculateBusStats(data) {
    let count12m = 0;
    let count9m = 0;
    let count5m = 0;

    data.forEach(function (item) {
        const durum = item.Arıza_Durumu ? item.Arıza_Durumu.toLowerCase().trim() : '';
        const isBroken = durum !== 'yapildi' && durum !== 'yapıldı' && durum !== 'yapilmis' && durum !== 'yapılmış';

        if (isBroken) {
            const tip = item.Tip ? item.Tip.toString().toUpperCase().trim() : '';
            if (tip === '12M') count12m++;
            else if (tip === '9M') count9m++;
            else if (tip === '5M') count5m++;
        }
    });

    document.getElementById('count-12m').textContent = count12m;
    document.getElementById('count-9m').textContent = count9m;
    document.getElementById('count-5m').textContent = count5m;
}

function openChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'flex';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordError').classList.remove('show');
    document.getElementById('passwordSuccess').classList.remove('show');
}

function closeChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'none';
}

function showPasswordError(message) {
    const errorDiv = document.getElementById('passwordError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(function () {
        errorDiv.classList.remove('show');
    }, 4000);
}

function showPasswordSuccess(message) {
    const successDiv = document.getElementById('passwordSuccess');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    setTimeout(function () {
        successDiv.classList.remove('show');
    }, 4000);
}

window.addEventListener('DOMContentLoaded', function () {
    console.log('Sayfa yuklendi');

    if (!checkLogin()) {
        return;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }

    fetchDataFromSupabase();
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

    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);

    updateLimitButtons();
    document.getElementById('platePopup').addEventListener('click', function (e) {
        if (e.target.id === 'platePopup') {
            closePopup();
        }
    });
    document.getElementById('changePasswordPopup').addEventListener('click', function (e) {
        if (e.target.id === 'changePasswordPopup') {
            closeChangePasswordPopup();
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const changePasswordBtn = document.getElementById('changePasswordBtn');

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

            changePasswordBtn.disabled = true;
            changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Değiştiriliyor...';

            try {
                const loggedInUser = sessionStorage.getItem('loggedInUser');

                if (!loggedInUser) {
                    throw new Error('Oturum bilgisi bulunamadı');
                }

                console.log('Şifre değiştirme işlemi başlatıldı. Kullanıcı:', loggedInUser);

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

                if (user.Pass !== currentPassword) {
                    showPasswordError('Mevcut şifre yanlış!');
                    changePasswordBtn.disabled = false;
                    changePasswordBtn.innerHTML = '<i class="fas fa-save"></i> Şifreyi Değiştir';
                    return;
                }

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

                showPasswordSuccess('Şifre başarıyla değiştirildi!');
                changePasswordBtn.innerHTML = '<i class="fas fa-check-circle"></i> Değiştirildi!';
                changePasswordBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';

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

function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        sessionStorage.removeItem('loggedInUser');
        sessionStorage.removeItem('userId');
        window.location.href = 'login.html';
    }
}
