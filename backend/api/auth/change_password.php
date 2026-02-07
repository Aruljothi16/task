<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_session = requireMember();

$database = new Database();
$db = $database->getConnection();
$user_model = new User($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->current_password) && !empty($data->new_password)) {
    // Fetch user with password
    $query = "SELECT password FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user_session['id']);
    $stmt->execute();
    $user_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user_data && password_verify($data->current_password, $user_data['password'])) {
        if ($user_model->changePassword($user_session['id'], $data->new_password)) {
            // Log password change
            $logger->logPasswordChanged($user_session['id'], $user_session['username']);
            
            http_response_code(200);
            echo json_encode(["message" => "Password changed successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to change password"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Current password is incorrect"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Current and new passwords are required"]);
}
?>
