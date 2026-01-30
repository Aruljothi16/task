<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();

$summary = [];

if ($user_data['role'] === 'admin') {
    // Admin dashboard stats
    $stats = [
        'total_users' => 0,
        'total_projects' => 0,
        'total_tasks' => 0,
        'tasks_by_status' => [],
        'projects_by_status' => []
    ];

    $query = "SELECT COUNT(*) as count FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['total_users'] = $stmt->fetch()['count'];

    $query = "SELECT COUNT(*) as count FROM projects";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['total_projects'] = $stmt->fetch()['count'];

    $query = "SELECT COUNT(*) as count FROM tasks";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['total_tasks'] = $stmt->fetch()['count'];

    $query = "SELECT status, COUNT(*) as count FROM tasks GROUP BY status";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['tasks_by_status'] = $stmt->fetchAll();

    $query = "SELECT status, COUNT(*) as count FROM projects GROUP BY status";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['projects_by_status'] = $stmt->fetchAll();

    $summary = $stats;
} else if ($user_data['role'] === 'manager') {
    // Manager dashboard stats
    $stats = [
        'my_projects' => 0,
        'my_tasks' => 0,
        'tasks_by_status' => []
    ];

    $query = "SELECT COUNT(*) as count FROM projects WHERE manager_id = :manager_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":manager_id", $user_data['id']);
    $stmt->execute();
    $stats['my_projects'] = $stmt->fetch()['count'];

    $query = "SELECT COUNT(*) as count FROM tasks t
              INNER JOIN projects p ON t.project_id = p.id
              WHERE p.manager_id = :manager_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":manager_id", $user_data['id']);
    $stmt->execute();
    $stats['my_tasks'] = $stmt->fetch()['count'];

    $query = "SELECT t.status, COUNT(*) as count FROM tasks t
              INNER JOIN projects p ON t.project_id = p.id
              WHERE p.manager_id = :manager_id
              GROUP BY t.status";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":manager_id", $user_data['id']);
    $stmt->execute();
    $stats['tasks_by_status'] = $stmt->fetchAll();

    $summary = $stats;
} else {
    // Member dashboard stats
    $stats = [
        'my_tasks' => 0,
        'tasks_by_status' => []
    ];

    $query = "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_data['id']);
    $stmt->execute();
    $stats['my_tasks'] = $stmt->fetch()['count'];

    $query = "SELECT status, COUNT(*) as count FROM tasks 
              WHERE assigned_to = :user_id 
              GROUP BY status";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_data['id']);
    $stmt->execute();
    $stats['tasks_by_status'] = $stmt->fetchAll();

    $summary = $stats;
}

http_response_code(200);
echo json_encode([
    "message" => "Dashboard summary retrieved successfully",
    "summary" => $summary
]);
?>






