<?php
/**
 * Debug Router - Test routing logic
 * Access: http://localhost:8000/api/debug-router.php?test=guests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'script_name' => $_SERVER['SCRIPT_NAME'],
    'path_info' => $_SERVER['PATH_INFO'] ?? 'N/A',
];

// Simulate the routing logic
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$debug['original_path'] = $path;

// Remove /api prefix
$path = preg_replace('#^/api/?#', '', $path);
$path = trim($path, '/');
$segments = $path ? explode('/', $path) : [];

$debug['parsed_path'] = $path;
$debug['segments'] = $segments;
$debug['segment_count'] = count($segments);
$debug['first_segment'] = $segments[0] ?? 'EMPTY';

// Test what would match
$firstSegment = $segments[0] ?? '';
$debug['would_match_guests'] = ($firstSegment === 'guests' || $firstSegment === '');
$debug['would_match_packages'] = ($firstSegment === 'packages');

echo json_encode($debug, JSON_PRETTY_PRINT);
