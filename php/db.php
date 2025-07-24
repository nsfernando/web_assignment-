<?php
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $this->connection = new mysqli('localhost', 'root', '', 'studentdb');

        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
        }

        $this->connection->set_charset("utf8mb4");
    }

    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    public function prepare($query) {
        return $this->connection->prepare($query);
    }

    public function lastInsertId() {
        return $this->connection->insert_id;
    }

    public function __destruct() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}

function getDB() {
    return Database::getInstance()->getConnection();
}

function executeStatement($query, $types = null, ...$params) {
    $db = Database::getInstance();
    $stmt = $db->prepare($query);

    if ($types && $params) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    return $stmt;
}
?>