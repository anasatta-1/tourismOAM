# Test Files Removal Guide

## Test Files to Remove in Production

The following test files should be removed or protected before going live:

### Root Directory
- `test-api.html` - API connection test page

### API Directory
- `api/test-api.php` - Basic API test
- `api/test-connection.php` - Database connection test
- `api/test-auth.php` - Authentication test
- `api/debug-router.php` - Router debugging tool

## Options

### Option 1: Delete Files (Recommended for Production)
Simply delete these files after testing is complete.

### Option 2: Restrict Access via .htaccess
Uncomment the test file restrictions in `api/.htaccess`:
```apache
<FilesMatch "^(test-|debug-).*\.(php|html)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

### Option 3: Move to Protected Directory
Move test files to a directory outside web root or protect with authentication.

## Current Status

Test files are currently accessible. Choose one of the options above before production deployment.

