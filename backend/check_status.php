<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->query("SHOW COLUMNS FROM tasks LIKE 'status'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    print_r($column);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
