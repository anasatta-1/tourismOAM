<?php
/**
 * Quotations Endpoints
 */

function handleQuotations($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/quotations - Generate quotation
    if ($method === 'POST' && count($segments) === 3) {
        $breakdown = calculatePackageTotal($pdo, $packageId);
        $quotationNumber = generateQuotationNumber($pdo);
        
        // Generate PDF path (mock - in production, generate actual PDF)
        $pdfPath = __DIR__ . '/../../uploads/quotations/' . $quotationNumber . '.pdf';
        if (!is_dir(dirname($pdfPath))) {
            mkdir(dirname($pdfPath), 0755, true);
        }
        
        $stmt = $pdo->prepare("INSERT INTO quotations (package_id, quotation_number, quotation_pdf_path, total_amount, generated_date, expiry_date, status, notes) VALUES (?, ?, ?, ?, NOW(), ?, 'draft', ?)");
        $stmt->execute([
            $packageId, $quotationNumber, $pdfPath, $breakdown['total'],
            $data['expiry_date'] ?? null, $data['notes'] ?? null
        ]);
        
        $quotationId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("SELECT * FROM quotations WHERE quotation_id = ?");
        $stmt->execute([$quotationId]);
        $quotation = $stmt->fetch();
        $quotation['breakdown'] = $breakdown;
        
        Response::success($quotation, 'Quotation generated successfully', 201);
    }
    
    // GET /api/packages/:packageId/quotations - Get all quotations
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM quotations WHERE package_id = ? ORDER BY generated_date DESC");
        $stmt->execute([$packageId]);
        
        Response::success([
            'package_id' => $packageId,
            'quotations' => $stmt->fetchAll()
        ]);
    }
    
    // GET /api/packages/:packageId/quotations/:quotationId - Get specific quotation
    elseif ($method === 'GET' && count($segments) === 4 && is_numeric($segments[3])) {
        $quotationId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT q.*, g.full_name as guest_name, tp.package_name FROM quotations q JOIN travel_packages tp ON q.package_id = tp.package_id JOIN guests g ON tp.guest_id = g.guest_id WHERE q.quotation_id = ? AND q.package_id = ?");
        $stmt->execute([$quotationId, $packageId]);
        $quotation = $stmt->fetch();
        
        if (!$quotation) {
            Response::notFound('Quotation not found');
        }
        
        $quotation['package_details'] = [
            'guest_name' => $quotation['guest_name'],
            'package_name' => $quotation['package_name']
        ];
        unset($quotation['guest_name'], $quotation['package_name']);
        
        Response::success($quotation);
    }
    
    // GET /api/packages/:packageId/quotations/:quotationId/pdf - Download PDF
    elseif ($method === 'GET' && count($segments) === 5 && $segments[4] === 'pdf' && is_numeric($segments[3])) {
        $quotationId = (int)$segments[3];
        
        $stmt = $pdo->prepare("SELECT quotation_pdf_path FROM quotations WHERE quotation_id = ? AND package_id = ?");
        $stmt->execute([$quotationId, $packageId]);
        $quotation = $stmt->fetch();
        
        if (!$quotation || !$quotation['quotation_pdf_path'] || !file_exists($quotation['quotation_pdf_path'])) {
            Response::notFound('PDF not found');
        }
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="quotation-' . $quotationId . '.pdf"');
        readfile($quotation['quotation_pdf_path']);
        exit;
    }
    
    // POST /api/packages/:packageId/quotations/:quotationId/send - Send quotation
    elseif ($method === 'POST' && count($segments) === 5 && $segments[4] === 'send' && is_numeric($segments[3])) {
        $quotationId = (int)$segments[3];
        
        $stmt = $pdo->prepare("UPDATE quotations SET status = 'sent', sent_date = NOW() WHERE quotation_id = ? AND package_id = ?");
        $stmt->execute([$quotationId, $packageId]);
        
        $stmt = $pdo->prepare("SELECT quotation_id, status, sent_date FROM quotations WHERE quotation_id = ?");
        $stmt->execute([$quotationId]);
        
        Response::success([
            'quotation_id' => $quotationId,
            'status' => 'sent',
            'sent_date' => date('Y-m-d H:i:s'),
            'message' => 'Quotation sent successfully'
        ]);
    }
    
    // PATCH /api/packages/:packageId/quotations/:quotationId/status - Update status
    elseif ($method === 'PATCH' && count($segments) === 5 && $segments[4] === 'status' && is_numeric($segments[3])) {
        $quotationId = (int)$segments[3];
        validateRequired($data, ['status']);
        
        $stmt = $pdo->prepare("UPDATE quotations SET status = ? WHERE quotation_id = ? AND package_id = ?");
        $stmt->execute([$data['status'], $quotationId, $packageId]);
        
        $stmt = $pdo->prepare("SELECT quotation_id, status FROM quotations WHERE quotation_id = ?");
        $stmt->execute([$quotationId]);
        Response::success($stmt->fetch(), 'Status updated successfully');
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

