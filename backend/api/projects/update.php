<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Project.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$project = new Project($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    // Check if project exists
    $existing_project = $project->findById($data->id);
    
    if (!$existing_project) {
        http_response_code(404);
        echo json_encode(["message" => "Project not found"]);
        exit;
    }
    
    // Check permissions
    if ($user_data['role'] !== 'admin' && $existing_project['manager_id'] != $user_data['id']) {
        http_response_code(403);
        echo json_encode(["message" => "Access denied"]);
        exit;
    }

    $project->id = $data->id;
    $project->name = $data->name ?? $existing_project['name'];
    $project->description = $data->description ?? $existing_project['description'];
    
    // Allow admin to change manager
    if ($user_data['role'] === 'admin' && !empty($data->manager_id)) {
        $project->manager_id = $data->manager_id;
    } else {
        $project->manager_id = $existing_project['manager_id'];
    }
    
    $project->status = $data->status ?? $existing_project['status'];
    $project->start_date = $data->start_date ?? $existing_project['start_date'];
    $project->due_date = $data->due_date ?? $existing_project['due_date'];
    $project->priority = $data->priority ?? $existing_project['priority'];

    if ($project->update()) {
        // Log project update
        $changes = [];
        if ($data->name && $data->name !== $existing_project['name']) $changes[] = 'name';
        if ($data->description && $data->description !== $existing_project['description']) $changes[] = 'description';
        if ($data->priority && $data->priority !== $existing_project['priority']) $changes[] = 'priority';
        
        if (!empty($changes)) {
            $logger->logProjectUpdated(
                $user_data['id'],
                $project->id,
                $project->name,
                $changes
            );
        }
        
        // Log status change separately if status changed
        if ($data->status && $data->status !== $existing_project['status']) {
            $logger->logProjectStatusChanged(
                $user_data['id'],
                $project->id,
                $project->name,
                $existing_project['status'],
                $data->status
            );
        }
        
        http_response_code(200);
        echo json_encode(["message" => "Project updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update project"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Project ID is required"]);
}
?>
