<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Task.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireManager();

$database = new Database();
$db = $database->getConnection();
$taskModel = new Task($db);
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->tasks) || !is_array($data->tasks)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid data format. Expected an array of tasks."]);
    exit;
}

$results = [
    "success" => [],
    "errors" => [],
    "total" => count($data->tasks),
    "processed" => 0
];

// Cache for project names and member emails to IDs
$projectCache = [];
$userCache = [];

foreach ($data->tasks as $index => $t) {
    if (empty($t->title) || empty($t->project_id) || empty($t->assigned_to)) {
        $results["errors"][] = [
            "index" => $index,
            "title" => $t->title ?? "Unknown",
            "message" => "Missing required fields (Title, Project, or Assigned To)"
        ];
        continue;
    }

    $taskModel->title = $t->title;
    $taskModel->description = $t->description ?? null;
    $taskModel->project_id = $t->project_id;
    $taskModel->assigned_to = $t->assigned_to;
    $taskModel->assigned_by = $user_data['id'];
    $taskModel->status = $t->status ?? 'pending';
    $taskModel->priority = $t->priority ?? 'medium';
    $taskModel->due_date = $t->due_date ?? date('Y-m-d', strtotime('+7 days'));

    if ($taskModel->create()) {
        // Log task creation (simplified for bulk)
        $results["success"][] = [
            "id" => $taskModel->id,
            "title" => $t->title
        ];
        
        // Basic logging
        $logger->logTaskCreated(
            $user_data['id'],
            $taskModel->id,
            $taskModel->title,
            "Project ID: " . $t->project_id
        );
        
        $results["processed"]++;
    } else {
        $results["errors"][] = [
            "index" => $index,
            "title" => $t->title,
            "message" => "Database error during creation"
        ];
    }
}

echo json_encode([
    "message" => "Import completed with " . $results["processed"] . " successes and " . count($results["errors"]) . " errors.",
    "summary" => $results
]);
?>
