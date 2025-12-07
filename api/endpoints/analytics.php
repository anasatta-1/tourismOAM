<?php
/**
 * Analytics Endpoints
 */

function handleAnalytics($method, $segments, $data, $queryParams) {
    $pdo = Database::getInstance()->getConnection();
    
    if ($method !== 'GET') {
        Response::error('Method not allowed', 405);
    }
    
    // GET /api/analytics/overview - Overall dashboard
    if (count($segments) === 2 && $segments[1] === 'overview') {
        // Total guests and clients
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM guests WHERE status = 'guest'");
        $totalGuests = $stmt->fetch()['total'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM guests WHERE status = 'client'");
        $totalClients = $stmt->fetch()['total'];
        
        // Total packages
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM travel_packages");
        $totalPackages = $stmt->fetch()['total'];
        
        // Total sales
        $stmt = $pdo->query("SELECT COALESCE(SUM(total_estimated_cost), 0) as total FROM travel_packages WHERE status IN ('confirmed', 'completed')");
        $totalSales = $stmt->fetch()['total'];
        
        // Pending and confirmed packages
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM travel_packages WHERE status = 'draft'");
        $pendingPackages = $stmt->fetch()['total'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM travel_packages WHERE status = 'confirmed'");
        $confirmedPackages = $stmt->fetch()['total'];
        
        // This month sales
        $stmt = $pdo->query("SELECT COALESCE(SUM(total_estimated_cost), 0) as sales, COUNT(*) as packages FROM travel_packages WHERE status IN ('confirmed', 'completed') AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
        $thisMonth = $stmt->fetch();
        
        // Last month sales
        $stmt = $pdo->query("SELECT COALESCE(SUM(total_estimated_cost), 0) as sales, COUNT(*) as packages FROM travel_packages WHERE status IN ('confirmed', 'completed') AND MONTH(created_at) = MONTH(NOW()) - 1 AND YEAR(created_at) = YEAR(NOW())");
        $lastMonth = $stmt->fetch();
        
        // This year sales
        $stmt = $pdo->query("SELECT COALESCE(SUM(total_estimated_cost), 0) as sales, COUNT(*) as packages FROM travel_packages WHERE status IN ('confirmed', 'completed') AND YEAR(created_at) = YEAR(NOW())");
        $thisYear = $stmt->fetch();
        
        // Top airlines
        $stmt = $pdo->query("SELECT preferred_airline as airline, COALESCE(SUM(estimated_cost), 0) as sales, COUNT(*) as packages FROM air_travel WHERE preferred_airline IS NOT NULL GROUP BY preferred_airline ORDER BY sales DESC LIMIT 5");
        $topAirlines = $stmt->fetchAll();
        
        // Top destinations
        $stmt = $pdo->query("SELECT CONCAT(destination_country, ', ', destination_city) as destination, COALESCE(SUM(estimated_cost), 0) as sales, COUNT(*) as packages FROM air_travel GROUP BY destination_country, destination_city ORDER BY sales DESC LIMIT 5");
        $topDestinations = $stmt->fetchAll();
        
        Response::success([
            'summary' => [
                'total_guests' => (int)$totalGuests,
                'total_clients' => (int)$totalClients,
                'total_packages' => (int)$totalPackages,
                'total_sales' => (float)$totalSales,
                'pending_packages' => (int)$pendingPackages,
                'confirmed_packages' => (int)$confirmedPackages
            ],
            'recent_sales' => [
                'this_month' => [
                    'sales' => (float)$thisMonth['sales'],
                    'packages' => (int)$thisMonth['packages']
                ],
                'last_month' => [
                    'sales' => (float)$lastMonth['sales'],
                    'packages' => (int)$lastMonth['packages']
                ],
                'this_year' => [
                    'sales' => (float)$thisYear['sales'],
                    'packages' => (int)$thisYear['packages']
                ]
            ],
            'top_airlines' => $topAirlines,
            'top_destinations' => $topDestinations
        ]);
    }
    
    // GET /api/analytics/sales - General sales analytics
    elseif (count($segments) === 3 && $segments[1] === 'sales') {
        $period = $queryParams['period'] ?? 'month';
        $startDate = $queryParams['startDate'] ?? null;
        $endDate = $queryParams['endDate'] ?? null;
        $filterBy = $queryParams['filterBy'] ?? null;
        $filterValue = $queryParams['filterValue'] ?? null;
        $status = $queryParams['status'] ?? null;
        
        // Build date range
        if ($startDate && $endDate) {
            $dateWhere = "tp.created_at BETWEEN ? AND ?";
            $dateParams = [$startDate, $endDate];
        } elseif ($period === 'month') {
            $dateWhere = "MONTH(tp.created_at) = MONTH(NOW()) AND YEAR(tp.created_at) = YEAR(NOW())";
            $dateParams = [];
        } elseif ($period === '3months') {
            $dateWhere = "tp.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)";
            $dateParams = [];
        } elseif ($period === 'year') {
            $dateWhere = "YEAR(tp.created_at) = YEAR(NOW())";
            $dateParams = [];
        } else {
            $dateWhere = "1=1";
            $dateParams = [];
        }
        
        $where = [$dateWhere];
        $params = $dateParams;
        
        if ($status) {
            $where[] = "tp.status = ?";
            $params[] = $status;
        }
        
        if ($filterBy === 'airline' && $filterValue) {
            $where[] = "at.preferred_airline = ?";
            $params[] = $filterValue;
        } elseif ($filterBy === 'destination' && $filterValue) {
            $where[] = "(at.destination_country = ? OR at.destination_city = ?)";
            $params[] = $filterValue;
            $params[] = $filterValue;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(tp.total_estimated_cost), 0) as total_sales, COUNT(*) as total_packages
            FROM travel_packages tp
            LEFT JOIN air_travel at ON tp.package_id = at.package_id
            WHERE $whereClause
        ");
        $stmt->execute($params);
        $totals = $stmt->fetch();
        
        Response::success([
            'period' => $period,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_sales' => (float)$totals['total_sales'],
            'total_packages' => (int)$totals['total_packages'],
            'average_package_value' => $totals['total_packages'] > 0 ? (float)($totals['total_sales'] / $totals['total_packages']) : 0,
            'breakdown' => [],
            'filter_applied' => [
                'filter_by' => $filterBy,
                'filter_value' => $filterValue
            ]
        ]);
    }
    
    // GET /api/analytics/sales/monthly
    elseif (count($segments) === 3 && $segments[2] === 'monthly') {
        $year = (int)($queryParams['year'] ?? date('Y'));
        $month = (int)($queryParams['month'] ?? date('m'));
        
        $stmt = $pdo->prepare("
            SELECT DATE(tp.created_at) as date, COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
            FROM travel_packages tp
            WHERE YEAR(tp.created_at) = ? AND MONTH(tp.created_at) = ?
            GROUP BY DATE(tp.created_at)
            ORDER BY date
        ");
        $stmt->execute([$year, $month]);
        
        $stmt2 = $pdo->prepare("
            SELECT COALESCE(SUM(tp.total_estimated_cost), 0) as total_sales, COUNT(*) as total_packages
            FROM travel_packages tp
            WHERE YEAR(tp.created_at) = ? AND MONTH(tp.created_at) = ?
        ");
        $stmt2->execute([$year, $month]);
        $totals = $stmt2->fetch();
        
        Response::success([
            'year' => $year,
            'month' => $month,
            'month_name' => date('F', mktime(0, 0, 0, $month, 1, $year)),
            'total_sales' => (float)$totals['total_sales'],
            'total_packages' => (int)$totals['total_packages'],
            'daily_breakdown' => $stmt->fetchAll(),
            'filter_applied' => [
                'filter_by' => $queryParams['filterBy'] ?? null,
                'filter_value' => $queryParams['filterValue'] ?? null
            ]
        ]);
    }
    
    // GET /api/analytics/sales/quarterly
    elseif (count($segments) === 3 && $segments[2] === 'quarterly') {
        $stmt = $pdo->query("
            SELECT YEAR(tp.created_at) as year, MONTH(tp.created_at) as month, 
            COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
            FROM travel_packages tp
            WHERE tp.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY YEAR(tp.created_at), MONTH(tp.created_at)
            ORDER BY year, month
        ");
        
        $stmt2 = $pdo->query("
            SELECT COALESCE(SUM(tp.total_estimated_cost), 0) as total_sales, COUNT(*) as total_packages
            FROM travel_packages tp
            WHERE tp.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        ");
        $totals = $stmt2->fetch();
        
        Response::success([
            'period' => 'Last 3 Months',
            'start_date' => date('Y-m-d', strtotime('-3 months')),
            'end_date' => date('Y-m-d'),
            'total_sales' => (float)$totals['total_sales'],
            'total_packages' => (int)$totals['total_packages'],
            'monthly_breakdown' => $stmt->fetchAll(),
            'filter_applied' => [
                'filter_by' => $queryParams['filterBy'] ?? null,
                'filter_value' => $queryParams['filterValue'] ?? null
            ]
        ]);
    }
    
    // GET /api/analytics/sales/yearly
    elseif (count($segments) === 3 && $segments[2] === 'yearly') {
        $year = (int)($queryParams['year'] ?? date('Y'));
        
        $stmt = $pdo->prepare("
            SELECT MONTH(tp.created_at) as month, 
            COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
            FROM travel_packages tp
            WHERE YEAR(tp.created_at) = ?
            GROUP BY MONTH(tp.created_at)
            ORDER BY month
        ");
        $stmt->execute([$year]);
        
        $stmt2 = $pdo->prepare("
            SELECT COALESCE(SUM(tp.total_estimated_cost), 0) as total_sales, COUNT(*) as total_packages
            FROM travel_packages tp
            WHERE YEAR(tp.created_at) = ?
        ");
        $stmt2->execute([$year]);
        $totals = $stmt2->fetch();
        
        $monthly = $stmt->fetchAll();
        foreach ($monthly as &$m) {
            $m['month_name'] = date('F', mktime(0, 0, 0, $m['month'], 1, $year));
        }
        
        Response::success([
            'year' => $year,
            'total_sales' => (float)$totals['total_sales'],
            'total_packages' => (int)$totals['total_packages'],
            'monthly_breakdown' => $monthly,
            'filter_applied' => [
                'filter_by' => $queryParams['filterBy'] ?? null,
                'filter_value' => $queryParams['filterValue'] ?? null
            ]
        ]);
    }
    
    // GET /api/analytics/sales/by-airline
    elseif (count($segments) === 3 && $segments[2] === 'by-airline') {
        $stmt = $pdo->query("
            SELECT at.preferred_airline as airline, 
            COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
            FROM air_travel at
            JOIN travel_packages tp ON at.package_id = tp.package_id
            WHERE at.preferred_airline IS NOT NULL
            GROUP BY at.preferred_airline
            ORDER BY sales DESC
        ");
        
        $breakdown = $stmt->fetchAll();
        $totalSales = array_sum(array_column($breakdown, 'sales'));
        
        foreach ($breakdown as &$item) {
            $item['percentage'] = $totalSales > 0 ? round(($item['sales'] / $totalSales) * 100, 2) : 0;
        }
        
        Response::success([
            'period' => $queryParams['period'] ?? 'all',
            'start_date' => $queryParams['startDate'] ?? null,
            'end_date' => $queryParams['endDate'] ?? null,
            'total_sales' => (float)$totalSales,
            'breakdown' => $breakdown
        ]);
    }
    
    // GET /api/analytics/sales/by-destination
    elseif (count($segments) === 3 && $segments[2] === 'by-destination') {
        $groupBy = $queryParams['groupBy'] ?? 'country';
        
        if ($groupBy === 'city') {
            $stmt = $pdo->query("
                SELECT at.destination_city as destination, at.destination_country as country,
                COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
                FROM air_travel at
                JOIN travel_packages tp ON at.package_id = tp.package_id
                GROUP BY at.destination_country, at.destination_city
                ORDER BY sales DESC
            ");
        } else {
            $stmt = $pdo->query("
                SELECT at.destination_country as destination, at.destination_country as country,
                COALESCE(SUM(tp.total_estimated_cost), 0) as sales, COUNT(*) as packages_count
                FROM air_travel at
                JOIN travel_packages tp ON at.package_id = tp.package_id
                GROUP BY at.destination_country
                ORDER BY sales DESC
            ");
        }
        
        $breakdown = $stmt->fetchAll();
        $totalSales = array_sum(array_column($breakdown, 'sales'));
        
        foreach ($breakdown as &$item) {
            $item['percentage'] = $totalSales > 0 ? round(($item['sales'] / $totalSales) * 100, 2) : 0;
            if ($groupBy === 'country') {
                $item['city'] = null;
            }
        }
        
        Response::success([
            'period' => $queryParams['period'] ?? 'all',
            'start_date' => $queryParams['startDate'] ?? null,
            'end_date' => $queryParams['endDate'] ?? null,
            'group_by' => $groupBy,
            'total_sales' => (float)$totalSales,
            'breakdown' => $breakdown
        ]);
    }
    
    else {
        Response::notFound('Endpoint not found');
    }
}

