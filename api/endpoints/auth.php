<?php
/**
 * Authentication Endpoints
 */

function handleAuth($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    // POST /api/auth/login - User login
    if ($method === 'POST' && count($segments) === 1 && $segments[0] === 'login') {
        validateRequired($data, ['username', 'password']);
        
        // Sanitize username input (prevent SQL injection)
        $username = trim($data['username']);
        $password = $data['password'];
        
        // Find user by username or email (using prepared statement to prevent SQL injection)
        $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Generic error message to prevent user enumeration
            Response::error('Invalid username or password', 401);
        }
        
        // Verify password using bcrypt (timing-safe comparison)
        if (!verifyPassword($password, $user['password_hash'])) {
            // Generic error message to prevent user enumeration
            Response::error('Invalid username or password', 401);
        }
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        
        // Return user data (without password)
        unset($user['password_hash']);
        Response::success([
            'user' => $user,
            'token' => base64_encode($user['user_id'] . ':' . time()) // Simple token (in production, use JWT)
        ], 'Login successful');
    }
    
    // POST /api/auth/register - Register new user (admin only in production)
    elseif ($method === 'POST' && count($segments) === 1 && $segments[0] === 'register') {
        validateRequired($data, ['username', 'email', 'password', 'full_name']);
        
        // Validate and sanitize inputs (prevent SQL injection and XSS)
        $username = validateUsername($data['username']);
        $email = validateEmail($data['email']);
        $password = validatePassword($data['password']);
        $fullName = sanitizeInput($data['full_name']);
        $role = in_array($data['role'] ?? 'staff', ['admin', 'manager', 'staff']) ? ($data['role'] ?? 'staff') : 'staff';
        
        // Check if username or email already exists (using prepared statement)
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            Response::error('Username or email already exists', 400);
        }
        
        // Hash password using bcrypt with cost factor 12
        $passwordHash = hashPassword($password);
        
        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $username,
            $email,
            $passwordHash,
            $fullName,
            $role
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Get created user
        $stmt = $pdo->prepare("SELECT user_id, username, email, full_name, role, is_active, created_at FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        Response::success($user, 'User registered successfully', 201);
    }
    
    // GET /api/auth/me - Get current user (requires token in production)
    elseif ($method === 'GET' && count($segments) === 1 && $segments[0] === 'me') {
        // In production, verify token here
        // For now, return a placeholder
        Response::success(['message' => 'Authentication endpoint - implement token verification']);
    }
    
    else {
        Response::notFound('Auth endpoint not found');
    }
}

