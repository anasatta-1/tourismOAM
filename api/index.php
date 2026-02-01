<?php
/**
 * Micro RESTful API Router - PHP 8
 * Fast execution with minimal overhead
 */

// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/../.env')) {
    $envFile = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envFile as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue; // Skip comments and empty lines
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Remove quotes if present
            $value = trim($value, '"\'');
            if (!empty($key) && !isset($_ENV[$key])) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Error reporting configuration - Environment-aware
error_reporting(E_ALL);

// Check if we're in production mode (via environment variable or config)
$isProduction = ($_ENV['ENVIRONMENT'] ?? getenv('ENVIRONMENT') ?: 'development') === 'production';

if ($isProduction) {
    // Production: Don't display errors to users, log them instead
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/../logs/php-errors.log');
} else {
    // Development: Show errors for debugging
    ini_set('display_errors', '1');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/../logs/php-errors.log');
}

// Set timezone
date_default_timezone_set('UTC');

// Load dependencies
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/helpers.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Response::json([], 200);
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Handle direct PHP file access (like test-api.php, test-connection.php, debug-router.php)
// Check if request is for a direct PHP file
$requestFile = basename($path);
if (in_array($requestFile, ['test-api.php', 'test-connection.php', 'debug-router.php']) && file_exists(__DIR__ . '/' . $requestFile)) {
    require __DIR__ . '/' . $requestFile;
    exit;
}

// Remove /api prefix - handle multiple cases including subdirectories
// Handles: /api/guests, /tourismOAM-main/api/guests, /api/guests/, /api, etc.
// Find the /api part in the path (could be in subdirectory like /tourismOAM-main/api)
$apiPos = strpos($path, '/api');
if ($apiPos !== false) {
    // Extract everything after /api
    $path = substr($path, $apiPos + 4); // +4 to skip '/api'
} else {
    // If no /api found, try to remove common patterns
    $path = preg_replace('#^.*?/api/?#', '', $path);
}
$path = trim($path, '/');
$segments = $path ? explode('/', $path) : [];

// Debug: Uncomment to see routing (remove in production)
// error_log("API Routing Debug - Method: $method, Original Path: " . $_SERVER['REQUEST_URI'] . ", Parsed Path: $path, Segments: " . json_encode($segments));

// Get request body and query params
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];
$queryParams = $_GET ?? [];

// Route handler
try {
    $firstSegment = $segments[0] ?? '';
    
    // Debug: Log routing info (remove in production)
    // error_log("Routing: Method=$method, Path=$path, Segments=" . json_encode($segments) . ", First=$firstSegment");
    
    // Route: /guests or empty (for root /api access)
    if ($firstSegment === 'guests' || $firstSegment === '') {
        require __DIR__ . '/endpoints/guests.php';
        handleGuests($method, $segments, $data, $queryParams);
    }
    // Route: /packages
    elseif ($firstSegment === 'packages') {
        require __DIR__ . '/endpoints/packages.php';
        handlePackages($method, $segments, $data, $queryParams);
    }
    // Route: /analytics
    elseif ($firstSegment === 'analytics') {
        require __DIR__ . '/endpoints/analytics.php';
        handleAnalytics($method, $segments, $data, $queryParams);
    }
    // Route: /options
    elseif ($firstSegment === 'options') {
        require __DIR__ . '/endpoints/options.php';
        handleOptions($method, $segments, $data, $queryParams);
    }
    // Route: /upload
    elseif ($firstSegment === 'upload') {
        require __DIR__ . '/endpoints/upload.php';
        handleUpload($method, $segments, $data, $queryParams);
    }
    // Route: /files
    elseif ($firstSegment === 'files') {
        require __DIR__ . '/endpoints/files.php';
        handleFiles($method, $segments, $data, $queryParams);
    }
    // Route: /auth
    elseif ($firstSegment === 'auth') {
        require __DIR__ . '/endpoints/auth.php';
        handleAuth($method, array_slice($segments, 1), $data, $queryParams);
    }
    else {
        Response::notFound('Endpoint not found');
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}

