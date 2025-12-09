// Login Page JavaScript

document.querySelector('.login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Disable button and show loading
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
        console.log('🔐 Attempting login...');
        const response = await api.login(username, password);
        
        if (response.success) {
            console.log('✅ Login successful:', response.data.user);
            
            // Store user data in sessionStorage (or localStorage if remember me)
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(response.data.user));
            storage.setItem('token', response.data.token || '');
            
            // Show success message
            alert('Login successful! Welcome, ' + response.data.user.full_name);
            
            // Redirect to dashboard
            window.location.href = '../dashboard/dashboard.html';
        } else {
            throw new Error(response.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('Login failed: ' + (error.message || 'Invalid username or password'));
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

