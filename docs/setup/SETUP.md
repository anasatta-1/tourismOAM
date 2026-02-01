# Database and Web Connection Setup Guide

This guide will help you connect your database to the web application.

## Step 1: Database Setup

1. **Create the database:**
   ```bash
   mysql -u root -p < database/tourism_schema.sql
   ```

2. **Verify database creation:**
   ```bash
   mysql -u root -p -e "USE tourism_db; SHOW TABLES;"
   ```

## Step 2: API Configuration

1. **Configure database connection:**
   - Edit `api/config.php`
   - Update database credentials:
     ```php
     'host' => 'localhost',
     'dbname' => 'tourism_db',
     'username' => 'your_username',
     'password' => 'your_password',
     ```

2. **Or use environment variables:**
   ```bash
   export DB_HOST=localhost
   export DB_NAME=tourism_db
   export DB_USER=your_username
   export DB_PASS=your_password
   ```

## Step 3: Web Server Configuration

### Apache Setup

1. **Enable mod_rewrite:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. **Ensure .htaccess is allowed:**
   - Edit `/etc/apache2/sites-available/000-default.conf`
   - Add inside `<VirtualHost>`:
     ```apache
     <Directory /var/www/html>
         AllowOverride All
     </Directory>
     ```

3. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

### Nginx Setup

1. **Add location block to your Nginx config:**
   ```nginx
   location /api {
       try_files $uri $uri/ /api/index.php?$query_string;
   }
   
   location ~ \.php$ {
       fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
       fastcgi_index index.php;
       include fastcgi_params;
       fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
   }
   ```

## Step 4: File Permissions

1. **Create upload directories:**
   ```bash
   mkdir -p uploads/passports uploads/receipts uploads/quotations uploads/contracts
   chmod -R 755 uploads/
   ```

2. **Set API directory permissions:**
   ```bash
   chmod -R 755 api/
   ```

## Step 5: Test the Connection

1. **Test API endpoint:**
   ```bash
   curl http://localhost/api/guests
   ```
   Should return JSON response.

2. **Test from browser:**
   - Open: `http://localhost/api/guests`
   - Should see JSON response

3. **Test frontend:**
   - Open: `http://localhost/wizard/wizard.html`
   - Fill out the form and submit
   - Check browser console for any errors

## Step 6: Troubleshooting

### Database Connection Issues

1. **Check database credentials:**
   ```php
   // Test in api/test-db.php
   <?php
   require_once 'Database.php';
   $pdo = Database::getInstance()->getConnection();
   echo "Connected successfully!";
   ?>
   ```

2. **Check MySQL is running:**
   ```bash
   sudo systemctl status mysql
   ```

### API Not Responding

1. **Check PHP errors:**
   ```bash
   tail -f /var/log/apache2/error.log
   ```

2. **Test PHP execution:**
   ```bash
   php -r "echo 'PHP is working';"
   ```

3. **Check .htaccess:**
   - Ensure mod_rewrite is enabled
   - Check file permissions

### CORS Issues

- The API already includes CORS headers
- If issues persist, check browser console
- Ensure API base URL matches in `api-service.js`

## Step 7: Verify Everything Works

1. **Create a guest via API:**
   ```bash
   curl -X POST http://localhost/api/guests \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Test User",
       "phone_number": "+1234567890",
       "country_of_residence": "United States"
     }'
   ```

2. **Create a package via Wizard:**
   - Open wizard page
   - Fill all steps
   - Submit form
   - Check database for new records

3. **Check database:**
   ```sql
   SELECT * FROM guests;
   SELECT * FROM travel_packages;
   ```

## API Base URL Configuration

The API service automatically detects the base URL. If you need to change it:

1. Edit `api-service.js`:
   ```javascript
   const API_BASE_URL = 'http://your-domain.com/api';
   ```

2. Or set it dynamically:
   ```javascript
   const api = new ApiService('http://your-domain.com/api');
   ```

## Next Steps

- Customize API endpoints as needed
- Add authentication if required
- Set up SSL/HTTPS for production
- Configure backup for database
- Set up monitoring and logging

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check server error logs
3. Verify database connection
4. Test API endpoints directly with curl/Postman

