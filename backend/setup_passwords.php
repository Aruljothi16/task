<?php
// Setup script to fix password hashes in database
// Access via: http://localhost/Task-management/backend/setup_passwords.php

require_once __DIR__ . '/config/database.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Password Setup Script</h2>";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        die("<p style='color:red'>Database connection failed!</p>");
    }
    
    echo "<p style='color:green'>✓ Database connected successfully</p>";
    
    $password = "admin123";
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "<p>Generated hash for 'admin123': <code>$hash</code></p>";
    
    // Update all users with the new hash
    $stmt = $db->prepare("UPDATE users SET password = :hash");
    $stmt->bindParam(":hash", $hash);
    $result = $stmt->execute();
    
    if ($result) {
        $affected = $stmt->rowCount();
        echo "<p style='color:green'>✓ Updated $affected user(s) with new password hash</p>";
    }
    
    // Verify the hash works
    $stmt = $db->prepare("SELECT email, password FROM users LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        echo "<p style='color:green'>✓ Password verification test: SUCCESS</p>";
    } else {
        echo "<p style='color:red'>✗ Password verification test: FAILED</p>";
    }
    
    echo "<hr>";
    echo "<h3>Test Login Credentials:</h3>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@tms.com / admin123</li>";
    echo "<li><strong>Manager:</strong> manager1@tms.com / admin123</li>";
    echo "<li><strong>Member:</strong> member1@tms.com / admin123</li>";
    echo "</ul>";
    
    echo "<p style='color:orange'><strong>Note:</strong> Delete this file after setup for security!</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
?>

