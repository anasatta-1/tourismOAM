/**
 * Common JavaScript Functions
 * Shared across all pages
 */

// Logout function
function logout() {
    // Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    
    // Redirect to login
    window.location.href = '../login/login.html';
}

// Add logout functionality to profile menu
function setupLogout() {
    const profileMenu = document.querySelector('.profile-menu');
    if (profileMenu && !profileMenu.querySelector('.logout-btn')) {
        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.style.cssText = 'margin-left: 1rem; padding: 0.5rem 1rem; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;';
        logoutBtn.onclick = logout;
        
        // Add click handler to profile menu for dropdown (optional)
        profileMenu.style.cursor = 'pointer';
        profileMenu.title = 'Click to logout';
        profileMenu.onclick = function(e) {
            if (e.target === profileMenu || e.target.closest('.profile-menu') === profileMenu) {
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            }
        };
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogout);
} else {
    setupLogout();
}

