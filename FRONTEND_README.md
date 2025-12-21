# Tourism Admin Management System - Frontend Documentation

Complete frontend documentation for the Tourism Admin Management System web application.

## 📁 Project Structure

```
anas/
├── styles.css                    # Global styles and theme
├── api-service.js                # Centralized API communication service
│
├── login/                        # Login page
│   ├── login.html
│   ├── login.css
│   └── login.js
│
├── dashboard/                    # Main dashboard
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
│
├── wizard/                       # Package creation wizard
│   ├── wizard.html
│   ├── wizard.css
│   └── wizard.js
│
├── data-entry/                  # Manual data entry forms
│   ├── data-entry.html
│   ├── data-entry.css
│   └── data-entry.js
│
├── analytics/                    # Analytics and reports
│   ├── analytics.html
│   ├── analytics.css
│   └── analytics.js
│
└── test-api.html                # API testing interface
```

## 🎨 Pages Overview

### 1. Login Page (`login/login.html`)

**Purpose:** User authentication and access control

**Features:**
- Username/Email and password login
- "Remember me" functionality
- Forgot password link (placeholder)
- Form validation
- API-based authentication

**Files:**
- `login.html` - Login form structure
- `login.css` - Login page styling
- `login.js` - Authentication logic

**Usage:**
```
http://localhost/anas/login/login.html
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

---

### 2. Dashboard (`dashboard/dashboard.html`)

**Purpose:** Main overview and quick access to system features

**Features:**
- Overview cards (Total Bookings, Active Destinations, Pending Tasks, Revenue)
- Recent activity log
- Quick action buttons
- Real-time data from API
- Responsive sidebar navigation

**Files:**
- `dashboard.html` - Dashboard layout
- `dashboard.css` - Dashboard styling
- `dashboard.js` - Data loading and display logic

**Usage:**
```
http://localhost/anas/dashboard/dashboard.html
```

**Data Sources:**
- Packages API (`/api/packages`)
- Analytics API (`/api/analytics/overview`)

---

### 3. Wizard (`wizard/wizard.html`)

**Purpose:** Step-by-step travel package creation

**Features:**
- 7-step wizard interface
- Progress bar indicator
- Form validation at each step
- Summary confirmation
- Complete package creation (guest, package, air travel, accommodation, tours, visas)

**Steps:**
1. Guest Information
2. Package Information
3. Air Travel
4. Accommodation
5. Tours
6. Visas
7. Confirmation

**Files:**
- `wizard.html` - Wizard form structure
- `wizard.css` - Wizard styling
- `wizard.js` - Step navigation and form submission

**Usage:**
```
http://localhost/anas/wizard/wizard.html
```

**API Endpoint:**
- `POST /api/packages/wizard` - Creates complete package with all components

---

### 4. Data Entry (`data-entry/data-entry.html`)

**Purpose:** Manual data entry for individual entities

**Features:**
- Tabbed interface for different data types
- Forms for:
  - Guests
  - Travel Packages
  - Air Travel
  - Accommodations
  - Tours
  - Visas
- Real-time form validation
- File upload support (passport images)

**Files:**
- `data-entry.html` - Data entry forms
- `data-entry.css` - Form styling
- `data-entry.js` - Form handling and API calls

**Usage:**
```
http://localhost/anas/data-entry/data-entry.html
```

**API Endpoints Used:**
- `POST /api/guests` - Create guest
- `POST /api/packages` - Create package
- `POST /api/packages/:id/air-travel` - Create air travel
- `POST /api/packages/:id/accommodations` - Create accommodation
- `POST /api/packages/:id/tours` - Create tour
- `POST /api/packages/:id/visas` - Create visa

---

### 5. Analytics (`analytics/analytics.html`)

**Purpose:** Business intelligence and reporting

**Features:**
- Overview statistics (bookings, revenue, destinations, satisfaction)
- Filterable date ranges
- Top destinations table
- Sales analytics
- Revenue breakdown
- Export functionality (placeholder)

**Files:**
- `analytics.html` - Analytics dashboard
- `analytics.css` - Analytics styling
- `analytics.js` - Data fetching and visualization

**Usage:**
```
http://localhost/anas/analytics/analytics.html
```

**API Endpoints Used:**
- `GET /api/analytics/overview` - Overview statistics
- `GET /api/packages` - Package data
- `GET /api/analytics/sales/by-destination` - Destination analytics

---

## 🎨 Styling System

### Global Styles (`styles.css`)

**Purpose:** Shared styles, theme variables, and common components

**Features:**
- CSS custom properties (variables) for theming
- Color scheme (primary, secondary, accent colors)
- Typography system
- Common component styles (buttons, forms, cards)
- Responsive utilities

**Key Variables:**
```css
--primary-color: #007bff
--secondary-color: #6c757d
--accent-color: #28a745
--background-color: #f8f9fa
--text-color: #333
```

### Page-Specific Styles

Each page has its own CSS file for:
- Page-specific layouts
- Component variations
- Unique styling requirements

**Files:**
- `login/login.css` - Login page styles
- `dashboard/dashboard.css` - Dashboard styles
- `wizard/wizard.css` - Wizard styles
- `data-entry/data-entry.css` - Data entry styles
- `analytics/analytics.css` - Analytics styles

---

## 🔌 API Integration

### API Service (`api-service.js`)

**Purpose:** Centralized API communication layer

**Features:**
- Automatic API URL detection (handles subdirectories)
- Unified request/response handling
- Error handling and logging
- CORS support
- File upload support

**Usage:**
```javascript
// The API service is automatically available as 'api' global object
const packages = await api.getPackages();
const guest = await api.createGuest(guestData);
```

**Key Methods:**

#### Guest Operations
- `api.createGuest(guestData)` - Create new guest
- `api.getGuests(params)` - List guests
- `api.getGuest(guestId)` - Get guest details
- `api.updateGuest(guestId, guestData)` - Update guest
- `api.uploadPassport(guestId, file)` - Upload passport image

#### Package Operations
- `api.createPackage(packageData)` - Create package
- `api.createPackageWizard(wizardData)` - Create package via wizard
- `api.getPackages(params)` - List packages
- `api.getPackage(packageId)` - Get package details

#### Authentication
- `api.login(username, password)` - User login
- `api.register(userData)` - Register new user

#### Analytics
- `api.getAnalyticsOverview()` - Get overview statistics
- `api.getSalesByDestination(params)` - Get destination sales

**API Base URL:**
Automatically detected based on current location:
- Root: `http://localhost/api`
- Subdirectory: `http://localhost/anas/api`

---

## 📱 Responsive Design

All pages are designed to be responsive:
- **Desktop:** Full sidebar navigation and multi-column layouts
- **Tablet:** Adjusted sidebar and flexible grids
- **Mobile:** Collapsible sidebar and stacked layouts

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🚀 Getting Started

### Prerequisites
- Web server (XAMPP, WAMP, or any PHP server)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd anas
   ```

2. **Place in web server directory**
   - XAMPP: `C:\xampp\htdocs\anas\`
   - WAMP: `C:\wamp64\www\anas\`

3. **Start web server**
   - Start Apache in XAMPP/WAMP

4. **Access the application**
   ```
   http://localhost/anas/login/login.html
   ```

### Quick Start URLs

- **Login:** `http://localhost/anas/login/login.html`
- **Dashboard:** `http://localhost/anas/dashboard/dashboard.html`
- **Wizard:** `http://localhost/anas/wizard/wizard.html`
- **Data Entry:** `http://localhost/anas/data-entry/data-entry.html`
- **Analytics:** `http://localhost/anas/analytics/analytics.html`

---

## 🔧 Configuration

### API URL Configuration

The API service automatically detects the base URL. If you need to override:

**In `api-service.js`:**
```javascript
// Auto-detection (default)
const API_BASE_URL = getApiBaseUrl();

// Manual override
const api = new ApiService('http://your-domain.com/api');
```

### Theme Customization

**In `styles.css`:**
```css
:root {
    --primary-color: #007bff;      /* Change primary color */
    --secondary-color: #6c757d;    /* Change secondary color */
    --accent-color: #28a745;       /* Change accent color */
    --background-color: #f8f9fa;   /* Change background */
}
```

---

## 📝 JavaScript Architecture

### Page-Specific JavaScript

Each page has its own JavaScript file that:
1. Loads on page initialization
2. Sets up event listeners
3. Handles form submissions
4. Communicates with API
5. Updates UI based on responses

### Common Patterns

**Form Submission:**
```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const response = await api.createGuest(formData);
        alert('Success!');
        form.reset();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});
```

**Data Loading:**
```javascript
async function loadData() {
    try {
        const response = await api.getPackages();
        const packages = response.data.data; // Handle nested response
        updateUI(packages);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

---

## 🎯 Features by Page

### Login Page
- ✅ User authentication
- ✅ Session management (localStorage/sessionStorage)
- ✅ Form validation
- ✅ Error handling

### Dashboard
- ✅ Real-time statistics
- ✅ Recent activity feed
- ✅ Quick action buttons
- ✅ Navigation sidebar

### Wizard
- ✅ Multi-step form
- ✅ Progress tracking
- ✅ Form validation per step
- ✅ Complete package creation
- ✅ File upload support

### Data Entry
- ✅ Tabbed interface
- ✅ Multiple entity forms
- ✅ Real-time validation
- ✅ File uploads
- ✅ Success/error feedback

### Analytics
- ✅ Overview statistics
- ✅ Filterable data
- ✅ Top destinations
- ✅ Revenue breakdown
- ✅ Export functionality (placeholder)

---

## 🐛 Troubleshooting

### API Connection Issues

**Problem:** "Failed to fetch" errors

**Solutions:**
1. Ensure web server is running
2. Check API URL in browser console
3. Verify API is accessible: `http://localhost/anas/api/test-api.php`
4. Check CORS headers in API

### Data Not Loading

**Problem:** Pages show "0" or empty data

**Solutions:**
1. Check browser console for errors (F12)
2. Verify database connection
3. Ensure API endpoints are working
4. Check API response structure

### Styling Issues

**Problem:** Styles not applying

**Solutions:**
1. Clear browser cache
2. Check CSS file paths
3. Verify `styles.css` is loaded
4. Check browser console for CSS errors

---

## 📚 File Descriptions

### Core Files

| File | Purpose |
|------|---------|
| `styles.css` | Global styles and theme |
| `api-service.js` | API communication service |

### Page Files

| Page | HTML | CSS | JS |
|------|------|-----|-----|
| Login | `login/login.html` | `login/login.css` | `login/login.js` |
| Dashboard | `dashboard/dashboard.html` | `dashboard/dashboard.css` | `dashboard/dashboard.js` |
| Wizard | `wizard/wizard.html` | `wizard/wizard.css` | `wizard/wizard.js` |
| Data Entry | `data-entry/data-entry.html` | `data-entry/data-entry.css` | `data-entry/data-entry.js` |
| Analytics | `analytics/analytics.html` | `analytics/analytics.css` | `analytics/analytics.js` |

### Test Files

| File | Purpose |
|------|---------|
| `test-api.html` | Comprehensive API testing interface |
| `test-api-simple.html` | Simple API connection test |
| `test-connection.html` | Connection diagnostic tool |
| `verify-setup.html` | Complete setup verification |

---

## 🔐 Security Features

### Frontend Security

- ✅ Input validation on all forms
- ✅ XSS prevention (input sanitization handled by API)
- ✅ Secure password handling (never stored in frontend)
- ✅ Session management (localStorage/sessionStorage)
- ✅ CORS-aware API communication

### Best Practices

- All API calls use HTTPS in production
- Sensitive data never logged to console
- User credentials handled securely
- Error messages don't expose sensitive information

---

## 🎨 UI Components

### Common Components

**Buttons:**
- Primary: `btn btn-primary`
- Secondary: `btn btn-secondary`
- Outline: `btn btn-outline`

**Forms:**
- Form groups: `form-group`
- Form controls: `form-control`
- Labels: `form-label`

**Cards:**
- Card container: `card`
- Card header: `card-header`
- Card content: `card-body`

**Navigation:**
- Sidebar: `sidebar`
- Menu items: `sidebar-menu`
- Active state: `active`

---

## 📖 API Response Structure

All API responses follow this structure:

```javascript
{
    success: true,
    message: "Success message",
    data: {
        // Response data (may be nested)
        data: [...],  // For list endpoints
        pagination: {...}  // For paginated responses
    }
}
```

**Example - Packages List:**
```javascript
{
    success: true,
    message: "Success",
    data: {
        data: [...packages...],
        pagination: {
            page: 1,
            limit: 20,
            total: 100,
            total_pages: 5
        }
    }
}
```

---

## 🚦 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

**Required Features:**
- ES6+ JavaScript
- Fetch API
- CSS Grid & Flexbox
- LocalStorage/SessionStorage

---

## 📞 Support

For issues or questions:
1. Check browser console (F12) for errors
2. Review API responses in Network tab
3. Verify API endpoints are accessible
4. Check `TROUBLESHOOTING.md` for common issues

---

## 📄 License

This frontend is part of the Tourism Admin Management System.

---

## 🎯 Quick Reference

### Most Used URLs
- Login: `/anas/login/login.html`
- Dashboard: `/anas/dashboard/dashboard.html`
- Wizard: `/anas/wizard/wizard.html`

### Most Used API Calls
```javascript
// Get packages
await api.getPackages();

// Create guest
await api.createGuest({full_name, phone_number, country_of_residence});

// Login
await api.login(username, password);

// Create package via wizard
await api.createPackageWizard(wizardData);
```

### Common CSS Classes
- `btn btn-primary` - Primary button
- `form-control` - Form input
- `card` - Card container
- `sidebar` - Sidebar navigation

---

**Last Updated:** Version 0.2
**Frontend Version:** 1.0.0

