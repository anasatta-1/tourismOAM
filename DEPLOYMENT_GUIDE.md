# Production Deployment Guide

## Quick Start

1. **Run Setup Script**
   ```bash
   # Linux/Mac
   chmod +x setup-production.sh
   ./setup-production.sh
   
   # Windows
   setup-production.bat
   ```

2. **Configure Environment**
   - Edit `api/.env` with your production settings
   - Set `PRODUCTION=true`
   - Update database credentials
   - Set `ALLOWED_ORIGINS` to your domain

3. **Database Setup**
   - Import `tourism_schema.sql`
   - Import `users_table.sql`
   - **CHANGE DEFAULT ADMIN PASSWORD IMMEDIATELY**

4. **File Permissions**
   ```bash
   chmod 755 uploads uploads/*
   chmod 755 logs
   chmod 600 api/config.php
   chmod 600 api/.env
   ```

5. **Enable HTTPS**
   - Uncomment HTTPS redirect in root `.htaccess`
   - Update API URLs to use HTTPS

## Critical Security Changes Made

✅ **Error Display Disabled** - Errors logged, not shown to users
✅ **CORS Configurable** - Can restrict to specific domains
✅ **Database Error Masking** - Production errors don't expose details
✅ **Upload Directory Protection** - PHP execution blocked in uploads
✅ **Sensitive File Protection** - Config files protected via .htaccess

## Files Modified

- `api/index.php` - Production error handling
- `api/Response.php` - Configurable CORS
- `api/Database.php` - Error masking in production
- `api/.htaccess` - Security headers added
- `.htaccess` - Root security rules
- `uploads/.htaccess` - Upload protection
- `logs/.htaccess` - Log protection

## Files Created

- `PRODUCTION_CHECKLIST.md` - Complete checklist
- `DEPLOYMENT_GUIDE.md` - This file
- `api/.env.example` - Environment template
- `setup-production.sh` - Linux/Mac setup script
- `setup-production.bat` - Windows setup script

## Post-Deployment Checklist

- [ ] Database credentials updated
- [ ] Default admin password changed
- [ ] CORS restricted to your domain
- [ ] HTTPS enabled and forced
- [ ] Test files removed or protected
- [ ] File permissions set correctly
- [ ] Error logging working
- [ ] Upload directories writable
- [ ] Backup strategy in place

## Testing Production

1. Test login with new admin password
2. Test file uploads
3. Test API endpoints
4. Verify errors are logged (not displayed)
5. Check CORS restrictions
6. Verify HTTPS redirects

## Troubleshooting

**Uploads not working?**
- Check directory permissions (755)
- Check PHP upload_max_filesize
- Check directory exists

**API errors?**
- Check `logs/php-errors.log`
- Verify database connection
- Check CORS settings

**CORS issues?**
- Update `ALLOWED_ORIGINS` in `.env`
- Check `.htaccess` headers
- Verify domain matches exactly

