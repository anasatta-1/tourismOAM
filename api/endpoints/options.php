<?php
/**
 * Options/Preset Data Endpoints
 */

function handleOptions($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($method !== 'GET') {
        Response::error('Method not allowed', 405);
    }
    
    // GET /api/options/countries
    if (count($segments) === 2 && $segments[1] === 'countries') {
        // Mock data - in production, this would come from a database
        Response::success([
            'countries' => [
                ['country_code' => 'US', 'country_name' => 'United States'],
                ['country_code' => 'UK', 'country_name' => 'United Kingdom'],
                ['country_code' => 'FR', 'country_name' => 'France'],
                ['country_code' => 'DE', 'country_name' => 'Germany'],
                ['country_code' => 'IT', 'country_name' => 'Italy']
            ]
        ]);
    }
    
    // GET /api/options/cities
    elseif (count($segments) === 2 && $segments[1] === 'cities') {
        $country = $queryParams['country'] ?? null;
        // Mock data
        Response::success([
            'cities' => [
                ['city_name' => 'New York', 'country' => 'United States', 'country_code' => 'US'],
                ['city_name' => 'London', 'country' => 'United Kingdom', 'country_code' => 'UK'],
                ['city_name' => 'Paris', 'country' => 'France', 'country_code' => 'FR']
            ]
        ]);
    }
    
    // GET /api/options/airports
    elseif (count($segments) === 2 && $segments[1] === 'airports') {
        $country = $queryParams['country'] ?? null;
        $city = $queryParams['city'] ?? null;
        // Mock data
        Response::success([
            'airports' => [
                ['airport_code' => 'JFK', 'airport_name' => 'John F. Kennedy International Airport', 'city' => 'New York', 'country' => 'United States', 'country_code' => 'US'],
                ['airport_code' => 'LHR', 'airport_name' => 'London Heathrow Airport', 'city' => 'London', 'country' => 'United Kingdom', 'country_code' => 'UK'],
                ['airport_code' => 'CDG', 'airport_name' => 'Charles de Gaulle Airport', 'city' => 'Paris', 'country' => 'France', 'country_code' => 'FR']
            ]
        ]);
    }
    
    // GET /api/options/airlines
    elseif (count($segments) === 2 && $segments[1] === 'airlines') {
        // Mock data
        Response::success([
            'airlines' => [
                ['airline_code' => 'AA', 'airline_name' => 'American Airlines'],
                ['airline_code' => 'BA', 'airline_name' => 'British Airways'],
                ['airline_code' => 'AF', 'airline_name' => 'Air France'],
                ['airline_code' => 'LH', 'airline_name' => 'Lufthansa'],
                ['airline_code' => 'EK', 'airline_name' => 'Emirates']
            ]
        ]);
    }
    
    // GET /api/options/bed-types
    elseif (count($segments) === 2 && $segments[1] === 'bed-types') {
        Response::success([
            'bed_types' => [
                ['bed_type' => 'Queen', 'description' => 'Queen size bed'],
                ['bed_type' => 'Twin', 'description' => 'Twin beds'],
                ['bed_type' => 'Single', 'description' => 'Single bed'],
                ['bed_type' => 'Double', 'description' => 'Double bed'],
                ['bed_type' => 'King', 'description' => 'King size bed']
            ]
        ]);
    }
    
    // GET /api/options/accommodation-types
    elseif (count($segments) === 2 && $segments[1] === 'accommodation-types') {
        Response::success([
            'accommodation_types' => [
                ['type' => 'Apartment', 'description' => 'Apartment accommodation'],
                ['type' => 'Villa', 'description' => 'Villa accommodation'],
                ['type' => 'Hotel', 'description' => 'Hotel accommodation']
            ]
        ]);
    }
    
    // GET /api/options/visa-types
    elseif (count($segments) === 2 && $segments[1] === 'visa-types') {
        Response::success([
            'visa_types' => [
                ['visa_type' => 'Tourist Visa', 'description' => 'Standard tourist visa'],
                ['visa_type' => 'Business Visa', 'description' => 'Business travel visa'],
                ['visa_type' => 'Transit Visa', 'description' => 'Transit visa'],
                ['visa_type' => 'Student Visa', 'description' => 'Student visa']
            ]
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

