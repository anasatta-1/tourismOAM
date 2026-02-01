# Production Hosting Checklist

## 🔴 CRITICAL - Must Change Before Hosting

### 1. **Disable Error Display** ⚠️ SECURITY RISK
**File:** `api/index.php`
- Currently shows all errors to users
- **Action:** Disable error display in production

### 2. **Change Default Admin Password** ⚠️ SECURITY RISK
**File:** `users_table.sql`
- Default password: `admin123`
- **Action:** Change immediately after first login

### 3. **Update Database Credentials**
**File:** `api/config.php`
- Currently uses default `root` user with no password
- **Action:** Use environment variables or secure credentials

### 4. **Restrict CORS** ⚠️ SECURITY RISK
**File:** `api/Response.php`
- Currently allows all origins (`*`)
- **Action:** Restrict to your domain only

### 5. **Create Upload Directories**
**Action:** Create and set permissions:
- `uploads/passports/` (755)
- `uploads/receipts/` (755)
- `uploads/quotations/` (755)
- `uploads/contracts/` (755)

## 🟡 IMPORTANT - Should Change

### 6. **Remove Test Files**
- `test-api.html`
- `test-api.php`
- `test-connection.php`
- `test-auth.php`
- `debug-router.php`
- Or restrict access via `.htaccess`

### 7. **Set Proper File Permissions**
- `api/config.php` → 600 (read/write owner only)
- Upload directories → 755
- PHP files → 644

### 8. **Enable HTTPS**
- Force HTTPS redirects
- Update API URLs to use HTTPS

### 9. **Add Logging**
- Log errors to file (not display)
- Log authentication attempts
- Log API access

### 10. **Environment Detection**
- Detect production vs development
- Auto-disable debug features

## 🟢 RECOMMENDED - Best Practices

### 11. **Add Rate Limiting**
- Prevent API abuse
- Limit login attempts

### 12. **Add Session Management**
- Implement proper session handling
- Add logout functionality

### 13. **Input Sanitization**
- Already using prepared statements (good!)
- Add additional validation layers

### 14. **Backup Strategy**
- Database backups
- File upload backups

### 15. **Monitoring**
- Error monitoring
- Performance monitoring
- Uptime monitoring

---

## Quick Fix Script

Run these commands after deployment:

```bash
# Create upload directories
mkdir -p uploads/{passports,receipts,quotations,contracts}
chmod 755 uploads uploads/*

# Secure config file
chmod 600 api/config.php

# Remove test files (optional)
# rm test-api.html api/test-*.php api/debug-router.php
```

