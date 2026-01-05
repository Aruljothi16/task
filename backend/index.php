<?php
// Main entry point for API routing
require_once __DIR__ . '/config/headers.php';

// Simple router
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/backend', '', $path);
$path = trim($path, '/');

// Route to appropriate endpoint
$routes = [
    'api/auth/login' => 'api/auth/login.php',
    'api/users/create' => 'api/users/create.php',
    'api/users/list' => 'api/users/list.php',
    'api/users/update' => 'api/users/update.php',
    'api/projects/create' => 'api/projects/create.php',
    'api/projects/list' => 'api/projects/list.php',
    'api/tasks/create' => 'api/tasks/create.php',
    'api/tasks/list' => 'api/tasks/list.php',
    'api/tasks/get' => 'api/tasks/get.php',
    'api/tasks/assign' => 'api/tasks/assign.php',
    'api/tasks/update-status' => 'api/tasks/update-status.php',
    'api/dashboard/summary' => 'api/dashboard/summary.php',
    'api/test/connection' => 'api/test/connection.php'
];

if (isset($routes[$path])) {
    $file_path = __DIR__ . '/' . $routes[$path];
    if (file_exists($file_path)) {
        require_once $file_path;
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["message" => "Route not found"]);
}
?>

