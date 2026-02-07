<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();
$logger = new ActivityLogger($db);

// Get request data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->task_id) || !isset($data->note)) {
    http_response_code(400);
    echo json_encode(["message" => "Task ID and note are required"]);
    exit;
}

$task_id = $data->task_id;
$note = trim($data->note);

if (empty($note)) {
    http_response_code(400);
    echo json_encode(["message" => "Note cannot be empty"]);
    exit;
}

try {
    // Verify task exists and user has access
    $query = "SELECT t.*, p.manager_id 
              FROM tasks t
              LEFT JOIN projects p ON t.project_id = p.id
              WHERE t.id = :task_id LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":task_id", $task_id);
    $stmt->execute();
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        http_response_code(404);
        echo json_encode(["message" => "Task not found"]);
        exit;
    }
    
    // Check permissions
    $has_access = false;
    if ($user_data['role'] === 'admin') {
        $has_access = true;
    } elseif ($user_data['role'] === 'manager' && $task['manager_id'] == $user_data['id']) {
        $has_access = true;
    } elseif ($user_data['role'] === 'member' && $task['assigned_to'] == $user_data['id']) {
        $has_access = true;
    }
    
    if (!$has_access) {
        http_response_code(403);
        echo json_encode(["message" => "Access denied"]);
        exit;
    }
    
    // Insert note
    $query = "INSERT INTO task_notes (task_id, user_id, note) 
              VALUES (:task_id, :user_id, :note)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":task_id", $task_id);
    $stmt->bindParam(":user_id", $user_data['id']);
    $stmt->bindParam(":note", $note);
    
    if ($stmt->execute()) {
        $note_id = $db->lastInsertId();
        
        // Log activity with new ActivityLogger
        $logger->logTaskCommentAdded(
            $user_data['id'],
            $task_id,
            $task['title']
        );
        
        http_response_code(201);
        echo json_encode([
            "message" => "Note added successfully",
            "note_id" => $note_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to add note"]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Failed to add note",
        "error" => $e->getMessage()
    ]);
}
?>
