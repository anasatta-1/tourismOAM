@echo off
echo ==========================================
echo Production Setup Script
echo ==========================================
echo.

REM Create upload directories
echo Creating upload directories...
if not exist "uploads\passports" mkdir "uploads\passports"
if not exist "uploads\receipts" mkdir "uploads\receipts"
if not exist "uploads\quotations" mkdir "uploads\quotations"
if not exist "uploads\contracts" mkdir "uploads\contracts"
if not exist "logs" mkdir "logs"

REM Create .htaccess files
echo Creating .htaccess files...
if not exist "uploads\.htaccess" (
    echo ^<FilesMatch "\.php$"^> > "uploads\.htaccess"
    echo     Order Allow,Deny >> "uploads\.htaccess"
    echo     Deny from all >> "uploads\.htaccess"
    echo ^</FilesMatch^> >> "uploads\.htaccess"
    echo Options -Indexes >> "uploads\.htaccess"
)

if not exist "logs\.htaccess" (
    echo Order Allow,Deny > "logs\.htaccess"
    echo Deny from all >> "logs\.htaccess"
)

REM Create .env file from example
if not exist "api\.env" (
    if exist "api\.env.example" (
        echo Creating api\.env from example...
        copy "api\.env.example" "api\.env"
        echo IMPORTANT: Edit api\.env with your production settings!
    )
)

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit api\.env with your production database credentials
echo 2. Set PRODUCTION=true in api\.env
echo 3. Update ALLOWED_ORIGINS in api\.env with your domain
echo 4. Change default admin password (username: admin)
echo 5. Remove or protect test files
echo 6. Enable HTTPS
echo.
pause

