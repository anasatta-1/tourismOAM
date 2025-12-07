<?php
/**
 * Visas Endpoints
 */

function handleVisas($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    // GET /api/visas/types - Get visa types
    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'types') {
        // Return mock data - in production, this would come from a database
        Response::success([
            'visa_types' => [
                ['visa_type' => 'Tourist Visa', 'description' => 'Standard tourist visa'],
                ['visa_type' => 'Business Visa', 'description' => 'Business travel visa'],
                ['visa_type' => 'Transit Visa', 'description' => 'Transit visa']
            ]
        ]);
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/visas - Create visa
    if ($method === 'POST' && count($segments) === 3) {
        validateRequired($data, ['visa_type', 'country']);
        
        if (strtolower($data['visa_type']) === 'cruise visa') {
            Response::error('Cruise Visa is not allowed', 400);
        }
        
        $stmt = $pdo->prepare("INSERT INTO visas (package_id, visa_type, visa_status, country, cost, special_notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $packageId, $data['visa_type'], $data['visa_status'] ?? 'Pending',
            $data['country'], $data['cost'] ?? 0.00, $data['special_notes'] ?? null
        ]);
        
        $visaId = $pdo->lastInsertId();
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM visas WHERE visa_id = ?");
        $stmt->execute([$visaId]);
        Response::success($stmt->fetch(), 'Visa entry created successfully', 201);
    }
    
    // GET /api/packages/:packageId/visas - Get all visas
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM visas WHERE package_id = ?");
        $stmt->execute([$packageId]);
        
        Response::success([
            'package_id' => $packageId,
            'visas' => $stmt->fetchAll()
        ]);
    }
    
    // GET /api/packages/:packageId/visas/:id - Get specific visa
    elseif ($method === 'GET' && count($segments) === 4 && is_numeric($segments[3])) {
        $visaId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT * FROM visas WHERE visa_id = ? AND package_id = ?");
        $stmt->execute([$visaId, $packageId]);
        $visa = $stmt->fetch();
        
        if (!$visa) {
            Response::notFound('Visa not found');
        }
        
        Response::success($visa);
    }
    
    // PUT /api/packages/:packageId/visas/:id - Update visa
    elseif ($method === 'PUT' && count($segments) === 4 && is_numeric($segments[3])) {
        $visaId = (int)$segments[3];
        
        if (isset($data['visa_type']) && strtolower($data['visa_type']) === 'cruise visa') {
            Response::error('Cruise Visa is not allowed', 400);
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['visa_type', 'visa_status', 'country', 'cost', 'special_notes'];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $visaId;
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE visas SET " . implode(', ', $updates) . " WHERE visa_id = ? AND package_id = ?");
        $stmt->execute($params);
        
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM visas WHERE visa_id = ?");
        $stmt->execute([$visaId]);
        Response::success($stmt->fetch(), 'Visa updated successfully');
    }
    
    // DELETE /api/packages/:packageId/visas/:id - Delete visa
    elseif ($method === 'DELETE' && count($segments) === 4 && is_numeric($segments[3])) {
        $visaId = (int)$segments[3];
        
        $stmt = $pdo->prepare("DELETE FROM visas WHERE visa_id = ? AND package_id = ?");
        $stmt->execute([$visaId, $packageId]);
        
        calculatePackageTotal($pdo, $packageId);
        Response::success(['message' => 'Visa entry deleted successfully']);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

