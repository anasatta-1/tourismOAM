# Test Files - Development Only

⚠️ **WARNING: These files should NOT be accessible in production!**

## Test Files in this Directory

- `test-api.php` - Basic API connectivity test
- `test-connection.php` - Database connection test  
- `test-auth.php` - Authentication endpoint test
- `debug-router.php` - Router debugging tool

## Production Deployment

Before deploying to production:

1. **Delete these files**, OR
2. **Restrict access** by uncommenting the test file restrictions in `.htaccess`, OR
3. **Move files** outside the web root

## Restricting Access

Uncomment these lines in `api/.htaccess`:

```apache
<FilesMatch "^(test-|debug-).*\.(php|html)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

## Development Use

These files are safe to use in development for:
- Testing API connectivity
- Debugging routing issues
- Verifying database connections
- Testing authentication

