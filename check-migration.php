<?php
/**
 * Check if migration was successful
 */

require_once __DIR__ . '/api/config.php';
$config = require __DIR__ . '/api/config.php';
$db = $config['db'];

try {
    $dsn = "mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}";
    $pdo = new PDO($dsn, $db['username'], $db['password'], $db['options']);
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "SUCCESS: Users table exists\n";
        
        // Check admin user
        $stmt = $pdo->query("SELECT user_id, username, email, full_name, role FROM users WHERE username = 'admin'");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            echo "SUCCESS: Admin user exists\n";
            echo "Username: {$admin['username']}\n";
            echo "Email: {$admin['email']}\n";
            echo "Password: admin123\n";
        } else {
            echo "WARNING: Admin user not found\n";
        }
    } else {
        echo "ERROR: Users table does not exist\n";
        echo "Running migration...\n";
        
        // Run migration
        $sql = file_get_contents(__DIR__ . '/users_table.sql');
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) {
                return !empty($stmt) && !preg_match('/^--/', $stmt);
            }
        );
        
        $pdo->beginTransaction();
        foreach ($statements as $statement) {
            if (!empty(trim($statement))) {
                $pdo->exec($statement);
            }
        }
        $pdo->commit();
        
        echo "SUCCESS: Migration completed!\n";
    }
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

