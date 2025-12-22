# Project Structure

This document describes the organized structure of the Tourism Management System project.

## Directory Organization

```
KAHRA/
├── api/                          # Backend API
│   ├── endpoints/               # API endpoint handlers
│   ├── index.php               # API router
│   ├── Database.php            # Database connection
│   ├── Response.php            # Response handler
│   ├── helpers.php             # Utility functions
│   ├── config.php              # Configuration (uses .env)
│   ├── .htaccess              # Apache configuration
│   └── README.md              # API documentation
│
├── assets/                      # Static assets
│   ├── css/
│   │   └── styles.css         # Global stylesheet
│   └── js/
│       └── api-service.js     # API client library
│
├── database/                    # Database files
│   ├── tourism_schema.sql     # Main database schema
│   └── add_users_table.sql    # Users table addition
│
├── docs/                        # Documentation
│   ├── deployment/            # Deployment guides
│   │   ├── PRE_DEPLOYMENT_CHECKLIST.md
│   │   ├── DEPLOYMENT_PRIORITY_SUMMARY.md
│   │   └── PRODUCTION_DEPLOYMENT_NOTES.md
│   ├── security/              # Security documentation
│   │   ├── SECURITY_FIXES_APPLIED.md
│   │   ├── SECURITY_SUMMARY.md
│   │   └── CHANGE_ADMIN_PASSWORD.md
│   ├── setup/                 # Setup guides
│   │   ├── SETUP.md
│   │   ├── QUICK_START.md
│   │   └── LOGIN_CREDENTIALS.md
│   ├── testing/               # Test documentation
│   │   ├── COMPLETE_WORKFLOW_TEST_REPORT.md
│   │   ├── WORKFLOW_TESTING_SUMMARY.md
│   │   └── PDF_FIX_NOTES.md
│   ├── troubleshooting/       # Troubleshooting guides
│   │   ├── TROUBLESHOOTING.md
│   │   └── FIXES_APPLIED.md
│   ├── FRONTEND_README.md     # Frontend documentation
│   ├── SYSTEM_VERIFICATION_REPORT.md
│   └── README.md              # Documentation index
│
├── scripts/                     # Utility scripts
│   ├── setup-users.php        # User table setup
│   ├── verify-system.php      # System verification
│   ├── start-server.bat       # Windows server start
│   └── start-server.sh        # Linux/Mac server start
│
├── tests/                       # Test files
│   ├── test-api.html
│   ├── test-api-simple.html
│   ├── test-connection.html
│   └── verify-setup.html
│
├── uploads/                     # User uploads (gitignored)
│   ├── passports/
│   ├── receipts/
│   ├── quotations/
│   └── contracts/
│
├── logs/                        # Log files (gitignored)
│   └── php-errors.log
│
├── [frontend pages]/            # Feature-based directories
│   ├── login/                  # Login page
│   ├── dashboard/              # Main dashboard
│   ├── wizard/                 # Package creation wizard
│   ├── analytics/              # Analytics dashboard
│   ├── settings/               # Settings pages
│   │   └── user-management/   # User management
│   ├── contract/               # Contract management
│   ├── quotation/              # Quotation management
│   ├── data-entry/             # Data entry (deprecated)
│   └── package-management/     # Package management (disabled)
│
├── .env                        # Environment configuration (gitignored)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── README.md                   # Main project README
└── PROJECT_STRUCTURE.md        # This file
```

## File Path Conventions

### Asset References
All HTML files reference assets using relative paths:
- **1 level deep** (e.g., `wizard/`): `../assets/css/styles.css`, `../assets/js/api-service.js`
- **2 levels deep** (e.g., `settings/user-management/`): `../../assets/css/styles.css`, `../../assets/js/api-service.js`
- **Tests directory**: `../assets/js/api-service.js`

### API References
API endpoints are accessed via `/api/` route. The `api-service.js` automatically detects the correct base URL.

### Database Files
- Schema files are in `database/` directory
- Scripts reference: `../database/tourism_schema.sql`

### Scripts
- Utility scripts are in `scripts/` directory
- They reference API files using: `../api/...`

## Key Files

### Configuration
- `.env` - Environment variables (create from `.env.example`)
- `api/config.php` - Database and API configuration
- `api/.htaccess` - Apache rewrite rules and headers

### Entry Points
- `login/login.html` - Application entry point
- `api/index.php` - API entry point

### Documentation
- Start with `docs/README.md` for documentation index
- `README.md` in root for quick start
- Feature-specific docs in respective `docs/` subdirectories

## Important Notes

1. **Never commit**:
   - `.env` file (contains sensitive credentials)
   - `uploads/` directory (user-uploaded files)
   - `logs/` directory (log files)

2. **Database Setup**:
   - Run `database/tourism_schema.sql` to create schema
   - Run `scripts/setup-users.php` to create admin user

3. **Environment**:
   - Copy `.env.example` to `.env` and configure
   - Set `ENVIRONMENT=production` for production deployment

4. **Documentation**:
   - All docs moved to `docs/` directory
   - See `docs/README.md` for categorized documentation

## Migration Notes

If you're updating from the old structure:

1. **Assets**: Moved from root to `assets/css/` and `assets/js/`
   - All HTML files updated automatically
   
2. **Documentation**: Moved to `docs/` with subdirectories
   - See `docs/README.md` for new locations
   
3. **SQL Files**: Moved to `database/` directory
   - Update any scripts that reference them
   
4. **Test Files**: Moved to `tests/` directory
   - Update any references if needed
   
5. **Scripts**: Moved to `scripts/` directory
   - Path references in scripts updated automatically

