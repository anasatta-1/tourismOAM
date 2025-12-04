<?php
/**
 * Database Connection - Singleton pattern for performance
 */

class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $config = require __DIR__ . '/config.php';
        $db = $config['db'];
        
        $dsn = "mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}";
        
        try {
            $this->pdo = new PDO($dsn, $db['username'], $db['password'], $db['options']);
        } catch (PDOException $e) {
            Response::error('Database connection failed: ' . $e->getMessage(), 500);
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

