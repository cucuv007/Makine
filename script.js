// Supabase Configuration
var SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzY3NzIsImV4cCI6MjA1MzU1Mjc3Mn0.5_2ypx7vZEKYOt-2hqxqJqxWJYqxqJqxqJqxqJqxqJo';

// Global Variables
var allData = [];
var filteredData = [];
var currentLimit = 50;
var currentStatusFilter = null;

// DOM Elements
var themeToggle = document.getElementById('themeToggle');
var body = document.body;
var searchSeriNoInput = document.getElementById('searchSeriNo');
var searchPlakaInput = document.getElementById('searchPlaka');
var searchArizaInput = document.getElementById('searchAriza');
var startDateInput = document.getElementById('startDate');
var endDateInput = document.getElementById('endDate');
var searchButton = document.getElementById('searchButton');
var dataTableBody = document.getElementById('dataTableBody');
var loadingSpinner = document.getElementById('loadingSpinner');

// Theme Toggle
var savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
    var isDark = body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Fetch Data from Supabase
async function fetchDataFromSupabase() {
    try {
        loadingSpinner.style.display = 'flex';
        
        var response = await fetch(SUPABASE_URL + '/rest/v1/md_data?select=*&order=Giris_Tarihi.desc', {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }

        var data = await response.json();
        console.log('Supabase\'den gelen veri:', data);
        
        allData = data;
        filteredData = data;
        
        applyFilters();
        
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        dataTableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: red;">Hata: ' + error.message + '</td></tr>';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Apply Filters
function applyFilters() {
    var seriNoValue = searchSeriNoInput.value.trim().toLowerCase();
    var plakaValue = searchPlakaInput.value.trim().toLowerCase();
    var arizaValue = searchArizaInput.value.trim().toLowerCase();
    var startDate = startDateInput.value;
    var endDate = endDateInput.value;
    
    filteredData = allData.filter(function(item) {
        var matchSeriNo = !seriNoValue || (item.Seri_No && item.Seri_No.toString().toLowerCase().includes(seriNoValue));
        var matchPlaka = !plakaValue || (item.Plaka && item.Plaka.toLowerCase().includes(plakaValue));
        var matchAriza = !arizaValue || (item.Ariza && item.Ariza.toLowerCase().includes(arizaValue));
        
        var matchDate = true;
        if (startDate && item.Giris_Tarihi) {
            matchDate = matchDate && (item.Giris_Tarihi >= startDate);
        }
        if (endDate && item.Giris_Tarihi) {
            matchDate = matchDate && (item.Giris_Tarihi <= endDate);
        }
        
        var matchStatus = true;
        if (currentStatusFilter === 'arizali') {
            matchStatus = item.Ariza_Durumu && item.Ariza_Durumu.toLowerCase() === 'arızalı';
        } else if (currentStatusFilter === 'yapilanlar') {
            matchStatus = item.Ariza_Durumu && item.Ariza_Durumu.toLowerCase() === 'yapıldı';
        }
        
        return matchSeriNo && matchPlaka && matchAriza && matchDate && matchStatus;
    });
    
    renderTable();
}

// Render Table
function renderTable() {
    var dataToShow = filteredData.slice(0, currentLimit);
    
    if (dataToShow.length === 0) {
        dataTableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Veri bulunamadı</td></tr>';
        return;
    }
    
    dataTableBody.innerHTML = '';
    
    dataToShow.forEach(function(item) {
        var row = document.createElement('tr');
        row.ondblclick = function() {
            openDetailPopup(item.Plaka);
        };
        
        var statusClass = getStatusClass(item.Ariza_Durumu);
        
        row.innerHTML = 
            '<td>' + (item.Seri_No || '-') + '</td>' +
            '<td>' + (item.Plaka || '-') + '</td>' +
            '<td>' + (item.Giris_Tarihi || '-') + '</td>' +
            '<td>' + (item.Giris_Saati || '-') + '</td>' +
            '<td>' + (item.Ariza || '-') + '</td>' +
            '<td>' + (item.Formu_Acan || '-') + '</td>' +
            '<td>' + (item.Arizayi_Kapatan || '-') + '</td>' +
            '<td>' + (item.Cikis_Tarihi || '-') + '</td>' +
            '<td>' + (item.Cikis_Saati || '-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + (item.Ariza_Durumu || '-') + '</span></td>' +
            '<td>' + (item.Resim ? '<a href="' + item.Resim + '" target="_blank">Görüntüle</a>' : '-') + '</td>';
        
        dataTableBody.appendChild(row);
    });
}

// Get Status Class
function getStatusClass(status) {
    if (!status) return '';
    var lowerStatus = status.toLowerCase();
    if (lowerStatus === 'yapıldı') {
        return 'status-active';
    } else {
        return 'status-breakdown';
    }
}

// Real-time Search (3+ characters)
searchSeriNoInput.addEventListener('input', function() {
    if (searchSeriNoInput.value.length >= 3 || searchSeriNoInput.value.length === 0) {
        applyFilters();
    }
});

searchPlakaInput.addEventListener('input', function() {
    if (searchPlakaInput.value.length >= 3 || searchPlakaInput.value.length === 0) {
        applyFilters();
    }
});

searchArizaInput.addEventListener('input', function() {
    if (searchArizaInput.value.length >= 3 || searchArizaInput.value.length === 0) {
        applyFilters();
    }
});

// Search Button
searchButton.addEventListener('click', function() {
    applyFilters();
});

// Limit Buttons
document.getElementById('limit50').addEventListener('click', function() {
    setLimit(50);
});

document.getElementById('limit100').addEventListener('click', function() {
    setLimit(100);
});

document.getElementById('limit1000').addEventListener('click', function() {
    setLimit(1000);
});

document.getElementById('limitAll').addEventListener('click', function() {
    setLimit(filteredData.length);
});

function setLimit(limit) {
    currentLimit = limit;
    
    document.querySelectorAll('.limit-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    if (limit === 50) {
        document.getElementById('limit50').classList.add('active');
    } else if (limit === 100) {
        document.getElementById('limit100').classList.add('active');
    } else if (limit === 1000) {
        document.getElementById('limit1000').classList.add('active');
    } else {
        document.getElementById('limitAll').classList.add('active');
    }
    
    renderTable();
}

// Status Filter Buttons
document.getElementById('filterArizali').addEventListener('click', function() {
    if (currentStatusFilter === 'arizali') {
        currentStatusFilter = null;
        document.getElementById('filterArizali').classList.remove('active');
    } else {
        currentStatusFilter = 'arizali';
        document.getElementById('filterArizali').classList.add('active');
        document.getElementById('filterYapilanlar').classList.remove('active');
    }
    applyFilters();
});

document.getElementById('filterYapilanlar').addEventListener('click', function() {
    if (currentStatusFilter === 'yapilanlar') {
        currentStatusFilter = null;
        document.getElementById('filterYapilanlar').classList.remove('active');
    } else {
        currentStatusFilter = 'yapilanlar';
        document.getElementById('filterYapilanlar').classList.add('active');
        document.getElementById('filterArizali').classList.remove('active');
    }
    applyFilters();
});

// Detail Popup
function openDetailPopup(plaka) {
    var plakaData = allData.filter(function(item) {
        return item.Plaka === plaka;
    });
    
    if (plakaData.length === 0) {
        alert('Bu plaka için veri bulunamadı!');
        return;
    }
    
    plakaData.sort(function(a, b) {
        var dateA = new Date(a.Giris_Tarihi + ' ' + (a.Giris_Saati || '00:00'));
        var dateB = new Date(b.Giris_Tarihi + ' ' + (b.Giris_Saati || '00:00'));
        return dateB - dateA;
    });
    
    var latestEntry = plakaData[0];
    
    var daysFaulty = '-';
    if (latestEntry.Giris_Tarihi && !latestEntry.Cikis_Tarihi) {
        var girisDate = new Date(latestEntry.Giris_Tarihi);
        var today = new Date();
        var diffTime = Math.abs(today - girisDate);
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysFaulty = diffDays + ' gün';
    } else if (latestEntry.Cikis_Tarihi) {
        daysFaulty = 'Arıza kapatıldı';
    }
    
    var totalFaults = plakaData.length;
    
    var last5Faults = plakaData.slice(0, 5);
    
    var detailHTML = '<h2>' + plaka + '</h2>';
    detailHTML += '<p style="font-weight: bold; font-style: italic; margin: 15px 0;">Kaç Gündür Arızalı: ' + daysFaulty + '</p>';
    detailHTML += '<p style="margin: 10px 0;"><strong>Toplam Arıza Sayısı:</strong> ' + totalFaults + '</p>';
    detailHTML += '<h3 style="margin-top: 20px;">Son 5 Arıza:</h3>';
    detailHTML += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
    detailHTML += '<thead><tr style="background: #f0f0f0;"><th style="padding: 8px; border: 1px solid #ddd;">Giriş Tarihi</th><th style="padding: 8px; border: 1px solid #ddd;">Arıza</th><th style="padding: 8px; border: 1px solid #ddd;">Durum</th></tr></thead>';
    detailHTML += '<tbody>';
    
    last5Faults.forEach(function(fault) {
        detailHTML += '<tr>';
        detailHTML += '<td style="padding: 8px; border: 1px solid #ddd;">' + (fault.Giris_Tarihi || '-') + '</td>';
        detailHTML += '<td style="padding: 8px; border: 1px solid #ddd;">' + (fault.Ariza || '-') + '</td>';
        detailHTML += '<td style="padding: 8px; border: 1px solid #ddd;">' + (fault.Ariza_Durumu || '-') + '</td>';
        detailHTML += '</tr>';
    });
    
    detailHTML += '</tbody></table>';
    
    document.getElementById('detailContent').innerHTML = detailHTML;
    document.getElementById('detailPopup').style.display = 'flex';
}

document.getElementById('closeDetailPopup').addEventListener('click', function() {
    document.getElementById('detailPopup').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('detailPopup')) {
        document.getElementById('detailPopup').style.display = 'none';
    }
});

// Şifre değiştirme popup'ını aç
document.getElementById('changePasswordBtn').addEventListener('click', function() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
});

// Şifre değiştirme popup'ını kapat
document.getElementById('closePasswordModal').addEventListener('click', function() {
    document.getElementById('changePasswordModal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('changePasswordModal')) {
        document.getElementById('changePasswordModal').style.display = 'none';
    }
});

// Şifre değiştirme formunu işle
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    
    // Şifrelerin eşleşip eşleşmediğini kontrol et
    if (newPassword !== confirmPassword) {
        alert('Şifreler eşleşmiyor!');
        return;
    }
    
    // Minimum şifre uzunluğu kontrolü
    if (newPassword.length < 4) {
        alert('Şifre en az 4 karakter olmalıdır!');
        return;
    }
    
    try {
        // Kullanıcı adını span'dan al
        var currentUserName = document.getElementById('currentUserName').textContent.trim();
        
        if (!currentUserName) {
            throw new Error('Kullanıcı adı bulunamadı');
        }
        
        console.log('Şifre değiştiriliyor:', currentUserName);
        
        // Kullanıcıyı m_users tablosundan bul (Kullanici sütununa göre)
        var userResponse = await fetch(
            SUPABASE_URL + '/rest/v1/m_users?Kullanici=eq.' + encodeURIComponent(currentUserName),
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!userResponse.ok) {
            throw new Error('Kullanıcı bilgisi alınamadı');
        }
        
        var users = await userResponse.json();
        
        if (!users || users.length === 0) {
            throw new Error('Kullanıcı bulunamadı');
        }
        
        var userId = users[0].id;
        
        // Şifreyi güncelle
        var updateResponse = await fetch(
            SUPABASE_URL + '/rest/v1/m_users?id=eq.' + userId,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    Pass: newPassword
                })
            }
        );
        
        if (!updateResponse.ok) {
            throw new Error('Şifre güncellenemedi');
        }
        
        alert('Şifreniz başarıyla değiştirildi!');
        document.getElementById('changePasswordModal').style.display = 'none';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        alert('Şifre değiştirme sırasında bir hata oluştu: ' + error.message);
    }
});

// Initialize
fetchDataFromSupabase();
