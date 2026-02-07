<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Project.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';

$user_data = requireAdmin();

$database = new Database();
$db = $database->getConnection();
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    // Get project name before deletion
    $check_stmt = $db->prepare("SELECT name FROM projects WHERE id = :id");
    $check_stmt->execute([':id' => $data->id]);
    $project = $check_stmt->fetch(PDO::FETCH_ASSOC);
    $project_name = $project ? $project['name'] : 'Unknown Project';

    $query = "DELETE FROM projects WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $data->id);

    if ($stmt->execute()) {
        // Log project deletion
        $logger->log(
            $user_data['id'],
            'project_deleted',
            'project',
            $data->id, // Referencing ID even if deleted for historical record
            "Deleted project: $project_name",
            $project_name,
            null,
            ['project_name' => $project_name]
        );
        
        http_response_code(200);
        echo json_encode(["message" => "Project deleted successfully", "status" => "success"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete project", "status" => "error"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to delete project. Data is incomplete.", "status" => "error"]);
}
?>
