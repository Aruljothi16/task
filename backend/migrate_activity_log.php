<?php
/**
 * Database Migration Script for Activity Log
 * Run this script once to set up the activity_log table
 */

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting Activity Log Migration...\n\n";
    
    // Create activity_log table
    $sql = "CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action_type ENUM(
            'user_created', 'user_updated', 'user_deleted',
            'project_created', 'project_updated', 'project_deleted', 'project_status_changed',
            'task_created', 'task_updated', 'task_deleted', 'task_assigned', 'task_reassigned',
            'task_status_changed', 'task_priority_changed', 'task_comment_added',
            'task_attachment_added', 'task_attachment_deleted',
            'member_added', 'member_removed',
            'login', 'logout', 'password_changed'
        ) NOT NULL,
        entity_type ENUM('user', 'project', 'task', 'comment', 'attachment', 'system') NOT NULL,
        entity_id INT,
        description TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        metadata JSON,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created (created_at),
        INDEX idx_composite (user_id, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Created activity_log table\n";
    
    // Add additional indexes for better performance
    $index_queries = [
        "CREATE INDEX IF NOT EXISTS idx_action_created ON activity_log(action_type, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_entity_created ON activity_log(entity_type, entity_id, created_at DESC)"
    ];
    
    foreach ($index_queries as $query) {
        try {
            $db->exec($query);
            echo "✓ Created index\n";
        } catch (PDOException $e) {
            // Index might already exist, that's okay
            if (strpos($e->getMessage(), 'Duplicate key name') === false) {
                throw $e;
            }
        }
    }
    
    // Insert some sample activity logs for testing (optional)
    echo "\nInserting sample activity logs...\n";
    
    // Get admin user ID
    $stmt = $db->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        $sample_activities = [
            [
                'user_id' => $admin['id'],
                'action_type' => 'login',
                'entity_type' => 'system',
                'description' => 'System initialized - Activity Log feature enabled',
                'metadata' => json_encode(['version' => '1.0', 'feature' => 'activity_log'])
            ]
        ];
        
        $insert_sql = "INSERT INTO activity_log 
                      (user_id, action_type, entity_type, entity_id, description, metadata) 
                      VALUES (:user_id, :action_type, :entity_type, NULL, :description, :metadata)";
        
        $stmt = $db->prepare($insert_sql);
        
        foreach ($sample_activities as $activity) {
            $stmt->execute($activity);
        }
        
        echo "✓ Inserted sample activity logs\n";
    }
    
    echo "\n✅ Activity Log Migration completed successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Integrate ActivityLogger in your API endpoints\n";
    echo "2. Access Activity Log from Admin panel: /admin/activity\n";
    echo "3. Access Activity Log from Manager panel: /manager/activity\n";
    
} catch (PDOException $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
