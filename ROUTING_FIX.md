# Routing Fix Applied

## Problem
- "Endpoint not found" error when creating guests
- POST requests to `/api/guests` were not being routed correctly

## Root Cause
The guests endpoint handler was checking `count($segments) === 1`, but when the path is parsed, the segments array might be empty or have a different structure depending on how PHP's built-in server handles the REQUEST_URI.

## Fixes Applied

### 1. Improved Path Parsing (`api/index.php`)
- Changed from `str_replace('/api', '', $path)` to `preg_replace('#^/api/?#', '', $path)`
- This handles multiple cases: `/api/guests`, `/api/guests/`, `/api`, etc.

### 2. Fixed Guests Handler (`api/endpoints/guests.php`)
- Updated POST condition to handle both cases:
  - `count($segments) === 1` (when path is `/api/guests`)
  - `count($segments) === 0` (when path is `/api`)
- Updated GET condition similarly

### 3. Improved Router Logic (`api/index.php`)
- Combined the empty and 'guests' checks into one condition
- Now handles both `/api/guests` and `/api` routes

## Testing

1. **Test the debug endpoint:**
   ```
   http://localhost:8000/api/debug-router.php
   ```
   This shows how paths are being parsed.

2. **Test guest creation:**
   - Use the test page: `http://localhost:8000/test-api.html`
   - Click "Test Create Guest"
   - Should now work ✓

3. **Test package creation:**
   - Click "Test Create Package"
   - Should now work ✓

## Files Modified

1. `api/index.php` - Improved path parsing and routing
2. `api/endpoints/guests.php` - Fixed segment count checks
3. `api/debug-router.php` - Added debug endpoint (new file)

## Next Steps

If you still get "Endpoint not found":
1. Check `http://localhost:8000/api/debug-router.php` to see path parsing
2. Verify the API URL in test page matches your server
3. Check browser console for actual request URL
4. Verify PHP server is running on correct port

The routing should now work correctly for both PHP built-in server and Apache!

