// Data Entry Page JavaScript

// Load API service
const apiScript = document.createElement('script');
apiScript.src = '../api-service.js';
document.head.appendChild(apiScript);

// Wait for API service to load
apiScript.onload = function() {
    if (checkAuth()) {
        initializeDataEntry();
    }
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

function initializeDataEntry() {
    // Data type switching
    document.querySelectorAll('.data-type-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.data-type-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding form
            const dataType = link.getAttribute('data-type');
            document.querySelectorAll('.form-content-type').forEach(form => {
                form.classList.remove('active');
            });
            const formId = dataType === 'air-travel' ? 'air-travel-form' : 
                          dataType === 'accommodation' ? 'accommodation-form' :
                          dataType + '-form';
            const formElement = document.getElementById(formId);
            if (formElement) {
                formElement.classList.add('active');
            }
        });
    });

    // Setup form submissions
    setupFormSubmissions();
}

// Accommodation type change handler - show/hide hotel-specific fields
const accTypeSelect = document.getElementById('acc-type');
if (accTypeSelect) {
    accTypeSelect.addEventListener('change', function() {
        const starRatingGroup = document.getElementById('acc-star-rating-group');
        const bedTypeGroup = document.getElementById('acc-bed-type-group');
        
        if (this.value === 'Hotel') {
            starRatingGroup.style.display = 'block';
            bedTypeGroup.style.display = 'block';
        } else {
            starRatingGroup.style.display = 'none';
            bedTypeGroup.style.display = 'none';
            document.getElementById('acc-star-rating').value = '';
            document.getElementById('acc-bed-type').value = '';
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
 * Setup form submission handlers
 */
function setupFormSubmissions() {
    // Guest form submission
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitGuestForm();
        });
    }

    // Package form submission
    const packageForm = document.getElementById('package-form');
    if (packageForm) {
        packageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPackageForm();
        });
    }

    // Air Travel form submission
    const airTravelForm = document.getElementById('air-travel-form');
    if (airTravelForm) {
        airTravelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAirTravelForm();
        });
    }

    // Accommodation form submission
    const accommodationForm = document.getElementById('accommodation-form');
    if (accommodationForm) {
        accommodationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAccommodationForm();
        });
    }

    // Tour form submission
    const tourForm = document.getElementById('tour-form');
    if (tourForm) {
        tourForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitTourForm();
        });
    }

    // Visa form submission
    const visaForm = document.getElementById('visa-form');
    if (visaForm) {
        visaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitVisaForm();
        });
    }
}

/**
 * Submit Guest Form
 */
async function submitGuestForm() {
    try {
        const formData = {
            full_name: document.getElementById('guest-full-name')?.value,
            phone_number: document.getElementById('guest-phone')?.value,
            country_of_residence: document.getElementById('guest-country')?.value,
            passport_image_path: null
        };

        const response = await api.createGuest(formData);
        alert('Guest created successfully! Guest ID: ' + response.data.guest_id);
        
        // Handle passport upload if file was selected
        const passportFile = document.getElementById('guest-passport')?.files[0];
        if (passportFile && response.data.guest_id) {
            try {
                await api.uploadPassport(response.data.guest_id, passportFile);
            } catch (error) {
                console.warn('Passport upload failed:', error);
            }
        }
        
        // Reset form
        document.getElementById('guest-form')?.reset();
    } catch (error) {
        alert('Error creating guest: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Submit Package Form
 */
async function submitPackageForm() {
    try {
        const guestId = document.getElementById('package-guest-id')?.value;
        if (!guestId) {
            alert('Please enter a Guest ID');
            return;
        }

        const formData = {
            guest_id: parseInt(guestId),
            package_name: document.getElementById('package-name')?.value || null
        };

        const response = await api.createPackage(formData);
        alert('Package created successfully! Package ID: ' + response.data.package_id);
        
        // Reset form
        document.getElementById('package-form')?.reset();
    } catch (error) {
        alert('Error creating package: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Submit Air Travel Form
 */
async function submitAirTravelForm() {
    try {
        const packageId = document.getElementById('air-package-id')?.value;
        if (!packageId) {
            alert('Please enter a Package ID');
            return;
        }

        const formData = {
            departure_country: document.getElementById('air-dep-country')?.value,
            departure_city: document.getElementById('air-dep-city')?.value,
            departure_airport: document.getElementById('air-dep-airport')?.value,
            destination_country: document.getElementById('air-dest-country')?.value,
            destination_city: document.getElementById('air-dest-city')?.value,
            destination_airport: document.getElementById('air-dest-airport')?.value,
            preferred_airline: document.getElementById('air-airline')?.value || null,
            number_of_adults: parseInt(document.getElementById('air-adults')?.value) || 0,
            number_of_children: parseInt(document.getElementById('air-children')?.value) || 0,
            number_of_infants: parseInt(document.getElementById('air-infants')?.value) || 0,
            departure_date: document.getElementById('air-dep-date')?.value,
            trip_duration_days: parseInt(document.getElementById('air-days')?.value),
            trip_duration_nights: parseInt(document.getElementById('air-nights')?.value),
            transit_time_hours: document.getElementById('air-transit')?.value ? parseFloat(document.getElementById('air-transit').value) : null,
            time_of_travel: document.getElementById('air-time')?.value || 'AM',
            lounges_access: document.getElementById('air-lounges')?.value === '1',
            estimated_cost: parseFloat(document.getElementById('air-cost')?.value) || 0.00,
            notes: document.getElementById('air-notes')?.value || null
        };

        const response = await api.createAirTravel(parseInt(packageId), formData);
        alert('Air travel entry created successfully!');
        
        // Reset form
        document.getElementById('air-travel-form')?.reset();
    } catch (error) {
        alert('Error creating air travel: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Submit Accommodation Form
 */
async function submitAccommodationForm() {
    try {
        const packageId = document.getElementById('acc-package-id')?.value;
        if (!packageId) {
            alert('Please enter a Package ID');
            return;
        }

        const formData = {
            accommodation_type: document.getElementById('acc-type')?.value,
            country: document.getElementById('acc-country')?.value,
            city: document.getElementById('acc-city')?.value,
            number_of_bedrooms: parseInt(document.getElementById('acc-bedrooms')?.value),
            star_rating: document.getElementById('acc-star-rating')?.value ? parseInt(document.getElementById('acc-star-rating').value) : null,
            bed_type: document.getElementById('acc-bed-type')?.value || null,
            cost: parseFloat(document.getElementById('acc-cost')?.value),
            check_in_date: document.getElementById('acc-checkin')?.value,
            check_out_date: document.getElementById('acc-checkout')?.value,
            notes: document.getElementById('acc-notes')?.value || null
        };

        const response = await api.createAccommodation(parseInt(packageId), formData);
        alert('Accommodation created successfully!');
        
        // Reset form
        document.getElementById('accommodation-form')?.reset();
    } catch (error) {
        alert('Error creating accommodation: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Submit Tour Form
 */
async function submitTourForm() {
    try {
        const packageId = document.getElementById('tour-package-id')?.value;
        if (!packageId) {
            alert('Please enter a Package ID');
            return;
        }

        const formData = {
            tour_type: document.getElementById('tour-type')?.value,
            tour_number: document.getElementById('tour-number')?.value || null,
            number_of_transfers: parseInt(document.getElementById('tour-transfers')?.value) || 0,
            country: document.getElementById('tour-country')?.value,
            city: document.getElementById('tour-city')?.value,
            tour_description: document.getElementById('tour-description')?.value || null,
            cost: parseFloat(document.getElementById('tour-cost')?.value) || 0.00,
            tour_date: document.getElementById('tour-date')?.value || null,
            notes: document.getElementById('tour-notes')?.value || null
        };

        const response = await api.createTour(parseInt(packageId), formData);
        alert('Tour created successfully!');
        
        // Reset form
        document.getElementById('tour-form')?.reset();
    } catch (error) {
        alert('Error creating tour: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Submit Visa Form
 */
async function submitVisaForm() {
    try {
        const packageId = document.getElementById('visa-package-id')?.value;
        if (!packageId) {
            alert('Please enter a Package ID');
            return;
        }

        const formData = {
            visa_type: document.getElementById('visa-type')?.value,
            country: document.getElementById('visa-country')?.value,
            visa_status: document.getElementById('visa-status')?.value || 'Pending',
            cost: parseFloat(document.getElementById('visa-cost')?.value) || 0.00,
            special_notes: document.getElementById('visa-notes')?.value || null
        };

        const response = await api.createVisa(parseInt(packageId), formData);
        alert('Visa entry created successfully!');
        
        // Reset form
        document.getElementById('visa-form')?.reset();
    } catch (error) {
        alert('Error creating visa: ' + (error.message || 'Unknown error'));
    }
}

