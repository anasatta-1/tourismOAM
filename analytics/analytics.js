// Analytics Page JavaScript with API integration

// Load API service
const apiScript = document.createElement('script');
apiScript.src = '../api-service.js';
document.head.appendChild(apiScript);

// Wait for API service to load
apiScript.onload = function() {
    initializeAnalytics();
};

// Check authentication
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
        window.location.href = '../login/login.html';
        return false;
    }
    return true;
}

async function initializeAnalytics() {
    if (!checkAuth()) return;
    
    try {
        // Load analytics overview
        await loadAnalyticsOverview();
        
        // Setup filter handlers
        setupFilters();
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showError('Failed to load analytics data');
    }
}

async function loadAnalyticsOverview() {
    try {
        const response = await api.getAnalyticsOverview();
        
        if (response.success && response.data) {
            updateStatsBoxes(response.data);
            updateTopDestinations(response.data);
        }
    } catch (error) {
        console.error('Error loading analytics overview:', error);
    }
}

function updateStatsBoxes(data) {
    const summary = data.summary || {};
    const recentSales = data.recent_sales || {};
    
    // Update stat boxes
    const statBoxes = document.querySelectorAll('.stat-box');
    
    if (statBoxes.length >= 1) {
        statBoxes[0].querySelector('.stat-value').textContent = summary.total_packages || '0';
    }
    
    if (statBoxes.length >= 2) {
        const revenue = summary.total_sales || 0;
        statBoxes[1].querySelector('.stat-value').textContent = '$' + revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    if (statBoxes.length >= 3) {
        // Destinations count - could calculate from air_travel data
        statBoxes[2].querySelector('.stat-value').textContent = data.top_destinations?.length || '0';
    }
    
    if (statBoxes.length >= 4) {
        // Satisfaction rate - placeholder
        statBoxes[3].querySelector('.stat-value').textContent = '89%';
    }
}

function updateTopDestinations(data) {
    const topDestinations = data.top_destinations || [];
    const tableBody = document.querySelector('.table tbody');
    
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    topDestinations.slice(0, 5).forEach((dest, index) => {
        const row = document.createElement('tr');
        
        const rank = document.createElement('td');
        rank.textContent = index + 1;
        
        const destination = document.createElement('td');
        destination.innerHTML = '<strong>' + (dest.destination || 'N/A') + '</strong>';
        
        const bookings = document.createElement('td');
        bookings.textContent = dest.packages || 0;
        
        const revenue = document.createElement('td');
        revenue.textContent = '$' + (dest.sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const growth = document.createElement('td');
        growth.className = 'growth-positive';
        growth.textContent = '+12%'; // Placeholder
        
        const status = document.createElement('td');
        status.innerHTML = '<span class="status-badge">Active</span>';
        
        row.appendChild(rank);
        row.appendChild(destination);
        row.appendChild(bookings);
        row.appendChild(revenue);
        row.appendChild(growth);
        row.appendChild(status);
        
        tableBody.appendChild(row);
    });
}

function setupFilters() {
    const dateRangeSelect = document.querySelector('.filter-select');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', async function() {
            const period = this.value;
            await loadFilteredAnalytics(period);
        });
    }
    
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Export functionality coming soon!');
        });
    }
}

async function loadFilteredAnalytics(period) {
    try {
        let response;
        
        switch(period) {
            case 'Last 7 days':
                response = await api.getSalesAnalytics({ period: '7days' });
                break;
            case 'Last 30 days':
                response = await api.getSalesAnalytics({ period: 'month' });
                break;
            case 'Last 3 months':
                response = await api.getQuarterlySales();
                break;
            case 'Last year':
                response = await api.getYearlySales();
                break;
            default:
                response = await api.getAnalyticsOverview();
        }
        
        if (response.success && response.data) {
            updateStatsBoxes(response.data);
        }
    } catch (error) {
        console.error('Error loading filtered analytics:', error);
    }
}

function showError(message) {
    console.error(message);
    // Could add a toast notification here
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Will be initialized when API script loads
    });
} else {
    // Already loaded, will be initialized when API script loads
}

