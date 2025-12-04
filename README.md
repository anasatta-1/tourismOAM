# Tourism Management System - Database Schema Documentation

This document provides detailed documentation for all tables and fields in the Tourism Management System database schema for MariaDB.

## Table of Contents

1. [Main Entities](#main-entities)
2. [Travel Components](#travel-components)
3. [Workflow & Business](#workflow--business)

---

## Main Entities

### guests

Stores guest/client information. Each customer starts as a guest and becomes a client after payment confirmation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| guest_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each guest/client |
| full_name | VARCHAR(200) | NOT NULL | Full name of the guest/client |
| phone_number | VARCHAR(20) | NOT NULL | Contact phone number |
| country_of_residence | VARCHAR(100) | NOT NULL | Country where the guest resides |
| passport_image_path | VARCHAR(500) | NULL | File path to uploaded passport image |
| status | ENUM | DEFAULT 'guest' | Status: 'guest' or 'client'. Changes from 'guest' to 'client' after payment |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

### travel_packages

Main entity representing a travel package/booking. Each package belongs to a guest and contains multiple components (air travel, accommodations, tours, visas).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| package_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each travel package |
| guest_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → guests(guest_id) | Reference to the guest/client who owns this package |
| package_name | VARCHAR(200) | NULL | Optional name for the travel package |
| total_estimated_cost | DECIMAL(12, 2) | DEFAULT 0.00 | Total estimated cost of the package (sum of all components) |
| status | ENUM | DEFAULT 'draft' | Package status: 'draft', 'quotation_sent', 'contract_sent', 'confirmed', 'completed', 'cancelled' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

---

## Travel Components

### air_travel

Stores airplane ticket details and travel preferences for each package.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| air_travel_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each air travel record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| departure_country | VARCHAR(100) | NOT NULL | Country of departure |
| departure_city | VARCHAR(100) | NOT NULL | City of departure |
| departure_airport | VARCHAR(200) | NOT NULL | Airport name of departure |
| destination_country | VARCHAR(100) | NOT NULL | Destination country |
| destination_city | VARCHAR(100) | NOT NULL | Destination city |
| destination_airport | VARCHAR(200) | NOT NULL | Airport name of destination |
| preferred_airline | VARCHAR(100) | NULL | Preferred airline name |
| number_of_adults | TINYINT UNSIGNED | DEFAULT 0 | Number of adult travelers |
| number_of_children | TINYINT UNSIGNED | DEFAULT 0 | Number of children travelers |
| number_of_infants | TINYINT UNSIGNED | DEFAULT 0 | Number of infant travelers |
| departure_date | DATE | NOT NULL | Date of departure |
| trip_duration_days | INT UNSIGNED | NOT NULL | Total number of days for the trip |
| trip_duration_nights | INT UNSIGNED | NOT NULL | Total number of nights for the trip |
| transit_time_hours | DECIMAL(5, 2) | NULL | Transit time in hours (if any) |
| time_of_travel | ENUM | DEFAULT 'AM' | Preferred time of travel: 'AM', 'PM', or 'Both' |
| lounges_access | BOOLEAN | DEFAULT FALSE | Whether lounge access is required |
| estimated_cost | DECIMAL(12, 2) | DEFAULT 0.00 | Estimated cost for air travel |
| notes | TEXT | NULL | Additional notes |

### accommodations

Stores stay accommodation details (Apartment, Villa, or Hotel).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| accommodation_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each accommodation record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| accommodation_type | ENUM | NOT NULL | Type: 'Apartment', 'Villa', or 'Hotel' |
| country | VARCHAR(100) | NOT NULL | Country where accommodation is located |
| city | VARCHAR(100) | NOT NULL | City where accommodation is located |
| number_of_bedrooms | TINYINT UNSIGNED | NOT NULL | Number of bedrooms |
| star_rating | TINYINT UNSIGNED | NULL | Star rating (1-5) for hotels only. NULL for apartments/villas |
| bed_type | VARCHAR(50) | NULL | Bed type (Queen, Twin, Single, Double, etc.). NULL for apartments/villas |
| cost | DECIMAL(12, 2) | NOT NULL | Cost of the accommodation |
| check_in_date | DATE | NOT NULL | Check-in date |
| check_out_date | DATE | NOT NULL | Check-out date |
| notes | TEXT | NULL | Additional notes |

### tours

Stores tour booking details including transfers.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| tour_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each tour record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| tour_type | ENUM | NOT NULL | Tour type: 'Group' or 'Private' |
| tour_number | VARCHAR(100) | NULL | Tour number if applicable |
| number_of_transfers | INT UNSIGNED | DEFAULT 0 | Number of Airport → Hotel transfers |
| country | VARCHAR(100) | NOT NULL | Country where tour takes place |
| city | VARCHAR(100) | NOT NULL | City where tour takes place |
| tour_description | TEXT | NULL | Description of the tour |
| cost | DECIMAL(12, 2) | DEFAULT 0.00 | Cost of the tour |
| tour_date | DATE | NULL | Date of the tour |
| notes | TEXT | NULL | Additional notes |

### visas

Stores visa application details and status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| visa_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each visa record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| visa_type | VARCHAR(100) | NOT NULL | Type of visa (e.g., "Tourist Visa", "Business Visa") |
| visa_status | ENUM | NOT NULL | Status: 'Pending', 'Done', 'Special Type', 'Rejected' |
| country | VARCHAR(100) | NOT NULL | Country the visa is for |
| cost | DECIMAL(12, 2) | DEFAULT 0.00 | Cost of the visa |
| special_notes | TEXT | NULL | Special notes or comments |

---

## Workflow & Business

### timeline_steps

Tracks workflow checkpoints/timeline steps for each package. Each package has multiple timeline steps that can be tracked through the booking process.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| timeline_step_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each timeline step record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| step_name | ENUM | NOT NULL | Step name: 'Guest Info Collection', 'Air Travel', 'Accommodations', 'Tours', 'Visa', 'Quotation Generation', 'Contract Stage', 'Payment Processing' |
| status | ENUM | DEFAULT 'pending' | Step status: 'pending', 'in_progress', 'completed', 'skipped' |
| completed_date | DATETIME | NULL | Date and time when step was completed |
| notes | TEXT | NULL | Additional notes for this step |

**Unique Constraint**: (package_id, step_name) - Ensures each step name appears only once per package.

### contracts

Stores contract information for travel packages.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| contract_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each contract |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| contract_template_path | VARCHAR(500) | NULL | File path to the contract template used |
| contract_pdf_path | VARCHAR(500) | NULL | File path to the generated contract PDF |
| status | ENUM | DEFAULT 'draft' | Contract status: 'draft', 'sent', 'confirmed', 'signed' |
| sent_date | DATETIME | NULL | Date and time when contract was sent to guest |
| confirmed_date | DATETIME | NULL | Date and time when contract was confirmed by guest |
| signed_date | DATETIME | NULL | Date and time when contract was signed |
| notes | TEXT | NULL | Additional notes |

**Unique Constraint**: (package_id) - Each package can have only one contract.

### payments

Stores payment receipts and transaction information.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| payment_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each payment record |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| payment_amount | DECIMAL(12, 2) | NOT NULL | Amount of the payment |
| payment_date | DATE | NOT NULL | Date of the payment |
| receipt_image_path | VARCHAR(500) | NULL | File path to uploaded payment receipt image |
| payment_method | VARCHAR(50) | NULL | Payment method used (e.g., "Bank Transfer", "Credit Card") |
| transaction_reference | VARCHAR(100) | NULL | Transaction reference number |
| notes | TEXT | NULL | Additional notes |

**Note**: A package can have multiple payment records for partial or installment payments.

### quotations

Stores generated quotation PDFs and their status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| quotation_id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each quotation |
| package_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → travel_packages(package_id) | Reference to the travel package |
| quotation_number | VARCHAR(50) | NOT NULL, UNIQUE | Unique quotation number/identifier |
| quotation_pdf_path | VARCHAR(500) | NULL | File path to the generated quotation PDF |
| total_amount | DECIMAL(12, 2) | NOT NULL | Total amount quoted |
| generated_date | DATETIME | NOT NULL | Date and time when quotation was generated |
| expiry_date | DATE | NULL | Expiry date of the quotation |
| status | ENUM | DEFAULT 'draft' | Quotation status: 'draft', 'sent', 'accepted', 'rejected', 'expired' |
| sent_date | DATETIME | NULL | Date and time when quotation was sent to guest |
| notes | TEXT | NULL | Additional notes |

---

## Relationships Summary

- **guests** → **travel_packages**: One guest can have multiple packages
- **travel_packages** → **air_travel**: One package can have one air travel record
- **travel_packages** → **accommodations**: One package can have multiple accommodations
- **travel_packages** → **tours**: One package can have multiple tours
- **travel_packages** → **visas**: One package can have multiple visas
- **travel_packages** → **timeline_steps**: One package has multiple timeline steps (one per step name)
- **travel_packages** → **contracts**: One package has one contract
- **travel_packages** → **payments**: One package can have multiple payments
- **travel_packages** → **quotations**: One package can have multiple quotations

## Schema Notes

- All location information (countries, cities, airports) is stored as VARCHAR fields directly in the main tables
- Airline information is stored as VARCHAR in the air_travel table
- This simplified approach eliminates the need for lookup tables while maintaining all core functionality
- Analytics by destination and airline can still be performed by grouping on the VARCHAR fields
