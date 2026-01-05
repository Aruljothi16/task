<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();

// Check if file and task_id are present
if (!isset($_FILES['file']) || !isset($_POST['task_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "No file or task ID specified"]);
    exit;
}

$task_id = $_POST['task_id'];
$file = $_FILES['file'];

// Verify task permissions
try {
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
    
    // Setup upload directory
    $upload_dir = __DIR__ . '/../../uploads/tasks/' . $task_id . '/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Generate unique filename
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $clean_filename = preg_replace("/[^a-zA-Z0-9\._-]/", "", pathinfo($file['name'], PATHINFO_FILENAME));
    $new_filename = $clean_filename . '_' . time() . '.' . $file_extension;
    $target_path = $upload_dir . $new_filename;
    
    // Allowed file types
    $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'];
    if (!in_array(strtolower($file_extension), $allowed_types)) {
        http_response_code(400);
        echo json_encode(["message" => "File type not allowed"]);
        exit;
    }
    
    // Max size (10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(["message" => "File too large. Max 10MB"]);
        exit;
    }
    
    if (move_uploaded_file($file['tmp_name'], $target_path)) {
        // Save to DB
        $query = "INSERT INTO task_attachments (task_id, user_id, file_name, file_path, file_size, file_type) 
                  VALUES (:task_id, :user_id, :file_name, :file_path, :file_size, :file_type)";
        
        $relative_path = '/uploads/tasks/' . $task_id . '/' . $new_filename;
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":task_id", $task_id);
        $stmt->bindParam(":user_id", $user_data['id']);
        $stmt->bindParam(":file_name", $file['name']); // Original name
        $stmt->bindParam(":file_path", $relative_path);
        $stmt->bindParam(":file_size", $file['size']);
        $stmt->bindParam(":file_type", $file_extension);
        
        if ($stmt->execute()) {
            $attachment_id = $db->lastInsertId();
            
            // Log activity
            $log_query = "INSERT INTO task_activity (task_id, user_id, action, description) 
                          VALUES (:task_id, :user_id, 'file_uploaded', :description)";
            $log_stmt = $db->prepare($log_query);
            $log_stmt->bindParam(":task_id", $task_id);
            $log_stmt->bindParam(":user_id", $user_data['id']);
            $desc = "Uploaded file: " . $file['name'];
            $log_stmt->bindParam(":description", $desc);
            $log_stmt->execute();
            
            http_response_code(201);
            echo json_encode([
                "message" => "File uploaded successfully",
                "attachment" => [
                    "id" => $attachment_id,
                    "file_name" => $file['name'],
                    "file_path" => $relative_path,
                    "created_at" => date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to save file info"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to upload file"]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error processing upload", "error" => $e->getMessage()]);
}
?>
