<?php
/**
 * Accommodations Endpoints
 */

function handleAccommodations($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/accommodations - Create accommodation
    if ($method === 'POST' && count($segments) === 3) {
        validateRequired($data, ['accommodation_type', 'country', 'city', 'number_of_bedrooms', 'cost', 'check_in_date', 'check_out_date']);
        
        if ($data['check_out_date'] <= $data['check_in_date']) {
            Response::error('Check-out date must be after check-in date', 400);
        }
        
        $stmt = $pdo->prepare("INSERT INTO accommodations (package_id, accommodation_type, country, city, number_of_bedrooms, star_rating, bed_type, cost, check_in_date, check_out_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $packageId, $data['accommodation_type'], $data['country'], $data['city'],
            $data['number_of_bedrooms'], $data['star_rating'] ?? null, $data['bed_type'] ?? null,
            $data['cost'], $data['check_in_date'], $data['check_out_date'], $data['notes'] ?? null
        ]);
        
        $accId = $pdo->lastInsertId();
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE accommodation_id = ?");
        $stmt->execute([$accId]);
        Response::success($stmt->fetch(), 'Accommodation created successfully', 201);
    }
    
    // GET /api/packages/:packageId/accommodations - Get all accommodations
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE package_id = ? ORDER BY check_in_date");
        $stmt->execute([$packageId]);
        
        Response::success([
            'package_id' => $packageId,
            'accommodations' => $stmt->fetchAll()
        ]);
    }
    
    // GET /api/packages/:packageId/accommodations/:id - Get specific accommodation
    elseif ($method === 'GET' && count($segments) === 4 && is_numeric($segments[3])) {
        $accId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE accommodation_id = ? AND package_id = ?");
        $stmt->execute([$accId, $packageId]);
        $acc = $stmt->fetch();
        
        if (!$acc) {
            Response::notFound('Accommodation not found');
        }
        
        Response::success($acc);
    }
    
    // PUT /api/packages/:packageId/accommodations/:id - Update accommodation
    elseif ($method === 'PUT' && count($segments) === 4 && is_numeric($segments[3])) {
        $accId = (int)$segments[3];
        
        $updates = [];
        $params = [];
        
        $fields = ['accommodation_type', 'country', 'city', 'number_of_bedrooms', 'star_rating', 'bed_type', 'cost', 'check_in_date', 'check_out_date', 'notes'];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $accId;
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE accommodations SET " . implode(', ', $updates) . " WHERE accommodation_id = ? AND package_id = ?");
        $stmt->execute($params);
        
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE accommodation_id = ?");
        $stmt->execute([$accId]);
        Response::success($stmt->fetch(), 'Accommodation updated successfully');
    }
    
    // DELETE /api/packages/:packageId/accommodations/:id - Delete accommodation
    elseif ($method === 'DELETE' && count($segments) === 4 && is_numeric($segments[3])) {
        $accId = (int)$segments[3];
        
        $stmt = $pdo->prepare("DELETE FROM accommodations WHERE accommodation_id = ? AND package_id = ?");
        $stmt->execute([$accId, $packageId]);
        
        calculatePackageTotal($pdo, $packageId);
        Response::success(['message' => 'Accommodation deleted successfully']);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

