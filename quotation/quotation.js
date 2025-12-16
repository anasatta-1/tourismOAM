// Quotation Page JavaScript

let packageId = null;
let quotationId = null;
let packageData = null;
let quotationData = null;

// Check if page is accessed from wizard confirmation
document.addEventListener('DOMContentLoaded', async () => {
    // Get package ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    packageId = urlParams.get('package_id');
    
    // Also check sessionStorage (set by wizard)
    if (!packageId) {
        packageId = sessionStorage.getItem('wizardPackageId');
    }
    
    if (!packageId) {
        // No package ID - access denied
        showError();
        return;
    }
    
    // Clear the session storage after reading
    sessionStorage.removeItem('wizardPackageId');
    
    // Load quotation data
    await loadQuotation();
});

// Show error message
function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('quotation-content').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
}

// Load quotation data
async function loadQuotation() {
    try {
        // First, get package details
        const packageResponse = await api.getPackage(packageId);
        if (!packageResponse.success) {
            throw new Error('Package not found');
        }
        
        packageData = packageResponse.data;
        
        // Generate quotation if it doesn't exist
        let quotationResponse;
        try {
            // Try to get existing quotations
            const quotationsResponse = await api.getQuotations(packageId);
            if (quotationsResponse.success && quotationsResponse.data.quotations && quotationsResponse.data.quotations.length > 0) {
                // Use the most recent quotation
                quotationId = quotationsResponse.data.quotations[0].quotation_id;
                quotationResponse = await api.getQuotation(packageId, quotationId);
            } else {
                // Generate new quotation
                quotationResponse = await api.createQuotation(packageId, {
                    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
                });
            }
        } catch (error) {
            // If getting quotation fails, create a new one
            quotationResponse = await api.createQuotation(packageId, {
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
        
        if (!quotationResponse.success) {
            throw new Error('Failed to generate quotation');
        }
        
        quotationData = quotationResponse.data;
        quotationId = quotationData.quotation_id;
        
        // Display quotation
        displayQuotation();
        
    } catch (error) {
        console.error('Error loading quotation:', error);
        document.getElementById('loading').innerHTML = `
            <div class="error-card">
                <h2>Error</h2>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.href='../wizard/wizard.html'">Go to Wizard</button>
            </div>
        `;
    }
}

// Display quotation data
function displayQuotation() {
    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('quotation-content').style.display = 'block';
    
    // Quotation header
    document.getElementById('quotation-number').textContent = quotationData.quotation_number || 'N/A';
    document.getElementById('quotation-date').textContent = quotationData.generated_date 
        ? new Date(quotationData.generated_date).toLocaleDateString() 
        : new Date().toLocaleDateString();
    
    const statusBadge = getStatusBadge(quotationData.status || 'draft');
    document.getElementById('quotation-status').innerHTML = statusBadge;
    
    // Guest information
    const guest = packageData.guest || {};
    document.getElementById('guest-name').textContent = guest.full_name || '-';
    document.getElementById('guest-phone').textContent = guest.phone_number || '-';
    document.getElementById('guest-country').textContent = guest.country_of_residence || '-';
    
    // Package information
    document.getElementById('package-name').textContent = packageData.package_name || 'Unnamed Package';
    document.getElementById('package-id').textContent = `#${packageData.package_id}`;
    
    // Air Travel
    if (packageData.air_travel) {
        document.getElementById('air-travel-section').style.display = 'block';
        const airTravel = packageData.air_travel;
        document.getElementById('air-travel-details').innerHTML = `
            <div class="info-item">
                <span class="info-label">Route:</span>
                <span class="info-value">${airTravel.departure_city || ''}, ${airTravel.departure_country || ''} → ${airTravel.destination_city || ''}, ${airTravel.destination_country || ''}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Departure Date:</span>
                <span class="info-value">${airTravel.departure_date ? new Date(airTravel.departure_date).toLocaleDateString() : '-'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Duration:</span>
                <span class="info-value">${airTravel.trip_duration_days || 0} days / ${airTravel.trip_duration_nights || 0} nights</span>
            </div>
            <div class="info-item">
                <span class="info-label">Passengers:</span>
                <span class="info-value">${airTravel.number_of_adults || 0} Adults, ${airTravel.number_of_children || 0} Children, ${airTravel.number_of_infants || 0} Infants</span>
            </div>
            ${airTravel.preferred_airline ? `
            <div class="info-item">
                <span class="info-label">Preferred Airline:</span>
                <span class="info-value">${airTravel.preferred_airline}</span>
            </div>
            ` : ''}
        `;
    }
    
    // Accommodations
    if (packageData.accommodations && packageData.accommodations.length > 0) {
        document.getElementById('accommodations-section').style.display = 'block';
        document.getElementById('accommodations-list').innerHTML = packageData.accommodations.map(acc => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${acc.accommodation_type || 'Accommodation'}</div>
                    <div class="list-item-cost">$${parseFloat(acc.cost || 0).toFixed(2)}</div>
                </div>
                <div class="list-item-details">
                    <div class="info-item">
                        <span class="info-label">Location:</span>
                        <span class="info-value">${acc.city || ''}, ${acc.country || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Check-in:</span>
                        <span class="info-value">${acc.check_in_date ? new Date(acc.check_in_date).toLocaleDateString() : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Check-out:</span>
                        <span class="info-value">${acc.check_out_date ? new Date(acc.check_out_date).toLocaleDateString() : '-'}</span>
                    </div>
                    ${acc.star_rating ? `
                    <div class="info-item">
                        <span class="info-label">Star Rating:</span>
                        <span class="info-value">${acc.star_rating} stars</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // Tours
    if (packageData.tours && packageData.tours.length > 0) {
        document.getElementById('tours-section').style.display = 'block';
        document.getElementById('tours-list').innerHTML = packageData.tours.map(tour => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${tour.tour_type || 'Tour'}</div>
                    <div class="list-item-cost">$${parseFloat(tour.cost || 0).toFixed(2)}</div>
                </div>
                <div class="list-item-details">
                    <div class="info-item">
                        <span class="info-label">Location:</span>
                        <span class="info-value">${tour.city || ''}, ${tour.country || ''}</span>
                    </div>
                    ${tour.tour_date ? `
                    <div class="info-item">
                        <span class="info-label">Tour Date:</span>
                        <span class="info-value">${new Date(tour.tour_date).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    ${tour.tour_description ? `
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <span class="info-label">Description:</span>
                        <span class="info-value">${tour.tour_description}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // Visas
    if (packageData.visas && packageData.visas.length > 0) {
        document.getElementById('visas-section').style.display = 'block';
        document.getElementById('visas-list').innerHTML = packageData.visas.map(visa => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${visa.visa_type || 'Visa'}</div>
                    <div class="list-item-cost">$${parseFloat(visa.cost || 0).toFixed(2)}</div>
                </div>
                <div class="list-item-details">
                    <div class="info-item">
                        <span class="info-label">Country:</span>
                        <span class="info-value">${visa.country || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">${visa.visa_status || '-'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Cost breakdown
    const breakdown = quotationData.breakdown || {};
    document.getElementById('cost-air-travel').textContent = formatCurrency(breakdown.air_travel_cost || 0);
    document.getElementById('cost-accommodations').textContent = formatCurrency(breakdown.accommodations_cost || 0);
    document.getElementById('cost-tours').textContent = formatCurrency(breakdown.tours_cost || 0);
    document.getElementById('cost-visas').textContent = formatCurrency(breakdown.visas_cost || 0);
    document.getElementById('cost-total').textContent = formatCurrency(breakdown.total || quotationData.total_amount || 0);
    
    // Notes
    if (quotationData.notes) {
        document.getElementById('quotation-notes').textContent = quotationData.notes;
    }
    
    // Setup action buttons
    setupActionButtons();
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'draft': '<span class="status-badge draft">Draft</span>',
        'sent': '<span class="status-badge sent">Sent</span>',
        'accepted': '<span class="status-badge accepted">Accepted</span>',
        'rejected': '<span class="status-badge rejected">Rejected</span>',
        'expired': '<span class="status-badge expired">Expired</span>'
    };
    return badges[status] || `<span class="status-badge">${status}</span>`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Setup action buttons
function setupActionButtons() {
    // Download PDF
    document.getElementById('download-pdf-btn').addEventListener('click', async () => {
            try {
            // Check if html2pdf is loaded
            if (typeof html2pdf === 'undefined') {
                throw new Error('PDF library not loaded. Please refresh the page and try again.');
            }
            
            // Show loading state
            const btn = document.getElementById('download-pdf-btn');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Generating PDF...';
            
            // Get the quotation content element
            const quotationContent = document.getElementById('quotation-content');
            
            if (!quotationContent) {
                throw new Error('Quotation content not found');
            }
            
            // Ensure content is visible
            const originalDisplay = quotationContent.style.display;
            quotationContent.style.display = 'block';
            
            // Hide action buttons for PDF
            const actionButtons = quotationContent.querySelector('.quotation-actions');
            const originalActionDisplay = actionButtons ? actionButtons.style.display : '';
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            // Scroll to top to ensure content is in view
            window.scrollTo(0, 0);
            
            // Wait for any pending renders
            await new Promise(resolve => {
                // Force browser to render
                void quotationContent.offsetHeight;
                setTimeout(resolve, 200);
            });
            
            // Configure PDF options
            const opt = {
                margin: [15, 15, 15, 15],
                filename: `quotation-${quotationData.quotation_number || quotationId || 'draft'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#0a0e14', // Match the dark theme background
                    windowWidth: quotationContent.scrollWidth || window.innerWidth,
                    windowHeight: quotationContent.scrollHeight || window.innerHeight,
                    allowTaint: true,
                    letterRendering: true,
                    removeContainer: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.quotation-section',
                    after: '.quotation-section'
                }
            };
            
            // Generate and download PDF
            await html2pdf().set(opt).from(quotationContent).save();
            
            // Restore original display
            quotationContent.style.display = originalDisplay;
            if (actionButtons) {
                actionButtons.style.display = originalActionDisplay || '';
            }
            
            // Restore button state
            btn.disabled = false;
            btn.textContent = originalText;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + error.message);
            
            // Restore button state
            const btn = document.getElementById('download-pdf-btn');
            btn.disabled = false;
            btn.textContent = 'Download PDF';
            
            // Restore content display if needed
            const quotationContent = document.getElementById('quotation-content');
            if (quotationContent) {
                quotationContent.style.display = 'block';
            }
            
            // Restore action buttons if hidden
            const actionButtons = document.querySelector('.quotation-actions');
            if (actionButtons) {
                actionButtons.style.display = '';
            }
        }
    });
    
    // View Contract button
    document.getElementById('view-contract-btn').addEventListener('click', () => {
        // Store package ID in sessionStorage and navigate to contract page
        sessionStorage.setItem('contractPackageId', packageId);
        window.location.href = '../contract/contract.html';
    });
    
    // Back to dashboard
    document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
        window.location.href = '../dashboard/dashboard.html';
    });
}

