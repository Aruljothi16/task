<?php
require_once __DIR__ . '/auth.php';

function requireRole($allowed_roles) {
    $user = authenticate();
    
    if (!in_array($user['role'], $allowed_roles)) {
        http_response_code(403);
        echo json_encode(["message" => "Access denied. Insufficient permissions."]);
        exit;
    }

    return $user;
}

function requireAdmin() {
    return requireRole(['admin']);
}

function requireManager() {
    return requireRole(['admin', 'manager']);
}

function requireMember() {
    return requireRole(['admin', 'manager', 'member']);
}
?>






