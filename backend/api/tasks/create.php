<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

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






