<?php
/**
 * Run Users Table Migration
 * This script creates the users table and inserts the default admin user
 */

// Load database configuration
require_once __DIR__ . '/api/config.php';
$config = require __DIR__ . '/api/config.php';
$db = $config['db'];

try {
    // Connect to database
    $dsn = "mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}";
    $pdo = new PDO($dsn, $db['username'], $db['password'], $db['options']);
    
    echo "Connected to database: {$db['dbname']}\n";
    
    // Check if table already exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "Users table already exists. Checking admin user...\n";
        $stmt = $pdo->query("SELECT user_id, username, email, full_name, role FROM users WHERE username = 'admin'");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($admin) {
            echo "SUCCESS: Admin user already exists!\n";
            echo "Username: {$admin['username']}\n";
            echo "Email: {$admin['email']}\n";
            echo "Password: admin123\n";
            exit(0);
        }
    }
    
    // Read migration file
    $migrationFile = __DIR__ . '/users_table.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    // Execute migration directly
    $pdo->beginTransaction();
    
    try {
        // Create users table
        $createTable = "CREATE TABLE IF NOT EXISTS users (
            user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            role ENUM('admin', 'staff', 'user') DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            last_login DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTable);
        echo "Users table created successfully!\n";
        
        // Insert admin user
        $insertAdmin = "INSERT INTO users (username, email, password_hash, full_name, role) 
            VALUES ('admin', 'admin@tourism.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin')
            ON DUPLICATE KEY UPDATE username=username";
        
        $pdo->exec($insertAdmin);
        echo "Admin user created/verified!\n";
        
        try {
            $pdo->commit();
        } catch (PDOException $e) {
            // Transaction may have auto-committed, that's okay
            if (strpos($e->getMessage(), 'no active transaction') === false) {
                throw $e;
            }
        }
        echo "\nMigration completed successfully!\n\n";
        
        // Verify the table was created
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() > 0) {
            echo "SUCCESS: Users table exists\n";
            
            // Check if admin user exists
            $stmt = $pdo->query("SELECT user_id, username, email, full_name, role FROM users WHERE username = 'admin'");
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($admin) {
                echo "SUCCESS: Default admin user exists:\n";
                echo "  - Username: {$admin['username']}\n";
                echo "  - Email: {$admin['email']}\n";
                echo "  - Full Name: {$admin['full_name']}\n";
                echo "  - Role: {$admin['role']}\n";
                echo "  - Password: admin123\n\n";
                echo "IMPORTANT: Change the default password after first login!\n";
            } else {
                echo "WARNING: Admin user not found\n";
            }
        } else {
            echo "ERROR: Users table was not created\n";
        }
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    echo "✗ Database Error: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. Make sure MySQL/MariaDB is running in XAMPP\n";
    echo "2. Check database credentials in api/config.php\n";
    echo "3. Verify database '{$db['dbname']}' exists\n";
    exit(1);
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✓ Migration completed successfully!\n";

