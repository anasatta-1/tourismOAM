<?php
/**
 * Guest Management Endpoints
 */

function handleGuests($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    // POST /api/guests - Create new guest
    // Handle both /api/guests (segments = ['guests']) and /api (segments = [])
    if ($method === 'POST' && (count($segments) === 1 || count($segments) === 0)) {
        validateRequired($data, ['full_name', 'phone_number', 'country_of_residence']);
        
        $stmt = $pdo->prepare("INSERT INTO guests (full_name, phone_number, country_of_residence, passport_image_path) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['full_name'],
            $data['phone_number'],
            $data['country_of_residence'],
            $data['passport_image_path'] ?? null
        ]);
        
        $guestId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        Response::success($stmt->fetch(), 'Guest created successfully', 201);
    }
    
    // GET /api/guests - List all guests
    // Handle both /api/guests (segments = ['guests']) and /api (segments = [])
    elseif ($method === 'GET' && (count($segments) === 1 || count($segments) === 0)) {
        $page = (int)($queryParams['page'] ?? 1);
        $limit = (int)($queryParams['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        
        $where = [];
        $params = [];
        
        if (!empty($queryParams['status'])) {
            $where[] = "g.status = ?";
            $params[] = $queryParams['status'];
        }
        
        if (!empty($queryParams['search'])) {
            $where[] = "(g.full_name LIKE ? OR g.phone_number LIKE ?)";
            $search = '%' . $queryParams['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM guests g $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get guests
        $stmt = $pdo->prepare("
            SELECT g.*, COUNT(tp.package_id) as packages_count 
            FROM guests g 
            LEFT JOIN travel_packages tp ON g.guest_id = tp.guest_id 
            $whereClause
            GROUP BY g.guest_id 
            ORDER BY g.created_at DESC 
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
    
    // GET /api/guests/:guestId - Get guest details
    elseif ($method === 'GET' && count($segments) === 2 && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT * FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            Response::notFound('Guest not found');
        }
        
        // Get packages
        $stmt = $pdo->prepare("SELECT package_id, package_name, status, total_estimated_cost FROM travel_packages WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        $guest['packages'] = $stmt->fetchAll();
        
        Response::success($guest);
    }
    
    // PUT /api/guests/:guestId - Update guest
    elseif ($method === 'PUT' && count($segments) === 2 && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        $updates = [];
        $params = [];
        
        if (isset($data['full_name'])) {
            $updates[] = "full_name = ?";
            $params[] = $data['full_name'];
        }
        if (isset($data['phone_number'])) {
            $updates[] = "phone_number = ?";
            $params[] = $data['phone_number'];
        }
        if (isset($data['country_of_residence'])) {
            $updates[] = "country_of_residence = ?";
            $params[] = $data['country_of_residence'];
        }
        if (isset($data['passport_image_path'])) {
            $updates[] = "passport_image_path = ?";
            $params[] = $data['passport_image_path'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $guestId;
        $stmt = $pdo->prepare("UPDATE guests SET " . implode(', ', $updates) . " WHERE guest_id = ?");
        $stmt->execute($params);
        
        $stmt = $pdo->prepare("SELECT * FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        Response::success($stmt->fetch(), 'Guest updated successfully');
    }
    
    // PATCH /api/guests/:guestId/status - Update status
    elseif ($method === 'PATCH' && count($segments) === 3 && $segments[2] === 'status' && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        validateRequired($data, ['status']);
        
        if (!in_array($data['status'], ['guest', 'client'])) {
            Response::error('Invalid status. Must be "guest" or "client"', 400);
        }
        
        $stmt = $pdo->prepare("UPDATE guests SET status = ? WHERE guest_id = ?");
        $stmt->execute([$data['status'], $guestId]);
        
        $stmt = $pdo->prepare("SELECT guest_id, status FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        Response::success($stmt->fetch(), 'Status updated successfully');
    }
    
    // POST /api/guests/:guestId/passport - Upload passport
    elseif ($method === 'POST' && count($segments) === 3 && $segments[2] === 'passport' && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded', 400);
        }
        
        $filepath = handleFileUpload($_FILES['file'], __DIR__ . '/../../uploads/passports');
        
        $stmt = $pdo->prepare("UPDATE guests SET passport_image_path = ? WHERE guest_id = ?");
        $stmt->execute([$filepath, $guestId]);
        
        Response::success([
            'guest_id' => $guestId,
            'passport_image_path' => $filepath,
            'message' => 'Passport image uploaded successfully'
        ]);
    }
    
    // GET /api/guests/:guestId/passport - Get passport image
    elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'passport' && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT passport_image_path FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        $result = $stmt->fetch();
        
        if (!$result || !$result['passport_image_path']) {
            Response::success(['passport_image_path' => null, 'image_url' => null]);
        }
        
        $filepath = $result['passport_image_path'];
        if (file_exists($filepath)) {
            header('Content-Type: ' . mime_content_type($filepath));
            readfile($filepath);
            exit;
        }
        
        Response::success([
            'passport_image_path' => $filepath,
            'image_url' => '/api/files/' . basename($filepath)
        ]);
    }
    
    // GET /api/guests/:guestId/packages - Get packages for guest
    elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'packages' && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT * FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            Response::notFound('Guest not found');
        }
        
        $where = ["guest_id = ?"];
        $params = [$guestId];
        
        if (!empty($queryParams['status'])) {
            $where[] = "status = ?";
            $params[] = $queryParams['status'];
        }
        
        $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE " . implode(' AND ', $where) . " ORDER BY created_at DESC");
        $stmt->execute($params);
        
        Response::success([
            'guest_id' => $guestId,
            'guest_name' => $guest['full_name'],
            'packages' => $stmt->fetchAll()
        ]);
    }
    
    // GET /api/guests/:guestId/payment-info - Get guest with packages, contracts, and payment info for payment processing
    elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'payment-info' && is_numeric($segments[1])) {
        $guestId = (int)$segments[1];
        
        $stmt = $pdo->prepare("SELECT * FROM guests WHERE guest_id = ?");
        $stmt->execute([$guestId]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            Response::notFound('Guest not found');
        }
        
        // Get all packages for this guest
        $stmt = $pdo->prepare("SELECT * FROM travel_packages WHERE guest_id = ? ORDER BY created_at DESC");
        $stmt->execute([$guestId]);
        $packages = $stmt->fetchAll();
        
        // For each package, get contract and payment info
        foreach ($packages as &$package) {
            $packageId = $package['package_id'];
            
            // Get contract
            $stmt = $pdo->prepare("SELECT * FROM contracts WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $package['contract'] = $stmt->fetch();
            
            // Get payments
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE package_id = ? ORDER BY payment_date DESC");
            $stmt->execute([$packageId]);
            $payments = $stmt->fetchAll();
            
            $totalPaid = array_sum(array_column($payments, 'payment_amount'));
            $package['payments'] = $payments;
            $package['total_paid'] = (float)$totalPaid;
            $package['remaining_balance'] = (float)($package['total_estimated_cost'] - $totalPaid);
            $package['is_paid_in_full'] = $totalPaid >= $package['total_estimated_cost'];
        }
        
        Response::success([
            'guest' => $guest,
            'packages' => $packages
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

