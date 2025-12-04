# Troubleshooting "Failed to fetch" Error

## Common Causes and Solutions

### 1. API Server Not Running

**Problem:** PHP server is not running or not accessible.

**Solution:**
```bash
# Check if PHP is running
php -v

# Start PHP built-in server (for testing)
cd api
php -S localhost:8000

# Or use Apache/Nginx
sudo systemctl status apache2
# or
sudo systemctl status nginx
```

**Test:**
- Open: `http://localhost/api/test-api.php`
- Should see JSON response

---

### 2. Wrong API URL

**Problem:** The API base URL is incorrect.

**Check:**
1. Open browser console (F12)
2. Look for the actual URL being called
3. Verify it matches your server setup

**Fix:**
Edit `api-service.js`:
```javascript
// If your API is in a subdirectory
const API_BASE_URL = window.location.origin + '/tourismOAM-main/api';

// Or if using a different port
const API_BASE_URL = 'http://localhost:8000/api';
```

---

### 3. CORS Issues

**Problem:** Browser blocking cross-origin requests.

**Symptoms:**
- Error in console: "CORS policy blocked"
- Works in Postman but not browser

**Solution:**
The API already includes CORS headers. If still having issues:

1. Check `.htaccess` is working:
```apache
# In api/.htaccess
Header set Access-Control-Allow-Origin "*"
```

2. Verify PHP headers are sent:
```php
// In api/Response.php (already done)
header('Access-Control-Allow-Origin: *');
```

3. Test with:
```bash
curl -H "Origin: http://localhost" http://localhost/api/test-api.php
```

---

### 4. .htaccess Not Working

**Problem:** URL rewriting not working, API routes not found.

**Symptoms:**
- 404 errors
- "Endpoint not found"

**Solution:**

**For Apache:**
```bash
# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Check AllowOverride in Apache config
# Should be: AllowOverride All
```

**For Nginx:**
Add to nginx config:
```nginx
location /api {
    try_files $uri $uri/ /api/index.php?$query_string;
}
```

**Test:**
- `http://localhost/api/test-api.php` should work
- `http://localhost/api/guests` should route to index.php

---

### 5. PHP Errors

**Problem:** PHP errors preventing API from responding.

**Check:**
```bash
# Check PHP error log
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/php-fpm/error.log
```

**Enable error display (development only):**
Edit `api/index.php`:
```php
ini_set('display_errors', '1');
error_reporting(E_ALL);
```

**Common PHP errors:**
- Database connection failed
- Missing PHP extensions (PDO, pdo_mysql)
- File permissions

---

### 6. Database Connection Issues

**Problem:** Database not accessible or wrong credentials.

**Test:**
```bash
# Test database connection
php api/test-connection.php
```

**Check:**
1. Database exists: `tourism_db`
2. Credentials in `api/config.php` are correct
3. MySQL is running:
```bash
sudo systemctl status mysql
```

---

### 7. File Permissions

**Problem:** PHP can't read/write files.

**Fix:**
```bash
# Set proper permissions
chmod -R 755 api/
chmod -R 755 uploads/
chown -R www-data:www-data api/ uploads/
```

---

### 8. Network/Firewall Issues

**Problem:** Firewall blocking requests.

**Check:**
```bash
# Test if port is accessible
curl http://localhost/api/test-api.php

# Check firewall
sudo ufw status
```

---

## Step-by-Step Debugging

### Step 1: Test Basic Connection
1. Open `test-api.html` in browser
2. Click "Test Basic Connection"
3. Check results

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Go to Network tab
5. Try submitting form
6. Check the failed request:
   - Status code
   - Response body
   - Request URL

### Step 3: Test API Directly
```bash
# Test with curl
curl -X POST http://localhost/api/guests \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","phone_number":"+123","country_of_residence":"US"}'
```

### Step 4: Check Server Logs
```bash
# Apache error log
tail -f /var/log/apache2/error.log

# PHP error log
tail -f /var/log/php8.0-fpm.log
```

### Step 5: Verify File Structure
```
tourismOAM-main/
├── api/
│   ├── index.php          ✓
│   ├── .htaccess          ✓
│   ├── config.php         ✓
│   ├── Database.php       ✓
│   ├── Response.php       ✓
│   └── endpoints/         ✓
├── wizard/
│   ├── wizard.html        ✓
│   └── wizard.js          ✓
└── api-service.js         ✓
```

---

## Quick Fixes

### Fix 1: Use Absolute URL
Edit `api-service.js`:
```javascript
// Instead of relative
const API_BASE_URL = 'http://localhost/api';
// or
const API_BASE_URL = 'http://your-domain.com/api';
```

### Fix 2: Enable Error Display
Edit `api/index.php`:
```php
ini_set('display_errors', '1');
error_reporting(E_ALL);
```

### Fix 3: Test with Simple Endpoint
Create `api/simple-test.php`:
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(['success' => true, 'message' => 'API works!']);
?>
```

Then test: `http://localhost/api/simple-test.php`

---

## Still Not Working?

1. **Check browser console** - Most errors show there
2. **Use test-api.html** - Run all diagnostic tests
3. **Check server logs** - PHP/Apache errors
4. **Test with Postman/curl** - Isolate if it's browser or server
5. **Verify file paths** - All files in correct locations
6. **Check PHP version** - Need PHP 8.0+
7. **Verify database** - Connection and schema

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch" | Network/CORS | Check server running, CORS headers |
| "404 Not Found" | Wrong URL | Verify API path, check .htaccess |
| "500 Internal Server Error" | PHP error | Check error logs, database connection |
| "CORS policy blocked" | CORS issue | Verify CORS headers in Response.php |
| "NetworkError" | Server down | Start PHP server, check Apache/Nginx |

---

## Need More Help?

1. Check browser console for detailed errors
2. Use `test-api.html` for diagnostics
3. Test API endpoints directly with curl
4. Check server error logs
5. Verify all files are in correct locations

