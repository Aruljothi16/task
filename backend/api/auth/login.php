<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $user_data = $user->findByEmail($data->email);

    if ($user_data) {
        // Debug: Log password verification attempt
        $password_match = password_verify($data->password, $user_data['password']);
        
        if ($password_match) {
            $token_payload = [
                "id" => $user_data['id'],
                "email" => $user_data['email'],
                "role" => $user_data['role'],
                "exp" => time() + (24 * 60 * 60) // 24 hours
            ];

            $token = JWT::encode($token_payload);

            // Log successful login
            $logger->logLogin($user_data['id'], $user_data['username']);

            http_response_code(200);
            echo json_encode([
                "message" => "Login successful",
                "token" => $token,
                "user" => [
                    "id" => $user_data['id'],
                    "username" => $user_data['username'],
                    "email" => $user_data['email'],
                    "full_name" => $user_data['full_name'],
                    "role" => $user_data['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                "message" => "Invalid email or password",
                "debug" => "Password verification failed"
            ]);
        }
    } else {
        http_response_code(401);
        echo json_encode([
            "message" => "Invalid email or password",
            "debug" => "User not found"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Email and password are required"]);
}
?>

