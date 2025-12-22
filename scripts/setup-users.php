<?php
/**
 * Setup Users Table and Default Admin
 * Run this file once to create the users table and default admin account
 * 
 * Usage: Open in browser: http://localhost/anas/setup-users.php
 */

require_once __DIR__ . '/../api/Database.php';
require_once __DIR__ . '/../api/Response.php';
require_once __DIR__ . '/../api/helpers.php';

header('Content-Type: application/json');

try {
    $pdo = Database::getInstance()->getConnection();
    
    // Create users table
    $createTableSQL = "
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
    ";
    
    $pdo->exec($createTableSQL);
    
    // Check if admin user exists
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = 'admin'");
    $stmt->execute();
    $existingAdmin = $stmt->fetch();
    
    if (!$existingAdmin) {
        // Create default admin user
        // Password: admin123
        // Using bcrypt with cost factor 12 for security
        $passwordHash = hashPassword('admin123');
        
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'admin',
            'admin@tourism.com',
            $passwordHash,
            'Administrator',
            'admin',
            true
        ]);
        
        Response::success([
            'message' => 'Users table created and default admin user added successfully!',
            'credentials' => [
                'username' => 'admin',
                'password' => 'admin123',
                'email' => 'admin@tourism.com',
                'role' => 'admin'
            ],
            'note' => 'Please change the default password after first login!'
        ]);
    } else {
        Response::success([
            'message' => 'Users table already exists. Admin user already created.',
            'note' => 'To reset admin password, update it in the database.'
        ]);
    }
    
} catch (Exception $e) {
    Response::error('Setup failed: ' . $e->getMessage(), 500);
}

