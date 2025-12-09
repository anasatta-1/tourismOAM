// Wizard Page JavaScript

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
        // Submit to API
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

/**
 * Submit wizard form to API
 */
async function submitWizardForm() {
    const nextBtn = document.getElementById('nextBtn');
    const originalText = nextBtn.textContent;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting...';
    
    console.log('🔄 Submitting wizard form...');
    console.log('📍 API Base URL:', api.baseUrl);
    
    try {
        // Collect guest data
        const guestData = {
            full_name: document.getElementById('wiz-guest-name').value,
            phone_number: document.getElementById('wiz-guest-phone').value,
            country_of_residence: document.getElementById('wiz-guest-country').value,
            status: document.getElementById('wiz-guest-status').value
        };
        
        // Collect package data
        const packageName = document.getElementById('wiz-package-name').value || null;
        
        // Collect air travel data
        const airTravelData = {
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
            trip_duration_days: parseInt(document.getElementById('wiz-air-days').value),
            trip_duration_nights: parseInt(document.getElementById('wiz-air-nights').value),
            transit_time_hours: document.getElementById('wiz-air-transit').value ? parseFloat(document.getElementById('wiz-air-transit').value) : null,
            time_of_travel: document.getElementById('wiz-air-time').value || 'AM',
            lounges_access: document.getElementById('wiz-air-lounges').value === '1',
            estimated_cost: parseFloat(document.getElementById('wiz-air-cost').value) || 0.00,
            notes: document.getElementById('wiz-air-notes').value || null
        };
        
        // Collect accommodation data
        const accommodationData = {
            accommodation_type: document.getElementById('wiz-acc-type').value,
            country: document.getElementById('wiz-acc-country').value,
            city: document.getElementById('wiz-acc-city').value,
            number_of_bedrooms: parseInt(document.getElementById('wiz-acc-bedrooms').value),
            star_rating: document.getElementById('wiz-acc-star-rating').value ? parseInt(document.getElementById('wiz-acc-star-rating').value) : null,
            bed_type: document.getElementById('wiz-acc-bed-type').value || null,
            cost: parseFloat(document.getElementById('wiz-acc-cost').value),
            check_in_date: document.getElementById('wiz-acc-checkin').value,
            check_out_date: document.getElementById('wiz-acc-checkout').value,
            notes: document.getElementById('wiz-acc-notes').value || null
        };
        
        // Collect tour data
        const tourData = {
            tour_type: document.getElementById('wiz-tour-type').value,
            tour_number: document.getElementById('wiz-tour-number').value || null,
            number_of_transfers: parseInt(document.getElementById('wiz-tour-transfers').value) || 0,
            country: document.getElementById('wiz-tour-country').value,
            city: document.getElementById('wiz-tour-city').value,
            tour_description: document.getElementById('wiz-tour-description').value || null,
            cost: parseFloat(document.getElementById('wiz-tour-cost').value) || 0.00,
            tour_date: document.getElementById('wiz-tour-date').value || null,
            notes: document.getElementById('wiz-tour-notes').value || null
        };
        
        // Collect visa data
        const visaData = {
            visa_type: document.getElementById('wiz-visa-type').value,
            country: document.getElementById('wiz-visa-country').value,
            visa_status: document.getElementById('wiz-visa-status').value || 'Pending',
            cost: parseFloat(document.getElementById('wiz-visa-cost').value) || 0.00,
            special_notes: document.getElementById('wiz-visa-notes').value || null
        };
        
        // Build wizard data object
        const wizardData = {
            guest: guestData,
            package_name: packageName,
            air_travel: airTravelData,
            accommodations: [accommodationData],
            tours: [tourData],
            visas: [visaData]
        };
        
        // Submit to API
        console.log('📤 Sending wizard data to:', api.baseUrl + '/packages/wizard');
        console.log('📋 Wizard data:', wizardData);
        const response = await api.createPackageWizard(wizardData);
        console.log('✅ Wizard response:', response);
        
        // Handle passport upload if file was selected
        const passportFile = document.getElementById('wiz-guest-passport')?.files[0];
        if (passportFile && response.data && response.data.guest_id) {
            try {
                await api.uploadPassport(response.data.guest_id, passportFile);
            } catch (error) {
                console.warn('Passport upload failed:', error);
            }
        }
        
        alert('Travel package created successfully! Package ID: ' + (response.data?.package_id || 'N/A'));
        
        // Reset form or redirect
        window.location.href = '../dashboard/dashboard.html';
        
    } catch (error) {
        console.error('❌ Error submitting wizard form:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            apiUrl: api.baseUrl
        });
        
        const errorMsg = `Error creating travel package.\n\n${error.message}\n\nPlease check:\n1. API is accessible at: ${api.baseUrl}\n2. Database connection is working\n3. Open browser console (F12) for more details`;
        alert(errorMsg);
        nextBtn.disabled = false;
        nextBtn.textContent = originalText;
    }
}

