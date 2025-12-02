// Data Entry Page JavaScript

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
        document.getElementById(formId).classList.add('active');
    });
});

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

