<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Project.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();
$project = new Project($db);

// Admin sees all projects, Manager sees their projects
if ($user_data['role'] === 'admin') {
    $projects = $project->getAll();
} else if ($user_data['role'] === 'manager') {
    $projects = $project->getByManager($user_data['id']);
} else {
    // Members see projects they're assigned to
    $query = "SELECT DISTINCT p.*, u.full_name as manager_name 
              FROM projects p
              LEFT JOIN users u ON p.manager_id = u.id
              INNER JOIN project_members pm ON p.id = pm.project_id
              WHERE pm.user_id = :user_id
              ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_data['id']);
    $stmt->execute();
    $projects = $stmt->fetchAll();
}

http_response_code(200);
echo json_encode([
    "message" => "Projects retrieved successfully",
    "projects" => $projects
]);
?>






