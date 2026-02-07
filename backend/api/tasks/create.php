<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title) && !empty($data->project_id) && !empty($data->assigned_to)) {
    $task->title = $data->title;
    $task->description = $data->description ?? null;
    $task->project_id = $data->project_id;
    $task->assigned_to = $data->assigned_to;
    $task->assigned_by = $user_data['id'];
    $task->status = $data->status ?? 'pending';
    $task->priority = $data->priority ?? 'medium';
    $task->due_date = $data->due_date ?? null;

    if ($task->create()) {
        // Get project name for activity log
        $stmt = $db->prepare("SELECT name FROM projects WHERE id = :id");
        $stmt->execute(['id' => $task->project_id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        $project_name = $project ? $project['name'] : 'Unknown Project';
        
        // Get assigned user name
        $stmt = $db->prepare("SELECT full_name FROM users WHERE id = :id");
        $stmt->execute(['id' => $task->assigned_to]);
        $assigned_user = $stmt->fetch(PDO::FETCH_ASSOC);
        $assigned_to_name = $assigned_user ? $assigned_user['full_name'] : 'Unknown User';
        
        // Log task creation
        $logger->logTaskCreated(
            $user_data['id'],
            $task->id,
            $task->title,
            $project_name
        );
        
        // Log task assignment
        $logger->logTaskAssigned(
            $user_data['id'],
            $task->id,
            $task->title,
            $assigned_to_name
        );
        
        http_response_code(201);
        echo json_encode([
            "message" => "Task created successfully",
            "task" => [
                "id" => $task->id,
                "title" => $task->title,
                "description" => $task->description,
                "project_id" => $task->project_id,
                "assigned_to" => $task->assigned_to,
                "status" => $task->status,
                "priority" => $task->priority
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create task"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Title, project ID, and assigned_to are required"]);
}
?>







