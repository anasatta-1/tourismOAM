# Quick Start Guide - Fix "Failed to fetch" Error

## The Problem
When you open `test-api.html` directly in the browser (file://), it cannot connect to the API because:
- Browsers block file:// to http:// requests (CORS)
- The API URL becomes `file:///api` which doesn't work

## Solution: Use a Web Server

### Option 1: PHP Built-in Server (Easiest)

1. **Open terminal/command prompt**
2. **Navigate to your project directory:**
   ```bash
   cd "D:\New folder (2)\tourismOAM-main"
   ```

3. **Start PHP server:**
   ```bash
   php -S localhost:8000
   ```

4. **Open in browser:**
   ```
   http://localhost:8000/test-api.html
   ```

5. **Test API:**
   ```
   http://localhost:8000/api/test-api.php
   ```

### Option 2: XAMPP/WAMP

1. **Copy project to htdocs/www:**
   - XAMPP: `C:\xampp\htdocs\tourismOAM-main\`
   - WAMP: `C:\wamp64\www\tourismOAM-main\`

2. **Start Apache in XAMPP/WAMP**

3. **Open in browser:**
   ```
   http://localhost/tourismOAM-main/test-api.html
   ```

### Option 3: Manual API URL (If server is on different port)

1. Open `test-api.html`
2. Enter your API URL in the input field:
   ```
   http://localhost:8000/api
   ```
3. Click "Set API URL"

## Database Setup

1. **Create database:**
   ```bash
   mysql -u root -p < database/tourism_schema.sql
   ```

2. **Configure database in `api/config.php`:**
   ```php
   'host' => 'localhost',
   'dbname' => 'tourism_db',
   'username' => 'root',
   'password' => 'your_password',
   ```

3. **Test database connection:**
   ```
   http://localhost:8000/api/test-connection.php
   ```

## Verify Everything Works

1. **Test API directly:**
   - Open: `http://localhost:8000/api/test-api.php`
   - Should see: `{"success": true, "message": "API is working!"}`

2. **Test database:**
   - Open: `http://localhost:8000/api/test-connection.php`
   - Should see database tables list

3. **Test from test page:**
   - Open: `http://localhost:8000/test-api.html`
   - Click "Run All Tests"
   - All tests should pass ✓

## Common Issues

### Issue: "Failed to fetch"
**Cause:** Opening HTML file directly (file://)
**Fix:** Use a web server (see options above)

### Issue: "Database connection failed"
**Cause:** Wrong credentials or database not created
**Fix:** 
1. Check `api/config.php` credentials
2. Run `database/tourism_schema.sql` to create database
3. Verify MySQL is running

### Issue: "404 Not Found"
**Cause:** Wrong URL path
**Fix:** 
- Check if `.htaccess` is working
- Try direct file: `http://localhost:8000/api/test-api.php`
- Check Apache mod_rewrite is enabled

### Issue: "CORS policy blocked"
**Cause:** CORS headers not set
**Fix:** Already handled in `api/Response.php` - check if headers are being sent

## Next Steps

Once connection works:
1. Test creating a guest
2. Test creating a package
3. Test the wizard endpoint
4. Check database to see inserted data

