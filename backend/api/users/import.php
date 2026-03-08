<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$current_user = requireAdmin();

$database = new Database();
$db = $database->getConnection();
$userModel = new User($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->users) || !is_array($data->users)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid data format. Expected an array of users."]);
    exit;
}

$results = [
    "success" => [],
    "errors" => [],
    "total" => count($data->users),
    "processed" => 0
];

foreach ($data->users as $index => $u) {
    if (empty($u->full_name) || empty($u->email) || empty($u->role)) {
        $results["errors"][] = [
            "index" => $index,
            "email" => $u->email ?? "Unknown",
            "message" => "Missing required fields (Name, Email, or Role)"
        ];
        continue;
    }

    // Check if user already exists
    if ($userModel->findByEmail($u->email)) {
        $results["errors"][] = [
            "index" => $index,
            "email" => $u->email,
            "message" => "User with this email already exists"
        ];
        continue;
    }

    // Generate password if not provided
    $password = $u->password ?? (explode(' ', $u->full_name)[0] . rand(100, 999) . "!");
    
    $userModel->username = $u->username ?? explode('@', $u->email)[0];
    $userModel->email = $u->email;
    $userModel->password = password_hash($password, PASSWORD_DEFAULT);
    $userModel->full_name = $u->full_name;
    $userModel->role = $u->role;
    $userModel->designation = $u->designation ?? ($u->role === 'admin' ? 'Administrator' : ($u->role === 'manager' ? 'Manager' : 'Developer'));

    if ($userModel->create()) {
        $results["success"][] = [
            "full_name" => $u->full_name,
            "email" => $u->email,
            "password" => $password // Sending back so it can be shown in summary
        ];
        
        // Log user creation
        $logger->logUserCreated(
            $current_user['id'],
            $userModel->id,
            $userModel->username,
            $userModel->role
        );
        
        $results["processed"]++;
    } else {
        $results["errors"][] = [
            "index" => $index,
            "email" => $u->email,
            "message" => "Database error during creation"
        ];
    }
}

echo json_encode([
    "message" => "Import completed with " . $results["processed"] . " successes and " . count($results["errors"]) . " errors.",
    "summary" => $results
]);
?>
