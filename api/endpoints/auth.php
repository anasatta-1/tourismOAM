<?php
/**
 * Authentication Endpoints with bcrypt password hashing
 */

function handleAuth($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    // POST /api/auth/login - User login
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'login') {
        validateRequired($data, ['username', 'password']);
        
        $username = trim($data['username']);
        $password = $data['password'];
        
        // Find user by username or email
        $stmt = $pdo->prepare("SELECT user_id, username, email, password_hash, full_name, role, is_active FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::error('Invalid username or password', 401);
        }
        
        // Verify password using bcrypt
        if (!password_verify($password, $user['password_hash'])) {
            Response::error('Invalid username or password', 401);
        }
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        
        // Return user data (without password)
        unset($user['password_hash']);
        Response::success([
            'user' => $user,
            'message' => 'Login successful'
        ]);
    }
    
    // POST /api/auth/register - User registration
    elseif ($method === 'POST' && count($segments) === 2 && $segments[1] === 'register') {
        validateRequired($data, ['username', 'email', 'password', 'full_name']);
        
        $username = trim($data['username']);
        $email = trim($data['email']);
        $password = $data['password'];
        $fullName = trim($data['full_name']);
        $role = $data['role'] ?? 'user';
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }
        
        // Validate password strength (minimum 6 characters)
        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters long', 400);
        }
        
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            Response::error('Username already exists', 409);
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error('Email already exists', 409);
        }
        
        // Hash password using bcrypt
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$username, $email, $passwordHash, $fullName, $role]);
        
        $userId = $pdo->lastInsertId();
        
        // Get created user (without password)
        $stmt = $pdo->prepare("SELECT user_id, username, email, full_name, role, is_active, created_at FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        Response::success([
            'user' => $user,
            'message' => 'User registered successfully'
        ], 'User registered successfully', 201);
    }
    
    // POST /api/auth/verify - Verify password (for password changes, etc.)
    elseif ($method === 'POST' && count($segments) === 2 && $segments[1] === 'verify') {
        validateRequired($data, ['username', 'password']);
        
        $username = trim($data['username']);
        $password = $data['password'];
        
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::error('User not found', 404);
        }
        
        $isValid = password_verify($password, $user['password_hash']);
        
        Response::success([
            'valid' => $isValid,
            'message' => $isValid ? 'Password is valid' : 'Password is invalid'
        ]);
    }
    
    // POST /api/auth/change-password - Change password
    elseif ($method === 'POST' && count($segments) === 2 && $segments[1] === 'change-password') {
        validateRequired($data, ['username', 'current_password', 'new_password']);
        
        $username = trim($data['username']);
        $currentPassword = $data['current_password'];
        $newPassword = $data['new_password'];
        
        // Validate new password strength
        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters long', 400);
        }
        
        // Get user and verify current password
        $stmt = $pdo->prepare("SELECT user_id, password_hash FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::error('User not found', 404);
        }
        
        if (!password_verify($currentPassword, $user['password_hash'])) {
            Response::error('Current password is incorrect', 401);
        }
        
        // Hash new password
        $newPasswordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Update password
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
        $stmt->execute([$newPasswordHash, $user['user_id']]);
        
        Response::success(['message' => 'Password changed successfully']);
    }
    
    // GET /api/auth/check - Check if user exists
    elseif ($method === 'GET' && count($segments) === 2 && $segments[1] === 'check') {
        $username = $queryParams['username'] ?? '';
        $email = $queryParams['email'] ?? '';
        
        if (empty($username) && empty($email)) {
            Response::error('Username or email required', 400);
        }
        
        $where = [];
        $params = [];
        
        if (!empty($username)) {
            $where[] = "username = ?";
            $params[] = $username;
        }
        
        if (!empty($email)) {
            $where[] = "email = ?";
            $params[] = $email;
        }
        
        $stmt = $pdo->prepare("SELECT user_id, username, email FROM users WHERE " . implode(' OR ', $where));
        $stmt->execute($params);
        $user = $stmt->fetch();
        
        Response::success([
            'exists' => $user !== false,
            'user' => $user ?: null
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

