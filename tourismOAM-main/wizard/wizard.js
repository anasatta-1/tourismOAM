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
        alert('Travel package created successfully!');
        // In real app, this would submit the form
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

