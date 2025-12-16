// Login Page JavaScript

document.querySelector('.login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a real application, this would handle authentication
    window.location.href = '../dashboard/dashboard.html';
});

