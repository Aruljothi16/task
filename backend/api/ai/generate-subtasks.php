<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$data = json_decode(file_get_contents("php://input"));


if (!empty($data->title)) {
    $description = $data->description ?? '';
    $result = AIService::generateSubtasks($data->title, $description);

    if ($result) {
        echo json_encode($result);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Subtask service unavailable"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Task title is required"]);
}
