// Wizard Page JavaScript

let currentStep = 1;
const totalSteps = 5;

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
}

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentStep < totalSteps) {
        updateStep(currentStep + 1);
    } else {
        alert('Destination created successfully!');
        // In real app, this would submit the form
    }
});

document.getElementById('backBtn').addEventListener('click', () => {
    if (currentStep > 1) {
        updateStep(currentStep - 1);
    }
});

// Highlight input
document.getElementById('highlightInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
            const container = document.getElementById('highlightsContainer');
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${value} <span class="remove">×</span>`;
            tag.querySelector('.remove').addEventListener('click', () => tag.remove());
            container.appendChild(tag);
            e.target.value = '';
        }
    }
});

// Remove existing highlights
document.querySelectorAll('.tag .remove').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.remove());
});

