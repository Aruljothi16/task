<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->project_id)) {
    // 1. Get project members (excluding testers and managers)
    $stmt = $db->prepare("SELECT u.id, u.full_name FROM users u 
                          JOIN project_members pm ON u.id = pm.user_id 
                          WHERE pm.project_id = :project_id 
                          AND LOWER(u.designation) NOT IN ('tester', 'manager')");
    $stmt->execute(['project_id' => $data->project_id]);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fallback: If no members explicitly assigned to project, get all 'member' role users (excluding testers and managers)
    if (empty($members)) {
        $stmt = $db->prepare("SELECT id, full_name FROM users 
                              WHERE role = 'member' 
                              AND (LOWER(designation) NOT IN ('tester', 'manager') OR designation IS NULL)");
        $stmt->execute();
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if (empty($members)) {
        echo json_encode(["message" => "No members available for analysis"]);
        exit;
    }

    error_log("Workload Analysis for project $data->project_id: Found " . count($members) . " members.");

    // 2. Get ALL active tasks for these specific members (cross-project)
    $member_ids = array_column($members, 'id');
    $placeholders = implode(',', array_fill(0, count($member_ids), '?'));
    
    $stmt = $db->prepare("SELECT assigned_to, status FROM tasks 
                          WHERE assigned_to IN ($placeholders) 
                          AND status IN ('pending', 'in_progress')");
    $stmt->execute($member_ids);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Call AI Service
    $analysis = AIService::analyzeWorkload($members, $tasks);
    
    if ($analysis) {
        echo json_encode($analysis);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Service currently unavailable"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Project ID is required"]);
}
