/**
 * API Service - Centralized API communication
 * Handles all API requests to the backend
 */

const API_BASE_URL = window.location.origin + '/api';

class ApiService {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Handle file uploads
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Log request for debugging
        console.log('API Request:', {
            url: url,
            method: config.method || 'GET',
            body: config.body
        });

        try {
            const response = await fetch(url, config);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, get text
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            // Enhanced error logging
            console.error('API Error Details:', {
                url: url,
                method: config.method || 'GET',
                error: error.message,
                stack: error.stack
            });
            
            // Provide more helpful error messages
            if (error.message === 'Failed to fetch') {
                const helpfulError = new Error(
                    `Cannot connect to API at ${url}. ` +
                    `Please check: 1) API server is running, 2) URL is correct, 3) CORS is enabled, 4) Check browser console for details`
                );
                helpfulError.originalError = error;
                throw helpfulError;
            }
            
            throw error;
        }
    }

    // ========== GUEST ENDPOINTS ==========
    
    async createGuest(guestData) {
        return this.request('/guests', {
            method: 'POST',
            body: JSON.stringify(guestData)
        });
    }

    async getGuests(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/guests${queryString ? '?' + queryString : ''}`);
    }

    async getGuest(guestId) {
        return this.request(`/guests/${guestId}`);
    }

    async updateGuest(guestId, guestData) {
        return this.request(`/guests/${guestId}`, {
            method: 'PUT',
            body: JSON.stringify(guestData)
        });
    }

    async updateGuestStatus(guestId, status) {
        return this.request(`/guests/${guestId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async uploadPassport(guestId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request(`/guests/${guestId}/passport`, {
            method: 'POST',
            body: formData
        });
    }

    // ========== PACKAGE ENDPOINTS ==========

    async createPackage(packageData) {
        return this.request('/packages', {
            method: 'POST',
            body: JSON.stringify(packageData)
        });
    }

    async createPackageWizard(wizardData) {
        return this.request('/packages/wizard', {
            method: 'POST',
            body: JSON.stringify(wizardData)
        });
    }

    async getPackages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/packages${queryString ? '?' + queryString : ''}`);
    }

    async getPackage(packageId) {
        return this.request(`/packages/${packageId}`);
    }

    async updatePackage(packageId, packageData) {
        return this.request(`/packages/${packageId}`, {
            method: 'PUT',
            body: JSON.stringify(packageData)
        });
    }

    async updatePackageWizard(packageId, wizardData) {
        return this.request(`/packages/${packageId}/wizard`, {
            method: 'PUT',
            body: JSON.stringify(wizardData)
        });
    }

    async deletePackage(packageId) {
        return this.request(`/packages/${packageId}`, {
            method: 'DELETE'
        });
    }

    async getPackageTotalCost(packageId) {
        return this.request(`/packages/${packageId}/total-cost`);
    }

    async recalculatePackageCost(packageId) {
        return this.request(`/packages/${packageId}/recalculate`, {
            method: 'POST'
        });
    }

    // ========== AIR TRAVEL ENDPOINTS ==========

    async createAirTravel(packageId, airTravelData) {
        return this.request(`/packages/${packageId}/air-travel`, {
            method: 'POST',
            body: JSON.stringify(airTravelData)
        });
    }

    async getAirTravel(packageId) {
        return this.request(`/packages/${packageId}/air-travel`);
    }

    async updateAirTravel(packageId, airTravelData) {
        return this.request(`/packages/${packageId}/air-travel`, {
            method: 'PUT',
            body: JSON.stringify(airTravelData)
        });
    }

    async deleteAirTravel(packageId) {
        return this.request(`/packages/${packageId}/air-travel`, {
            method: 'DELETE'
        });
    }

    // ========== ACCOMMODATION ENDPOINTS ==========

    async createAccommodation(packageId, accommodationData) {
        return this.request(`/packages/${packageId}/accommodations`, {
            method: 'POST',
            body: JSON.stringify(accommodationData)
        });
    }

    async getAccommodations(packageId) {
        return this.request(`/packages/${packageId}/accommodations`);
    }

    async getAccommodation(packageId, accommodationId) {
        return this.request(`/packages/${packageId}/accommodations/${accommodationId}`);
    }

    async updateAccommodation(packageId, accommodationId, accommodationData) {
        return this.request(`/packages/${packageId}/accommodations/${accommodationId}`, {
            method: 'PUT',
            body: JSON.stringify(accommodationData)
        });
    }

    async deleteAccommodation(packageId, accommodationId) {
        return this.request(`/packages/${packageId}/accommodations/${accommodationId}`, {
            method: 'DELETE'
        });
    }

    // ========== TOUR ENDPOINTS ==========

    async createTour(packageId, tourData) {
        return this.request(`/packages/${packageId}/tours`, {
            method: 'POST',
            body: JSON.stringify(tourData)
        });
    }

    async getTours(packageId) {
        return this.request(`/packages/${packageId}/tours`);
    }

    async getTour(packageId, tourId) {
        return this.request(`/packages/${packageId}/tours/${tourId}`);
    }

    async updateTour(packageId, tourId, tourData) {
        return this.request(`/packages/${packageId}/tours/${tourId}`, {
            method: 'PUT',
            body: JSON.stringify(tourData)
        });
    }

    async deleteTour(packageId, tourId) {
        return this.request(`/packages/${packageId}/tours/${tourId}`, {
            method: 'DELETE'
        });
    }

    // ========== VISA ENDPOINTS ==========

    async createVisa(packageId, visaData) {
        return this.request(`/packages/${packageId}/visas`, {
            method: 'POST',
            body: JSON.stringify(visaData)
        });
    }

    async getVisas(packageId) {
        return this.request(`/packages/${packageId}/visas`);
    }

    async getVisa(packageId, visaId) {
        return this.request(`/packages/${packageId}/visas/${visaId}`);
    }

    async updateVisa(packageId, visaId, visaData) {
        return this.request(`/packages/${packageId}/visas/${visaId}`, {
            method: 'PUT',
            body: JSON.stringify(visaData)
        });
    }

    async deleteVisa(packageId, visaId) {
        return this.request(`/packages/${packageId}/visas/${visaId}`, {
            method: 'DELETE'
        });
    }

    async getVisaTypes() {
        return this.request('/visas/types');
    }

    // ========== OPTIONS ENDPOINTS ==========

    async getCountries() {
        return this.request('/options/countries');
    }

    async getCities(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/options/cities${queryString ? '?' + queryString : ''}`);
    }

    async getAirports(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/options/airports${queryString ? '?' + queryString : ''}`);
    }

    async getAirlines() {
        return this.request('/options/airlines');
    }

    async getBedTypes() {
        return this.request('/options/bed-types');
    }

    async getAccommodationTypes() {
        return this.request('/options/accommodation-types');
    }

    async getVisaTypesOptions() {
        return this.request('/options/visa-types');
    }

    // ========== ANALYTICS ENDPOINTS ==========

    async getAnalyticsOverview() {
        return this.request('/analytics/overview');
    }

    async getSalesAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales${queryString ? '?' + queryString : ''}`);
    }

    async getMonthlySales(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales/monthly${queryString ? '?' + queryString : ''}`);
    }

    async getQuarterlySales(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales/quarterly${queryString ? '?' + queryString : ''}`);
    }

    async getYearlySales(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales/yearly${queryString ? '?' + queryString : ''}`);
    }

    async getSalesByAirline(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales/by-airline${queryString ? '?' + queryString : ''}`);
    }

    async getSalesByDestination(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales/by-destination${queryString ? '?' + queryString : ''}`);
    }
}

// Create global instance
const api = new ApiService();

// Export for use in modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

