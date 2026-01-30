<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';

requireAdmin();

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    // Delete query
    $query = "DELETE FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $data->id);

    if ($stmt->execute()) {
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
