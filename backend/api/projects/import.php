<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Project.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$projectModel = new Project($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->projects) || !is_array($data->projects)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid data format. Expected an array of projects."]);
    exit;
}

$results = [
    "success" => [],
    "errors" => [],
    "total" => count($data->projects),
    "processed" => 0
];

foreach ($data->projects as $index => $p) {
    if (empty($p->name)) {
        $results["errors"][] = [
            "index" => $index,
            "name" => $p->name ?? "Unknown",
            "message" => "Missing required field: Name"
        ];
        continue;
    }

    $projectModel->name = $p->name;
    $projectModel->description = $p->description ?? null;
    
    if ($user_data['role'] === 'admin') {
        $projectModel->manager_id = $p->manager_id ?? $user_data['id'];
    } else {
        $projectModel->manager_id = $user_data['id'];
    }

    $projectModel->status = $p->status ?? 'active';
    $projectModel->start_date = $p->start_date ?? date('Y-m-d');
    $projectModel->due_date = $p->due_date ?? date('Y-m-d', strtotime('+30 days'));
    $projectModel->priority = $p->priority ?? 'medium';

    if ($projectModel->create()) {
        $results["success"][] = [
            "id" => $projectModel->id,
            "name" => $p->name
        ];
        
        $logger->logProjectCreated(
            $user_data['id'],
            $projectModel->id,
            $projectModel->name
        );
        
        $results["processed"]++;
    } else {
        $results["errors"][] = [
            "index" => $index,
            "name" => $p->name,
            "message" => "Database error during creation"
        ];
    }
}

echo json_encode([
    "message" => "Import completed with " . $results["processed"] . " successes and " . count($results["errors"]) . " errors.",
    "summary" => $results
]);
?>
