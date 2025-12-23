@echo off
echo ========================================
echo Tourism API Server Starter
echo ========================================
echo.
echo Starting PHP built-in server...
echo.
echo Server will be available at:
echo   http://localhost:8000
echo.
echo Test pages:
echo   http://localhost:8000/tests/test-api.html
echo   http://localhost:8000/api/test-api.php
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

cd /d "%~dp0"
php -S localhost:8000

pause

