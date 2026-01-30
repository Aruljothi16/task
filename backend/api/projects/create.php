<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Project.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$project = new Project($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name)) {
    $project->name = $data->name;
    $project->description = $data->description ?? null;
    
    // Logic for manager assignment
    if ($user_data['role'] === 'admin') {
        if (empty($data->manager_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Manager ID is required for admins"]);
            exit;
        }
        $project->manager_id = $data->manager_id;
    } else {
        // Managers can only create projects for themselves
        $project->manager_id = $user_data['id'];
    }

    $project->status = $data->status ?? 'active';
    $project->start_date = $data->start_date ?? null;
    $project->due_date = $data->due_date ?? null;
    $project->priority = $data->priority ?? 'medium';

    if ($project->create()) {
        http_response_code(201);
        echo json_encode([
            "message" => "Project created successfully",
            "project" => [
                "id" => $project->id,
                "name" => $project->name,
                "description" => $project->description,
                "manager_id" => $project->manager_id,
                "status" => $project->status
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create project"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Project name and manager ID are required"]);
}
?>






