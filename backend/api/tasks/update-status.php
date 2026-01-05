<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';

$user_data = requireMember();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->task_id) && !empty($data->status)) {
    $task->id = $data->task_id;
    $task->status = $data->status;

    // Verify task belongs to user (for members)
    if ($user_data['role'] === 'member') {
        $task_data = $task->findById($task->id);
        if ($task_data && $task_data['assigned_to'] != $user_data['id']) {
            http_response_code(403);
            echo json_encode(["message" => "You can only update your own tasks"]);
            exit;
        }
    }

    if ($task->updateStatus()) {
        http_response_code(200);
        echo json_encode(["message" => "Task status updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update task status"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Task ID and status are required"]);
}
?>





