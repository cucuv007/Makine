// Supabase Configuration
const SUPABASE_URL = 'https://yfiulwcqyxgvpiefxgph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaXVsd2NxeXhndnBpZWZ4Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMwMzgsImV4cCI6MjA4NjM3OTAzOH0.GlE4Q71Ja_vfDKhBF4j9pEFIIVnkaM8rPrmdRnibmmg';

let busData = [];
let filteredData = [];

// Supabase'den veri çekme fonksiyonu
async function fetchDataFromSupabase() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/md_data?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Veri çekme hatası: ' + response.statusText);
        }

        const data = await response.json();

        // Supabase verisini uygun formata dönüştür
        busData = data.map(item => ({
            id: item.id,
            seriNo: item.Seri_No || '-',
            plate: item.Plaka || '-',
            route: extractRoute(item.Plaka), // Plakadan hat çıkar (opsiyonel)
            type: '12M', // Varsayılan, gerekirse dinamik yapılabilir
            status: getStatus(item.Arıza_Durumu),
            issue: item.Arıza || '-',
            priority: getPriority(item.Arıza_Durumu),
            location: '-', // Tabloda yok, gerekirse eklenebilir
            datetime: formatDateTime(item.Giriş_Tarihi, item.Giriş_Saati),
            exitDate: formatDateTime(item.Çıkış_Tarihi, item.Çıkış_Saati),
            openedBy: item.Formu_Açan || '-',
            closedBy: item.Arızayı_Kapatan || '-',
            image: item.Resim || null,
            rawStatus: item.Arıza_Durumu
        }));

        filteredData = [...busData];
        renderTable(filteredData);

        console.log('✅ Supabase'den', busData.length, 'kayıt çekildi');
    } catch (error) {
        console.error('❌ Supabase bağlantı hatası:', error);
        showError('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    }
}

// Arıza durumuna göre status belirleme
function getStatus(arizaDurumu) {
    if (!arizaDurumu) return 'active';

    const durum = arizaDurumu.toLowerCase();
    if (durum.includes('açık') || durum.includes('devam')) return 'breakdown';
    if (durum.includes('kapalı') || durum.includes('tamamlandı')) return 'active';
    if (durum.includes('bakım')) return 'maintenance';

    return 'breakdown'; // Varsayılan
}

// Öncelik belirleme
function getPriority(arizaDurumu) {
    if (!arizaDurumu) return 'low';

    const durum = arizaDurumu.toLowerCase();
    if (durum.includes('acil') || durum.includes('kritik')) return 'high';
    if (durum.includes('orta')) return 'medium';

    return 'low';
}

// Tarih ve saat formatlama
function formatDateTime(date, time) {
    if (!date) return '-';

    const dateStr = new Date(date).toLocaleDateString('tr-TR');
    const timeStr = time ? time.substring(0, 5) : '';

    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
}

// Plakadan hat numarası çıkarma (opsiyonel)
function extractRoute(plaka) {
    // Eğer plakada hat bilgisi varsa çıkar, yoksa '-' döndür
    return '-';
}

// Hata mesajı gösterme
function showError(message) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="8" class="no-data" style="color: var(--accent-red);">
        <i class="fas fa-exclamation-triangle"></i><br>${message}
    </td></tr>`;
}

// Tablo render fonksiyonu
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const totalCount = document.getElementById('totalCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="fas fa-inbox"></i><br>Kayıt bulunamadı</td></tr>';
        totalCount.textContent = '0';
        return;
    }

    tbody.innerHTML = data.map(bus => `
        <tr>
            <td><strong>${bus.plate}</strong></td>
            <td>${bus.seriNo}</td>
            <td>${bus.type}</td>
            <td>
                <span class="status-badge status-${bus.status}">
                    ${getStatusText(bus.status)}
                </span>
            </td>
            <td>${bus.issue}</td>
            <td class="priority-${bus.priority}">${getPriorityText(bus.priority)}</td>
            <td>${bus.openedBy}</td>
            <td>${bus.datetime}</td>
        </tr>
    `).join('');

    totalCount.textContent = data.length;
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'breakdown': 'Arızalı',
        'maintenance': 'Bakımda'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Yüksek',
        'medium': 'Orta',
        'low': 'Düşük'
    };
    return priorityMap[priority] || priority;
}

// Filtreleme fonksiyonu
function filterData() {
    const plate = document.getElementById('searchPlate').value.toLowerCase();
    const route = document.getElementById('searchRoute').value.toLowerCase();
    const status = document.getElementById('searchStatus').value;
    const priority = document.getElementById('searchPriority').value;

    filteredData = busData.filter(bus => {
        return (
            (plate === '' || bus.plate.toLowerCase().includes(plate)) &&
            (route === '' || bus.seriNo.toString().includes(route)) &&
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
    filteredData = [...busData];
    renderTable(filteredData);
}

// Tema değiştirme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Aydınlık Mod';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Karanlık Mod';
    }

    localStorage.setItem('theme', newTheme);
}

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
    // Tema yükle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Aydınlık Mod';
    }

    // Supabase'den veri çek
    fetchDataFromSupabase();
});

// Gerçek zamanlı arama
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchPlate').addEventListener('input', filterData);
    document.getElementById('searchRoute').addEventListener('input', filterData);
    document.getElementById('searchStatus').addEventListener('change', filterData);
    document.getElementById('searchPriority').addEventListener('change', filterData);
});
