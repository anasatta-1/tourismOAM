# Login Credentials

## Default Admin Account

After running the SQL schema, a default admin account is created:

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@tourism.com`
- **Role:** `admin`

## ⚠️ IMPORTANT SECURITY NOTE

**Change the default password immediately after first login!**

The default password is for initial setup only. In a production environment, you should:

1. Change the admin password immediately
2. Create additional user accounts with appropriate roles
3. Disable or remove the default admin account if not needed
4. Implement proper password policies

## Creating New Users

You can create new users via the API:

```javascript
// Example: Create a new staff user
await api.register({
    username: 'staff1',
    email: 'staff1@tourism.com',
    password: 'securepassword123',
    full_name: 'Staff Member',
    role: 'staff' // or 'manager' or 'admin'
});
```

Or directly in the database:

```sql
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES (
    'username',
    'email@example.com',
    '$2y$10$...', -- Use password_hash() PHP function or bcrypt
    'Full Name',
    'staff'
);
```

## User Roles

- **admin**: Full access to all features
- **manager**: Can manage packages, guests, and view analytics
- **staff**: Limited access (can be customized based on your needs)

## Password Hashing

Passwords are hashed using PHP's `password_hash()` function with bcrypt algorithm. When creating users manually, make sure to hash passwords properly:

```php
$passwordHash = password_hash('yourpassword', PASSWORD_DEFAULT);
```

