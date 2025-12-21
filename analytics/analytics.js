// Analytics Page JavaScript

// Load analytics data on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadAnalyticsData();
    
    // Setup filter change handlers
    setupFilters();
});

/**
 * Load all analytics data from API
 */
async function loadAnalyticsData() {
    try {
        // Load analytics overview
        let analyticsData = null;
        try {
            const analyticsResponse = await api.getAnalyticsOverview();
            analyticsData = analyticsResponse.data;
        } catch (error) {
            console.warn('Could not load analytics overview:', error);
        }
        
        // Load packages for calculations - fetch all packages (no limit)
        const packagesResponse = await api.getPackages({ limit: 1000 }); // Get up to 1000 packages
        console.log('✅ Packages response:', packagesResponse);
        
        // API returns { success: true, data: { data: [...], pagination: {...} } }
        // So we need to access response.data.data
        let packages = [];
        if (packagesResponse.success && packagesResponse.data) {
            if (Array.isArray(packagesResponse.data.data)) {
                packages = packagesResponse.data.data;
            } else if (Array.isArray(packagesResponse.data)) {
                packages = packagesResponse.data;
            }
        }
        console.log(`📊 Found ${packages.length} packages`);
        
        // Load sales by destination
        let salesByDestination = null;
        try {
            const destinationResponse = await api.getSalesByDestination();
            salesByDestination = destinationResponse.data;
        } catch (error) {
            console.warn('Could not load sales by destination:', error);
        }
        
        // Update overview cards
        updateOverviewCards(packages, analyticsData);
        
        // Update stats row
        updateStatsRow(packages, analyticsData);
        
        // Update top destinations table
        updateTopDestinationsTable(packages, salesByDestination);
        
        // Update recent activity
        updateRecentActivity(packages);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showAnalyticsError('Unable to load analytics data. Please check your connection.');
    }
}

/**
 * Update overview cards with real data
 */
function updateOverviewCards(packages, analyticsData) {
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateOverviewCards:', packages);
        packages = [];
    }
    
    // Total Bookings
    const totalBookings = packages.length || 0;
    const bookingsCard = document.querySelector('.overview-card:nth-child(1) .overview-card-value');
    if (bookingsCard) {
        bookingsCard.textContent = formatNumber(totalBookings);
    }
    
    // Calculate unique destinations from packages
    // The list endpoint includes has_accommodations, has_air_travel flags
    // To get accurate destination count, we'd need to fetch full package details
    // For now, we'll count packages that have travel/accommodation data as having destinations
    const destinationsWithData = packages.filter(pkg => 
        pkg.has_air_travel || pkg.has_accommodations
    ).length;
    
    // Active Destinations - approximate count based on packages with travel/accommodation data
    const destinationsCard = document.querySelector('.overview-card:nth-child(2) .overview-card-value');
    if (destinationsCard) {
        // For a more accurate count, we could fetch full package details
        // But for performance, we'll use the approximate count
        destinationsCard.textContent = destinationsWithData || 0;
    }
    
    // Pending Tasks (packages with status 'draft' or 'quotation_sent')
    const pendingPackages = Array.isArray(packages) ? packages.filter(pkg => 
        pkg.status === 'draft' || pkg.status === 'quotation_sent'
    ) : [];
    const pendingCard = document.querySelector('.overview-card:nth-child(3) .overview-card-value');
    if (pendingCard) {
        pendingCard.textContent = pendingPackages.length || 0;
    }
    
    // Revenue
    let totalRevenue = 0;
    if (analyticsData && (analyticsData.summary?.total_sales || analyticsData.total_revenue)) {
        totalRevenue = analyticsData.summary?.total_sales || analyticsData.total_revenue || 0;
    } else if (Array.isArray(packages)) {
        totalRevenue = packages.reduce((sum, pkg) => {
            return sum + (parseFloat(pkg.total_estimated_cost) || 0);
        }, 0);
    }
    const revenueCard = document.querySelector('.overview-card:nth-child(4) .overview-card-value');
    if (revenueCard) {
        revenueCard.textContent = formatCurrency(totalRevenue);
    }
}

/**
 * Update stats row with real data
 */
function updateStatsRow(packages, analyticsData) {
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateStatsRow:', packages);
        packages = [];
    }
    
    // Total Bookings
    const totalBookings = packages.length || 0;
    const bookingsStat = document.querySelector('.stat-box:nth-child(1) .stat-value');
    if (bookingsStat) {
        bookingsStat.textContent = formatNumber(totalBookings);
    }
    
    // Total Revenue
    let totalRevenue = 0;
    if (analyticsData && (analyticsData.summary?.total_sales || analyticsData.total_revenue)) {
        totalRevenue = analyticsData.summary?.total_sales || analyticsData.total_revenue || 0;
    } else if (Array.isArray(packages)) {
        totalRevenue = packages.reduce((sum, pkg) => {
            return sum + (parseFloat(pkg.total_estimated_cost) || 0);
        }, 0);
    }
    const revenueStat = document.querySelector('.stat-box:nth-child(2) .stat-value');
    if (revenueStat) {
        revenueStat.textContent = formatCurrency(totalRevenue);
    }
    
    // Destinations (count unique destinations)
    // Note: The list endpoint doesn't include full package details
    const destinations = new Set();
    if (Array.isArray(packages)) {
        packages.forEach(pkg => {
            // The list endpoint doesn't include accommodations/air_travel details
            // We can't accurately count destinations from the list view
        });
    }
    const destinationsStat = document.querySelector('.stat-box:nth-child(3) .stat-value');
    if (destinationsStat) {
        destinationsStat.textContent = destinations.size || 0;
    }
    
    // Satisfaction Rate (placeholder - would need feedback data)
    const satisfactionStat = document.querySelector('.stat-box:nth-child(4) .stat-value');
    if (satisfactionStat) {
        // Calculate based on completed packages vs total
        const completedPackages = Array.isArray(packages) ? packages.filter(pkg => pkg.status === 'completed').length : 0;
        const satisfactionRate = totalBookings > 0 
            ? Math.round((completedPackages / totalBookings) * 100) 
            : 0;
        satisfactionStat.textContent = satisfactionRate + '%';
    }
}

/**
 * Update top destinations table with real data
 */
function updateTopDestinationsTable(packages, salesByDestination) {
    const tableBody = document.querySelector('.table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateTopDestinationsTable:', packages);
        packages = [];
    }
    
    // Calculate destination statistics
    const destinationStats = {};
    
    packages.forEach(pkg => {
        let destination = null;
        let country = null;
        
        // Get destination from accommodations
        if (pkg.accommodations && pkg.accommodations.length > 0) {
            const acc = pkg.accommodations[0];
            destination = acc.city;
            country = acc.country;
        }
        // Or from air travel
        else if (pkg.air_travel && pkg.air_travel.destination_city) {
            destination = pkg.air_travel.destination_city;
            country = pkg.air_travel.destination_country;
        }
        
        if (destination) {
            const key = `${destination}, ${country}`;
            if (!destinationStats[key]) {
                destinationStats[key] = {
                    destination: destination,
                    country: country,
                    bookings: 0,
                    revenue: 0
                };
            }
            destinationStats[key].bookings++;
            destinationStats[key].revenue += parseFloat(pkg.total_estimated_cost) || 0;
        }
    });
    
    // Convert to array and sort by bookings
    const sortedDestinations = Object.values(destinationStats)
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5); // Top 5
    
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateTopDestinationsTable:', packages);
        packages = [];
    }
    
    // If we have API data, use it
    if (salesByDestination && Array.isArray(salesByDestination)) {
        salesByDestination.slice(0, 5).forEach((item, index) => {
            const row = createDestinationRow(index + 1, item.destination || item.city, item.bookings || 0, item.revenue || 0);
            tableBody.appendChild(row);
        });
    } else {
        // Use calculated data
        if (sortedDestinations.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                    No destination data available. Create some packages to see analytics.
                </td>
            `;
            tableBody.appendChild(noDataRow);
        } else {
            sortedDestinations.forEach((stat, index) => {
                const destinationName = `${stat.destination}, ${stat.country}`;
                const row = createDestinationRow(index + 1, destinationName, stat.bookings, stat.revenue);
                tableBody.appendChild(row);
            });
        }
    }
}

/**
 * Create a destination table row
 */
function createDestinationRow(rank, destination, bookings, revenue) {
    const row = document.createElement('tr');
    
    // Calculate growth (placeholder - would need historical data)
    const growth = '+12%'; // This would be calculated from historical data
    const growthClass = 'growth-positive';
    
    row.innerHTML = `
        <td>${rank}</td>
        <td><strong>${destination}</strong></td>
        <td>${formatNumber(bookings)}</td>
        <td>${formatCurrency(revenue)}</td>
        <td class="${growthClass}">${growth}</td>
        <td><span class="status-badge">Active</span></td>
    `;
    
    return row;
}

/**
 * Setup filter change handlers
 */
function setupFilters() {
    const dateRangeSelect = document.querySelector('.filter-select');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', async function() {
            // Reload data with new filters
            await loadAnalyticsData();
        });
    }
    
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Export functionality would be implemented here');
        });
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
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
 * Update recent activity log with real data
 */
function updateRecentActivity(packages) {
    const activityLog = document.querySelector('.activity-log');
    if (!activityLog) return;
    
    // Ensure packages is an array
    if (!Array.isArray(packages)) {
        console.warn('⚠️ Packages is not an array in updateRecentActivity:', packages);
        packages = [];
    }
    
    // Clear existing activity items
    activityLog.innerHTML = '';
    
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
    const packageName = pkg.package_name || 'Unnamed Package';
    const guestName = pkg.guest_name || 'Unknown Guest';
    
    item.innerHTML = `
        <div class="activity-icon booking">${statusIcon}</div>
        <div class="activity-content">
            <div class="activity-title">${packageName} - ${statusText} (Guest: ${guestName})</div>
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
 * Show analytics error message
 */
function showAnalyticsError(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'card';
        errorDiv.style.cssText = 'background: #fee; border: 1px solid #fcc; padding: 1rem; margin-bottom: 1rem;';
        errorDiv.innerHTML = `<p style="color: #c00; margin: 0;">⚠️ ${message}</p>`;
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
}

