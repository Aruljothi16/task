<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

$task_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$task_id) {
    http_response_code(400);
    echo json_encode(["message" => "Task ID is required"]);
    exit;
}

$task_data = $task->findById($task_id);

if (!$task_data) {
    http_response_code(404);
    echo json_encode(["message" => "Task not found"]);
    exit;
}

// Check permissions
if ($user_data['role'] === 'member' && $task_data['assigned_to'] != $user_data['id']) {
    http_response_code(403);
    echo json_encode(["message" => "Access denied"]);
    exit;
}

if ($user_data['role'] === 'manager') {
    // Check if task belongs to manager's project
    $query = "SELECT p.manager_id FROM projects p WHERE p.id = :project_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":project_id", $task_data['project_id']);
    $stmt->execute();
    $project = $stmt->fetch();
    
    if ($project && $project['manager_id'] != $user_data['id'] && $user_data['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Access denied"]);
        exit;
    }
}

// Fetch task notes
$notes_query = "SELECT n.*, u.full_name as user_name 
                FROM task_notes n 
                LEFT JOIN users u ON n.user_id = u.id 
                WHERE n.task_id = :task_id 
                ORDER BY n.created_at DESC";
$stmt = $db->prepare($notes_query);
$stmt->bindParam(":task_id", $task_id);
$stmt->execute();
$task_data['notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch task attachments
$attachments_query = "SELECT a.*, u.full_name as user_name 
                      FROM task_attachments a 
                      LEFT JOIN users u ON a.user_id = u.id 
                      WHERE a.task_id = :task_id 
                      ORDER BY a.created_at DESC";
$stmt = $db->prepare($attachments_query);
$stmt->bindParam(":task_id", $task_id);
$stmt->execute();
$task_data['attachments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    "message" => "Task retrieved successfully",
    "task" => $task_data
]);
?>







