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

    
    $query_str = "UPDATE tasks SET assigned_to = :assigned_to";
    
    if (!empty($data->status)) {
        $query_str .= ", status = :status";
    }
    
    $query_str .= ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    
    $stmt = $db->prepare($query_str);
    $stmt->bindParam(":assigned_to", $task->assigned_to);
    if (!empty($data->status)) {
        $stmt->bindParam(":status", $data->status);
    }
    $stmt->bindParam(":id", $task->id);

    if ($stmt->execute()) {
        // Log Activity
        try {
            $activity_query = "INSERT INTO task_activity (task_id, user_id, action, description) 
                             VALUES (:task_id, :user_id, 'assigned', :description)";
            
            // Get assignee name for friendly description
            $user_stmt = $db->prepare("SELECT full_name FROM users WHERE id = ?");
            $user_stmt->execute([$task->assigned_to]);
            $assignee = $user_stmt->fetch(PDO::FETCH_ASSOC);
            $assignee_name = $assignee ? $assignee['full_name'] : 'User #' . $task->assigned_to;
            
            $description = "assigned task to " . $assignee_name;
            
            $activity_stmt = $db->prepare($activity_query);
            $activity_stmt->bindParam(":task_id", $task->id);
            $activity_stmt->bindParam(":user_id", $user_data['id']);
            $activity_stmt->bindParam(":description", $description);
            $activity_stmt->execute();
        } catch (Exception $e) {
            // Ignore logging errors to not break the flow
        }

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






