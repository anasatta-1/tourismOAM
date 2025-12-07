<?php
/**
 * Payments Endpoints
 */

function handlePayments($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/payments - Create payment
    if ($method === 'POST' && count($segments) === 3) {
        validateRequired($data, ['payment_amount', 'payment_date']);
        
        $stmt = $pdo->prepare("INSERT INTO payments (package_id, payment_amount, payment_date, payment_method, transaction_reference, notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $packageId, $data['payment_amount'], $data['payment_date'],
            $data['payment_method'] ?? null, $data['transaction_reference'] ?? null, $data['notes'] ?? null
        ]);
        
        $paymentId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE payment_id = ?");
        $stmt->execute([$paymentId]);
        Response::success($stmt->fetch(), 'Payment created successfully', 201);
    }
    
    // GET /api/packages/:packageId/payments - Get all payments
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE package_id = ? ORDER BY payment_date DESC");
        $stmt->execute([$packageId]);
        $payments = $stmt->fetchAll();
        
        $totalPaid = array_sum(array_column($payments, 'payment_amount'));
        
        $stmt = $pdo->prepare("SELECT total_estimated_cost FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package = $stmt->fetch();
        $remaining = ($package['total_estimated_cost'] ?? 0) - $totalPaid;
        
        Response::success([
            'package_id' => $packageId,
            'payments' => $payments,
            'total_paid' => (float)$totalPaid,
            'remaining_balance' => (float)$remaining
        ]);
    }
    
    // GET /api/packages/:packageId/payments/:paymentId - Get specific payment
    elseif ($method === 'GET' && count($segments) === 4 && is_numeric($segments[3])) {
        $paymentId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE payment_id = ? AND package_id = ?");
        $stmt->execute([$paymentId, $packageId]);
        $payment = $stmt->fetch();
        
        if (!$payment) {
            Response::notFound('Payment not found');
        }
        
        Response::success($payment);
    }
    
    // PUT /api/packages/:packageId/payments/:paymentId - Update payment
    elseif ($method === 'PUT' && count($segments) === 4 && is_numeric($segments[3])) {
        $paymentId = (int)$segments[3];
        
        $updates = [];
        $params = [];
        
        $fields = ['payment_amount', 'payment_date', 'payment_method', 'transaction_reference', 'notes'];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $paymentId;
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE payments SET " . implode(', ', $updates) . " WHERE payment_id = ? AND package_id = ?");
        $stmt->execute($params);
        
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE payment_id = ?");
        $stmt->execute([$paymentId]);
        Response::success($stmt->fetch(), 'Payment updated successfully');
    }
    
    // POST /api/packages/:packageId/payments/:paymentId/receipt - Upload receipt
    elseif ($method === 'POST' && count($segments) === 5 && $segments[4] === 'receipt' && is_numeric($segments[3])) {
        $paymentId = (int)$segments[3];
        
        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded', 400);
        }
        
        $filepath = handleFileUpload($_FILES['file'], __DIR__ . '/../../uploads/receipts');
        
        $stmt = $pdo->prepare("UPDATE payments SET receipt_image_path = ? WHERE payment_id = ? AND package_id = ?");
        $stmt->execute([$filepath, $paymentId, $packageId]);
        
        Response::success([
            'payment_id' => $paymentId,
            'receipt_image_path' => $filepath,
            'message' => 'Payment receipt uploaded successfully'
        ]);
    }
    
    // GET /api/packages/:packageId/payments/:paymentId/receipt - Get receipt
    elseif ($method === 'GET' && count($segments) === 5 && $segments[4] === 'receipt' && is_numeric($segments[3])) {
        $paymentId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT receipt_image_path FROM payments WHERE payment_id = ? AND package_id = ?");
        $stmt->execute([$paymentId, $packageId]);
        $result = $stmt->fetch();
        
        if (!$result || !$result['receipt_image_path']) {
            Response::success(['receipt_image_path' => null, 'image_url' => null]);
        }
        
        $filepath = $result['receipt_image_path'];
        if (file_exists($filepath)) {
            header('Content-Type: ' . mime_content_type($filepath));
            readfile($filepath);
            exit;
        }
        
        Response::success([
            'receipt_image_path' => $filepath,
            'image_url' => '/api/files/' . basename($filepath)
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

