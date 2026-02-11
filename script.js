// Sample data
const busData = [
    { plate: '06 ABC 123', route: 'LC07', type: '12M', status: 'breakdown', issue: 'Motor Arızası', priority: 'high', location: 'Lara Kavşağı', datetime: '2024-02-11 14:30' },
    { plate: '07 DEF 456', route: 'KC09', type: '9M', status: 'maintenance', issue: 'Periyodik Bakım', priority: 'low', location: 'Garaj', datetime: '2024-02-11 13:15' },
    { plate: '06 GHI 789', route: 'KL01', type: '12M', status: 'active', issue: '-', priority: 'low', location: 'Konyaaltı', datetime: '2024-02-11 15:00' },
    { plate: '07 JKL 012', route: 'LC07', type: '5.5M', status: 'breakdown', issue: 'Fren Sistemi', priority: 'high', location: 'Muratpaşa', datetime: '2024-02-11 14:45' },
    { plate: '06 MNO 345', route: 'KC09', type: '12M', status: 'active', issue: '-', priority: 'low', location: 'Kepez', datetime: '2024-02-11 15:10' },
    { plate: '07 PQR 678', route: 'KL01', type: '9M', status: 'breakdown', issue: 'Klima Arızası', priority: 'medium', location: 'Aksu', datetime: '2024-02-11 12:20' },
    { plate: '06 STU 901', route: 'LC07', type: '12M', status: 'maintenance', issue: 'Lastik Değişimi', priority: 'medium', location: 'Garaj', datetime: '2024-02-11 11:00' },
    { plate: '07 VWX 234', route: 'KC09', type: '5.5M', status: 'active', issue: '-', priority: 'low', location: 'Döşemealtı', datetime: '2024-02-11 15:20' },
    { plate: '06 YZA 567', route: 'KL01', type: '12M', status: 'breakdown', issue: 'Elektrik Arızası', priority: 'high', location: 'Kemer', datetime: '2024-02-11 14:00' },
    { plate: '07 BCD 890', route: 'LC07', type: '9M', status: 'active', issue: '-', priority: 'low', location: 'Serik', datetime: '2024-02-11 15:30' }
];

let filteredData = [...busData];

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
            <td>${bus.route}</td>
            <td>${bus.type}</td>
            <td>
                <span class="status-badge status-${bus.status}">
                    ${getStatusText(bus.status)}
                </span>
            </td>
            <td>${bus.issue}</td>
            <td class="priority-${bus.priority}">${getPriorityText(bus.priority)}</td>
            <td>${bus.location}</td>
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

function filterData() {
    const plate = document.getElementById('searchPlate').value.toLowerCase();
    const route = document.getElementById('searchRoute').value.toLowerCase();
    const status = document.getElementById('searchStatus').value;
    const priority = document.getElementById('searchPriority').value;

    filteredData = busData.filter(bus => {
        return (
            (plate === '' || bus.plate.toLowerCase().includes(plate)) &&
            (route === '' || bus.route.toLowerCase().includes(route)) &&
            (status === '' || bus.status === status) &&
            (priority === '' || bus.priority === priority)
        );
    });

    renderTable(filteredData);
}

function clearFilters() {
    document.getElementById('searchPlate').value = '';
    document.getElementById('searchRoute').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchPriority').value = '';
    filteredData = [...busData];
    renderTable(filteredData);
}

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

// Load saved theme
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Aydınlık Mod';
    }

    renderTable(filteredData);
});

// Real-time search on input
document.getElementById('searchPlate').addEventListener('input', filterData);
document.getElementById('searchRoute').addEventListener('input', filterData);
document.getElementById('searchStatus').addEventListener('change', filterData);
document.getElementById('searchPriority').addEventListener('change', filterData);