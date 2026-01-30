<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';

$user_session = requireMember();

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_info = $user->findByIdDetailed($user_session['id']);
    if ($user_info) {
        http_response_code(200);
        echo json_encode($user_info);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "User not found"]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->full_name) && !empty($data->email)) {
        // Fetch current user data to keep things consistent
        $current_user = $user->findById($user_session['id']);
        
        $user->id = $user_session['id'];
        $user->username = $data->username ?? $current_user['username'];
        $user->email = $data->email;
        $user->full_name = $data->full_name;
        $user->role = $user_session['role']; // Don't let users change their own role here
        
        if ($user->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Profile updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update profile"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Full name and email are required"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
