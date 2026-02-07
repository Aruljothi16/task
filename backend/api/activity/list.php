<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = authenticate();

$database = new Database();
$db = $database->getConnection();

// Get query parameters
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$action_type = isset($_GET['action_type']) ? $_GET['action_type'] : null;
$entity_type = isset($_GET['entity_type']) ? $_GET['entity_type'] : null;
$date_from = isset($_GET['date_from']) ? $_GET['date_from'] : null;
$date_to = isset($_GET['date_to']) ? $_GET['date_to'] : null;
$search = isset($_GET['search']) ? $_GET['search'] : null;
$scope = isset($_GET['scope']) ? $_GET['scope'] : 'all'; // 'all', 'me', 'notifications'

try {
    // Base query with user information
    $base_query = "SELECT 
                    al.*, 
                    u.full_name as user_name,
                    u.username,
                    u.role as user_role
                   FROM activity_log al 
                   LEFT JOIN users u ON al.user_id = u.id";
    
    $where_conditions = [];
    $params = [];

    // Filter out login activities from notifications
    if ($scope === 'notifications') {
        $where_conditions[] = "al.action_type != 'login'";
    }
    
    // Role-based filtering
    if ($user_data['role'] === 'admin') {
        if ($scope === 'me') {
            $where_conditions[] = "al.user_id = :current_user_id";
            $params[':current_user_id'] = $user_data['id'];
        } else {
            // Admin sees all but hide manager/member logins as per user request
            $where_conditions[] = "!(al.action_type = 'login' AND u.role != 'admin')";
        }
        // Admin sees all activities otherwise
    } else if ($user_data['role'] === 'manager') {
        if ($scope === 'me') {
            $where_conditions[] = "al.user_id = :current_user_id";
            $params[':current_user_id'] = $user_data['id'];
        } else {
            // Managers see activities related to their projects OR their own activities
            $where_conditions[] = "(
                al.entity_type = 'project' AND al.entity_id IN (
                    SELECT id FROM projects WHERE manager_id = :mgr_id_1
                )
                OR al.entity_type = 'task' AND al.entity_id IN (
                    SELECT t.id FROM tasks t 
                    INNER JOIN projects p ON t.project_id = p.id 
                    WHERE p.manager_id = :mgr_id_2
                )
                OR al.user_id = :mgr_id_3
            )";
            $params[':mgr_id_1'] = $user_data['id'];
            $params[':mgr_id_2'] = $user_data['id'];
            $params[':mgr_id_3'] = $user_data['id'];
        }
    } else {
        // MEMBERS
        if ($scope === 'me') {
            // Only show THEIR actions (Activity Log case)
            $where_conditions[] = "al.user_id = :current_user_id";
            $params[':current_user_id'] = $user_data['id'];
        } else {
            // Notifications case: show their actions OR actions on their tasks/projects by others
            $where_conditions[] = "(
                al.user_id = :current_user_id
                OR (
                    al.entity_type = 'task' AND al.entity_id IN (
                        SELECT id FROM tasks WHERE assigned_to = :current_user_id
                    )
                )
                OR (
                    al.entity_type = 'project' AND al.entity_id IN (
                        SELECT project_id FROM project_members WHERE user_id = :current_user_id
                    )
                )
            )";
            $params[':current_user_id'] = $user_data['id'];
        }
    }
    
    // Additional filters
    if ($action_type) {
        $where_conditions[] = "al.action_type = :action_type";
        $params[':action_type'] = $action_type;
    }
    
    if ($entity_type) {
        $where_conditions[] = "al.entity_type = :entity_type";
        $params[':entity_type'] = $entity_type;
    }
    
    if ($date_from) {
        $where_conditions[] = "DATE(al.created_at) >= :date_from";
        $params[':date_from'] = $date_from;
    }
    
    if ($date_to) {
        $where_conditions[] = "DATE(al.created_at) <= :date_to";
        $params[':date_to'] = $date_to;
    }
    
    if ($search) {
        $where_conditions[] = "(al.description LIKE :search_desc OR u.full_name LIKE :search_name OR u.username LIKE :search_user)";
        $params[':search_desc'] = "%$search%";
        $params[':search_name'] = "%$search%";
        $params[':search_user'] = "%$search%";
    }
    
    // Build final query
    $query = $base_query;
    if (!empty($where_conditions)) {
        $query .= " WHERE " . implode(" AND ", $where_conditions);
    }
    $query .= " ORDER BY al.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    if (!$stmt->execute()) {
        $errorInfo = $stmt->errorInfo();
        throw new PDOException("Main query failed: " . $errorInfo[2]);
    }
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count for pagination
    $count_query = "SELECT COUNT(*) as total FROM activity_log al LEFT JOIN users u ON al.user_id = u.id";
    if (!empty($where_conditions)) {
        $count_query .= " WHERE " . implode(" AND ", $where_conditions);
    }
    
    $count_stmt = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    
    if (!$count_stmt->execute()) {
        $errorInfo = $count_stmt->errorInfo();
        throw new PDOException("Count query failed: " . $errorInfo[2]);
    }
    
    $fetch_total = $count_stmt->fetch(PDO::FETCH_ASSOC);
    $total = $fetch_total ? $fetch_total['total'] : 0;
    
    // Parse JSON metadata if exists
    foreach ($activities as &$activity) {
        if ($activity['metadata']) {
            $activity['metadata'] = json_decode($activity['metadata'], true);
        }
    }
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "activities" => $activities,
        "pagination" => [
            "total" => (int)$total,
            "limit" => $limit,
            "offset" => $offset,
            "has_more" => ($offset + $limit) < $total
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch activity logs",
        "error" => $e->getMessage()
    ]);
}
?>
