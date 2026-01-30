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

if (!empty($data->id)) {
    $user->id = $data->id;
    $user->username = $data->username ?? null;
    $user->email = $data->email ?? null;
    $user->full_name = $data->full_name ?? null;
    $user->role = $data->role ?? null;
    $user->designation = $data->designation ?? null;
    
    if (!empty($data->password)) {
        $user->password = password_hash($data->password, PASSWORD_DEFAULT);
    }

    if ($user->update()) {
        http_response_code(200);
        echo json_encode(["message" => "User updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update user"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "User ID is required"]);
}
?>






