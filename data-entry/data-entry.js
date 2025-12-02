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
        document.getElementById(dataType + '-form').classList.add('active');
    });
});

// Form validation example
document.querySelectorAll('form, .form-control').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value) {
            const msg = this.parentElement.querySelector('.validation-message');
            if (msg) {
                msg.classList.add('error');
            }
        }
    });
});

