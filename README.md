# Tourism Management System

A comprehensive tourism management system with package creation, guest management, payment processing, and analytics.

## Project Structure

```
/
├── api/              # RESTful API backend
├── assets/           # CSS and JavaScript assets
│   ├── css/
│   └── js/
├── database/         # SQL schema files
├── docs/             # Documentation (organized by category)
├── scripts/          # Setup and utility scripts
├── tests/            # Test files
├── uploads/          # File uploads (passports, receipts, etc.)
└── [frontend pages]/ # HTML pages organized by feature
```

**See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed structure documentation.**

## Quick Start

1. **Database Setup**
   ```bash
   mysql -u root -p < database/tourism_schema.sql
   ```

2. **Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

3. **Run Setup Script**
   ```bash
   php scripts/setup-users.php
   ```

4. **Start Server**
   - XAMPP: Start Apache and MySQL
   - Or use: `php scripts/start-server.bat` (Windows) / `scripts/start-server.sh` (Linux/Mac)

5. **Access Application**
   - Login: http://localhost/KAHRA/login/login.html
   - Default credentials: admin / OAM@2025

## Documentation

- **[Documentation Index](docs/README.md)** - Start here for all documentation
- [Quick Start Guide](docs/setup/QUICK_START.md)
- [Setup Instructions](docs/setup/SETUP.md)
- [Frontend Documentation](docs/FRONTEND_README.md)
- [API Documentation](api/README.md)
- [Security Documentation](docs/security/SECURITY_FIXES_APPLIED.md)
- [Deployment Guide](docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md)
- [Project Structure](PROJECT_STRUCTURE.md)

## Features

- ✅ Guest and Client Management
- ✅ Travel Package Creation (Wizard-based)
- ✅ Payment Processing with Receipt Upload
- ✅ Contract Generation and PDF Download
- ✅ Quotation Management
- ✅ Analytics Dashboard
- ✅ User Management System

## System Requirements

- PHP 8.0+
- MySQL 5.7+ or MariaDB 10.3+
- Apache with mod_rewrite (or Nginx)
- Modern web browser

## Security

- All passwords hashed with bcrypt
- SQL injection prevention (prepared statements)
- XSS protection
- File upload security
- Environment-based configuration
- Security headers enabled

**See [Security Documentation](docs/security/SECURITY_FIXES_APPLIED.md) for details.**

## License

Proprietary - Tourism Management System

---

# Database Schema Documentation
