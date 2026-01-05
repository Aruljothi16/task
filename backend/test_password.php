<?php
// Quick script to generate password hash for "admin123"
$password = "admin123";
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Password: " . $password . "\n";
echo "Hash: " . $hash . "\n";
echo "\nVerification: " . (password_verify($password, $hash) ? "SUCCESS" : "FAILED") . "\n";
?>





