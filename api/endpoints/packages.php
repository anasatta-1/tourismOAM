<?php
/**
 * Travel Package Management Endpoints
 */

function handlePackages($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    // POST /api/packages - Create package
    if ($method === 'POST' && count($segments) === 1) {
        validateRequired($data, ['guest_id']);
        
        $stmt = $pdo->prepare("INSERT INTO travel_packages (guest_id, package_name) VALUES (?, ?)");
        $stmt->execute([$data['guest_id'], $data['package_name'] ?? null]);
        
        $packageId = $pdo->lastInsertId();
        initializeTimelineSteps($pdo, $packageId);
        
        $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package = $stmt->fetch();
        
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['timeline_steps'] = $stmt->fetchAll();
        
        Response::success($package, 'Package created successfully', 201);
    }
    
    // POST /api/packages/wizard - Create package with all components
    elseif ($method === 'POST' && count($segments) === 2 && $segments[1] === 'wizard') {
        validateRequired($data, ['guest']);
        validateRequired($data['guest'], ['full_name', 'phone_number', 'country_of_residence']);
        
        $pdo->beginTransaction();
        try {
            // Create or get guest
            $stmt = $pdo->prepare("SELECT guest_id FROM guests WHERE phone_number = ?");
            $stmt->execute([$data['guest']['phone_number']]);
            $guest = $stmt->fetch();
            
            if ($guest) {
                $guestId = $guest['guest_id'];
            } else {
                $stmt = $pdo->prepare("INSERT INTO guests (full_name, phone_number, country_of_residence, passport_image_path) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['guest']['full_name'],
                    $data['guest']['phone_number'],
                    $data['guest']['country_of_residence'],
                    $data['guest']['passport_image_path'] ?? null
                ]);
                $guestId = $pdo->lastInsertId();
            }
            
            // Create package
            $stmt = $pdo->prepare("INSERT INTO travel_packages (guest_id, package_name) VALUES (?, ?)");
            $stmt->execute([$guestId, $data['package_name'] ?? null]);
            $packageId = $pdo->lastInsertId();
            
            // Create air travel
            if (!empty($data['air_travel'])) {
                $at = $data['air_travel'];
                validateRequired($at, ['departure_country', 'departure_city', 'departure_airport', 'destination_country', 'destination_city', 'destination_airport', 'departure_date', 'trip_duration_days', 'trip_duration_nights', 'estimated_cost']);
                
                $stmt = $pdo->prepare("INSERT INTO air_travel (package_id, departure_country, departure_city, departure_airport, destination_country, destination_city, destination_airport, preferred_airline, number_of_adults, number_of_children, number_of_infants, departure_date, trip_duration_days, trip_duration_nights, transit_time_hours, time_of_travel, lounges_access, estimated_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $packageId, $at['departure_country'], $at['departure_city'], $at['departure_airport'],
                    $at['destination_country'], $at['destination_city'], $at['destination_airport'],
                    $at['preferred_airline'] ?? null, $at['number_of_adults'] ?? 0, $at['number_of_children'] ?? 0,
                    $at['number_of_infants'] ?? 0, $at['departure_date'], $at['trip_duration_days'],
                    $at['trip_duration_nights'], $at['transit_time_hours'] ?? null,
                    $at['time_of_travel'] ?? 'AM', $at['lounges_access'] ?? false, $at['estimated_cost'],
                    $at['notes'] ?? null
                ]);
            }
            
            // Create accommodations
            if (!empty($data['accommodations']) && is_array($data['accommodations'])) {
                $stmt = $pdo->prepare("INSERT INTO accommodations (package_id, accommodation_type, country, city, number_of_bedrooms, star_rating, bed_type, cost, check_in_date, check_out_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['accommodations'] as $acc) {
                    validateRequired($acc, ['accommodation_type', 'country', 'city', 'number_of_bedrooms', 'cost', 'check_in_date', 'check_out_date']);
                    $stmt->execute([
                        $packageId, $acc['accommodation_type'], $acc['country'], $acc['city'],
                        $acc['number_of_bedrooms'], $acc['star_rating'] ?? null, $acc['bed_type'] ?? null,
                        $acc['cost'], $acc['check_in_date'], $acc['check_out_date'], $acc['notes'] ?? null
                    ]);
                }
            }
            
            // Create tours
            if (!empty($data['tours']) && is_array($data['tours'])) {
                $stmt = $pdo->prepare("INSERT INTO tours (package_id, tour_type, tour_number, number_of_transfers, country, city, tour_description, cost, tour_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['tours'] as $tour) {
                    validateRequired($tour, ['tour_type', 'country', 'city']);
                    $stmt->execute([
                        $packageId, $tour['tour_type'], $tour['tour_number'] ?? null, $tour['number_of_transfers'] ?? 0,
                        $tour['country'], $tour['city'], $tour['tour_description'] ?? null,
                        $tour['cost'] ?? 0.00, $tour['tour_date'] ?? null, $tour['notes'] ?? null
                    ]);
                }
            }
            
            // Create visas
            if (!empty($data['visas']) && is_array($data['visas'])) {
                $stmt = $pdo->prepare("INSERT INTO visas (package_id, visa_type, visa_status, country, cost, special_notes) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($data['visas'] as $visa) {
                    validateRequired($visa, ['visa_type', 'country']);
                    if (strtolower($visa['visa_type']) === 'cruise visa') {
                        Response::error('Cruise Visa is not allowed', 400);
                    }
                    $stmt->execute([
                        $packageId, $visa['visa_type'], $visa['visa_status'] ?? 'Pending',
                        $visa['country'], $visa['cost'] ?? 0.00, $visa['special_notes'] ?? null
                    ]);
                }
            }
            
            initializeTimelineSteps($pdo, $packageId);
            calculatePackageTotal($pdo, $packageId);
            
            $pdo->commit();
            
            // Return full package
            $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package = $stmt->fetch();
            
            $package['air_travel'] = null;
            $package['accommodations'] = [];
            $package['tours'] = [];
            $package['visas'] = [];
            $package['timeline'] = [];
            
            // Get related data
            $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $airTravel = $stmt->fetch();
            if ($airTravel) $package['air_travel'] = $airTravel;
            
            $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package['accommodations'] = $stmt->fetchAll();
            
            $stmt = $pdo->prepare("SELECT * FROM tours WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package['tours'] = $stmt->fetchAll();
            
            $stmt = $pdo->prepare("SELECT * FROM visas WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package['visas'] = $stmt->fetchAll();
            
            $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package['timeline'] = $stmt->fetchAll();
            
            Response::success($package, 'Package created successfully', 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error($e->getMessage(), 500);
        }
    }
    
    // GET /api/packages - List packages
    elseif ($method === 'GET' && count($segments) === 1) {
        $page = (int)($queryParams['page'] ?? 1);
        $limit = (int)($queryParams['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        $sortBy = $queryParams['sort_by'] ?? 'created_at';
        $order = strtoupper($queryParams['order'] ?? 'desc');
        
        $where = [];
        $params = [];
        
        if (!empty($queryParams['guest_id'])) {
            $where[] = "tp.guest_id = ?";
            $params[] = $queryParams['guest_id'];
        }
        if (!empty($queryParams['status'])) {
            $where[] = "tp.status = ?";
            $params[] = $queryParams['status'];
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        $orderBy = in_array($sortBy, ['created_at', 'total_estimated_cost']) ? $sortBy : 'created_at';
        $order = in_array($order, ['ASC', 'DESC']) ? $order : 'DESC';
        
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM travel_packages tp $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        $stmt = $pdo->prepare("
            SELECT tp.*, g.full_name as guest_name,
            (SELECT COUNT(*) FROM air_travel WHERE package_id = tp.package_id) > 0 as has_air_travel,
            (SELECT COUNT(*) FROM accommodations WHERE package_id = tp.package_id) > 0 as has_accommodations,
            (SELECT COUNT(*) FROM tours WHERE package_id = tp.package_id) > 0 as has_tours,
            (SELECT COUNT(*) FROM visas WHERE package_id = tp.package_id) > 0 as has_visas
            FROM travel_packages tp
            LEFT JOIN guests g ON tp.guest_id = g.guest_id
            $whereClause
            ORDER BY tp.$orderBy $order
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        
        Response::success([
            'data' => $stmt->fetchAll(),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'total_pages' => (int)ceil($total / $limit)
            ]
        ]);
    }
    
    // GET /api/packages/:packageId - Get package details
    elseif ($method === 'GET' && count($segments) === 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package = $stmt->fetch();
        
        if (!$package) {
            Response::notFound('Package not found');
        }
        
        // Get guest
        $stmt = $pdo->prepare("SELECT guest_id, full_name, phone_number, country_of_residence, status FROM guests WHERE guest_id = ?");
        $stmt->execute([$package['guest_id']]);
        $package['guest'] = $stmt->fetch();
        
        // Get air travel
        $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['air_travel'] = $stmt->fetch() ?: null;
        
        // Get accommodations
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['accommodations'] = $stmt->fetchAll();
        
        // Get tours
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['tours'] = $stmt->fetchAll();
        
        // Get visas
        $stmt = $pdo->prepare("SELECT * FROM visas WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['visas'] = $stmt->fetchAll();
        
        // Get timeline
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['timeline'] = $stmt->fetchAll();
        
        // Get quotations
        $stmt = $pdo->prepare("SELECT quotation_id, quotation_number, total_amount, status, generated_date FROM quotations WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['quotations'] = $stmt->fetchAll();
        
        // Get contract
        $stmt = $pdo->prepare("SELECT contract_id, status, sent_date, confirmed_date FROM contracts WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['contract'] = $stmt->fetch() ?: null;
        
        // Get payments
        $stmt = $pdo->prepare("SELECT payment_id, payment_amount, payment_date, payment_method FROM payments WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package['payments'] = $stmt->fetchAll();
        
        Response::success($package);
    }
    
    // PUT /api/packages/:packageId - Update package
    elseif ($method === 'PUT' && count($segments) === 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        
        $updates = [];
        $params = [];
        
        if (isset($data['package_name'])) {
            $updates[] = "package_name = ?";
            $params[] = $data['package_name'];
        }
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $packageId;
        $stmt = $pdo->prepare("UPDATE travel_packages SET " . implode(', ', $updates) . " WHERE package_id = ?");
        $stmt->execute($params);
        
        $stmt = $pdo->prepare("SELECT package_id, package_name, status FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        Response::success($stmt->fetch(), 'Package updated successfully');
    }
    
    // DELETE /api/packages/:packageId - Delete package
    elseif ($method === 'DELETE' && count($segments) === 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        
        $stmt = $pdo->prepare("DELETE FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        
        Response::success(['message' => 'Package deleted successfully']);
    }
    
    // PATCH /api/packages/:packageId/status - Update status
    elseif ($method === 'PATCH' && count($segments) === 3 && $segments[2] === 'status' && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        validateRequired($data, ['status']);
        
        $stmt = $pdo->prepare("UPDATE travel_packages SET status = ? WHERE package_id = ?");
        $stmt->execute([$data['status'], $packageId]);
        
        $stmt = $pdo->prepare("SELECT package_id, status FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        Response::success($stmt->fetch(), 'Status updated successfully');
    }
    
    // GET /api/packages/:packageId/total-cost - Get total cost
    elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'total-cost' && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        $breakdown = calculatePackageTotal($pdo, $packageId);
        
        Response::success([
            'package_id' => $packageId,
            'total_estimated_cost' => $breakdown['total'],
            'breakdown' => $breakdown,
            'last_calculated' => date('Y-m-d H:i:s')
        ]);
    }
    
    // POST /api/packages/:packageId/recalculate - Recalculate cost
    elseif ($method === 'POST' && count($segments) === 3 && $segments[2] === 'recalculate' && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT total_estimated_cost FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $package = $stmt->fetch();
        
        if (!$package) {
            Response::notFound('Package not found');
        }
        
        $previousTotal = $package['total_estimated_cost'];
        $breakdown = calculatePackageTotal($pdo, $packageId);
        
        Response::success([
            'package_id' => $packageId,
            'previous_total' => (float)$previousTotal,
            'new_total' => $breakdown['total'],
            'breakdown' => $breakdown,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    // Handle nested routes - air-travel, accommodations, tours, visas, timeline, quotations, contracts, payments
    elseif (count($segments) >= 3 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
        $resource = $segments[2];
        
        // Verify package exists
        $stmt = $pdo->prepare("SELECT package_id FROM travel_packages WHERE package_id = ?");
        $stmt->execute([$packageId]);
        if (!$stmt->fetch()) {
            Response::notFound('Package not found');
        }
        
        // Route to appropriate handler
        if ($resource === 'air-travel') {
            require __DIR__ . '/air_travel.php';
            handleAirTravel($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'accommodations') {
            require __DIR__ . '/accommodations.php';
            handleAccommodations($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'tours') {
            require __DIR__ . '/tours.php';
            handleTours($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'visas') {
            require __DIR__ . '/visas.php';
            handleVisas($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'timeline') {
            require __DIR__ . '/timeline_steps.php';
            handleTimelineSteps($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'quotations') {
            require __DIR__ . '/quotations.php';
            handleQuotations($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'contracts') {
            require __DIR__ . '/contracts.php';
            handleContracts($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'payments') {
            require __DIR__ . '/payments.php';
            handlePayments($method, $segments, $data, $queryParams, $packageId);
        } elseif ($resource === 'wizard') {
            // PUT /api/packages/:packageId/wizard
            if ($method === 'PUT') {
                $pdo->beginTransaction();
                try {
                    if (isset($data['package_name'])) {
                        $stmt = $pdo->prepare("UPDATE travel_packages SET package_name = ? WHERE package_id = ?");
                        $stmt->execute([$data['package_name'], $packageId]);
                    }
                    
                    // Update air travel (delete old, insert new)
                    if (isset($data['air_travel'])) {
                        $stmt = $pdo->prepare("DELETE FROM air_travel WHERE package_id = ?");
                        $stmt->execute([$packageId]);
                        
                        if ($data['air_travel'] !== null) {
                            $at = $data['air_travel'];
                            $stmt = $pdo->prepare("INSERT INTO air_travel (package_id, departure_country, departure_city, departure_airport, destination_country, destination_city, destination_airport, preferred_airline, number_of_adults, number_of_children, number_of_infants, departure_date, trip_duration_days, trip_duration_nights, transit_time_hours, time_of_travel, lounges_access, estimated_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            $stmt->execute([
                                $packageId, $at['departure_country'], $at['departure_city'], $at['departure_airport'],
                                $at['destination_country'], $at['destination_city'], $at['destination_airport'],
                                $at['preferred_airline'] ?? null, $at['number_of_adults'] ?? 0, $at['number_of_children'] ?? 0,
                                $at['number_of_infants'] ?? 0, $at['departure_date'], $at['trip_duration_days'],
                                $at['trip_duration_nights'], $at['transit_time_hours'] ?? null,
                                $at['time_of_travel'] ?? 'AM', $at['lounges_access'] ?? false, $at['estimated_cost'],
                                $at['notes'] ?? null
                            ]);
                        }
                    }
                    
                    // Update accommodations
                    if (isset($data['accommodations'])) {
                        $stmt = $pdo->prepare("DELETE FROM accommodations WHERE package_id = ?");
                        $stmt->execute([$packageId]);
                        
                        if (!empty($data['accommodations']) && is_array($data['accommodations'])) {
                            $stmt = $pdo->prepare("INSERT INTO accommodations (package_id, accommodation_type, country, city, number_of_bedrooms, star_rating, bed_type, cost, check_in_date, check_out_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            foreach ($data['accommodations'] as $acc) {
                                $stmt->execute([
                                    $packageId, $acc['accommodation_type'], $acc['country'], $acc['city'],
                                    $acc['number_of_bedrooms'], $acc['star_rating'] ?? null, $acc['bed_type'] ?? null,
                                    $acc['cost'], $acc['check_in_date'], $acc['check_out_date'], $acc['notes'] ?? null
                                ]);
                            }
                        }
                    }
                    
                    // Update tours
                    if (isset($data['tours'])) {
                        $stmt = $pdo->prepare("DELETE FROM tours WHERE package_id = ?");
                        $stmt->execute([$packageId]);
                        
                        if (!empty($data['tours']) && is_array($data['tours'])) {
                            $stmt = $pdo->prepare("INSERT INTO tours (package_id, tour_type, tour_number, number_of_transfers, country, city, tour_description, cost, tour_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            foreach ($data['tours'] as $tour) {
                                $stmt->execute([
                                    $packageId, $tour['tour_type'], $tour['tour_number'] ?? null, $tour['number_of_transfers'] ?? 0,
                                    $tour['country'], $tour['city'], $tour['tour_description'] ?? null,
                                    $tour['cost'] ?? 0.00, $tour['tour_date'] ?? null, $tour['notes'] ?? null
                                ]);
                            }
                        }
                    }
                    
                    // Update visas
                    if (isset($data['visas'])) {
                        $stmt = $pdo->prepare("DELETE FROM visas WHERE package_id = ?");
                        $stmt->execute([$packageId]);
                        
                        if (!empty($data['visas']) && is_array($data['visas'])) {
                            $stmt = $pdo->prepare("INSERT INTO visas (package_id, visa_type, visa_status, country, cost, special_notes) VALUES (?, ?, ?, ?, ?, ?)");
                            foreach ($data['visas'] as $visa) {
                                if (strtolower($visa['visa_type']) === 'cruise visa') {
                                    throw new Exception('Cruise Visa is not allowed');
                                }
                                $stmt->execute([
                                    $packageId, $visa['visa_type'], $visa['visa_status'] ?? 'Pending',
                                    $visa['country'], $visa['cost'] ?? 0.00, $visa['special_notes'] ?? null
                                ]);
                            }
                        }
                    }
                    
                    calculatePackageTotal($pdo, $packageId);
                    $pdo->commit();
                    
                    $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE package_id = ?");
                    $stmt->execute([$packageId]);
                    $package = $stmt->fetch();
                    
                    // Get related data
                    $stmt = $pdo->prepare("SELECT * FROM air_travel WHERE package_id = ?");
                    $stmt->execute([$packageId]);
                    $package['air_travel'] = $stmt->fetch() ?: null;
                    
                    $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE package_id = ?");
                    $stmt->execute([$packageId]);
                    $package['accommodations'] = $stmt->fetchAll();
                    
                    $stmt = $pdo->prepare("SELECT * FROM tours WHERE package_id = ?");
                    $stmt->execute([$packageId]);
                    $package['tours'] = $stmt->fetchAll();
                    
                    $stmt = $pdo->prepare("SELECT * FROM visas WHERE package_id = ?");
                    $stmt->execute([$packageId]);
                    $package['visas'] = $stmt->fetchAll();
                    
                    Response::success($package, 'Package updated successfully');
                } catch (Exception $e) {
                    $pdo->rollBack();
                    Response::error($e->getMessage(), 500);
                }
            } else {
                Response::notFound('Endpoint not found');
            }
        } else {
            Response::notFound('Endpoint not found');
        }
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

