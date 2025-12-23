-- Add users table for authentication
USE tourism_db;

CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
-- Username: admin
-- Password: admin123 (hashed with password_hash PHP function)
-- You should change this password after first login!
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
    'admin',
    'admin@tourism.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'Administrator',
    'admin',
    TRUE
) ON DUPLICATE KEY UPDATE username=username;

