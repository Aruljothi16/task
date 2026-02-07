<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireAdmin();

$database = new Database();
$db = $database->getConnection();
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    // Get user details before deletion
    $check_stmt = $db->prepare("SELECT username, email FROM users WHERE id = :id");
    $check_stmt->execute([':id' => $data->id]);
    $user = $check_stmt->fetch(PDO::FETCH_ASSOC);
    $username = $user ? $user['username'] : 'Unknown User';
    
    // Delete query
    $query = "DELETE FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $data->id);

    if ($stmt->execute()) {
        // Log user deletion
        $logger->log(
            $user_data['id'],
            'user_deleted',
            'user',
            $data->id,
            "Deleted user: $username",
            $username,
            null,
            ['username' => $username, 'email' => $user['email'] ?? '']
        );
        
        http_response_code(200);
        echo json_encode(["message" => "User deleted successfully", "status" => "success"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete user", "status" => "error"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to delete user. ID is incomplete.", "status" => "error"]);
}
?>
