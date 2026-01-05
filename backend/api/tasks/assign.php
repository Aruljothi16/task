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

if (!empty($data->task_id) && !empty($data->assigned_to)) {
    $task->id = $data->task_id;
    $task->assigned_to = $data->assigned_to;

    $query = "UPDATE tasks 
              SET assigned_to = :assigned_to, updated_at = CURRENT_TIMESTAMP
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":assigned_to", $task->assigned_to);
    $stmt->bindParam(":id", $task->id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Task assigned successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to assign task"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Task ID and assigned_to are required"]);
}
?>





