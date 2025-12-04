<?php
/**
 * File Upload Endpoints
 */

function handleUpload($method, $segments, $data, $queryParams) {
    if ($method !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    // POST /api/upload/passport
    if (count($segments) === 2 && $segments[1] === 'passport') {
        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded', 400);
        }
        
        $filepath = handleFileUpload($_FILES['file'], __DIR__ . '/../../uploads/passports');
        
        // If guest_id provided, update guest record
        if (!empty($queryParams['guest_id'])) {
            $pdo = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare("UPDATE guests SET passport_image_path = ? WHERE guest_id = ?");
            $stmt->execute([$filepath, $queryParams['guest_id']]);
        }
        
        Response::success([
            'file_path' => $filepath,
            'file_url' => '/api/files/' . basename($filepath),
            'message' => 'File uploaded successfully'
        ]);
    }
    
    // POST /api/upload/receipt
    elseif (count($segments) === 2 && $segments[1] === 'receipt') {
        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded', 400);
        }
        
        $filepath = handleFileUpload($_FILES['file'], __DIR__ . '/../../uploads/receipts');
        
        // If payment_id provided, update payment record
        if (!empty($queryParams['payment_id'])) {
            $pdo = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare("UPDATE payments SET receipt_image_path = ? WHERE payment_id = ?");
            $stmt->execute([$filepath, $queryParams['payment_id']]);
        }
        
        Response::success([
            'file_path' => $filepath,
            'file_url' => '/api/files/' . basename($filepath),
            'message' => 'File uploaded successfully'
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

