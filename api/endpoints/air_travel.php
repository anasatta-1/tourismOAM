<?php
/**
 * Air Travel Endpoints
 */

function handleAirTravel($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    // If called from packages router, packageId is provided
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/air-travel - Create air travel
    if ($method === 'POST' && count($segments) === 3) {
        validateRequired($data, ['departure_country', 'departure_city', 'departure_airport', 'destination_country', 'destination_city', 'destination_airport', 'departure_date', 'trip_duration_days', 'trip_duration_nights', 'estimated_cost']);
        
        $stmt = $pdo->prepare("INSERT INTO air_travel (package_id, departure_country, departure_city, departure_airport, destination_country, destination_city, destination_airport, preferred_airline, number_of_adults, number_of_children, number_of_infants, departure_date, trip_duration_days, trip_duration_nights, transit_time_hours, time_of_travel, lounges_access, estimated_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $packageId, $data['departure_country'], $data['departure_city'], $data['departure_airport'],
            $data['destination_country'], $data['destination_city'], $data['destination_airport'],
            $data['preferred_airline'] ?? null, $data['number_of_adults'] ?? 0, $data['number_of_children'] ?? 0,
            $data['number_of_infants'] ?? 0, $data['departure_date'], $data['trip_duration_days'],
            $data['trip_duration_nights'], $data['transit_time_hours'] ?? null,
            $data['time_of_travel'] ?? 'AM', $data['lounges_access'] ?? false, $data['estimated_cost'],
            $data['notes'] ?? null
        ]);
        
        $airTravelId = $pdo->lastInsertId();
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE air_travel_id = ?");
        $stmt->execute([$airTravelId]);
        Response::success($stmt->fetch(), 'Air travel created successfully', 201);
    }
    
    // GET /api/packages/:packageId/air-travel - Get air travel
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $airTravel = $stmt->fetch();
        
        if (!$airTravel) {
            Response::notFound('Air travel not found');
        }
        
        Response::success($airTravel);
    }
    
    // PUT /api/packages/:packageId/air-travel - Update air travel
    elseif ($method === 'PUT' && count($segments) === 3) {
        $updates = [];
        $params = [];
        
        $fields = ['departure_country', 'departure_city', 'departure_airport', 'destination_country', 'destination_city', 'destination_airport', 'preferred_airline', 'number_of_adults', 'number_of_children', 'number_of_infants', 'departure_date', 'trip_duration_days', 'trip_duration_nights', 'transit_time_hours', 'time_of_travel', 'lounges_access', 'estimated_cost', 'notes'];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE air_travel SET " . implode(', ', $updates) . " WHERE package_id = ?");
        $stmt->execute($params);
        
        calculatePackageTotal($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE package_id = ?");
        $stmt->execute([$packageId]);
        Response::success($stmt->fetch(), 'Air travel updated successfully');
    }
    
    // DELETE /api/packages/:packageId/air-travel - Delete air travel
    elseif ($method === 'DELETE' && count($segments) === 3) {
        $stmt = $pdo->prepare("DELETE FROM air_travel WHERE package_id = ?");
        $stmt->execute([$packageId]);
        
        calculatePackageTotal($pdo, $packageId);
        Response::success(['message' => 'Air travel entry deleted successfully']);
    }
    
    // GET /api/air-travel/options - Get preset options
    elseif ($method === 'GET' && count($segments) === 2 && $segments[1] === 'options') {
        // Return mock data - in production, this would come from a database
        Response::success([
            'countries' => [],
            'cities' => [],
            'airports' => [],
            'airlines' => []
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

