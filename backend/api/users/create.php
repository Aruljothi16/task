<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';

$user_data = requireAdmin();

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->email) && !empty($data->password) && !empty($data->full_name) && !empty($data->role)) {
    // Check if user already exists
    $existing_user = $user->findByEmail($data->email);
    if ($existing_user) {
        http_response_code(400);
        echo json_encode(["message" => "User with this email already exists"]);
        exit;
    }

    $user->username = $data->username;
    $user->email = $data->email;
    $user->password = password_hash($data->password, PASSWORD_DEFAULT);
    $user->full_name = $data->full_name;
    $user->role = $data->role;

    if ($user->create()) {
        http_response_code(201);
        echo json_encode([
            "message" => "User created successfully",
            "user" => [
                "id" => $user->id,
                "username" => $user->username,
                "email" => $user->email,
                "full_name" => $user->full_name,
                "role" => $user->role
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create user"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "All fields are required"]);
}
?>





