<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$sql = "
USE task_management_system;

ALTER TABLE projects
ADD COLUMN start_date DATE NULL,
ADD COLUMN due_date DATE NULL,
ADD COLUMN priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium';
";

try {
    $db->exec($sql);
    echo "Projects table updated successfully.\n";
} catch (PDOException $e) {
    echo "Error updating table: " . $e->getMessage() . "\n";
}
?>
