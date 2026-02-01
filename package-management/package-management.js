// Package Management Page JavaScript

let currentPage = 1;
let currentLimit = 20;
let currentFilters = {};
let currentPackageId = null;

// Statistics
const stats = {
    total: 0,
    active: 0,
    revenue: 0,
    pending: 0
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadAllPackages();
});

// Initialize event listeners
function initializeEventListeners() {
    // Search by Package ID
    document.getElementById('search-btn').addEventListener('click', searchByPackageId);
    document.getElementById('search-package-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByPackageId();
        }
    });

    // Show all packages
    document.getElementById('show-all-btn').addEventListener('click', () => {
        document.getElementById('search-package-id').value = '';
        currentPackageId = null;
        currentFilters = {};
        currentPage = 1;
        loadAllPackages();
    });

    // Filter by status
    document.getElementById('filter-status').addEventListener('change', (e) => {
        currentFilters.status = e.target.value || null;
        currentPage = 1;
        if (currentPackageId) {
            loadAllPackages();
        } else {
            loadAllPackages();
        }
    });

    // Create package button
    document.getElementById('create-package-btn').addEventListener('click', () => {
        openCreateModal();
    });

    // Modal close buttons
    document.getElementById('close-create-modal').addEventListener('click', closeCreateModal);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('close-view-modal').addEventListener('click', closeViewModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('close-view-btn').addEventListener('click', closeViewModal);
    document.getElementById('cancel-create-btn').addEventListener('click', closeCreateModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);

    // Form submissions
    document.getElementById('submit-create-btn').addEventListener('click', submitCreatePackage);
    document.getElementById('submit-edit-btn').addEventListener('click', submitEditPackage);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDeletePackage);
    document.getElementById('edit-from-view-btn').addEventListener('click', editFromView);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadAllPackages();
        }
    });
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadAllPackages();
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Search by Package ID
async function searchByPackageId() {
    const packageId = document.getElementById('search-package-id').value.trim();
    
    if (!packageId) {
        alert('Please enter a Package ID');
        return;
    }

    currentPackageId = parseInt(packageId);
    currentPage = 1;

    try {
        const response = await api.getPackage(currentPackageId);
        if (response.success && response.data) {
            displayPackages([response.data]);
            updateStats([response.data]);
            document.getElementById('table-info').textContent = `Found 1 package`;
            document.getElementById('pagination').style.display = 'none';
        } else {
            throw new Error('Package not found');
        }
    } catch (error) {
        console.error('Error fetching package:', error);
        alert('Package not found: ' + error.message);
        document.getElementById('packages-tbody').innerHTML = '<tr><td colspan="7" class="loading-row">No package found</td></tr>';
        document.getElementById('table-info').textContent = 'No results';
        document.getElementById('pagination').style.display = 'none';
    }
}

// Load all packages
async function loadAllPackages() {
    try {
        const params = {
            page: currentPage,
            limit: currentLimit,
            ...currentFilters
        };
        
        // Remove null/empty values
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.getPackages(params);
        
        if (response.success && response.data) {
            const packages = response.data.data || [];
            const pagination = response.data.pagination || {};
            
            displayPackages(packages);
            updateStats(packages);
            updatePagination(pagination);
            document.getElementById('table-info').textContent = 
                `Showing ${packages.length} of ${pagination.total || 0} packages`;
        } else {
            throw new Error(response.message || 'Failed to load packages');
        }
    } catch (error) {
        console.error('Error loading packages:', error);
        document.getElementById('packages-tbody').innerHTML = 
            '<tr><td colspan="7" class="loading-row">Error loading packages: ' + error.message + '</td></tr>';
        document.getElementById('table-info').textContent = 'Error loading packages';
    }
}

// Display packages in table
function displayPackages(packages) {
    const tbody = document.getElementById('packages-tbody');
    
    if (packages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No packages found</td></tr>';
        return;
    }

    tbody.innerHTML = packages.map(pkg => {
        const statusClass = pkg.status || 'draft';
        const statusLabel = (pkg.status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const packageName = pkg.package_name || '-';
        const guestName = pkg.guest_name || 'Unknown Guest';
        const totalCost = pkg.total_estimated_cost ? `$${parseFloat(pkg.total_estimated_cost).toFixed(2)}` : '$0.00';
        const createdDate = pkg.created_at ? new Date(pkg.created_at).toLocaleDateString() : '-';

        return `
            <tr>
                <td><strong>#${pkg.package_id}</strong></td>
                <td>${packageName}</td>
                <td>${guestName}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>${totalCost}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewPackage(${pkg.package_id})" title="View Details">
                            👁️ View
                        </button>
                        <button class="action-btn edit" onclick="editPackage(${pkg.package_id})" title="Edit Package">
                            ✏️ Edit
                        </button>
                        <button class="action-btn delete" onclick="deletePackage(${pkg.package_id})" title="Delete Package">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats(packages) {
    stats.total = packages.length;
    stats.active = packages.filter(p => p.status === 'confirmed' || p.status === 'quotation_sent' || p.status === 'contract_sent').length;
    stats.revenue = packages.reduce((sum, p) => sum + (parseFloat(p.total_estimated_cost) || 0), 0);
    stats.pending = packages.filter(p => p.status === 'draft').length;

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-active').textContent = stats.active;
    document.getElementById('stat-revenue').textContent = `$${stats.revenue.toFixed(2)}`;
    document.getElementById('stat-pending').textContent = stats.pending;
}

// Update pagination
function updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (pagination.total_pages > 1) {
        paginationEl.style.display = 'flex';
        paginationInfo.textContent = `Page ${pagination.page} of ${pagination.total_pages}`;
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.total_pages;
    } else {
        paginationEl.style.display = 'none';
    }
}

// Open create modal
function openCreateModal() {
    document.getElementById('create-modal').classList.add('active');
    document.getElementById('create-package-form').reset();
}

// Close create modal
function closeCreateModal() {
    document.getElementById('create-modal').classList.remove('active');
}

// Submit create package
async function submitCreatePackage() {
    const form = document.getElementById('create-package-form');
    const guestId = document.getElementById('create-guest-id').value;
    const packageName = document.getElementById('create-package-name').value;
    const status = document.getElementById('create-package-status').value;

    if (!guestId) {
        alert('Please enter a Guest ID');
        return;
    }

    const submitBtn = document.getElementById('submit-create-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const packageData = {
            guest_id: parseInt(guestId),
            package_name: packageName || null,
            status: status
        };

        const response = await api.createPackage(packageData);
        
        if (response.success) {
            alert('Package created successfully! Package ID: ' + response.data.package_id);
            closeCreateModal();
            loadAllPackages();
        } else {
            throw new Error(response.message || 'Failed to create package');
        }
    } catch (error) {
        console.error('Error creating package:', error);
        alert('Error creating package: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Package';
    }
}

// View package details
async function viewPackage(packageId) {
    const modal = document.getElementById('view-modal');
    const modalBody = document.getElementById('view-modal-body');
    
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="loading-text">Loading package details...</div>';

    try {
        const response = await api.getPackage(packageId);
        
        if (response.success && response.data) {
            const pkg = response.data;
            displayPackageDetails(pkg);
            currentPackageId = packageId;
        } else {
            throw new Error(response.message || 'Package not found');
        }
    } catch (error) {
        console.error('Error fetching package details:', error);
        modalBody.innerHTML = `<div class="loading-text">Error loading package: ${error.message}</div>`;
    }
}

// Display package details
function displayPackageDetails(pkg) {
    const modalBody = document.getElementById('view-modal-body');
    
    const guest = pkg.guest || {};
    const airTravel = pkg.air_travel || null;
    const accommodations = pkg.accommodations || [];
    const tours = pkg.tours || [];
    const visas = pkg.visas || [];
    const quotations = pkg.quotations || [];
    const contract = pkg.contract || null;
    const payments = pkg.payments || [];

    modalBody.innerHTML = `
        <div class="package-details">
            <div class="detail-section">
                <div class="detail-section-title">Package Information</div>
                <div class="detail-row">
                    <div class="detail-label">Package ID:</div>
                    <div class="detail-value">#${pkg.package_id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Package Name:</div>
                    <div class="detail-value">${pkg.package_name || '<span class="empty">Not set</span>'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div class="detail-value"><span class="status-badge ${pkg.status || 'draft'}">${(pkg.status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Cost:</div>
                    <div class="detail-value">$${parseFloat(pkg.total_estimated_cost || 0).toFixed(2)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Created Date:</div>
                    <div class="detail-value">${pkg.created_at ? new Date(pkg.created_at).toLocaleString() : '-'}</div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Guest Information</div>
                <div class="detail-row">
                    <div class="detail-label">Guest ID:</div>
                    <div class="detail-value">#${guest.guest_id || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Full Name:</div>
                    <div class="detail-value">${guest.full_name || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">${guest.phone_number || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Country:</div>
                    <div class="detail-value">${guest.country_of_residence || '-'}</div>
                </div>
            </div>

            ${airTravel ? `
            <div class="detail-section">
                <div class="detail-section-title">Air Travel</div>
                <div class="detail-row">
                    <div class="detail-label">Route:</div>
                    <div class="detail-value">${airTravel.departure_city || ''}, ${airTravel.departure_country || ''} → ${airTravel.destination_city || ''}, ${airTravel.destination_country || ''}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Departure Date:</div>
                    <div class="detail-value">${airTravel.departure_date ? new Date(airTravel.departure_date).toLocaleDateString() : '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Duration:</div>
                    <div class="detail-value">${airTravel.trip_duration_days || 0} days / ${airTravel.trip_duration_nights || 0} nights</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Estimated Cost:</div>
                    <div class="detail-value">$${parseFloat(airTravel.estimated_cost || 0).toFixed(2)}</div>
                </div>
            </div>
            ` : ''}

            ${accommodations.length > 0 ? `
            <div class="detail-section">
                <div class="detail-section-title">Accommodations (${accommodations.length})</div>
                ${accommodations.map(acc => `
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div class="detail-row">
                            <div class="detail-label">Type:</div>
                            <div class="detail-value">${acc.accommodation_type || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Location:</div>
                            <div class="detail-value">${acc.city || ''}, ${acc.country || ''}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Check-in/out:</div>
                            <div class="detail-value">${acc.check_in_date ? new Date(acc.check_in_date).toLocaleDateString() : '-'} / ${acc.check_out_date ? new Date(acc.check_out_date).toLocaleDateString() : '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Cost:</div>
                            <div class="detail-value">$${parseFloat(acc.cost || 0).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${tours.length > 0 ? `
            <div class="detail-section">
                <div class="detail-section-title">Tours (${tours.length})</div>
                ${tours.map(tour => `
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div class="detail-row">
                            <div class="detail-label">Type:</div>
                            <div class="detail-value">${tour.tour_type || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Location:</div>
                            <div class="detail-value">${tour.city || ''}, ${tour.country || ''}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Cost:</div>
                            <div class="detail-value">$${parseFloat(tour.cost || 0).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${visas.length > 0 ? `
            <div class="detail-section">
                <div class="detail-section-title">Visas (${visas.length})</div>
                ${visas.map(visa => `
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div class="detail-row">
                            <div class="detail-label">Type:</div>
                            <div class="detail-value">${visa.visa_type || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Country:</div>
                            <div class="detail-value">${visa.country || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Status:</div>
                            <div class="detail-value">${visa.visa_status || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Cost:</div>
                            <div class="detail-value">$${parseFloat(visa.cost || 0).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    `;
}

// Edit package
async function editPackage(packageId) {
    try {
        const response = await api.getPackage(packageId);
        
        if (response.success && response.data) {
            const pkg = response.data;
            
            document.getElementById('edit-package-id').value = pkg.package_id;
            document.getElementById('edit-package-name').value = pkg.package_name || '';
            document.getElementById('edit-package-status').value = pkg.status || 'draft';
            
            document.getElementById('edit-modal').classList.add('active');
            currentPackageId = packageId;
        } else {
            throw new Error(response.message || 'Package not found');
        }
    } catch (error) {
        console.error('Error fetching package for edit:', error);
        alert('Error loading package: ' + error.message);
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// Submit edit package
async function submitEditPackage() {
    const packageId = document.getElementById('edit-package-id').value;
    const packageName = document.getElementById('edit-package-name').value;
    const status = document.getElementById('edit-package-status').value;

    const submitBtn = document.getElementById('submit-edit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        const packageData = {
            package_name: packageName || null,
            status: status
        };

        const response = await api.updatePackage(packageId, packageData);
        
        if (response.success) {
            alert('Package updated successfully!');
            closeEditModal();
            loadAllPackages();
        } else {
            throw new Error(response.message || 'Failed to update package');
        }
    } catch (error) {
        console.error('Error updating package:', error);
        alert('Error updating package: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Package';
    }
}

// Delete package
function deletePackage(packageId) {
    document.getElementById('delete-package-id').textContent = packageId;
    document.getElementById('delete-modal').classList.add('active');
    currentPackageId = packageId;
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
}

// Confirm delete package
async function confirmDeletePackage() {
    const packageId = currentPackageId;
    
    if (!packageId) {
        alert('Package ID not found');
        return;
    }

    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
        const response = await api.deletePackage(packageId);
        
        if (response.success) {
            alert('Package deleted successfully!');
            closeDeleteModal();
            loadAllPackages();
        } else {
            throw new Error(response.message || 'Failed to delete package');
        }
    } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package: ' + error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Package';
    }
}

// Edit from view modal
function editFromView() {
    closeViewModal();
    if (currentPackageId) {
        editPackage(currentPackageId);
    }
}

// Close view modal
function closeViewModal() {
    document.getElementById('view-modal').classList.remove('active');
}

// Make functions globally available for onclick handlers
window.viewPackage = viewPackage;
window.editPackage = editPackage;
window.deletePackage = deletePackage;

