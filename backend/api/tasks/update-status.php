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
        // Log Activity
        try {
            $activity_query = "INSERT INTO task_activity (task_id, user_id, action, description) 
                             VALUES (:task_id, :user_id, 'status_updated', :description)";
            
            $description = "changed status to " . str_replace('_', ' ', ucfirst($task->status));
            
            $activity_stmt = $db->prepare($activity_query);
            $activity_stmt->bindParam(":task_id", $task->id);
            $activity_stmt->bindParam(":user_id", $user_data['id']);
            $activity_stmt->bindParam(":description", $description);
            $activity_stmt->execute();
        } catch (Exception $e) {
            // Ignore errors
        }

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






