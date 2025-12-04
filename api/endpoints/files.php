<?php
/**
 * File Serving Endpoints
 */

function handleFiles($method, $segments, $data, $queryParams) {
    if ($method !== 'GET') {
        Response::error('Method not allowed', 405);
    }
    
    // GET /api/files/:filePath
    if (count($segments) >= 2) {
        $filePath = implode('/', array_slice($segments, 1));
        $filePath = urldecode($filePath);
        
        // Security: prevent directory traversal
        $filePath = str_replace('..', '', $filePath);
        $filePath = ltrim($filePath, '/');
        
        // Search in uploads directories
        $uploadDirs = [
            __DIR__ . '/../../uploads/passports',
            __DIR__ . '/../../uploads/receipts',
            __DIR__ . '/../../uploads/quotations',
            __DIR__ . '/../../uploads/contracts'
        ];
        
        $found = false;
        foreach ($uploadDirs as $dir) {
            $fullPath = $dir . '/' . basename($filePath);
            if (file_exists($fullPath) && is_file($fullPath)) {
                $found = true;
                $mimeType = mime_content_type($fullPath);
                header('Content-Type: ' . $mimeType);
                header('Content-Length: ' . filesize($fullPath));
                readfile($fullPath);
                exit;
            }
        }
        
        if (!$found) {
            Response::notFound('File not found');
        }
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

