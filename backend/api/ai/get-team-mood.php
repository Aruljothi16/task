<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/role.php';

$user = requireManager(); // Only managers/admins should see team mood

$database = new Database();
$db = $database->getConnection();

try {
    // Fetch latest 50 notes across the system (for high-level sentiment)
    $stmt = $db->prepare("SELECT note FROM task_notes ORDER BY created_at DESC LIMIT 50");
    $stmt->execute();
    $notes = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($notes)) {
        echo json_encode(["mood" => "neutral", "reason" => "Not enough data yet."]);
        exit;
    }

    $result = AIService::analyzeSentiment($notes);
    
    if ($result) {
        echo json_encode($result);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Mood service unavailable"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error analyzing mood", "error" => $e->getMessage()]);
}
