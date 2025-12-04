<?php
/**
 * Tours Endpoints
 */

function handleTours($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/tours - Create tour
    if ($method === 'POST' && count($segments) === 3) {
        validateRequired($data, ['tour_type', 'country', 'city']);
        
        $stmt = $pdo->prepare("INSERT INTO tours (package_id, tour_type, tour_number, number_of_transfers, country, city, tour_description, cost, tour_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $packageId, $data['tour_type'], $data['tour_number'] ?? null, $data['number_of_transfers'] ?? 0,
            $data['country'], $data['city'], $data['tour_description'] ?? null,
            $data['cost'] ?? 0.00, $data['tour_date'] ?? null, $data['notes'] ?? null
        ]);
        
        $tourId = $pdo->lastInsertId();
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE tour_id = ?");
        $stmt->execute([$tourId]);
        Response::success($stmt->fetch(), 'Tour created successfully', 201);
    }
    
    // GET /api/packages/:packageId/tours - Get all tours
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE package_id = ? ORDER BY tour_date");
        $stmt->execute([$packageId]);
        
        Response::success([
            'package_id' => $packageId,
            'tours' => $stmt->fetchAll()
        ]);
    }
    
    // GET /api/packages/:packageId/tours/:id - Get specific tour
    elseif ($method === 'GET' && count($segments) === 4 && is_numeric($segments[3])) {
        $tourId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE tour_id = ? AND package_id = ?");
        $stmt->execute([$tourId, $packageId]);
        $tour = $stmt->fetch();
        
        if (!$tour) {
            Response::notFound('Tour not found');
        }
        
        Response::success($tour);
    }
    
    // PUT /api/packages/:packageId/tours/:id - Update tour
    elseif ($method === 'PUT' && count($segments) === 4 && is_numeric($segments[3])) {
        $tourId = (int)$segments[3];
        
        $updates = [];
        $params = [];
        
        $fields = ['tour_type', 'tour_number', 'number_of_transfers', 'country', 'city', 'tour_description', 'cost', 'tour_date', 'notes'];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $tourId;
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE tours SET " . implode(', ', $updates) . " WHERE tour_id = ? AND package_id = ?");
        $stmt->execute($params);
        
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE tour_id = ?");
        $stmt->execute([$tourId]);
        Response::success($stmt->fetch(), 'Tour updated successfully');
    }
    
    // DELETE /api/packages/:packageId/tours/:id - Delete tour
    elseif ($method === 'DELETE' && count($segments) === 4 && is_numeric($segments[3])) {
        $tourId = (int)$segments[3];
        
        $stmt = $pdo->prepare("DELETE FROM tours WHERE tour_id = ? AND package_id = ?");
        $stmt->execute([$tourId, $packageId]);
        
        calculatePackageTotal($pdo, $packageId);
        Response::success(['message' => 'Tour deleted successfully']);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

