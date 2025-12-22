// Wizard Page JavaScript

let currentStep = 1;
const totalSteps = 7;

// Timeline state for wizard
const wizardTimelineState = {
    steps: {
        1: { name: 'Guest Info', status: 'pending' },
        2: { name: 'Package', status: 'pending' },
        3: { name: 'Air Travel', status: 'pending' },
        4: { name: 'Accommodation', status: 'pending' },
        5: { name: 'Tours', status: 'pending' },
        6: { name: 'Visas', status: 'pending' },
        7: { name: 'Confirmation', status: 'pending' }
    }
};

// Load wizard timeline state from localStorage
function loadWizardTimelineState() {
    const saved = localStorage.getItem('wizardTimelineState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(wizardTimelineState.steps, parsed.steps);
    }
}

// Save wizard timeline state to localStorage
function saveWizardTimelineState() {
    localStorage.setItem('wizardTimelineState', JSON.stringify(wizardTimelineState));
}

// Check if a wizard step is completed
function checkWizardStepCompletion(stepNum) {
    const stepSection = document.getElementById(`step${stepNum}`);
    if (!stepSection) {
        console.warn(`⚠️ Step section ${stepNum} not found`);
        return false;
    }
    
    const requiredFields = stepSection.querySelectorAll('input[required], select[required], textarea[required]');
    if (requiredFields.length === 0) {
        // No required fields, consider it complete
        return true;
    }
    
    let allFilled = true;
    
    requiredFields.forEach(field => {
        if (field.type === 'checkbox') {
            // For confirmation checkbox, it's optional until final step
            if (stepNum === totalSteps && !field.checked) {
                allFilled = false;
            }
        } else if (!field.value || field.value.trim() === '') {
            allFilled = false;
        }
    });
    
    return allFilled;
}

// Update timeline visual state
function updateWizardTimeline() {
    let completedSteps = 0;
    const totalSteps = Object.keys(wizardTimelineState.steps).length;
    
    Object.keys(wizardTimelineState.steps).forEach(stepNum => {
        const step = wizardTimelineState.steps[stepNum];
        const timelineStep = document.querySelector(`.timeline-step[data-step="${stepNum}"]`);
        
        if (!timelineStep) return;
        
        // Remove all status classes
        timelineStep.classList.remove('finished', 'ongoing', 'pending', 'locked');
        
        const stepNumInt = parseInt(stepNum);
        const isCompleted = checkWizardStepCompletion(stepNumInt);
        
        // Check if previous steps are completed (for locking)
        let isAccessible = true;
        if (stepNumInt > 1) {
            for (let i = 1; i < stepNumInt; i++) {
                if (!checkWizardStepCompletion(i)) {
                    isAccessible = false;
                    break;
                }
            }
        }
        
        if (!isAccessible) {
            // Step is locked - previous steps not completed
            timelineStep.classList.add('locked');
            step.status = 'locked';
        } else if (stepNumInt < currentStep) {
            // Previous step - should be finished if completed
            if (isCompleted) {
                timelineStep.classList.add('finished');
                step.status = 'completed';
                completedSteps++;
            } else {
                // Previous step not completed - this shouldn't happen if validation works
                timelineStep.classList.add('pending');
                step.status = 'pending';
            }
        } else if (stepNumInt === currentStep) {
            // Current step - THIS IS THE KEY LOGIC
            console.log(`   Step ${stepNumInt} is current step, completed: ${isCompleted}`);
            if (isCompleted) {
                // Current step is completed - show as finished (ready to move to next)
                timelineStep.classList.add('finished');
                step.status = 'completed';
                completedSteps++;
                console.log(`   ✅ Step ${stepNumInt} marked as finished`);
            } else {
                // Current step in progress - MUST show as ongoing
                timelineStep.classList.add('ongoing');
                step.status = 'in_progress';
                console.log(`   ✅ Step ${stepNumInt} marked as ongoing`);
                // Partial credit for current step
                const stepSection = document.getElementById(`step${stepNumInt}`);
                if (stepSection) {
                    const filledFields = stepSection.querySelectorAll('input[required]:not([value=""]), select[required]:not([value=""]), textarea[required]:not(:empty)');
                    const totalRequired = stepSection.querySelectorAll('input[required], select[required], textarea[required]').length;
                    if (filledFields.length > 0 && totalRequired > 0) {
                        completedSteps += (filledFields.length / totalRequired) * 0.5; // Partial credit
                    }
                }
            }
        } else if (stepNumInt > currentStep) {
            // Future step - check if it should be locked or accessible
            if (!isAccessible) {
                timelineStep.classList.add('locked');
                step.status = 'locked';
            } else {
                timelineStep.classList.add('pending');
                step.status = 'pending';
            }
        } else {
            // Fallback - should not happen
            timelineStep.classList.add('pending');
            step.status = 'pending';
        }
    });
    
    // Update progress bar fill
    const progressPercentage = Math.min((completedSteps / totalSteps) * 100, 100);
    const progressFill = document.getElementById('wizard-timeline-progress-fill');
    if (progressFill) {
        progressFill.style.width = progressPercentage + '%';
    }
    
    saveWizardTimelineState();
}

// Navigate to timeline step
function navigateToWizardTimelineStep(stepNum) {
    const stepNumInt = parseInt(stepNum);
    if (stepNumInt >= 1 && stepNumInt <= totalSteps) {
        // Check if previous steps are completed
        if (stepNumInt > 1) {
            // Check all previous steps are completed
            let allPreviousCompleted = true;
            for (let i = 1; i < stepNumInt; i++) {
                if (!checkWizardStepCompletion(i)) {
                    allPreviousCompleted = false;
                    break;
                }
            }
            
            if (!allPreviousCompleted) {
                alert('Please complete all previous steps before proceeding');
                return;
            }
        }
        
        // Allow navigation to this step
        updateStep(stepNumInt);
    }
}

// Make timeline steps clickable
function initializeWizardTimeline() {
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.addEventListener('click', () => {
            const stepNum = step.getAttribute('data-step');
            const stepNumInt = parseInt(stepNum);
            
            // Check if step is locked
            if (stepNumInt > 1) {
                let allPreviousCompleted = true;
                for (let i = 1; i < stepNumInt; i++) {
                    if (!checkWizardStepCompletion(i)) {
                        allPreviousCompleted = false;
                        break;
                    }
                }
                
                if (!allPreviousCompleted) {
                    step.style.cursor = 'not-allowed';
                    return;
                }
            }
            
            step.style.cursor = 'pointer';
            navigateToWizardTimelineStep(stepNum);
        });
    });
}

function updateStep(step) {
    // Check if we can navigate to this step
    if (step > 1) {
        // Verify all previous steps are completed
        let allPreviousCompleted = true;
        for (let i = 1; i < step; i++) {
            if (!checkWizardStepCompletion(i)) {
                allPreviousCompleted = false;
                break;
            }
        }
        
        if (!allPreviousCompleted) {
            alert('Please complete all previous steps before proceeding');
            return;
        }
    }
    
    currentStep = step;
    
    // Update progress bar (simple step-based progress)
    const progress = ((step - 1) / totalSteps) * 100;
    const progressFillEl = document.getElementById('progressFill');
    if (progressFillEl) {
        progressFillEl.style.width = progress + '%';
    }
    
    // Update step indicators (numbered steps below timeline)
    document.querySelectorAll('.step').forEach((s, index) => {
        const stepNum = index + 1;
        s.classList.remove('active', 'completed');
        if (stepNum < step) {
            s.classList.add('completed');
        } else if (stepNum === step) {
            s.classList.add('active');
        }
    });
    
    // Update step content visibility - show only current step
    document.querySelectorAll('.step-section').forEach((section, index) => {
        const stepNum = index + 1;
        if (stepNum === step) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Update buttons
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (backBtn) {
        backBtn.style.display = step > 1 ? 'inline-block' : 'none';
    }
    if (nextBtn) {
        nextBtn.textContent = step === totalSteps ? 'Submit' : 'Next';
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }
    
    // Update timeline (this handles the visual timeline with colors)
    updateWizardTimeline();
    
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

document.getElementById('nextBtn').addEventListener('click', async () => {
    // Validate current step before proceeding
    const currentSection = document.querySelector('.step-section.active');
    if (!currentSection) return;
    
    const requiredFields = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    requiredFields.forEach(field => {
        if (field.type === 'checkbox') {
            // For final step, checkbox is required
            if (currentStep === totalSteps && !field.checked) {
                field.classList.add('error');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = field;
            }
            return;
        }
        if (!field.value || field.value.trim() === '') {
            field.classList.add('error');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = field;
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields before proceeding');
        // Scroll to first invalid field
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        return;
    }
    
    // Verify step is actually completed (double check)
    if (!checkWizardStepCompletion(currentStep)) {
        alert('Please complete all required fields in this step');
        return;
    }
    
    // Mark current step as completed
    if (wizardTimelineState.steps[currentStep]) {
        wizardTimelineState.steps[currentStep].status = 'completed';
    }
    
    if (currentStep < totalSteps) {
        updateStep(currentStep + 1);
    } else {
        // Check confirmation checkbox for final step
        if (!document.getElementById('wiz-confirm').checked) {
            alert('Please confirm that all information is correct');
            document.getElementById('wiz-confirm').focus();
            return;
        }
        // Mark final step as completed
        wizardTimelineState.steps[currentStep].status = 'completed';
        updateWizardTimeline();
        
        // Submit wizard data to API
        await submitWizardData();
    }
});

document.getElementById('backBtn').addEventListener('click', () => {
    if (currentStep > 1) {
        updateStep(currentStep - 1);
    }
});

// Generic function to load saved values from localStorage
function loadSavedValues(storageKey, datalistId) {
    const savedValues = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const datalist = document.getElementById(datalistId);
    if (datalist) {
        datalist.innerHTML = savedValues.map(value => 
            `<option value="${escapeHtml(value)}">`
        ).join('');
    }
    return savedValues;
}

// Generic function to save value to localStorage
function saveValue(storageKey, value, datalistId, maxItems = 50) {
    if (!value || value.trim() === '') return;
    
    const savedValues = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const valueTrimmed = value.trim();
    
    // Check if value already exists (case-insensitive)
    if (!savedValues.some(v => v.toLowerCase() === valueTrimmed.toLowerCase())) {
        savedValues.unshift(valueTrimmed); // Add to beginning
        // Keep only last maxItems
        if (savedValues.length > maxItems) {
            savedValues.pop();
        }
        localStorage.setItem(storageKey, JSON.stringify(savedValues));
        if (datalistId) {
            loadSavedValues(storageKey, datalistId); // Reload datalist
        }
    }
}

// Initialize default values if not already in localStorage
function initializeDefaultValues() {
    // Default countries
    if (!localStorage.getItem('savedCountries')) {
        const defaultCountries = [
            'Oman', 'Egypt', 'Russia', 'Indonesia', 'Thailand'
        ];
        localStorage.setItem('savedCountries', JSON.stringify(defaultCountries));
    }
    
    // Default cities
    if (!localStorage.getItem('savedCities')) {
        const defaultCities = [
            'Muscat', // Oman
            'Cairo', // Egypt
            'Moscow', // Russia
            'Jakarta', 'Bali', 'Yogyakarta', 'Surabaya', // Indonesia
            'Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya' // Thailand
        ];
        localStorage.setItem('savedCities', JSON.stringify(defaultCities));
    }
    
    // Default airports
    if (!localStorage.getItem('savedAirports')) {
        const defaultAirports = [
            'Muscat International Airport', 'Seeb International Airport', // Oman
            'Cairo International Airport', // Egypt
            'Moscow Sheremetyevo Airport', 'Moscow Domodedovo Airport', // Russia
            'Jakarta Soekarno-Hatta Airport', 'Ngurah Rai International Airport', // Indonesia
            'Suvarnabhumi Airport', 'Don Mueang International Airport', 'Phuket International Airport' // Thailand
        ];
        localStorage.setItem('savedAirports', JSON.stringify(defaultAirports));
    }
    
    // Default airlines
    if (!localStorage.getItem('savedAirlines')) {
        const defaultAirlines = [
            'Salam Air',
            'Oman Air',
            'Turkish Airlines',
            'Pegasus Airlines',
            'Middle East Airlines'
        ];
        localStorage.setItem('savedAirlines', JSON.stringify(defaultAirlines));
    }
    
    // Default visa types
    if (!localStorage.getItem('savedVisaTypes')) {
        const defaultVisaTypes = [
            'Tourist Visa',
            'Business Visa',
            'Transit Visa',
            'Work Visa',
            'Student Visa',
            'Visit Visa',
            'Multiple Entry Visa',
            'Single Entry Visa'
        ];
        localStorage.setItem('savedVisaTypes', JSON.stringify(defaultVisaTypes));
    }
}

// Load all saved values on page load
function loadAllSavedValues() {
    // Initialize defaults first if needed
    initializeDefaultValues();
    
    // Then load all values
    loadSavedValues('savedCountries', 'country-list');
    loadSavedValues('savedCities', 'city-list');
    loadSavedValues('savedAirports', 'airport-list');
    loadSavedValues('savedAirlines', 'airline-list');
    loadSavedValues('savedVisaTypes', 'visa-type-list');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Submit wizard data to API
async function submitWizardData() {
    const submitBtn = document.getElementById('nextBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Save all reusable values to localStorage before submission
        const guestCountry = document.getElementById('wiz-guest-country').value;
        const depCountry = document.getElementById('wiz-air-dep-country').value;
        const depCity = document.getElementById('wiz-air-dep-city').value;
        const depAirport = document.getElementById('wiz-air-dep-airport').value;
        const destCountry = document.getElementById('wiz-air-dest-country').value;
        const destCity = document.getElementById('wiz-air-dest-city').value;
        const destAirport = document.getElementById('wiz-air-dest-airport').value;
        const airline = document.getElementById('wiz-air-airline').value;
        const accCountry = document.getElementById('wiz-acc-country').value;
        const accCity = document.getElementById('wiz-acc-city').value;
        const tourCountry = document.getElementById('wiz-tour-country').value;
        const tourCity = document.getElementById('wiz-tour-city').value;
        const visaCountry = document.getElementById('wiz-visa-country').value;
        
        // Save all values
        saveValue('savedCountries', guestCountry, 'country-list');
        saveValue('savedCountries', depCountry, 'country-list');
        saveValue('savedCountries', destCountry, 'country-list');
        saveValue('savedCountries', accCountry, 'country-list');
        saveValue('savedCountries', tourCountry, 'country-list');
        saveValue('savedCountries', visaCountry, 'country-list');
        saveValue('savedCities', depCity, 'city-list');
        saveValue('savedCities', destCity, 'city-list');
        
        // Save visa type
        const visaType = document.getElementById('wiz-visa-type').value;
        if (visaType) {
            saveValue('savedVisaTypes', visaType, 'visa-type-list');
        }
        saveValue('savedCities', accCity, 'city-list');
        saveValue('savedCities', tourCity, 'city-list');
        saveValue('savedAirports', depAirport, 'airport-list');
        saveValue('savedAirports', destAirport, 'airport-list');
        if (airline) {
            saveValue('savedAirlines', airline, 'airline-list');
        }
        
        // Collect all form data
        const wizardData = {
            guest: {
                full_name: document.getElementById('wiz-guest-name').value,
                phone_number: document.getElementById('wiz-guest-phone').value,
                country_of_residence: guestCountry,
                passport_image_path: null // Would be set if file upload was implemented
            },
            package_name: document.getElementById('wiz-package-name').value || null,
            air_travel: {
                departure_country: depCountry,
                departure_city: depCity,
                departure_airport: depAirport,
                destination_country: destCountry,
                destination_city: destCity,
                destination_airport: destAirport,
                preferred_airline: airline || null,
                number_of_adults: parseInt(document.getElementById('wiz-air-adults').value) || 0,
                number_of_children: parseInt(document.getElementById('wiz-air-children').value) || 0,
                number_of_infants: parseInt(document.getElementById('wiz-air-infants').value) || 0,
                departure_date: document.getElementById('wiz-air-dep-date').value,
                trip_duration_days: parseInt(document.getElementById('wiz-air-days').value) || 0,
                trip_duration_nights: parseInt(document.getElementById('wiz-air-nights').value) || 0,
                transit_time_hours: parseFloat(document.getElementById('wiz-air-transit').value) || null,
                time_of_travel: document.getElementById('wiz-air-time').value || 'AM',
                lounges_access: document.getElementById('wiz-air-lounges').checked || false,
                estimated_cost: parseFloat(document.getElementById('wiz-air-cost').value) || 0.00,
                notes: document.getElementById('wiz-air-notes').value || null
            },
            accommodations: [{
                accommodation_type: document.getElementById('wiz-acc-type').value,
                country: accCountry,
                city: accCity,
                number_of_bedrooms: parseInt(document.getElementById('wiz-acc-bedrooms').value) || 1,
                star_rating: document.getElementById('wiz-acc-star-rating').value || null,
                bed_type: document.getElementById('wiz-acc-bed-type').value || null,
                cost: parseFloat(document.getElementById('wiz-acc-cost').value) || 0.00,
                check_in_date: document.getElementById('wiz-acc-checkin').value,
                check_out_date: document.getElementById('wiz-acc-checkout').value,
                notes: document.getElementById('wiz-acc-notes').value || null
            }],
            tours: [{
                tour_type: document.getElementById('wiz-tour-type').value,
                tour_number: document.getElementById('wiz-tour-number').value || null,
                number_of_transfers: parseInt(document.getElementById('wiz-tour-transfers').value) || 0,
                country: tourCountry,
                city: tourCity,
                tour_description: document.getElementById('wiz-tour-description').value || null,
                cost: parseFloat(document.getElementById('wiz-tour-cost').value) || 0.00,
                tour_date: document.getElementById('wiz-tour-date').value || null,
                notes: document.getElementById('wiz-tour-notes').value || null
            }],
            visas: [{
                visa_type: document.getElementById('wiz-visa-type').value,
                country: visaCountry,
                visa_status: document.getElementById('wiz-visa-status').value,
                cost: parseFloat(document.getElementById('wiz-visa-cost').value) || 0.00,
                special_notes: document.getElementById('wiz-visa-notes').value || null
            }]
        };
        
        // Submit to API
        const response = await api.createPackageWizard(wizardData);
        
        if (response.success) {
            const createdPackageId = response.data.package_id;
            
            // Store package ID in sessionStorage for quotation page access
            sessionStorage.setItem('wizardPackageId', createdPackageId);
            
            // Clear timeline state after successful submission
            localStorage.removeItem('wizardTimelineState');
            
            // Redirect to quotation page
            window.location.href = `../quotation/quotation.html?package_id=${createdPackageId}`;
        } else {
            throw new Error(response.message || 'Failed to create package');
        }
    } catch (error) {
        console.error('Error submitting wizard data:', error);
        alert('Error creating package: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Form validation and timeline updates
function setupFormListeners() {
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
            // Update timeline when field changes
            updateWizardTimeline();
            // Check if current step is now complete and update button state
            checkCurrentStepCompletion();
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error') && this.value) {
                this.classList.remove('error');
            }
            // Update timeline in real-time (debounced)
            clearTimeout(window.timelineUpdateTimeout);
            window.timelineUpdateTimeout = setTimeout(() => {
                updateWizardTimeline();
                checkCurrentStepCompletion();
            }, 200);
        });
        
        input.addEventListener('change', function() {
            // Update timeline when select/dropdown changes
            updateWizardTimeline();
            // Check if current step is now complete
            checkCurrentStepCompletion();
        });
    });
}

// Accommodation type change handler - show/hide hotel-specific fields
function setupAccommodationTypeHandler() {
    const accTypeSelect = document.getElementById('wiz-acc-type');
    if (accTypeSelect) {
        accTypeSelect.addEventListener('change', function() {
            const hotelFields = document.getElementById('wiz-acc-hotel-fields');
            
            if (this.value === 'Hotel') {
                if (hotelFields) hotelFields.style.display = 'flex';
            } else {
                if (hotelFields) hotelFields.style.display = 'none';
                const starRating = document.getElementById('wiz-acc-star-rating');
                const bedType = document.getElementById('wiz-acc-bed-type');
                if (starRating) starRating.value = '';
                if (bedType) bedType.value = '';
            }
        });
    }
}

// Check if current step is completed and provide visual feedback
function checkCurrentStepCompletion() {
    const isCompleted = checkWizardStepCompletion(currentStep);
    const nextBtn = document.getElementById('nextBtn');
    
    // Update timeline immediately when step becomes completed
    if (isCompleted) {
        // Mark current step as completed in timeline state
        if (wizardTimelineState.steps[currentStep]) {
            wizardTimelineState.steps[currentStep].status = 'completed';
        }
        // Update timeline visual state
        updateWizardTimeline();
        // Step is complete - button is ready
        nextBtn.style.opacity = '1';
    } else {
        // Step not complete - button still works but will show validation error
        nextBtn.style.opacity = '1';
        // Still update timeline to show progress
        updateWizardTimeline();
        
        // CRITICAL: Force current step to show as ongoing if not completed
        const currentTimelineStep = document.querySelector(`.timeline-step[data-step="${currentStep}"]`);
        if (currentTimelineStep) {
            if (!currentTimelineStep.classList.contains('ongoing') && !currentTimelineStep.classList.contains('finished')) {
                currentTimelineStep.classList.remove('pending', 'locked');
                currentTimelineStep.classList.add('ongoing');
                console.log(`✅ Fixed: Step ${currentStep} timeline set to ongoing`);
            }
        }
    }
}

// Initialize wizard timeline on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Initializing wizard...');
    
    // Load all saved values for autocomplete
    loadAllSavedValues();
    
    // Set initial step FIRST - always start at step 1
    currentStep = 1;
    
    // Make sure step 1 is visible immediately
    const step1 = document.getElementById('step1');
    if (step1) {
        step1.classList.add('active');
    }
    
    // Load saved state if any (but don't let it override currentStep on first load)
    loadWizardTimelineState();
    
    // Setup form listeners
    setupFormListeners();
    
    // Setup accommodation type handler
    setupAccommodationTypeHandler();
    
    // Make timeline steps clickable
    initializeWizardTimeline();
    
    // Initialize UI to step 1 - this updates step indicators and buttons
    updateStep(1);
    
    // CRITICAL: Force timeline update to show step 1 as "ongoing"
    // This must happen AFTER updateStep to ensure currentStep is set
    updateWizardTimeline();
    
    // FORCE step 1 to be ongoing - do this IMMEDIATELY and REPEATEDLY
    function forceStep1Ongoing() {
        const step1Timeline = document.querySelector('.timeline-step[data-step="1"]');
        if (step1Timeline && currentStep === 1) {
            // Remove ALL status classes
            step1Timeline.classList.remove('finished', 'pending', 'locked');
            // Force add ongoing class
            step1Timeline.classList.add('ongoing');
            return true;
        }
        return false;
    }
    
    // Try immediately
    forceStep1Ongoing();
    
    // Try after a short delay
    setTimeout(() => {
        forceStep1Ongoing();
        updateWizardTimeline();
    }, 100);
    
    // Try again after longer delay
    setTimeout(() => {
        forceStep1Ongoing();
        updateWizardTimeline();
        console.log('✅ Final check - Step 1 ongoing:', document.querySelector('.timeline-step[data-step="1"]')?.classList.contains('ongoing'));
    }, 500);
    
    // Check current step completion status
    checkCurrentStepCompletion();
    
    console.log('✅ Wizard initialized - Current step:', currentStep);
    console.log('✅ Step 1 visible:', document.getElementById('step1')?.classList.contains('active'));
});

