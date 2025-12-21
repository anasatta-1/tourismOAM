<?php
/**
 * Contracts Endpoints
 */

function handleContracts($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // POST /api/packages/:packageId/contracts - Generate contract
    if ($method === 'POST' && count($segments) === 3) {
        // Get guest info
        $stmt = $pdo->prepare("SELECT g.* FROM guests g JOIN travel_packages tp ON g.guest_id = tp.guest_id WHERE tp.package_id = ?");
        $stmt->execute([$packageId]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            Response::notFound('Package or guest not found');
        }
        
        // Generate PDF path (mock - in production, generate actual PDF with template)
        $contractNumber = 'CONTRACT-' . date('Y') . '-' . str_pad($packageId, 4, '0', STR_PAD_LEFT);
        $pdfPath = __DIR__ . '/../../uploads/contracts/' . $contractNumber . '.pdf';
        if (!is_dir(dirname($pdfPath))) {
            mkdir(dirname($pdfPath), 0755, true);
        }
        
        $stmt = $pdo->prepare("INSERT INTO contracts (package_id, contract_template_path, contract_pdf_path, status, notes) VALUES (?, ?, ?, 'draft', ?) ON DUPLICATE KEY UPDATE contract_pdf_path = VALUES(contract_pdf_path), status = 'draft', notes = VALUES(notes)");
        $stmt->execute([
            $packageId, $data['contract_template_path'] ?? null, $pdfPath, $data['notes'] ?? null
        ]);
        
        $contractId = $pdo->lastInsertId();
        if (!$contractId) {
            $stmt = $pdo->prepare("SELECT contract_id FROM contracts WHERE package_id = ?");
            $stmt->execute([$packageId]);
            $contractId = $stmt->fetch()['contract_id'];
        }
        
        $stmt = $pdo->prepare("SELECT * FROM contracts WHERE contract_id = ?");
        $stmt->execute([$contractId]);
        $contract = $stmt->fetch();
        $contract['client_info'] = [
            'guest_id' => $guest['guest_id'],
            'full_name' => $guest['full_name'],
            'phone_number' => $guest['phone_number'],
            'country_of_residence' => $guest['country_of_residence']
        ];
        
        Response::success($contract, 'Contract generated successfully', 201);
    }
    
    // GET /api/packages/:packageId/contracts - Get contract
    elseif ($method === 'GET' && count($segments) === 3) {
        $stmt = $pdo->prepare("SELECT * FROM contracts WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $contract = $stmt->fetch();
        
        if (!$contract) {
            Response::notFound('Contract not found');
        }
        
        Response::success($contract);
    }
    
    // GET /api/packages/:packageId/contracts/pdf - Download PDF
    elseif ($method === 'GET' && count($segments) === 4 && $segments[3] === 'pdf') {
        $stmt = $pdo->prepare("SELECT contract_pdf_path FROM contracts WHERE package_id = ?");
        $stmt->execute([$packageId]);
        $contract = $stmt->fetch();
        
        if (!$contract || !$contract['contract_pdf_path'] || !file_exists($contract['contract_pdf_path'])) {
            Response::notFound('PDF not found');
        }
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="contract-' . $packageId . '.pdf"');
        readfile($contract['contract_pdf_path']);
        exit;
    }
    
    // POST /api/packages/:packageId/contracts/send - Send contract
    elseif ($method === 'POST' && count($segments) === 4 && $segments[3] === 'send') {
        $stmt = $pdo->prepare("UPDATE contracts SET status = 'sent', sent_date = NOW() WHERE package_id = ?");
        $stmt->execute([$packageId]);
        
        $stmt = $pdo->prepare("SELECT contract_id, status, sent_date FROM contracts WHERE package_id = ?");
        $stmt->execute([$packageId]);
        
        Response::success([
            'contract_id' => $stmt->fetch()['contract_id'],
            'status' => 'sent',
            'sent_date' => date('Y-m-d H:i:s'),
            'message' => 'Contract sent successfully'
        ]);
    }
    
    // PATCH /api/packages/:packageId/contracts/confirm - Confirm contract
    elseif ($method === 'PATCH' && count($segments) === 4 && $segments[3] === 'confirm') {
        validateRequired($data, ['confirmed']);
        
        if ($data['confirmed']) {
            $stmt = $pdo->prepare("UPDATE contracts SET status = 'confirmed', confirmed_date = NOW() WHERE package_id = ?");
            $stmt->execute([$packageId]);
            
            $stmt = $pdo->prepare("SELECT contract_id, status, confirmed_date FROM contracts WHERE package_id = ?");
            $stmt->execute([$packageId]);
            
            Response::success([
                'contract_id' => $stmt->fetch()['contract_id'],
                'status' => 'confirmed',
                'confirmed_date' => date('Y-m-d H:i:s'),
                'message' => 'Contract confirmed successfully'
            ]);
        } else {
            Response::error('Contract confirmation failed', 400);
        }
    }
    
    // PATCH /api/packages/:packageId/contracts/status - Update status
    elseif ($method === 'PATCH' && count($segments) === 4 && $segments[3] === 'status') {
        validateRequired($data, ['status']);
        
        $stmt = $pdo->prepare("UPDATE contracts SET status = ? WHERE package_id = ?");
        $stmt->execute([$data['status'], $packageId]);
        
        $stmt = $pdo->prepare("SELECT contract_id, status FROM contracts WHERE package_id = ?");
        $stmt->execute([$packageId]);
        Response::success($stmt->fetch(), 'Status updated successfully');
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

