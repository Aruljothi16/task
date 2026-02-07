<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

// Get filter parameters
$project_id = isset($_GET['project_id']) ? $_GET['project_id'] : null;
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if ($user_data['role'] === 'admin') {
    if ($project_id) {
        $tasks = $task->getByProject($project_id);
    } else {
        $tasks = $task->getAll();
    }
} else if ($user_data['role'] === 'manager') {
    if ($project_id) {
        $tasks = $task->getByProject($project_id);
    } else {
        // Get tasks from manager's projects
        $query = "SELECT t.*, p.name as project_name,
                         u1.full_name as assigned_to_name,
                         u1.designation as assigned_to_designation,
                         u2.full_name as assigned_by_name
                  FROM tasks t
                  LEFT JOIN projects p ON t.project_id = p.id
                  LEFT JOIN users u1 ON t.assigned_to = u1.id
                  LEFT JOIN users u2 ON t.assigned_by = u2.id
                  WHERE p.manager_id = :manager_id
                  ORDER BY t.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":manager_id", $user_data['id']);
        $stmt->execute();
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} else {
    // Members see only their tasks
    $tasks = $task->getByUser($user_data['id']);
}

http_response_code(200);
echo json_encode([
    "message" => "Tasks retrieved successfully",
    "tasks" => $tasks
]);
?>







