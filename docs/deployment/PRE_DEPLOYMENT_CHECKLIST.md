# Pre-Deployment Checklist
## Tourism Management System

This document outlines all steps required before deploying to production.

---

## 🔴 Critical Security Items

### 1. Environment Configuration
- [ ] **Create `.env` file for production** (DO NOT commit to git)
  ```env
  DB_HOST=your_production_db_host
  DB_NAME=your_production_db_name
  DB_USER=your_production_db_user
  DB_PASS=your_secure_production_password
  ENVIRONMENT=production
  ```
- [ ] **Update `api/config.php`** to prioritize environment variables
  - Currently supports `$_ENV` but verify it's working
  - Ensure no hardcoded credentials exist
- [ ] **Verify `.env` is in `.gitignore`** ✅ (Already ignored)

### 2. Error Reporting & Debugging
- [ ] **Disable error display in production**
  - File: `api/index.php`
  - Change:
    ```php
    // CURRENT (Development):
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    
    // PRODUCTION (Change to):
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/../logs/php-errors.log');
    ```
- [ ] **Create logs directory** (outside web root if possible)
  ```bash
  mkdir -p logs
  chmod 755 logs
  chown www-data:www-data logs
  ```
- [ ] **Remove debug code**
  - Remove/comment out any `console.log()` statements with sensitive data
  - Remove test files (or move to separate directory)

### 3. CORS Configuration
- [ ] **Restrict CORS to specific origins**
  - File: `api/.htaccess`
  - Change from `*` to your actual domain:
    ```apache
    # CURRENT:
    Header set Access-Control-Allow-Origin "*"
    
    # PRODUCTION (Replace with your domain):
    Header set Access-Control-Allow-Origin "https://yourdomain.com"
    ```
  - If multiple domains needed, handle in PHP (see `api/index.php`)

### 4. Security Headers
- [ ] **Add production security headers**
  - File: `api/index.php` or `api/.htaccess`
  - Add to Response.php or index.php:
    ```php
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    header('Content-Security-Policy: default-src \'self\'');
    ```
  - Or in `.htaccess`:
    ```apache
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    ```

### 5. HTTPS Enforcement
- [ ] **Configure HTTPS/SSL certificate**
  - Set up SSL certificate (Let's Encrypt, etc.)
  - Redirect HTTP to HTTPS in `.htaccess`:
    ```apache
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    ```
- [ ] **Update API base URL in frontend**
  - File: `api-service.js`
  - Ensure it uses HTTPS in production

### 6. Default Credentials
- [ ] **Change default admin password**
  - Current: `admin` / `admin123`
  - File: `LOGIN_CREDENTIALS.md` - Document the change
  - Use strong password (min 16 characters, mixed case, numbers, symbols)
- [ ] **Remove or disable default admin account** (optional, if not needed)
- [ ] **Create production admin account** with secure credentials

### 7. File Upload Security
- [ ] **Verify upload directories exist**
  ```bash
  mkdir -p uploads/passports uploads/receipts uploads/quotations uploads/contracts
  chmod 755 uploads/
  chmod 755 uploads/passports uploads/receipts uploads/quotations uploads/contracts
  ```
- [ ] **Set proper file permissions**
  ```bash
  chown -R www-data:www-data uploads/
  ```
- [ ] **Ensure uploads are outside web root** (if possible)
  - Currently in project root, consider moving to `/var/www/uploads/` or similar
- [ ] **Add `.htaccess` to uploads directories** to prevent execution:
  ```apache
  # uploads/.htaccess
  Options -ExecCGI
  AddHandler cgi-script .php .pl .py .jsp .asp .sh .cgi
  ```
- [ ] **Review file upload validation**
  - File: `api/helpers.php` - `handleFileUpload()` function
  - Ensure MIME type validation is strict
  - Consider adding virus scanning (if available)

---

## 🟡 Important Configuration Items

### 8. Database Configuration
- [ ] **Use production database credentials**
  - Update `api/config.php` or set environment variables
  - Use strong database password
  - Use dedicated database user (not root)
- [ ] **Test database connection** with production credentials
- [ ] **Backup existing production database** (if migrating)
- [ ] **Run database schema** on production:
  ```bash
  mysql -u production_user -p production_db < database/tourism_schema.sql
  ```
- [ ] **Verify all tables created correctly**
  ```sql
  USE production_db;
  SHOW TABLES;
  ```

### 9. API Base URL Configuration
- [ ] **Update frontend API base URL**
  - File: `api-service.js`
  - Ensure `getApiBaseUrl()` returns production URL
  - Or set explicitly:
    ```javascript
    const API_BASE_URL = 'https://yourdomain.com/api';
    ```
- [ ] **Test API endpoints** are accessible from frontend domain

### 10. Authentication & Sessions
- [ ] **Implement JWT tokens** (currently using simple base64)
  - File: `api/endpoints/auth.php`
  - Replace base64 encoding with JWT
  - Add token expiration
  - Implement refresh tokens
- [ ] **Add rate limiting** for login endpoint
  - Prevent brute force attacks
  - Implement in `api/index.php` or use middleware
- [ ] **Session configuration**
  - Set secure cookie flags
  - Set appropriate session timeout

### 11. Web Server Configuration

#### Apache
- [ ] **Enable required modules**
  ```bash
  sudo a2enmod rewrite
  sudo a2enmod headers
  sudo systemctl restart apache2
  ```
- [ ] **Configure `.htaccess` AllowOverride**
  - Ensure `AllowOverride All` in Apache config
- [ ] **Set proper directory permissions**
  ```bash
  chown -R www-data:www-data /path/to/project
  chmod -R 755 /path/to/project
  ```

#### Nginx
- [ ] **Configure Nginx location blocks** (if using Nginx)
  - See `SETUP.md` for Nginx configuration example
- [ ] **Configure PHP-FPM** properly

### 12. PHP Configuration
- [ ] **Review PHP settings** in `php.ini`
  - `upload_max_filesize` = 10M (or as needed)
  - `post_max_size` = 10M (or as needed)
  - `max_execution_time` = 300 (or as needed)
  - `memory_limit` = 256M (or as needed)
- [ ] **Verify PHP version** is 8.0 or higher
  ```bash
  php -v
  ```
- [ ] **Enable required PHP extensions**
  - PDO
  - pdo_mysql
  - json
  - mbstring

---

## 🟢 Performance & Monitoring

### 13. Performance Optimization
- [ ] **Enable PHP OPcache** (if available)
- [ ] **Configure caching headers** (for static assets)
- [ ] **Review and optimize database queries**
- [ ] **Consider adding database indexes** (if needed for performance)
- [ ] **Minify JavaScript/CSS** (optional, for production)

### 14. Monitoring & Logging
- [ ] **Set up error logging**
  - Configure PHP error log path
  - Set up log rotation
- [ ] **Set up application monitoring** (optional)
  - Error tracking (Sentry, etc.)
  - Performance monitoring
  - Uptime monitoring
- [ ] **Create log monitoring scripts** (optional)

### 15. Backup Strategy
- [ ] **Set up database backups**
  - Daily automated backups
  - Retention policy (7 days, 30 days, etc.)
- [ ] **Backup uploads directory**
  - Include in backup strategy
- [ ] **Test backup restoration** process
- [ ] **Document backup procedures**

---

## 🔵 Testing & Verification

### 16. Pre-Deployment Testing
- [ ] **End-to-end workflow test**
  - Create guest via wizard
  - Process payment
  - Download contract PDF
  - Upload receipt
  - Verify guest→client conversion
- [ ] **Test all API endpoints**
  - Use Postman or similar tool
  - Verify all CRUD operations work
- [ ] **Test file uploads**
  - Passport images
  - Payment receipts
  - Verify file restrictions work
- [ ] **Test authentication**
  - Login with production credentials
  - Verify session management
- [ ] **Cross-browser testing**
  - Chrome, Firefox, Safari, Edge
- [ ] **Mobile responsiveness testing**
- [ ] **PDF generation testing**
  - Verify contract PDFs download correctly
  - Verify PDFs are complete and readable

### 17. Security Testing
- [ ] **SQL injection testing**
  - Try malicious inputs in all forms
- [ ] **XSS testing**
  - Try script injection in text fields
- [ ] **CSRF testing** (if CSRF protection added)
- [ ] **File upload security testing**
  - Try uploading malicious files
  - Try uploading oversized files
- [ ] **Authentication testing**
  - Test brute force protection (if implemented)
  - Test session timeout

---

## 🟣 Documentation & Maintenance

### 18. Documentation
- [ ] **Update README.md** with production URLs
- [ ] **Document production environment** details
- [ ] **Create deployment runbook**
  - Step-by-step deployment instructions
  - Rollback procedures
- [ ] **Document environment variables** required
- [ ] **Create troubleshooting guide** for common production issues

### 19. Maintenance Tasks
- [ ] **Set up regular security updates**
  - PHP updates
  - Server OS updates
  - Dependency updates
- [ ] **Plan for regular database maintenance**
  - Optimize tables
  - Check for orphaned records
- [ ] **Set up log rotation**
  - PHP error logs
  - Apache/Nginx logs
  - Application logs

### 20. Cleanup
- [ ] **Remove test data** from production database
- [ ] **Remove test files** (if any)
  - `test-api.html`
  - `test-connection.html`
  - `verify-setup.html`
  - Or move to `/tests/` directory
- [ ] **Remove debug/test documentation** (or move to separate docs)
- [ ] **Clean up temporary files** in uploads directory
- [ ] **Remove `.git` directory** (if not using git on production server)

---

## 📋 Quick Reference: Files to Modify

1. **`api/index.php`**
   - Disable error display
   - Enable error logging
   - Add security headers

2. **`api/.htaccess`**
   - Restrict CORS origins
   - Add security headers
   - Add HTTPS redirect

3. **`api/config.php`**
   - Ensure environment variables are used
   - Remove hardcoded credentials (if any)

4. **`api-service.js`**
   - Update API base URL for production
   - Ensure HTTPS is used

5. **`uploads/.htaccess`** (create if doesn't exist)
   - Prevent PHP execution in uploads

6. **`.env`** (create)
   - Production database credentials
   - Environment settings

---

## 🚨 Critical Pre-Launch Checklist

Before going live, verify:

- [ ] All security items (sections 1-7) are completed
- [ ] Error display is disabled
- [ ] CORS is restricted
- [ ] HTTPS is configured and enforced
- [ ] Default passwords are changed
- [ ] Database backups are configured
- [ ] All tests pass
- [ ] Documentation is updated

---

## 📞 Support & Rollback Plan

### Rollback Procedure
1. Restore database backup
2. Revert code changes (git reset or file restore)
3. Restart web server
4. Verify system is operational

### Emergency Contacts
- [ ] Document who to contact for issues
- [ ] Document escalation procedures

---

## ✅ Sign-Off

- [ ] **Development Team**: Reviewed and approved
- [ ] **Security Team**: Security review completed
- [ ] **QA Team**: Testing completed and approved
- [ ] **Operations Team**: Infrastructure ready
- [ ] **Product Owner**: Business approval for launch

---

**Last Updated**: December 21, 2025
**Version**: 1.0

