<?php
/**
 * System Verification Script
 * Checks database, configuration, and codebase for issues
 * 
 * Usage: php verify-system.php
 */

require_once __DIR__ . '/../api/Database.php';
require_once __DIR__ . '/../api/helpers.php';

echo "=== System Verification Report ===\n\n";

$issues = [];
$warnings = [];
$success = [];

// 1. Database Connection
echo "1. Database Connection...\n";
try {
    $pdo = Database::getInstance()->getConnection();
    $success[] = "Database connection successful";
    echo "   ✓ Connected\n";
} catch (Exception $e) {
    $issues[] = "Database connection failed: " . $e->getMessage();
    echo "   ✗ Failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Check Required Tables
echo "\n2. Database Tables...\n";
$expectedTables = [
    'guests', 'travel_packages', 'air_travel', 'accommodations', 
    'tours', 'visas', 'timeline_steps', 'contracts', 'payments', 
    'quotations', 'users'
];

$stmt = $pdo->query("SHOW TABLES");
$existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
$missingTables = array_diff($expectedTables, $existingTables);

if (empty($missingTables)) {
    $success[] = "All required tables exist";
    echo "   ✓ All " . count($expectedTables) . " required tables found\n";
} else {
    $issues[] = "Missing tables: " . implode(', ', $missingTables);
    echo "   ✗ Missing tables: " . implode(', ', $missingTables) . "\n";
}

// 3. Check Admin User
echo "\n3. Admin User...\n";
$stmt = $pdo->prepare("SELECT username, email, role, is_active, password_hash FROM users WHERE username = ?");
$stmt->execute(['admin']);
$admin = $stmt->fetch();

if ($admin) {
    echo "   ✓ Admin user exists\n";
    echo "     - Username: " . $admin['username'] . "\n";
    echo "     - Email: " . $admin['email'] . "\n";
    echo "     - Role: " . $admin['role'] . "\n";
    echo "     - Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n";
    
    // Verify password
    if (verifyPassword('OAM@2025', $admin['password_hash'])) {
        $success[] = "Admin password correctly set to OAM@2025";
        echo "     - Password: ✓ Verified (OAM@2025)\n";
    } else {
        $issues[] = "Admin password verification failed";
        echo "     - Password: ✗ Verification failed\n";
    }
    
    // Check if old password still works
    if (verifyPassword('admin123', $admin['password_hash'])) {
        $warnings[] = "Old password 'admin123' still works - password not changed properly";
        echo "     - ⚠️  WARNING: Old password still works!\n";
    } else {
        $success[] = "Old password correctly disabled";
        echo "     - Old password: ✓ Disabled\n";
    }
} else {
    $issues[] = "Admin user not found in database";
    echo "   ✗ Admin user not found\n";
}

// 4. Check Table Record Counts
echo "\n4. Table Record Counts...\n";
foreach ($expectedTables as $table) {
    if (in_array($table, $existingTables)) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            echo "   - $table: " . $result['count'] . " records\n";
        } catch (Exception $e) {
            $warnings[] = "Could not count records in table $table: " . $e->getMessage();
        }
    }
}

// 5. Check Environment Configuration
echo "\n5. Environment Configuration...\n";
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $success[] = ".env file exists";
    echo "   ✓ .env file found\n";
} else {
    $warnings[] = ".env file not found (using defaults)";
    echo "   ⚠️  .env file not found (will use defaults)\n";
}

// 6. Check Logs Directory
echo "\n6. Logs Directory...\n";
$logsDir = __DIR__ . '/../logs';
if (is_dir($logsDir)) {
    $success[] = "Logs directory exists";
    echo "   ✓ Logs directory exists\n";
    if (is_writable($logsDir)) {
        $success[] = "Logs directory is writable";
        echo "     - Writable: ✓\n";
    } else {
        $warnings[] = "Logs directory is not writable";
        echo "     - Writable: ✗\n";
    }
} else {
    $issues[] = "Logs directory does not exist";
    echo "   ✗ Logs directory not found\n";
}

// 7. Check Upload Directories
echo "\n7. Upload Directories...\n";
$uploadDirs = ['uploads', 'uploads/passports', 'uploads/receipts', 'uploads/quotations', 'uploads/contracts'];
foreach ($uploadDirs as $dir) {
    $fullPath = __DIR__ . '/../' . $dir;
    if (is_dir($fullPath)) {
        $htaccess = $fullPath . '/.htaccess';
        if (file_exists($htaccess)) {
            echo "   ✓ $dir/.htaccess exists\n";
        } else {
            if ($dir !== 'uploads') {
                $warnings[] = "Missing .htaccess in $dir";
                echo "   ⚠️  $dir/.htaccess missing\n";
            }
        }
    } else {
        $warnings[] = "Upload directory $dir does not exist";
        echo "   ⚠️  $dir not found\n";
    }
}

// Summary
echo "\n=== Summary ===\n";
echo "✓ Success: " . count($success) . "\n";
echo "⚠️  Warnings: " . count($warnings) . "\n";
echo "✗ Issues: " . count($issues) . "\n\n";

if (!empty($success)) {
    echo "Successes:\n";
    foreach ($success as $item) {
        echo "  ✓ $item\n";
    }
    echo "\n";
}

if (!empty($warnings)) {
    echo "Warnings:\n";
    foreach ($warnings as $item) {
        echo "  ⚠️  $item\n";
    }
    echo "\n";
}

if (!empty($issues)) {
    echo "Critical Issues:\n";
    foreach ($issues as $item) {
        echo "  ✗ $item\n";
    }
    echo "\n";
}

if (empty($issues)) {
    echo "✅ System check completed. No critical issues found.\n";
    exit(0);
} else {
    echo "❌ System check completed with critical issues. Please fix them before deployment.\n";
    exit(1);
}

