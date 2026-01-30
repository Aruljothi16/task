<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';

// Only managers can get member list
$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

try {
    // Get all active members
    $query = "SELECT id, full_name, email, role, designation, created_at 
              FROM users 
              WHERE role = 'member'
              ORDER BY full_name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        "message" => "Team members retrieved successfully",
        "members" => $members
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Failed to retrieve members",
        "error" => $e->getMessage()
    ]);
}
?>