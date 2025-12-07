<?php
/**
 * Micro RESTful API Router - PHP 8
 * Fast execution with minimal overhead
 */

// Enable error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '1'); // Temporarily enable for debugging

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
    else {
        Response::notFound('Endpoint not found');
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}

