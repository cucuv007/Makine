// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

let busData = [];
let filteredData = [];

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

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="no-data"><i class="fas fa-inbox"></i><br>Tabloda kayit bulunamadi</td></tr>';
            document.getElementById('totalCount').textContent = '0';
            return;
        }

        // Supabase verisini direkt kullan
        busData = data;
        filteredData = busData.slice();
        renderTable(filteredData);

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

// Ariza durumuna gore badge class
function getStatusClass(arizaDurumu) {
    if (!arizaDurumu) return 'status-breakdown';

    const durum = arizaDurumu.toLowerCase().trim();

    if (durum === 'acik' || durum === 'açık') return 'status-breakdown';
    if (durum === 'kapali' || durum === 'kapalı') return 'status-active';
    if (durum.includes('bakim') || durum.includes('bakım')) return 'status-maintenance';

    return 'status-breakdown';
}

// Tablo render fonksiyonu
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const totalCount = document.getElementById('totalCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data"><i class="fas fa-inbox"></i><br>Kayit bulunamadi</td></tr>';
        totalCount.textContent = '0';
        return;
    }

    tbody.innerHTML = data.map(function(item) {
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
            '<td><span class="status-badge ' + getStatusClass(item.Arıza_Durumu) + '">' + (item.Arıza_Durumu || '-') + '</span></td>' +
        '</tr>';
    }).join('');

    totalCount.textContent = data.length;
}

// Filtreleme fonksiyonu
function filterData() {
    const seriNo = document.getElementById('searchSeriNo').value.toLowerCase();
    const plaka = document.getElementById('searchPlaka').value.toLowerCase();
    const ariza = document.getElementById('searchAriza').value.toLowerCase();
    const durum = document.getElementById('searchDurum').value.toLowerCase();

    filteredData = busData.filter(function(item) {
        const seriNoMatch = seriNo === '' || (item.Seri_No && item.Seri_No.toString().toLowerCase().includes(seriNo));
        const plakaMatch = plaka === '' || (item.Plaka && item.Plaka.toLowerCase().includes(plaka));
        const arizaMatch = ariza === '' || (item.Arıza && item.Arıza.toLowerCase().includes(ariza));
        const durumMatch = durum === '' || (item.Arıza_Durumu && item.Arıza_Durumu.toLowerCase().includes(durum));

        return seriNoMatch && plakaMatch && arizaMatch && durumMatch;
    });

    renderTable(filteredData);
}

// Filtreleri temizleme
function clearFilters() {
    document.getElementById('searchSeriNo').value = '';
    document.getElementById('searchPlaka').value = '';
    document.getElementById('searchAriza').value = '';
    document.getElementById('searchDurum').value = '';
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
    document.getElementById('searchSeriNo').addEventListener('input', filterData);
    document.getElementById('searchPlaka').addEventListener('input', filterData);
    document.getElementById('searchAriza').addEventListener('input', filterData);
    document.getElementById('searchDurum').addEventListener('input', filterData);
});
