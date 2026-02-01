<?php
/**
 * Database Connection Test
 * Use this file to verify your database connection is working
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';

header('Content-Type: application/json');

try {
    $pdo = Database::getInstance()->getConnection();
    
    // Test query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    // Check if database exists and has tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    Response::success([
        'status' => 'connected',
        'database' => 'tourism_db',
        'tables_count' => count($tables),
        'tables' => $tables,
        'message' => 'Database connection successful!'
    ]);
    
} catch (Exception $e) {
    Response::error('Database connection failed: ' . $e->getMessage(), 500);
}

