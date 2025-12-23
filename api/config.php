<?php
/**
 * Database Configuration
 * Micro API - Fast execution
 */

// Helper function to get environment variable
function getEnvVar($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

return [
    'db' => [
        'host' => getEnvVar('DB_HOST', 'localhost'),
        'dbname' => getEnvVar('DB_NAME', 'tourism_db'),
        'username' => getEnvVar('DB_USER', 'root'),
        'password' => getEnvVar('DB_PASS', ''),
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],
    'api' => [
        'version' => '1.0',
        'base_path' => '/api'
    ]
];

