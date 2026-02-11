// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

let busData = [];
let filteredData = [];

// Supabase'den veri cekme fonksiyonu
async function fetchDataFromSupabase() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="fas fa-spinner fa-spin"></i><br>Veriler yukleniyor...</td></tr>';

    try {
        console.log('Supabase baglantisi baslatiliyor...');

        const response = await fetch(SUPABASE_URL + '/rest/v1/md_data?select=*', {
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
            tbody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="fas fa-inbox"></i><br>Tabloda kayit bulunamadi</td></tr>';
            document.getElementById('totalCount').textContent = '0';
            return;
        }

        // Supabase verisini uygun formata donustur
        busData = data.map(function(item) {
            return {
                id: item.id,
                seriNo: item.Seri_No || '-',
                plate: item.Plaka || '-',
                route: item.Seri_No || '-',
                type: '12M',
                status: getStatus(item.Arıza_Durumu),
                issue: item.Arıza || '-',
                priority: getPriority(item.Arıza_Durumu),
                location: '-',
                datetime: formatDateTime(item.Giriş_Tarihi, item.Giriş_Saati),
                exitDate: formatDateTime(item.Çıkış_Tarihi, item.Çıkış_Saati),
                openedBy: item.Formu_Açan || '-',
                closedBy: item.Arızayı_Kapatan || '-',
                image: item.Resim || null,
                rawStatus: item.Arıza_Durumu
            };
        });

        filteredData = busData.slice();
        renderTable(filteredData);

        console.log('Toplam kayit yuklendi:', busData.length);
    } catch (error) {
        console.error('Supabase baglanti hatasi:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="no-data" style="color: var(--accent-red);"><i class="fas fa-exclamation-triangle"></i><br><strong>Hata:</strong> ' + error.message + '<br><small>Konsolu kontrol edin (F12)</small></td></tr>';
    }
}

// Ariza durumuna gore status belirleme
function getStatus(arizaDurumu) {
    if (!arizaDurumu) return 'breakdown';

    const durum = arizaDurumu.toLowerCase().trim();

    if (durum === 'acik' || durum === 'açık' || durum.includes('devam')) return 'breakdown';
    if (durum === 'kapali' || durum === 'kapalı' || durum.includes('tamamlan')) return 'active';
    if (durum.includes('bakim') || durum.includes('bakım')) return 'maintenance';

    return 'breakdown';
}

// Oncelik belirleme
function getPriority(arizaDurumu) {
    if (!arizaDurumu) return 'medium';

    const durum = arizaDurumu.toLowerCase();
    if (durum.includes('acil') || durum.includes('kritik') || durum === 'acik' || durum === 'açık') return 'high';
    if (durum.includes('orta')) return 'medium';
    if (durum === 'kapali' || durum === 'kapalı') return 'low';

    return 'medium';
}

// Tarih ve saat formatlama
function formatDateTime(date, time) {
    if (!date) return '-';

    try {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('tr-TR');
        const timeStr = time ? time.substring(0, 5) : '';

        return timeStr ? dateStr + ' ' + timeStr : dateStr;
    } catch (e) {
        return '-';
    }
}

// Tablo render fonksiyonu
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const totalCount = document.getElementById('totalCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="fas fa-inbox"></i><br>Kayit bulunamadi</td></tr>';
        totalCount.textContent = '0';
        return;
    }

    tbody.innerHTML = data.map(function(bus) {
        return '<tr><td><strong>' + bus.plate + '</strong></td><td>' + bus.seriNo + '</td><td>' + bus.type + '</td><td><span class="status-badge status-' + bus.status + '">' + getStatusText(bus.status) + '</span></td><td>' + bus.issue + '</td><td class="priority-' + bus.priority + '">' + getPriorityText(bus.priority) + '</td><td>' + bus.openedBy + '</td><td>' + bus.datetime + '</td></tr>';
    }).join('');

    totalCount.textContent = data.length;
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'breakdown': 'Arizali',
        'maintenance': 'Bakimda'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Yuksek',
        'medium': 'Orta',
        'low': 'Dusuk'
    };
    return priorityMap[priority] || priority;
}

// Filtreleme fonksiyonu
function filterData() {
    const plate = document.getElementById('searchPlate').value.toLowerCase();
    const route = document.getElementById('searchRoute').value.toLowerCase();
    const status = document.getElementById('searchStatus').value;
    const priority = document.getElementById('searchPriority').value;

    filteredData = busData.filter(function(bus) {
        return (
            (plate === '' || bus.plate.toLowerCase().includes(plate)) &&
            (route === '' || bus.seriNo.toString().toLowerCase().includes(route)) &&
            (status === '' || bus.status === status) &&
            (priority === '' || bus.priority === priority)
        );
    });

    renderTable(filteredData);
}

// Filtreleri temizleme
function clearFilters() {
    document.getElementById('searchPlate').value = '';
    document.getElementById('searchRoute').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchPriority').value = '';
    filteredData = busData.slice();
    renderTable(filteredData);
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

    // Gercek zamanli arama
    document.getElementById('searchPlate').addEventListener('input', filterData);
    document.getElementById('searchRoute').addEventListener('input', filterData);
    document.getElementById('searchStatus').addEventListener('change', filterData);
    document.getElementById('searchPriority').addEventListener('change', filterData);
});
