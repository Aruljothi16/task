<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->query("SELECT id, full_name, role, designation FROM users WHERE designation = 'Tester'");
    $testers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($testers) > 0) {
        echo "Found " . count($testers) . " testers:\n";
        print_r($testers);
    } else {
        echo "No users found with designation 'Tester'. Please create one in the Admin panel.\n";
    }
    
    // Also check total members
    $stmt = $db->query("SELECT id, full_name, role, designation FROM users WHERE role = 'member'");
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nTotal Members found: " . count($members) . "\n";
    print_r($members);

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
