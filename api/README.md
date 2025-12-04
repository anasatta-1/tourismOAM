# Tourism Management System - RESTful API

A lightweight, fast micro RESTful API built with PHP 8 for the Tourism Management System.

## Features

- **Micro Framework**: Minimal overhead for fast execution
- **RESTful Design**: Follows REST principles
- **PHP 8**: Uses modern PHP 8 features
- **PDO**: Secure database access with prepared statements
- **CORS Support**: Built-in CORS headers
- **File Upload**: Support for passport images and payment receipts
- **Comprehensive Endpoints**: All CRUD operations for all entities

## Requirements

- PHP 8.0 or higher
- MySQL 5.7+ or MariaDB 10.3+
- Apache with mod_rewrite enabled (or Nginx with proper configuration)
- PDO MySQL extension

## Installation

1. **Database Setup**
   ```sql
   mysql -u root -p < ../tourism_schema.sql
   ```

2. **Configuration**
   Edit `api/config.php` or set environment variables:
   ```php
   DB_HOST=localhost
   DB_NAME=tourism_db
   DB_USER=your_username
   DB_PASS=your_password
   ```

3. **Directory Permissions**
   ```bash
   chmod -R 755 api/
   mkdir -p uploads/passports uploads/receipts uploads/quotations uploads/contracts
   chmod -R 755 uploads/
   ```

4. **Apache Configuration**
   Ensure `.htaccess` is enabled and mod_rewrite is active.

## API Base URL

```
http://your-domain.com/api
```

## Endpoints Overview

### 1. Guest Management
- `POST /api/guests` - Create guest
- `GET /api/guests` - List guests
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest
- `PATCH /api/guests/:id/status` - Update status
- `POST /api/guests/:id/passport` - Upload passport
- `GET /api/guests/:id/packages` - Get guest packages

### 2. Travel Packages
- `POST /api/packages` - Create package
- `POST /api/packages/wizard` - Create package with all components
- `GET /api/packages` - List packages
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `PUT /api/packages/:id/wizard` - Update package with all components
- `DELETE /api/packages/:id` - Delete package
- `GET /api/packages/:id/total-cost` - Get total cost
- `POST /api/packages/:id/recalculate` - Recalculate cost

### 3. Air Travel
- `POST /api/packages/:id/air-travel` - Create air travel
- `GET /api/packages/:id/air-travel` - Get air travel
- `PUT /api/packages/:id/air-travel` - Update air travel
- `DELETE /api/packages/:id/air-travel` - Delete air travel

### 4. Accommodations
- `POST /api/packages/:id/accommodations` - Create accommodation
- `GET /api/packages/:id/accommodations` - List accommodations
- `GET /api/packages/:id/accommodations/:accId` - Get accommodation
- `PUT /api/packages/:id/accommodations/:accId` - Update accommodation
- `DELETE /api/packages/:id/accommodations/:accId` - Delete accommodation

### 5. Tours
- `POST /api/packages/:id/tours` - Create tour
- `GET /api/packages/:id/tours` - List tours
- `GET /api/packages/:id/tours/:tourId` - Get tour
- `PUT /api/packages/:id/tours/:tourId` - Update tour
- `DELETE /api/packages/:id/tours/:tourId` - Delete tour

### 6. Visas
- `POST /api/packages/:id/visas` - Create visa
- `GET /api/packages/:id/visas` - List visas
- `GET /api/packages/:id/visas/:visaId` - Get visa
- `PUT /api/packages/:id/visas/:visaId` - Update visa
- `DELETE /api/packages/:id/visas/:visaId` - Delete visa
- `GET /api/visas/types` - Get visa types

### 7. Timeline Steps
- `GET /api/packages/:id/timeline` - Get timeline
- `POST /api/packages/:id/timeline/steps` - Initialize steps
- `PATCH /api/packages/:id/timeline/steps/:stepName` - Update step
- `GET /api/packages/:id/timeline/steps/:stepName` - Get step

### 8. Quotations
- `POST /api/packages/:id/quotations` - Generate quotation
- `GET /api/packages/:id/quotations` - List quotations
- `GET /api/packages/:id/quotations/:quotationId` - Get quotation
- `GET /api/packages/:id/quotations/:quotationId/pdf` - Download PDF
- `POST /api/packages/:id/quotations/:quotationId/send` - Send quotation
- `PATCH /api/packages/:id/quotations/:quotationId/status` - Update status

### 9. Contracts
- `POST /api/packages/:id/contracts` - Generate contract
- `GET /api/packages/:id/contracts` - Get contract
- `GET /api/packages/:id/contracts/pdf` - Download PDF
- `POST /api/packages/:id/contracts/send` - Send contract
- `PATCH /api/packages/:id/contracts/confirm` - Confirm contract
- `PATCH /api/packages/:id/contracts/status` - Update status

### 10. Payments
- `POST /api/packages/:id/payments` - Create payment
- `GET /api/packages/:id/payments` - List payments
- `GET /api/packages/:id/payments/:paymentId` - Get payment
- `PUT /api/packages/:id/payments/:paymentId` - Update payment
- `POST /api/packages/:id/payments/:paymentId/receipt` - Upload receipt
- `GET /api/packages/:id/payments/:paymentId/receipt` - Get receipt

### 11. Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/sales/monthly` - Monthly sales
- `GET /api/analytics/sales/quarterly` - Quarterly sales
- `GET /api/analytics/sales/yearly` - Yearly sales
- `GET /api/analytics/sales/by-airline` - Sales by airline
- `GET /api/analytics/sales/by-destination` - Sales by destination

### 12. Options
- `GET /api/options/countries` - Get countries
- `GET /api/options/cities` - Get cities
- `GET /api/options/airports` - Get airports
- `GET /api/options/airlines` - Get airlines
- `GET /api/options/bed-types` - Get bed types
- `GET /api/options/accommodation-types` - Get accommodation types
- `GET /api/options/visa-types` - Get visa types

### 13. File Upload
- `POST /api/upload/passport` - Upload passport image
- `POST /api/upload/receipt` - Upload payment receipt

### 14. File Serving
- `GET /api/files/:filePath` - Get uploaded file

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Example Usage

### Create Guest
```bash
curl -X POST http://localhost/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone_number": "+1234567890",
    "country_of_residence": "United States"
  }'
```

### Create Package with Wizard
```bash
curl -X POST http://localhost/api/packages/wizard \
  -H "Content-Type: application/json" \
  -d '{
    "guest": {
      "full_name": "John Doe",
      "phone_number": "+1234567890",
      "country_of_residence": "United States"
    },
    "air_travel": {
      "departure_country": "United States",
      "departure_city": "New York",
      "departure_airport": "JFK",
      "destination_country": "France",
      "destination_city": "Paris",
      "destination_airport": "CDG",
      "departure_date": "2024-06-01",
      "trip_duration_days": 7,
      "trip_duration_nights": 6,
      "estimated_cost": 1500.00
    }
  }'
```

## Performance

This micro API is designed for fast execution:
- Minimal dependencies
- Direct PDO connections
- Efficient routing
- Optimized queries
- No heavy frameworks

## Security

- Prepared statements (SQL injection prevention)
- Input validation
- File upload validation
- Directory traversal protection
- CORS configuration

## License

Proprietary - Tourism Management System

