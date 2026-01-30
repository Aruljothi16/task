<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Modify the column type to include new statuses
    $sql = "ALTER TABLE tasks MODIFY COLUMN status ENUM('pending','in_progress','completed','cancelled','ready_for_testing','testing','verified','failed') NOT NULL DEFAULT 'pending'";
    $db->exec($sql);
    echo "Status column updated successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
