<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/role.php';

$user = requireAdmin();

$database = new Database();
$db = $database->getConnection();

try {
    // Fetch project stats for inertia analysis
    $query = "SELECT p.id, p.name, 
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
              FROM projects p";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = AIService::analyzeInertia($projects);
    
    if ($result) {
        echo json_encode($result);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Inertia service unavailable"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error analyzing inertia", "error" => $e->getMessage()]);
}
