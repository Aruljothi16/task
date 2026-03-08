<?php
require_once __DIR__ . '/backend/models/AIService.php';

$title = "Urgent: Fix the broken login screen immediately";
$description = "The login screen is showing a 500 error for all users.";
$context = [
    "project_id" => 1,
    "due_date" => date('Y-m-d', strtotime('+1 day'))
];

$result = AIService::predictPriority($title, $description, $context);
echo "Priority Prediction Result:\n";
print_r($result);
?>
