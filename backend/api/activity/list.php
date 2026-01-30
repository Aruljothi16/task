<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

try {
    // Base query with joins
    $base_query = "SELECT ta.*, 
                          u.full_name as user_name, 
                          t.title as task_title, 
                          p.name as project_name,
                          p.id as project_id
                   FROM task_activity ta 
                   LEFT JOIN users u ON ta.user_id = u.id 
                   LEFT JOIN tasks t ON ta.task_id = t.id 
                   LEFT JOIN projects p ON t.project_id = p.id";

    // Role-based filtering
    if ($user_data['role'] === 'admin') {
        $query = $base_query . " ORDER BY ta.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($query);
    } else if ($user_data['role'] === 'manager') {
        $query = $base_query . " WHERE p.manager_id = :manager_id ORDER BY ta.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":manager_id", $user_data['id']);
    } else {
        // Members see activity for tasks assigned to them
        // We could also show activity for tasks they follow or are assigned by them (if applicable)
        $query = $base_query . " WHERE t.assigned_to = :user_id ORDER BY ta.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_data['id']);
    }

    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format relative time or other enhancements if needed, 
    // but frontend is better at '2 minutes ago'

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "activities" => $activities
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Failed to fetch activities",
        "error" => $e->getMessage()
    ]);
}
?>
