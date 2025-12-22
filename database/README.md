# Database Schema Files

This directory contains all database schema files for the Tourism Management System.

## Files

### `DEPLOYMENT_SCHEMA.sql` ⭐ **USE THIS FOR PRODUCTION**
Complete database schema with:
- All 11 tables
- Default admin user (password: OAM@2025)
- All indexes and foreign keys
- Ready for production deployment

**Usage:**
```bash
mysql -u root -p < database/DEPLOYMENT_SCHEMA.sql
```

---

### `tourism_schema.sql`
Original complete schema file (includes default admin with old password)

**Usage:**
```bash
mysql -u root -p < database/tourism_schema.sql
```

**Note:** After running, change the admin password using:
```bash
php scripts/setup-users.php
```

---

### `add_users_table.sql`
Standalone script to add users table only (if needed separately)

**Usage:**
```bash
mysql -u root -p tourism_db < database/add_users_table.sql
```

---

## Database Structure

### Tables (11 total)

1. **guests** - Guest/client information
2. **travel_packages** - Main package entity
3. **air_travel** - Air travel details
4. **accommodations** - Accommodation bookings
5. **tours** - Tour bookings
6. **visas** - Visa applications
7. **timeline_steps** - Workflow tracking
8. **contracts** - Contract management
9. **payments** - Payment records
10. **quotations** - Quotation management
11. **users** - User authentication

### Default Admin User

After running the schema:
- **Username:** `admin`
- **Password:** `OAM@2025` (in DEPLOYMENT_SCHEMA.sql)
- **Email:** `admin@tourism.com`
- **Role:** `admin`

**⚠️ IMPORTANT:** Change the admin password immediately after deployment!

---

## Deployment Steps

1. **Create Database**
   ```bash
   mysql -u root -p < database/DEPLOYMENT_SCHEMA.sql
   ```

2. **Verify Tables**
   ```bash
   mysql -u root -p -e "USE tourism_db; SHOW TABLES;"
   ```

3. **Change Admin Password** (recommended)
   ```bash
   php scripts/setup-users.php
   ```
   Or update directly in database using bcrypt hash

4. **Configure .env File**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Set `ENVIRONMENT=production`

---

## Schema Details

See [README.md](../README.md) for detailed database schema documentation.

---

## Notes

- All tables use `utf8mb4` character set for full Unicode support
- All foreign keys use `ON DELETE CASCADE`
- All primary keys are `INT UNSIGNED AUTO_INCREMENT`
- Decimal fields use `DECIMAL(12, 2)` for currency (supports up to 9,999,999,999.99)
- All timestamps use `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

**Last Updated:** December 21, 2025

