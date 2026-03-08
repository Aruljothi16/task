<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/role.php';

// Allow any authenticated user to get suggestions
$user_data = authenticate();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title)) {
    $context = [
        "project_id" => $data->project_id ?? null,
        "due_date" => $data->due_date ?? null,
        "estimated_hours" => $data->estimated_hours ?? null,
        "task_type" => $data->task_type ?? null,
        "dependencies" => $data->dependencies ?? []
    ];
    $prediction = AIService::predictPriority($data->title, $data->description ?? "", $context);
    
    if ($prediction) {
        echo json_encode($prediction);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Service currently unavailable"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Title is required for prediction"]);
}
