# Production Deployment Notes

## Quick Deployment Checklist

Use this as a quick reference when deploying to production.

---

## Before Deployment

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with production values:
  - Set `ENVIRONMENT=production`
  - Update database credentials
  - Set `CORS_ORIGIN` to your production domain
- [ ] Verify `.env` is in `.gitignore` ✅

### 2. Error Configuration
✅ **Already configured** - `api/index.php` now checks `ENVIRONMENT` variable
- Set `ENVIRONMENT=production` in `.env` to disable error display
- Errors will be logged to `logs/php-errors.log`

### 3. CORS Configuration
- [ ] Update `CORS_ORIGIN` in `.env` to your production domain
- [ ] OR update `api/.htaccess` line 18 with your domain
- [ ] OR update `api/Response.php` if using custom logic

**Example:**
```env
CORS_ORIGIN=https://yourdomain.com
```

### 4. Security Headers
✅ **Already added** - Security headers are now in `api/Response.php`
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (when HTTPS is enabled)

### 5. HTTPS Configuration
- [ ] Obtain SSL certificate (Let's Encrypt, commercial, etc.)
- [ ] Configure SSL in web server (Apache/Nginx)
- [ ] Uncomment HTTPS redirect in `api/.htaccess`:
  ```apache
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```
- [ ] Update `api-service.js` if API base URL is hardcoded

### 6. Database Setup
- [ ] Create production database
- [ ] Run schema: `mysql -u user -p dbname < database/tourism_schema.sql`
- [ ] Update database credentials in `.env`
- [ ] Test database connection
- [ ] Create dedicated database user (not root) with minimal permissions

### 7. File Upload Security
✅ **Already configured** - `.htaccess` files added to uploads directories
- `uploads/.htaccess` ✅
- `uploads/passports/.htaccess` ✅
- `uploads/receipts/.htaccess` ✅
- `uploads/quotations/.htaccess` ✅
- `uploads/contracts/.htaccess` ✅

### 8. Directory Permissions
```bash
# Set proper ownership
chown -R www-data:www-data /path/to/project

# Set directory permissions
find /path/to/project -type d -exec chmod 755 {} \;

# Set file permissions
find /path/to/project -type f -exec chmod 644 {} \;

# Make logs and uploads writable
chmod -R 755 logs/ uploads/
```

### 9. Admin Password
- [ ] Change default admin password (`admin`/`admin123`)
- [ ] See `CHANGE_ADMIN_PASSWORD.md` for instructions
- [ ] Use strong password (16+ characters)

### 10. Error Logging
✅ **Already configured** - Logs directory created
- [ ] Verify `logs/` directory exists and is writable
- [ ] Check `logs/php-errors.log` is being created
- [ ] Set up log rotation (optional but recommended)

---

## Post-Deployment Verification

### Quick Tests
1. [ ] Visit production URL - should load without errors
2. [ ] Check browser console - no JavaScript errors
3. [ ] Try login with new admin password
4. [ ] Test API endpoint: `https://yourdomain.com/api/test-api.php`
5. [ ] Check error logs: `logs/php-errors.log` (should exist but be empty for normal operations)
6. [ ] Verify HTTPS redirect works (HTTP → HTTPS)
7. [ ] Test file upload (passport image, receipt)
8. [ ] Test complete workflow (create guest → payment → client conversion)

### Security Verification
1. [ ] Errors don't display sensitive information
2. [ ] CORS only allows your domain
3. [ ] HTTPS is enforced
4. [ ] Default password no longer works
5. [ ] Uploaded files cannot be executed as PHP

---

## Environment Variables Reference

Create `.env` file with these variables:

```env
# Environment
ENVIRONMENT=production

# Database
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASS=your_secure_password

# CORS
CORS_ORIGIN=https://yourdomain.com

# Optional: API Base URL (if needed)
API_BASE_URL=https://yourdomain.com/api
```

---

## Important Files Modified

### Security Fixes Applied
1. ✅ `api/index.php` - Environment-aware error handling
2. ✅ `api/Response.php` - Security headers and CORS configuration
3. ✅ `api/.htaccess` - Security headers, HTTPS redirect (commented)
4. ✅ `uploads/*/.htaccess` - Prevent PHP execution in uploads
5. ✅ `.gitignore` - Updated to ignore logs

### New Files Created
1. ✅ `.env.example` - Environment configuration template
2. ✅ `logs/.gitkeep` - Ensures logs directory exists
3. ✅ `CHANGE_ADMIN_PASSWORD.md` - Password change instructions
4. ✅ `PRODUCTION_DEPLOYMENT_NOTES.md` - This file

---

## Common Issues

### Issue: CORS errors after deployment
**Solution**: Update `CORS_ORIGIN` in `.env` or `.htaccess` with your production domain

### Issue: Errors still displaying
**Solution**: Verify `ENVIRONMENT=production` is set in `.env`

### Issue: Cannot write to logs directory
**Solution**: 
```bash
chmod 755 logs/
chown www-data:www-data logs/
```

### Issue: File uploads failing
**Solution**: 
```bash
chmod -R 755 uploads/
chown -R www-data:www-data uploads/
```

---

## Rollback Procedure

If something goes wrong:

1. **Restore code**: `git checkout <previous-commit>`
2. **Restore database**: Restore from backup
3. **Restart services**: Restart Apache/Nginx and PHP-FPM
4. **Verify**: Test that everything works

---

## Support

For detailed information, see:
- `PRE_DEPLOYMENT_CHECKLIST.md` - Complete checklist
- `DEPLOYMENT_PRIORITY_SUMMARY.md` - Priority items
- `CHANGE_ADMIN_PASSWORD.md` - Password change guide
- `api/SECURITY.md` - Security documentation

---

**Last Updated**: December 21, 2025

