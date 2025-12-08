// Wizard Page JavaScript with API integration

// Load API service
const apiScript = document.createElement('script');
apiScript.src = '../api-service.js';
document.head.appendChild(apiScript);

// Wait for API service to load
apiScript.onload = function() {
    initializeWizard();
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

function initializeWizard() {
    if (!checkAuth()) return;
    // Wizard is already initialized, just ensure API is available
}

let currentStep = 1;
const totalSteps = 7;

function updateStep(step) {
    currentStep = step;
    
    // Update progress bar
    const progress = (step / totalSteps) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((s, index) => {
        const stepNum = index + 1;
        s.classList.remove('active', 'completed');
        if (stepNum < step) {
            s.classList.add('completed');
        } else if (stepNum === step) {
            s.classList.add('active');
        }
    });
    
    // Update step content
    document.querySelectorAll('.step-section').forEach((section, index) => {
        section.classList.remove('active');
        if (index + 1 === step) {
            section.classList.add('active');
        }
    });
    
    // Update buttons
    document.getElementById('backBtn').style.display = step > 1 ? 'inline-block' : 'none';
    document.getElementById('nextBtn').textContent = step === totalSteps ? 'Submit' : 'Next';
    
    // Update summary on confirmation step
    if (step === totalSteps) {
        updateSummary();
    }
}

function updateSummary() {
    // Guest information
    const guestName = document.getElementById('wiz-guest-name').value || '-';
    document.getElementById('summary-guest-name').textContent = guestName;
    
    // Package information
    const packageName = document.getElementById('wiz-package-name').value || '-';
    const packageStatus = document.getElementById('wiz-package-status').value || '-';
    document.getElementById('summary-package-name').textContent = packageName;
    document.getElementById('summary-package-status').textContent = packageStatus;
    
    // Air travel
    const depCountry = document.getElementById('wiz-air-dep-country').value;
    const destCountry = document.getElementById('wiz-air-dest-country').value;
    const airTravel = depCountry && destCountry ? `${depCountry} → ${destCountry}` : '-';
    document.getElementById('summary-air-travel').textContent = airTravel;
    
    // Accommodation
    const accType = document.getElementById('wiz-acc-type').value;
    const accCity = document.getElementById('wiz-acc-city').value;
    const accommodation = accType && accCity ? `${accType} in ${accCity}` : '-';
    document.getElementById('summary-accommodation').textContent = accommodation;
}

document.getElementById('nextBtn').addEventListener('click', () => {
    // Validate current step before proceeding
    const currentSection = document.querySelector('.step-section.active');
    const requiredFields = currentSection.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (currentStep < totalSteps) {
        updateStep(currentStep + 1);
    } else {
        // Check confirmation checkbox
        if (!document.getElementById('wiz-confirm').checked) {
            alert('Please confirm that all information is correct');
            return;
        }
        // Submit the form via API
        submitWizardForm();
    }
});

document.getElementById('backBtn').addEventListener('click', () => {
    if (currentStep > 1) {
        updateStep(currentStep - 1);
    }
});

// Accommodation type change handler - show/hide hotel-specific fields
const accTypeSelect = document.getElementById('wiz-acc-type');
if (accTypeSelect) {
    accTypeSelect.addEventListener('change', function() {
        const hotelFields = document.getElementById('wiz-acc-hotel-fields');
        
        if (this.value === 'Hotel') {
            hotelFields.style.display = 'flex';
        } else {
            hotelFields.style.display = 'none';
            document.getElementById('wiz-acc-star-rating').value = '';
            document.getElementById('wiz-acc-bed-type').value = '';
        }
    });
}

// Form validation
document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });
    
    input.addEventListener('input', function() {
        if (this.classList.contains('error') && this.value) {
            this.classList.remove('error');
        }
    });
});

// Submit wizard form to API
async function submitWizardForm() {
    const submitBtn = document.getElementById('nextBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Package...';
    
    try {
        // Collect all form data
        const wizardData = collectWizardData();
        
        // Submit via API
        const response = await api.createPackageWizard(wizardData);
        
        if (response.success) {
            alert('Travel package created successfully!');
            // Redirect to dashboard or package view
            window.location.href = '../dashboard/dashboard.html';
        } else {
            alert('Error: ' + (response.message || 'Failed to create package'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Error creating package:', error);
        alert('Error: ' + (error.message || 'Failed to create package. Please try again.'));
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function collectWizardData() {
    const data = {
        guest: {
            full_name: document.getElementById('wiz-guest-name').value,
            phone_number: document.getElementById('wiz-guest-phone').value,
            country_of_residence: document.getElementById('wiz-guest-country').value,
            status: document.getElementById('wiz-guest-status').value
        },
        package_name: document.getElementById('wiz-package-name').value || null
    };
    
    // Air travel (if filled)
    const airTravel = {
        departure_country: document.getElementById('wiz-air-dep-country').value,
        departure_city: document.getElementById('wiz-air-dep-city').value,
        departure_airport: document.getElementById('wiz-air-dep-airport').value,
        destination_country: document.getElementById('wiz-air-dest-country').value,
        destination_city: document.getElementById('wiz-air-dest-city').value,
        destination_airport: document.getElementById('wiz-air-dest-airport').value,
        preferred_airline: document.getElementById('wiz-air-airline').value || null,
        number_of_adults: parseInt(document.getElementById('wiz-air-adults').value) || 0,
        number_of_children: parseInt(document.getElementById('wiz-air-children').value) || 0,
        number_of_infants: parseInt(document.getElementById('wiz-air-infants').value) || 0,
        departure_date: document.getElementById('wiz-air-dep-date').value,
        trip_duration_days: parseInt(document.getElementById('wiz-air-days').value) || 0,
        trip_duration_nights: parseInt(document.getElementById('wiz-air-nights').value) || 0,
        transit_time_hours: document.getElementById('wiz-air-transit').value ? parseFloat(document.getElementById('wiz-air-transit').value) : null,
        time_of_travel: document.getElementById('wiz-air-time').value,
        lounges_access: document.getElementById('wiz-air-lounges').value === '1',
        estimated_cost: parseFloat(document.getElementById('wiz-air-cost').value) || 0.00,
        notes: document.getElementById('wiz-air-notes').value || null
    };
    
    // Check if air travel is filled
    if (airTravel.departure_country && airTravel.destination_country) {
        data.air_travel = airTravel;
    }
    
    // Accommodation (if filled)
    const accType = document.getElementById('wiz-acc-type').value;
    if (accType) {
        data.accommodations = [{
            accommodation_type: accType,
            country: document.getElementById('wiz-acc-country').value,
            city: document.getElementById('wiz-acc-city').value,
            number_of_bedrooms: parseInt(document.getElementById('wiz-acc-bedrooms').value) || 0,
            star_rating: document.getElementById('wiz-acc-star-rating').value ? parseInt(document.getElementById('wiz-acc-star-rating').value) : null,
            bed_type: document.getElementById('wiz-acc-bed-type').value || null,
            cost: parseFloat(document.getElementById('wiz-acc-cost').value) || 0.00,
            check_in_date: document.getElementById('wiz-acc-checkin').value,
            check_out_date: document.getElementById('wiz-acc-checkout').value,
            notes: document.getElementById('wiz-acc-notes').value || null
        }];
    }
    
    // Tours (if filled)
    const tourType = document.getElementById('wiz-tour-type').value;
    if (tourType) {
        data.tours = [{
            tour_type: tourType,
            tour_number: document.getElementById('wiz-tour-number').value || null,
            number_of_transfers: parseInt(document.getElementById('wiz-tour-transfers').value) || 0,
            country: document.getElementById('wiz-tour-country').value,
            city: document.getElementById('wiz-tour-city').value,
            tour_description: document.getElementById('wiz-tour-description').value || null,
            cost: parseFloat(document.getElementById('wiz-tour-cost').value) || 0.00,
            tour_date: document.getElementById('wiz-tour-date').value || null,
            notes: document.getElementById('wiz-tour-notes').value || null
        }];
    }
    
    // Visas (if filled)
    const visaCountry = document.getElementById('wiz-visa-country').value;
    if (visaCountry) {
        data.visas = [{
            visa_type: document.getElementById('wiz-visa-type').value,
            visa_status: document.getElementById('wiz-visa-status').value,
            country: visaCountry,
            cost: parseFloat(document.getElementById('wiz-visa-cost').value) || 0.00,
            special_notes: document.getElementById('wiz-visa-notes').value || null
        }];
    }
    
    return data;
}

