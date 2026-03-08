<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    $database = new Database();
    $db = $database->getConnection();
    
    // Count active tasks for the user
    $stmt = $db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = :uid AND status IN ('pending', 'in_progress')");
    $stmt->execute(['uid' => $data->user_id]);
    $count = $stmt->fetchColumn();
    
    $result = AIService::predictDelay($count, $data->complexity ?? 'medium');
    
    if ($result) {
        echo json_encode($result);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Risk service unavailable"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "User ID is required"]);
}
