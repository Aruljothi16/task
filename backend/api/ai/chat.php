<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../models/AIService.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->message)) {
    $response = AIService::chat(
        $data->message, 
        $user['role'], 
        $user['id'], 
        $user['full_name'] ?? $user['username']
    );
    
    if ($response) {
        echo json_encode($response);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "AI Chat currently unavailable"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Message is required"]);
}
