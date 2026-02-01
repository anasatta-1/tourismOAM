# How to Change Default Admin Password

## ⚠️ CRITICAL SECURITY STEP

The default admin credentials are:
- **Username**: `admin`
- **Password**: `admin123`

**You MUST change this password before deploying to production!**

---

## Method 1: Via Database (Recommended for Production)

### Step 1: Connect to Database
```bash
mysql -u root -p tourism_db
```

### Step 2: Update Password Hash
```sql
-- Generate a secure password hash first (use PHP or bcrypt online tool)
-- Or use this PHP one-liner:
-- php -r "echo password_hash('YourNewSecurePassword123!', PASSWORD_BCRYPT, ['cost' => 12]);"

-- Update the admin password
UPDATE users 
SET password_hash = '$2y$12$YourGeneratedHashHere' 
WHERE username = 'admin';

-- Verify the change
SELECT username, email FROM users WHERE username = 'admin';
```

### Step 3: Test Login
- Logout if currently logged in
- Try logging in with new password
- If it works, you're done!

---

## Method 2: Via PHP Script

Create a temporary file `change-admin-password.php` in the project root:

```php
<?php
require_once 'api/Database.php';
require_once 'api/helpers.php';

$pdo = Database::getInstance()->getConnection();

// Set your new password here
$newPassword = 'YourNewSecurePassword123!';

// Hash the password
$passwordHash = hashPassword($newPassword);

// Update in database
$stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'");
$stmt->execute([$passwordHash]);

echo "Password updated successfully!\n";
echo "New password: $newPassword\n";
echo "⚠️ DELETE THIS FILE IMMEDIATELY AFTER USE!\n";
?>
```

Run it:
```bash
php change-admin-password.php
```

**⚠️ IMPORTANT: Delete the file immediately after use!**

---

## Method 3: Via API (If Authentication Already Working)

If you have API access and authentication is working:

```bash
# First, login to get a token
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Then update password (you'll need to implement a password change endpoint)
# OR use the database method above
```

---

## Password Requirements

For production, use a strong password:
- **Minimum 16 characters** (recommended: 20+)
- Mix of uppercase and lowercase letters
- Numbers
- Special characters (!@#$%^&*)
- Not a dictionary word
- Not related to your business/organization

**Example strong password**: `Tr@v3l@dm1n!2024$ecure`

---

## Verification Checklist

After changing the password:

- [ ] Can login with new password
- [ ] Cannot login with old password (`admin123`)
- [ ] Password change script/file deleted (if used Method 2)
- [ ] Documented new password securely (password manager, secure notes)
- [ ] Shared with authorized personnel only

---

## Additional Security Recommendations

1. **Create Separate Admin Accounts**: Create individual accounts for each admin user instead of sharing one account
2. **Enable Two-Factor Authentication**: If possible, implement 2FA for admin accounts
3. **Regular Password Rotation**: Change passwords every 90 days
4. **Use Password Manager**: Store passwords in a secure password manager
5. **Audit Logging**: Monitor admin login attempts and activities

---

## Emergency: Locked Out

If you're locked out and can't remember the password:

1. Use database Method 1 above to reset password
2. Or restore from backup if recent change was made
3. Contact system administrator

---

**Last Updated**: December 21, 2025

