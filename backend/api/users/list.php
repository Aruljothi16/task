<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';

requireAdmin();

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$users = $user->getAll();

http_response_code(200);
echo json_encode([
    "message" => "Users retrieved successfully",
    "users" => $users
]);
?>





