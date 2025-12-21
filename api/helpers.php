<?php
/**
 * Helper Functions - Utility functions for the API
 */

function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        Response::error('Missing required fields: ' . implode(', ', $missing), 400);
    }
}

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate and sanitize email
 */
function validateEmail($email) {
    $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Invalid email format', 400);
    }
    return $email;
}

/**
 * Validate password strength
 */
function validatePassword($password) {
    if (strlen($password) < 8) {
        Response::error('Password must be at least 8 characters long', 400);
    }
    // Optional: Add more strength requirements
    // if (!preg_match('/[A-Z]/', $password)) {
    //     Response::error('Password must contain at least one uppercase letter', 400);
    // }
    return $password;
}

/**
 * Validate username format
 */
function validateUsername($username) {
    $username = trim($username);
    if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username)) {
        Response::error('Username must be 3-20 characters and contain only letters, numbers, and underscores', 400);
    }
    return $username;
}

/**
 * Hash password using bcrypt
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password against hash
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function calculatePackageTotal($pdo, $packageId) {
    $total = 0;
    
    // Air travel cost
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(estimated_cost), 0) as total FROM air_travel WHERE package_id = ?");
    $stmt->execute([$packageId]);
    $airTotal = $stmt->fetch()['total'] ?? 0;
    
    // Accommodations cost
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(cost), 0) as total FROM accommodations WHERE package_id = ?");
    $stmt->execute([$packageId]);
    $accTotal = $stmt->fetch()['total'] ?? 0;
    
    // Tours cost
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(cost), 0) as total FROM tours WHERE package_id = ?");
    $stmt->execute([$packageId]);
    $toursTotal = $stmt->fetch()['total'] ?? 0;
    
    // Visas cost
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(cost), 0) as total FROM visas WHERE package_id = ?");
    $stmt->execute([$packageId]);
    $visasTotal = $stmt->fetch()['total'] ?? 0;
    
    $total = $airTotal + $accTotal + $toursTotal + $visasTotal;
    
    // Update package total
    $stmt = $pdo->prepare("UPDATE travel_packages SET total_estimated_cost = ? WHERE package_id = ?");
    $stmt->execute([$total, $packageId]);
    
    return [
        'air_travel_cost' => (float)$airTotal,
        'accommodations_cost' => (float)$accTotal,
        'tours_cost' => (float)$toursTotal,
        'visas_cost' => (float)$visasTotal,
        'total' => (float)$total
    ];
}

function generateQuotationNumber($pdo) {
    $year = date('Y');
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM quotations WHERE quotation_number LIKE ?");
    $stmt->execute(["QUO-{$year}-%"]);
    $count = $stmt->fetch()['count'] ?? 0;
    $number = $count + 1;
    return "QUO-{$year}-" . str_pad($number, 4, '0', STR_PAD_LEFT);
}

function initializeTimelineSteps($pdo, $packageId) {
    $defaultSteps = [
        'Guest Info Collection',
        'Air Travel',
        'Accommodations',
        'Tours',
        'Visa',
        'Quotation Generation',
        'Payment Processing'
    ];
    
    $stmt = $pdo->prepare("INSERT INTO timeline_steps (package_id, step_name, status) VALUES (?, ?, 'pending') ON DUPLICATE KEY UPDATE package_id = package_id");
    
    foreach ($defaultSteps as $step) {
        $stmt->execute([$packageId, $step]);
    }
}

function handleFileUpload($file, $uploadDir, $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']) {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        Response::error('File upload error', 400);
    }
    
    if ($file['size'] > 5 * 1024 * 1024) { // 5MB
        Response::error('File size exceeds 5MB limit', 400);
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        Response::error('Invalid file type. Allowed: jpg, png, pdf', 400);
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . '/' . $filename;
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        Response::error('Failed to save file', 500);
    }
    
    return $filepath;
}

