<?php
/**
 * Timeline Steps Endpoints
 */

function handleTimelineSteps($method, $segments, $data, $queryParams, $packageId = null) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($packageId === null && count($segments) >= 2 && is_numeric($segments[1])) {
        $packageId = (int)$segments[1];
    }
    
    if (!$packageId) {
        Response::error('Package ID required', 400);
    }
    
    // GET /api/packages/:packageId/timeline - Get timeline
    if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'timeline') {
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ? ORDER BY timeline_step_id");
        $stmt->execute([$packageId]);
        $steps = $stmt->fetchAll();
        
        $completed = 0;
        foreach ($steps as $step) {
            if ($step['status'] === 'completed') {
                $completed++;
            }
        }
        $progress = count($steps) > 0 ? round(($completed / count($steps)) * 100) : 0;
        
        Response::success([
            'package_id' => $packageId,
            'timeline_steps' => $steps,
            'progress_percentage' => $progress
        ]);
    }
    
    // POST /api/packages/:packageId/timeline/steps - Initialize steps
    elseif ($method === 'POST' && count($segments) === 4 && $segments[2] === 'timeline' && $segments[3] === 'steps') {
        if (!empty($data['steps']) && is_array($data['steps'])) {
            $stmt = $pdo->prepare("INSERT INTO timeline_steps (package_id, step_name, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)");
            foreach ($data['steps'] as $step) {
                validateRequired($step, ['step_name']);
                $stmt->execute([$packageId, $step['step_name'], $step['status'] ?? 'pending']);
            }
        } else {
            initializeTimelineSteps($pdo, $packageId);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ?");
        $stmt->execute([$packageId]);
        Response::success([
            'package_id' => $packageId,
            'timeline_steps' => $stmt->fetchAll()
        ], 'Timeline steps initialized', 201);
    }
    
    // PATCH /api/packages/:packageId/timeline/steps/:stepName - Update step status
    elseif ($method === 'PATCH' && count($segments) === 5 && $segments[2] === 'timeline' && $segments[3] === 'steps') {
        $stepName = urldecode($segments[4]);
        validateRequired($data, ['status']);
        
        $completedDate = ($data['status'] === 'completed') ? date('Y-m-d H:i:s') : null;
        
        $stmt = $pdo->prepare("UPDATE timeline_steps SET status = ?, completed_date = ?, notes = ? WHERE package_id = ? AND step_name = ?");
        $stmt->execute([
            $data['status'],
            $completedDate,
            $data['notes'] ?? null,
            $packageId,
            $stepName
        ]);
        
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ? AND step_name = ?");
        $stmt->execute([$packageId, $stepName]);
        $step = $stmt->fetch();
        
        if (!$step) {
            Response::notFound('Timeline step not found');
        }
        
        Response::success($step, 'Timeline step updated successfully');
    }
    
    // GET /api/packages/:packageId/timeline/steps/:stepName - Get specific step
    elseif ($method === 'GET' && count($segments) === 5 && $segments[2] === 'timeline' && $segments[3] === 'steps') {
        $stepName = urldecode($segments[4]);
        
        $stmt = $pdo->prepare("SELECT * FROM timeline_steps WHERE package_id = ? AND step_name = ?");
        $stmt->execute([$packageId, $stepName]);
        $step = $stmt->fetch();
        
        if (!$step) {
            Response::notFound('Timeline step not found');
        }
        
        Response::success($step);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

