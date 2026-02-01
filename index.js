// Dashboard Page JavaScript

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
});

/**
 * Load all dashboard data from API
 */
async function loadDashboardData() {
    console.log('🔄 Loading dashboard data...');
    console.log('📍 API Base URL:', api.baseUrl);
    
    try {
        // Load packages for total bookings
        console.log('📦 Fetching packages from:', api.baseUrl + '/packages');
        const packagesResponse = await api.getPackages();
        console.log('✅ Packages response:', packagesResponse);
        
        // API returns { data: { data: [...], pagination: {...} } }
        // So we need to access response.data.data
        const packages = (packagesResponse.data && Array.isArray(packagesResponse.data.data)) 
            ? packagesResponse.data.data 
            : (Array.isArray(packagesResponse.data) ? packagesResponse.data : []);
        console.log(`📊 Found ${packages.length} packages`);
        
        // Load analytics overview
        let analyticsData = null;
        try {
            console.log('📈 Fetching analytics from:', api.baseUrl + '/analytics/overview');
            const analyticsResponse = await api.getAnalyticsOverview();
            // Analytics might return data directly or nested
            analyticsData = analyticsResponse.data?.data || analyticsResponse.data || null;
            console.log('✅ Analytics response:', analyticsData);
        } catch (error) {
            console.warn('⚠️ Could not load analytics:', error);
        }
        
        // Update overview cards
        updateOverviewCards(packages, analyticsData);
        
        // Load recent packages for activity log
        updateRecentActivity(packages);
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            apiUrl: api.baseUrl
        });
        
        // Show detailed error message
        const errorMsg = `Unable to load dashboard data.\n\nError: ${error.message}\n\nPlease check:\n1. API is accessible at: ${api.baseUrl}\n2. Database connection is working\n3. Open browser console (F12) for more details`;
        showDashboardError(errorMsg);
    }
}

/**
 * Update overview cards with real data
 */
function updateOverviewCards(packages, analyticsData) {
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array:', packages);
        packages = [];
    }
    
    // Total Bookings
    const totalBookingsCard = document.querySelector('.overview-card:first-child .overview-card-value');
    if (totalBookingsCard) {
        totalBookingsCard.textContent = packages.length || 0;
    }
    
    // Active Destinations (count unique destinations from packages)
    // Note: The list endpoint doesn't include full package details, so we'll use a simple count
    // For accurate destination count, we'd need to fetch full package details
    const destinations = new Set();
    packages.forEach(pkg => {
        // The list endpoint doesn't include accommodations/air_travel details
        // We can't accurately count destinations from the list view
        // This would require fetching individual package details
    });
    const destinationsCard = document.querySelector('.overview-card:nth-child(2) .overview-card-value');
    if (destinationsCard) {
        destinationsCard.textContent = destinations.size || 0;
    }
    
    // Pending Tasks (packages with status 'draft' or 'quotation_sent')
    const pendingPackages = Array.isArray(packages) ? packages.filter(pkg => 
        pkg.status === 'draft' || pkg.status === 'quotation_sent'
    ) : [];
    const pendingCard = document.querySelector('.overview-card:nth-child(3) .overview-card-value');
    if (pendingCard) {
        pendingCard.textContent = pendingPackages.length || 0;
    }
    
    // Revenue (from analytics or calculate from packages)
    let revenue = 0;
    if (analyticsData && (analyticsData.summary?.total_sales || analyticsData.total_revenue)) {
        revenue = analyticsData.summary?.total_sales || analyticsData.total_revenue || 0;
    } else if (Array.isArray(packages)) {
        revenue = packages.reduce((sum, pkg) => {
            return sum + (parseFloat(pkg.total_estimated_cost) || 0);
        }, 0);
    }
    const revenueCard = document.querySelector('.overview-card:nth-child(4) .overview-card-value');
    if (revenueCard) {
        revenueCard.textContent = formatCurrency(revenue);
    }
}

/**
 * Update recent activity log
 */
function updateRecentActivity(packages) {
    const activityLog = document.querySelector('.activity-log');
    if (!activityLog) return;
    
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateRecentActivity:', packages);
        packages = [];
    }
    
    // Clear existing activity items (keep first few as template if needed)
    const existingItems = activityLog.querySelectorAll('.activity-item');
    if (existingItems.length > 0 && packages.length > 0) {
        // Remove template items
        existingItems.forEach(item => item.remove());
    }
    
    // Sort packages by created_at (most recent first)
    const sortedPackages = [...packages].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
    });
    
    // Show most recent 6 packages
    const recentPackages = sortedPackages.slice(0, 6);
    
    recentPackages.forEach(pkg => {
        const activityItem = createActivityItem(pkg);
        activityLog.appendChild(activityItem);
    });
    
    // If no packages, show message
    if (packages.length === 0) {
        const noActivity = document.createElement('div');
        noActivity.className = 'activity-item';
        noActivity.innerHTML = `
            <div class="activity-content">
                <div class="activity-title">No recent activity</div>
                <div class="activity-time">Create a new package to get started</div>
            </div>
        `;
        activityLog.appendChild(noActivity);
    }
}

/**
 * Create an activity item from package data
 */
function createActivityItem(pkg) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const statusIcon = getStatusIcon(pkg.status);
    const statusText = getStatusText(pkg.status);
    const timeAgo = getTimeAgo(pkg.created_at);
    
    item.innerHTML = `
        <div class="activity-icon booking">${statusIcon}</div>
        <div class="activity-content">
            <div class="activity-title">${pkg.package_name || 'Unnamed Package'} - ${statusText}</div>
            <div class="activity-time">${timeAgo}</div>
        </div>
    `;
    
    return item;
}

/**
 * Get icon for package status
 */
function getStatusIcon(status) {
    const icons = {
        'draft': '📝',
        'quotation_sent': '📧',
        'contract_sent': '📄',
        'confirmed': '✅',
        'completed': '🎉',
        'cancelled': '❌'
    };
    return icons[status] || '📋';
}

/**
 * Get readable status text
 */
function getStatusText(status) {
    const texts = {
        'draft': 'Draft Package',
        'quotation_sent': 'Quotation Sent',
        'contract_sent': 'Contract Sent',
        'confirmed': 'Confirmed',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return texts[status] || status;
}

/**
 * Get time ago string
 */
function getTimeAgo(dateString) {
    if (!dateString) return 'Unknown time';
    
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

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Show dashboard error message
 */
function showDashboardError(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'card';
        errorDiv.style.cssText = 'background: #fee; border: 1px solid #fcc; padding: 1rem; margin-bottom: 1rem;';
        errorDiv.innerHTML = `<p style="color: #c00; margin: 0;">⚠️ ${message}</p>`;
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
}

