-- =====================================================
-- Set Admin Password to OAM@2025
-- =====================================================
-- Run this AFTER running DEPLOYMENT_SCHEMA.sql
-- 
-- Generate the password hash using PHP:
-- php -r "require 'api/helpers.php'; echo hashPassword('OAM@2025');"
-- 
-- Then replace [GENERATED_HASH] below with the output
-- =====================================================

USE tourism_db;

-- Update admin password to OAM@2025
-- Replace [GENERATED_HASH] with the hash generated from PHP hashPassword('OAM@2025')
UPDATE users 
SET password_hash = '$2y$12$[GENERATED_HASH]' 
WHERE username = 'admin';

-- Verify the update
SELECT username, email, role, is_active 
FROM users 
WHERE username = 'admin';

