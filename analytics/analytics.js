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
        
        // Load packages for calculations
        const packagesResponse = await api.getPackages();
        console.log('✅ Packages response:', packagesResponse);
        
        // API returns { data: { data: [...], pagination: {...} } }
        // So we need to access response.data.data
        const packages = (packagesResponse.data && Array.isArray(packagesResponse.data.data)) 
            ? packagesResponse.data.data 
            : (Array.isArray(packagesResponse.data) ? packagesResponse.data : []);
        console.log(`📊 Found ${packages.length} packages`);
        
        // Load sales by destination
        let salesByDestination = null;
        try {
            const destinationResponse = await api.getSalesByDestination();
            salesByDestination = destinationResponse.data;
        } catch (error) {
            console.warn('Could not load sales by destination:', error);
        }
        
        // Update stats row
        updateStatsRow(packages, analyticsData);
        
        // Update top destinations table
        updateTopDestinationsTable(packages, salesByDestination);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showAnalyticsError('Unable to load analytics data. Please check your connection.');
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

