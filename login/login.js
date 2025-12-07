// Login Page JavaScript with bcrypt authentication

document.querySelector('.login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const loginButton = document.querySelector('.login-button');
    const originalButtonText = loginButton.textContent;
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    // Disable button and show loading
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    try {
        // Call authentication API
        const response = await api.login(username, password);
        
        if (response.success && response.data.user) {
            // Store user data in sessionStorage or localStorage
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(response.data.user));
            storage.setItem('isAuthenticated', 'true');
            
            // Show success message
            showSuccess('Login successful! Redirecting...');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = '../dashboard/dashboard.html';
            }, 500);
        } else {
            showError(response.message || 'Login failed');
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
        loginButton.disabled = false;
        loginButton.textContent = originalButtonText;
    }
});

function showError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #ff6b6b; background: #ffe0e0; padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center;';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.login-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Remove existing messages
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = 'color: #2d5a4f; background: #d4edda; padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center;';
    successDiv.textContent = message;
    
    const form = document.querySelector('.login-form');
    form.insertBefore(successDiv, form.firstChild);
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', function() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
        // Optionally redirect if already logged in
        // window.location.href = '../dashboard/dashboard.html';
    }
});

