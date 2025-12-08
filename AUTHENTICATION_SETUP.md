# Authentication Setup with bcrypt

## Overview
A complete authentication system has been added to the Tourism Management System with bcrypt password hashing.

## What Was Added

### 1. Database Table
- **File**: `users_table.sql`
- **Table**: `users`
- **Features**:
  - Username and email (both unique)
  - Password hash (bcrypt)
  - User roles (admin, staff, user)
  - Active status
  - Last login tracking

### 2. Authentication API Endpoints
- **File**: `api/endpoints/auth.php`
- **Endpoints**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/verify` - Verify password
  - `POST /api/auth/change-password` - Change password
  - `GET /api/auth/check` - Check if user exists

### 3. Frontend Integration
- **Updated**: `login/login.js` - Now uses API authentication
- **Updated**: `login/login.html` - Includes api-service.js
- **Updated**: `api-service.js` - Added auth methods

## Setup Instructions

### Step 1: Create Users Table
Run the SQL migration:
```sql
-- Execute users_table.sql in your MySQL/MariaDB database
```

Or manually run:
```bash
mysql -u root -p tourism_db < users_table.sql
```

### Step 2: Default Admin User
A default admin user is created with:
- **Username**: `admin`
- **Email**: `admin@tourism.com`
- **Password**: `admin123`
- **Role**: `admin`

**⚠️ IMPORTANT**: Change the default password after first login!

### Step 3: Test Login
1. Navigate to `/login/login.html`
2. Use credentials:
   - Username: `admin` (or `admin@tourism.com`)
   - Password: `admin123`

## API Usage Examples

### Login
```javascript
const response = await api.login('admin', 'admin123');
// Returns: { success: true, data: { user: {...}, message: 'Login successful' } }
```

### Register New User
```javascript
const response = await api.register({
    username: 'newuser',
    email: 'user@example.com',
    password: 'password123',
    full_name: 'New User',
    role: 'user' // optional, defaults to 'user'
});
```

### Change Password
```javascript
const response = await api.changePassword('admin', 'oldpassword', 'newpassword');
```

## Security Features

1. **bcrypt Password Hashing**
   - Uses PHP's `password_hash()` with bcrypt
   - Cost factor: 12 (good balance of security and performance)
   - Passwords are never stored in plain text

2. **Password Verification**
   - Uses `password_verify()` for secure comparison
   - Prevents timing attacks

3. **Input Validation**
   - Email format validation
   - Password strength (minimum 6 characters)
   - Username/email uniqueness checks

4. **User Status**
   - Only active users can login
   - Inactive users are blocked

## Password Hashing Details

The system uses PHP's built-in `password_hash()` function with bcrypt:
- **Algorithm**: bcrypt
- **Cost**: 12 rounds
- **Format**: `$2y$10$...` (bcrypt identifier)

Example hash generation:
```php
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
```

Example verification:
```php
if (password_verify($password, $storedHash)) {
    // Password is correct
}
```

## Frontend Storage

- **Remember Me**: Uses `localStorage` (persists across sessions)
- **No Remember Me**: Uses `sessionStorage` (cleared on browser close)
- **Stored Data**: User object (without password hash)

## Next Steps

1. ✅ Run the SQL migration to create users table
2. ✅ Test login with default admin credentials
3. ⚠️ Change default admin password
4. 🔒 Consider adding session management for protected routes
5. 🔒 Consider adding JWT tokens for stateless authentication
6. 🔒 Add password reset functionality
7. 🔒 Add account lockout after failed attempts

## Troubleshooting

### "User not found" error
- Make sure the users table exists
- Verify the default admin user was created
- Check database connection

### "Invalid password" error
- Verify you're using the correct password
- Check if user account is active (`is_active = TRUE`)

### API connection errors
- Check CORS settings in `api/Response.php`
- Verify API base URL in `api-service.js`
- Check browser console for detailed errors

