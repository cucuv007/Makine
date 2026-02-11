// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

let busData = [];
let filteredData = [];
let currentLimit = 50;
let currentStatusFilter = 'all';

// Supabase'den veri cekme fonksiyonu
async function fetchDataFromSupabase() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="10" class="no-data"><i class="fas fa-spinner fa-spin"></i><br>Veriler yukleniyor...</td></tr>';

    try {
        console.log('Supabase baglantisi baslatiliyor...');

        const response = await fetch(SUPABASE_URL + '/rest/v1/md_data?select=*&order=id.desc', {
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
        console.log('Ornek veri:', data[0]);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="no-data"><i class="fas fa-inbox"></i><br>Tabloda kayit bulunamadi</td></tr>';
            document.getElementById('totalCount').textContent = '0';
            return;
        }

        busData = data;
        applyFilters();

        console.log('Toplam kayit yuklendi:', busData.length);
    } catch (error) {
        console.error('Supabase baglanti hatasi:', error);
        tbody.innerHTML = '<tr><td colspan="10" class="no-data" style="color: var(--accent-red);"><i class="fas fa-exclamation-triangle"></i><br><strong>Hata:</strong> ' + error.message + '<br><small>Konsolu kontrol edin (F12)</small></td></tr>';
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
    console.log('Durum kontrol:', durum);

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

    console.log('Filtreler:', {seriNo: seriNo, plaka: plaka, ariza: ariza, startDate: startDate, endDate: endDate, statusFilter: currentStatusFilter});

    filteredData = busData.filter(function(item) {
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

        // Durum filtresi
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

// Tablo render fonksiyonu
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const totalCount = document.getElementById('totalCount');
    const displayedCount = document.getElementById('displayedCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data"><i class="fas fa-inbox"></i><br>Kayit bulunamadi</td></tr>';
        totalCount.textContent = '0';
        displayedCount.textContent = '0';
        return;
    }

    // Limit uygula
    const limitedData = currentLimit === 'all' ? data : data.slice(0, currentLimit);

    tbody.innerHTML = limitedData.map(function(item) {
        const statusClass = getStatusClass(item.Arıza_Durumu);
        return '<tr>' +
            '<td><strong>' + (item.Seri_No || '-') + '</strong></td>' +
            '<td>' + (item.Plaka || '-') + '</td>' +
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

    totalCount.textContent = data.length;
    displayedCount.textContent = limitedData.length;
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

// Limit degistirme
function setLimit(limit) {
    currentLimit = limit;
    currentStatusFilter = 'all';
    updateLimitButtons();
    renderTable(filteredData);
}

// Durum filtresi
function setStatusFilter(status) {
    currentStatusFilter = status;
    currentLimit = 'all';
    updateLimitButtons();
    applyFilters();
}

// Limit butonlarini guncelle
function updateLimitButtons() {
    // Tum butonlari pasif yap
    document.querySelectorAll('.limit-btn').forEach(function(btn) {
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

// Sayfa yuklendiginde
window.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yuklendi');

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
    document.getElementById('searchSeriNo').addEventListener('input', function() {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    document.getElementById('searchPlaka').addEventListener('input', function() {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    document.getElementById('searchAriza').addEventListener('input', function() {
        if (this.value.length === 0 || this.value.length >= 3) {
            applyFilters();
        }
    });

    // Tarih degisikliklerinde filtrele
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);

    // Limit butonlarini guncelle
    updateLimitButtons();
});
