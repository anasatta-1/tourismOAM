-- =====================================================
-- Tourism Management System - Complete Database Schema
-- For Production Deployment
-- Generated: December 21, 2025
-- =====================================================

CREATE DATABASE IF NOT EXISTS tourism_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourism_db;

-- =====================================================
-- 1. GUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS guests (
    guest_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    country_of_residence VARCHAR(100) NOT NULL,
    passport_image_path VARCHAR(500),
    status ENUM('guest', 'client') DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. TRAVEL PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS travel_packages (
    package_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    guest_id INT UNSIGNED NOT NULL,
    package_name VARCHAR(200),
    total_estimated_cost DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('draft', 'quotation_sent', 'contract_sent', 'confirmed', 'completed', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. AIR TRAVEL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS air_travel (
    air_travel_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    departure_country VARCHAR(100) NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    departure_airport VARCHAR(200) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_airport VARCHAR(200) NOT NULL,
    preferred_airline VARCHAR(100),
    number_of_adults TINYINT UNSIGNED DEFAULT 0,
    number_of_children TINYINT UNSIGNED DEFAULT 0,
    number_of_infants TINYINT UNSIGNED DEFAULT 0,
    departure_date DATE NOT NULL,
    trip_duration_days INT UNSIGNED NOT NULL,
    trip_duration_nights INT UNSIGNED NOT NULL,
    transit_time_hours DECIMAL(5, 2),
    time_of_travel ENUM('AM', 'PM', 'Both') DEFAULT 'AM',
    lounges_access BOOLEAN DEFAULT FALSE,
    estimated_cost DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_departure_date (departure_date),
    INDEX idx_destination (destination_country, destination_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ACCOMMODATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accommodations (
    accommodation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    accommodation_type ENUM('Apartment', 'Villa', 'Hotel') NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    number_of_bedrooms TINYINT UNSIGNED NOT NULL,
    star_rating TINYINT UNSIGNED NULL,
    bed_type VARCHAR(50),
    cost DECIMAL(12, 2) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_type (accommodation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. TOURS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tours (
    tour_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    tour_type ENUM('Group', 'Private') NOT NULL,
    tour_number VARCHAR(100),
    number_of_transfers INT UNSIGNED DEFAULT 0,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    tour_description TEXT,
    cost DECIMAL(12, 2) DEFAULT 0.00,
    tour_date DATE,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_tour_type (tour_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. VISAS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visas (
    visa_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    visa_type VARCHAR(100) NOT NULL,
    visa_status ENUM('Pending', 'Done', 'Special Type', 'Rejected') NOT NULL,
    country VARCHAR(100) NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0.00,
    special_notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_status (visa_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. TIMELINE STEPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timeline_steps (
    timeline_step_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    step_name ENUM('Guest Info Collection', 'Air Travel', 'Accommodations', 'Tours', 'Visa', 'Quotation Generation', 'Contract Stage', 'Payment Processing') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
    completed_date DATETIME NULL,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_step (package_id, step_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. CONTRACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contracts (
    contract_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    contract_template_path VARCHAR(500),
    contract_pdf_path VARCHAR(500),
    status ENUM('draft', 'sent', 'confirmed', 'signed') DEFAULT 'draft',
    sent_date DATETIME NULL,
    confirmed_date DATETIME NULL,
    signed_date DATETIME NULL,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_contract (package_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    receipt_image_path VARCHAR(500),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. QUOTATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quotations (
    quotation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    quotation_pdf_path VARCHAR(500),
    total_amount DECIMAL(12, 2) NOT NULL,
    generated_date DATETIME NOT NULL,
    expiry_date DATE,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    sent_date DATETIME NULL,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    INDEX idx_quotation_number (quotation_number),
    INDEX idx_status (status),
    INDEX idx_generated_date (generated_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. USERS TABLE (Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT ADMIN USER
-- =====================================================
-- Username: admin
-- Password: OAM@2025
-- 
-- IMPORTANT: After running this schema, update the password hash
-- Option 1: Run setup script (recommended):
--   php scripts/setup-users.php
-- 
-- Option 2: Generate hash and update manually:
--   php -r "require 'api/helpers.php'; echo hashPassword('OAM@2025');"
--   Then update the INSERT statement below with the generated hash
-- 
-- Option 3: Use temporary default (change immediately after):
--   Default password hash below is for 'admin123' (change required!)
-- 
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
    'admin',
    'admin@tourism.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Temporary: admin123 (MUST CHANGE!)
    'Administrator',
    'admin',
    TRUE
) ON DUPLICATE KEY UPDATE username=username;

-- =====================================================
-- SET ADMIN PASSWORD TO OAM@2025
-- =====================================================
-- Run this UPDATE statement after deployment:
-- UPDATE users SET password_hash = '$2y$12$[GENERATED_HASH]' WHERE username = 'admin';
-- 
-- To generate the hash, use PHP:
-- php -r "require 'api/helpers.php'; echo hashPassword('OAM@2025');"
-- =====================================================

