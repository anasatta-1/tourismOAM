// Dashboard Page JavaScript with API integration

// Load API service
const apiScript = document.createElement('script');
apiScript.src = '../api-service.js';
document.head.appendChild(apiScript);

// Wait for API service to load
apiScript.onload = function() {
    initializeDashboard();
};

// Check authentication
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
        window.location.href = '../login/login.html';
        return false;
    }
    
    // Load user info
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        updateUserProfile(user);
    }
    
    return true;
}

function updateUserProfile(user) {
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const profileAvatar = document.querySelector('.profile-avatar');
    
    if (profileName) profileName.textContent = user.full_name || 'Admin User';
    if (profileRole) profileRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator';
    if (profileAvatar) {
        const initials = (user.full_name || 'AD').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        profileAvatar.textContent = initials;
    }
}

async function initializeDashboard() {
    if (!checkAuth()) return;
    
    try {
        // Load analytics overview
        const analytics = await api.getAnalyticsOverview();
        
        if (analytics.success && analytics.data) {
            updateDashboardStats(analytics.data);
        }
        
        // Load recent packages
        await loadRecentPackages();
        
        // Load recent guests
        await loadRecentGuests();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

function updateDashboardStats(data) {
    // Update overview cards
    const summary = data.summary || {};
    const recentSales = data.recent_sales || {};
    
    // Total packages
    const totalBookingsEl = document.querySelector('.overview-card-value');
    if (totalBookingsEl && summary.total_packages !== undefined) {
        totalBookingsEl.textContent = summary.total_packages.toLocaleString();
    }
    
    // Total guests/clients
    const activeDestinationsEl = document.querySelectorAll('.overview-card-value')[1];
    if (activeDestinationsEl && summary.total_clients !== undefined) {
        activeDestinationsEl.textContent = summary.total_clients;
    }
    
    // Pending packages
    const pendingTasksEl = document.querySelectorAll('.overview-card-value')[2];
    if (pendingTasksEl && summary.pending_packages !== undefined) {
        pendingTasksEl.textContent = summary.pending_packages;
    }
    
    // Revenue
    const revenueEl = document.querySelectorAll('.overview-card-value')[3];
    if (revenueEl && summary.total_sales !== undefined) {
        revenueEl.textContent = '$' + summary.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

async function loadRecentPackages() {
    try {
        const response = await api.getPackages({ page: 1, limit: 5 });
        
        if (response.success && response.data && response.data.data) {
            updateRecentActivity(response.data.data);
        }
    } catch (error) {
        console.error('Error loading packages:', error);
    }
}

async function loadRecentGuests() {
    try {
        const response = await api.getGuests({ page: 1, limit: 5 });
        
        if (response.success && response.data && response.data.data) {
            // Could update guest-related activity here
        }
    } catch (error) {
        console.error('Error loading guests:', error);
    }
}

function updateRecentActivity(packages) {
    const activityLog = document.querySelector('.activity-log');
    if (!activityLog) return;
    
    // Clear existing items (keep first few as template or clear all)
    activityLog.innerHTML = '';
    
    packages.slice(0, 6).forEach((pkg, index) => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const icon = document.createElement('div');
        icon.className = 'activity-icon booking';
        icon.textContent = '📋';
        
        const content = document.createElement('div');
        content.className = 'activity-content';
        
        const title = document.createElement('div');
        title.className = 'activity-title';
        title.textContent = `Package: ${pkg.package_name || 'Unnamed'} (${pkg.status})`;
        
        const time = document.createElement('div');
        time.className = 'activity-time';
        time.textContent = formatTimeAgo(pkg.created_at);
        
        content.appendChild(title);
        content.appendChild(time);
        activityItem.appendChild(icon);
        activityItem.appendChild(content);
        activityLog.appendChild(activityItem);
    });
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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

