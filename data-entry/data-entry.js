// Data Entry Page JavaScript

// Timeline state management
const timelineState = {
    steps: {
        1: { name: 'Guest Info', status: 'pending', formId: 'guest-form' },
        2: { name: 'Package', status: 'pending', formId: 'package-form' },
        3: { name: 'Air Travel', status: 'pending', formId: 'air-travel-form' },
        4: { name: 'Accommodation', status: 'pending', formId: 'accommodation-form' },
        5: { name: 'Tour', status: 'pending', formId: 'tour-form' },
        6: { name: 'Visa', status: 'pending', formId: 'visa-form' }
    },
    currentStep: 1
};

// Total steps for data entry
const dataEntryTotalSteps = 6;

// Load timeline state from localStorage
function loadTimelineState() {
    const saved = localStorage.getItem('dataEntryTimelineState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(timelineState.steps, parsed.steps);
        timelineState.currentStep = parsed.currentStep || 1;
    } else {
        // Initialize fresh - start at step 1 like wizard
        timelineState.currentStep = 1;
    }
}

// Save timeline state to localStorage
function saveTimelineState() {
    localStorage.setItem('dataEntryTimelineState', JSON.stringify(timelineState));
}

// Check if a form is completed
function checkFormCompletion(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let allFilled = true;
    
    requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === '') {
            allFilled = false;
        }
    });
    
    return allFilled;
}

// Enable/disable form sections based on previous completion
function updateFormAccessibility() {
    const formOrder = ['guest-form', 'package-form', 'air-travel-form', 'accommodation-form', 'tour-form', 'visa-form'];
    
    formOrder.forEach((formId, index) => {
        const formSection = document.getElementById(formId);
        if (!formSection) return;
        
        // First section (Guest) is always accessible
        if (index === 0) {
            formSection.classList.remove('disabled');
            enableFormFields(formSection, true);
            return;
        }
        
        // Check if previous section is completed
        const previousFormId = formOrder[index - 1];
        const previousCompleted = checkFormCompletion(previousFormId);
        
        if (previousCompleted) {
            // Previous section is completed, enable this section
            formSection.classList.remove('disabled');
            enableFormFields(formSection, true);
        } else {
            // Previous section not completed, disable this section
            formSection.classList.add('disabled');
            enableFormFields(formSection, false);
        }
    });
}

// Enable or disable all form fields in a section
function enableFormFields(formSection, enabled) {
    const fields = formSection.querySelectorAll('input, select, textarea, button');
    fields.forEach(field => {
        if (enabled) {
            field.removeAttribute('disabled');
            field.style.pointerEvents = 'auto';
        } else {
            field.setAttribute('disabled', 'disabled');
            field.style.pointerEvents = 'none';
        }
    });
}

// Update timeline visual state - for vertical timeline
function updateTimeline() {
    let completedSteps = 0;
    const totalSteps = dataEntryTotalSteps;
    
    // Determine current step based on which section is in view or has focus
    let currentStepNum = 1;
    const formSections = ['guest-form', 'package-form', 'air-travel-form', 'accommodation-form', 'tour-form', 'visa-form'];
    
    // Check which section has active focus or is most completed
    formSections.forEach((formId, index) => {
        const form = document.getElementById(formId);
        if (form) {
            const activeElement = document.activeElement;
            if (form.contains(activeElement)) {
                currentStepNum = index + 1;
            }
        }
    });
    
    timelineState.currentStep = currentStepNum;
    
    const formOrder = ['guest-form', 'package-form', 'air-travel-form', 'accommodation-form', 'tour-form', 'visa-form'];
    
    Object.keys(timelineState.steps).forEach(stepNum => {
        const step = timelineState.steps[stepNum];
        const timelineStep = document.querySelector(`.timeline-step-vertical[data-step="${stepNum}"]`);
        
        if (!timelineStep) return;
        
        // Remove all status classes
        timelineStep.classList.remove('finished', 'ongoing', 'pending', 'locked');
        
        // Check if this section is accessible
        const stepNumInt = parseInt(stepNum);
        const isAccessible = stepNumInt === 1 || checkFormCompletion(formOrder[stepNumInt - 2]);
        
        // Check form completion
        const isCompleted = checkFormCompletion(step.formId);
        
        if (!isAccessible) {
            // Section is locked - previous section not completed
            timelineStep.classList.add('locked');
            step.status = 'locked';
        } else if (isCompleted) {
            timelineStep.classList.add('finished');
            step.status = 'completed';
            completedSteps++;
        } else if (stepNumInt === currentStepNum) {
            timelineStep.classList.add('ongoing');
            step.status = 'in_progress';
            // Count current step as partially complete if it has some fields filled
            const form = document.getElementById(step.formId);
            if (form) {
                const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
                const filledFields = Array.from(requiredFields).filter(field => {
                    if (field.type === 'checkbox') return field.checked;
                    return field.value && field.value.trim() !== '';
                });
                const totalRequired = requiredFields.length;
                if (filledFields.length > 0 && totalRequired > 0) {
                    completedSteps += (filledFields.length / totalRequired) * 0.5; // Partial credit
                }
            }
        } else {
            timelineStep.classList.add('pending');
            step.status = 'pending';
        }
    });
    
    // Update progress bar fill - vertical timeline uses height
    const progressPercentage = Math.min((completedSteps / totalSteps) * 100, 100);
    
    const progressFill = document.getElementById('timeline-progress-fill');
    if (progressFill) {
        // Check if we're on mobile (horizontal) or desktop (vertical)
        const isVertical = window.innerWidth > 1024;
        if (isVertical) {
            progressFill.style.height = progressPercentage + '%';
        } else {
            progressFill.style.width = progressPercentage + '%';
        }
    }
    
    // Update form accessibility based on completion
    updateFormAccessibility();
    
    saveTimelineState();
}

// Navigate to timeline step - scroll to corresponding form section
function navigateToTimelineStep(stepNum) {
    const step = timelineState.steps[stepNum];
    if (!step) return;
    
    const formElement = document.getElementById(step.formId);
    if (!formElement) return;
    
    // Check if this section is accessible (previous sections completed)
    const formOrder = ['guest-form', 'package-form', 'air-travel-form', 'accommodation-form', 'tour-form', 'visa-form'];
    const currentIndex = formOrder.indexOf(step.formId);
    
    if (currentIndex > 0) {
        const previousFormId = formOrder[currentIndex - 1];
        const previousCompleted = checkFormCompletion(previousFormId);
        
        if (!previousCompleted) {
            alert('Please complete the previous section first');
            return;
        }
    }
    
    timelineState.currentStep = parseInt(stepNum);
    
    // Scroll to the corresponding form section
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus first input in the section
        const firstInput = formElement.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 500);
        }
    }
    
    updateTimeline();
}

// Make timeline steps clickable
function initializeTimeline() {
    document.querySelectorAll('.timeline-step-vertical').forEach(step => {
        step.style.cursor = 'pointer';
        step.addEventListener('click', () => {
            const stepNum = step.getAttribute('data-step');
            navigateToTimelineStep(stepNum);
        });
    });
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

// Form validation and timeline updates
document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
        // Update timeline and form accessibility when field changes
        updateTimeline();
        updateFormAccessibility();
    });
    
    input.addEventListener('input', function() {
        if (this.classList.contains('error') && this.value) {
            this.classList.remove('error');
        }
        // Update timeline and form accessibility in real-time
        updateTimeline();
        updateFormAccessibility();
    });
    
    input.addEventListener('change', function() {
        // Update timeline and form accessibility when select/dropdown changes
        updateTimeline();
        updateFormAccessibility();
    });
    
    input.addEventListener('focus', function() {
        // Update timeline when user focuses on a field
        updateTimeline();
    });
});

// Update timeline on scroll to detect which section is in view
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        updateTimeline();
    }, 100);
});

// Initialize timeline on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTimelineState();
    initializeTimeline();
    
    // Match wizard: HTML shows step 1 as finished and step 2 as ongoing initially
    // But JavaScript will correct this based on actual state
    // The guest form is active by default in HTML, so we start at step 1
    if (!localStorage.getItem('dataEntryTimelineState')) {
        timelineState.currentStep = 1;
    }
    
    // Initial timeline update - JavaScript will set correct state
    updateTimeline();
    
    // Initial form accessibility update
    updateFormAccessibility();
    
    // Initialize form submission handlers
    initializeFormSubmissions();
});

// Initialize form submission handlers
function initializeFormSubmissions() {
    // Save button - saves all completed forms sequentially
    document.getElementById('saveBtn').addEventListener('click', async () => {
        await saveAllForms();
    });
    
    // Save & Add Another button
    document.getElementById('saveAndAddAnotherBtn').addEventListener('click', async () => {
        await saveAllForms(true);
    });
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            window.location.href = '../index.html';
        }
    });
}

// Save all forms sequentially
async function saveAllForms(addAnother = false) {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        let guestId = null;
        let packageId = null;
        
        // Step 1: Save Guest
        if (checkFormCompletion('guest-form')) {
            const guestData = {
                full_name: document.getElementById('guest-name').value,
                phone_number: document.getElementById('guest-phone').value,
                country_of_residence: document.getElementById('guest-country').value,
                passport_image_path: null // Would be set if file upload was implemented
            };
            
            const guestResponse = await api.createGuest(guestData);
            if (guestResponse.success) {
                guestId = guestResponse.data.guest_id;
                console.log('✅ Guest created:', guestId);
            } else {
                throw new Error('Failed to create guest: ' + guestResponse.message);
            }
        } else {
            throw new Error('Please complete the Guest form first');
        }
        
        // Step 2: Save Package
        if (checkFormCompletion('package-form') && guestId) {
            const packageData = {
                guest_id: guestId,
                package_name: document.getElementById('package-name').value || null
            };
            
            const packageResponse = await api.createPackage(packageData);
            if (packageResponse.success) {
                packageId = packageResponse.data.package_id;
                console.log('✅ Package created:', packageId);
            } else {
                throw new Error('Failed to create package: ' + packageResponse.message);
            }
        } else if (guestId) {
            throw new Error('Please complete the Package form');
        }
        
        // Step 3: Save Air Travel (if completed)
        if (checkFormCompletion('air-travel-form') && packageId) {
            const airTravelData = {
                departure_country: document.getElementById('air-dep-country').value,
                departure_city: document.getElementById('air-dep-city').value,
                departure_airport: document.getElementById('air-dep-airport').value,
                destination_country: document.getElementById('air-dest-country').value,
                destination_city: document.getElementById('air-dest-city').value,
                destination_airport: document.getElementById('air-dest-airport').value,
                preferred_airline: document.getElementById('air-airline').value || null,
                number_of_adults: parseInt(document.getElementById('air-adults').value) || 0,
                number_of_children: parseInt(document.getElementById('air-children').value) || 0,
                number_of_infants: parseInt(document.getElementById('air-infants').value) || 0,
                departure_date: document.getElementById('air-dep-date').value,
                trip_duration_days: parseInt(document.getElementById('air-days').value) || 0,
                trip_duration_nights: parseInt(document.getElementById('air-nights').value) || 0,
                transit_time_hours: parseFloat(document.getElementById('air-transit').value) || null,
                time_of_travel: document.getElementById('air-time').value || 'AM',
                lounges_access: document.getElementById('air-lounges').checked || false,
                estimated_cost: parseFloat(document.getElementById('air-cost').value) || 0.00,
                notes: document.getElementById('air-notes').value || null
            };
            
            const airTravelResponse = await api.createAirTravel(packageId, airTravelData);
            if (airTravelResponse.success) {
                console.log('✅ Air travel created');
            } else {
                console.warn('⚠️ Failed to create air travel:', airTravelResponse.message);
            }
        }
        
        // Step 4: Save Accommodation (if completed)
        if (checkFormCompletion('accommodation-form') && packageId) {
            const accommodationData = {
                accommodation_type: document.getElementById('acc-type').value,
                country: document.getElementById('acc-country').value,
                city: document.getElementById('acc-city').value,
                number_of_bedrooms: parseInt(document.getElementById('acc-bedrooms').value) || 1,
                star_rating: document.getElementById('acc-star-rating').value || null,
                bed_type: document.getElementById('acc-bed-type').value || null,
                cost: parseFloat(document.getElementById('acc-cost').value) || 0.00,
                check_in_date: document.getElementById('acc-checkin').value,
                check_out_date: document.getElementById('acc-checkout').value,
                notes: document.getElementById('acc-notes').value || null
            };
            
            const accResponse = await api.createAccommodation(packageId, accommodationData);
            if (accResponse.success) {
                console.log('✅ Accommodation created');
            } else {
                console.warn('⚠️ Failed to create accommodation:', accResponse.message);
            }
        }
        
        // Step 5: Save Tour (if completed)
        if (checkFormCompletion('tour-form') && packageId) {
            const tourData = {
                tour_type: document.getElementById('tour-type').value,
                tour_number: document.getElementById('tour-number').value || null,
                number_of_transfers: parseInt(document.getElementById('tour-transfers').value) || 0,
                country: document.getElementById('tour-country').value,
                city: document.getElementById('tour-city').value,
                tour_description: document.getElementById('tour-description').value || null,
                cost: parseFloat(document.getElementById('tour-cost').value) || 0.00,
                tour_date: document.getElementById('tour-date').value || null,
                notes: document.getElementById('tour-notes').value || null
            };
            
            const tourResponse = await api.createTour(packageId, tourData);
            if (tourResponse.success) {
                console.log('✅ Tour created');
            } else {
                console.warn('⚠️ Failed to create tour:', tourResponse.message);
            }
        }
        
        // Step 6: Save Visa (if completed)
        if (checkFormCompletion('visa-form') && packageId) {
            const visaData = {
                visa_type: document.getElementById('visa-type').value,
                country: document.getElementById('visa-country').value,
                visa_status: document.getElementById('visa-status').value,
                cost: parseFloat(document.getElementById('visa-cost').value) || 0.00,
                special_notes: document.getElementById('visa-notes').value || null
            };
            
            const visaResponse = await api.createVisa(packageId, visaData);
            if (visaResponse.success) {
                console.log('✅ Visa created');
            } else {
                console.warn('⚠️ Failed to create visa:', visaResponse.message);
            }
        }
        
        alert(`Data saved successfully!${packageId ? ` Package ID: ${packageId}` : ''}`);
        
        if (addAnother) {
            // Reset forms for adding another entry
            document.querySelectorAll('form input, form select, form textarea').forEach(field => {
                if (field.type !== 'button' && field.type !== 'submit') {
                    field.value = '';
                }
            });
            // Reset to first step
            timelineState.currentStep = 1;
            updateTimeline();
        } else {
            // Optionally redirect to package management
            // window.location.href = '../package-management/package-management.html';
        }
        
    } catch (error) {
        console.error('Error saving forms:', error);
        alert('Error saving data: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

