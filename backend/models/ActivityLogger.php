<?php
/**
 * Activity Logger Helper
 * Use this to log activities throughout the application
 */

class ActivityLogger {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Log an activity
     * 
     * @param int $user_id User who performed the action
     * @param string $action_type Type of action (e.g., 'task_created', 'project_updated')
     * @param string $entity_type Type of entity (e.g., 'task', 'project', 'user')
     * @param int|null $entity_id ID of the entity
     * @param string $description Human-readable description
     * @param string|null $old_value Previous value (for updates)
     * @param string|null $new_value New value (for updates)
     * @param array|null $metadata Additional metadata as associative array
     * @return bool Success status
     */
    public function log(
        $user_id,
        $action_type,
        $entity_type,
        $entity_id = null,
        $description = '',
        $old_value = null,
        $new_value = null,
        $metadata = null
    ) {
        try {
            $query = "INSERT INTO activity_log 
                     (user_id, action_type, entity_type, entity_id, description, 
                      old_value, new_value, metadata, ip_address, user_agent) 
                     VALUES 
                     (:user_id, :action_type, :entity_type, :entity_id, :description,
                      :old_value, :new_value, :metadata, :ip_address, :user_agent)";
            
            $stmt = $this->db->prepare($query);
            
            $ip_address = $this->getClientIP();
            $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null;
            $metadata_json = $metadata ? json_encode($metadata) : null;
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':action_type', $action_type);
            $stmt->bindParam(':entity_type', $entity_type);
            $stmt->bindParam(':entity_id', $entity_id);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':old_value', $old_value);
            $stmt->bindParam(':new_value', $new_value);
            $stmt->bindParam(':metadata', $metadata_json);
            $stmt->bindParam(':ip_address', $ip_address);
            $stmt->bindParam(':user_agent', $user_agent);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Activity Logger Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 
                        'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR');
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return null;
    }
    
    // Convenience methods for common actions
    
    public function logUserCreated($user_id, $created_user_id, $username, $role) {
        return $this->log(
            $user_id,
            'user_created',
            'user',
            $created_user_id,
            "Created new user: $username with role: $role",
            null,
            $role,
            ['username' => $username, 'role' => $role]
        );
    }
    
    public function logUserUpdated($user_id, $updated_user_id, $username, $changes) {
        return $this->log(
            $user_id,
            'user_updated',
            'user',
            $updated_user_id,
            "Updated user: $username",
            null,
            null,
            ['username' => $username, 'changes' => $changes]
        );
    }
    
    public function logProjectCreated($user_id, $project_id, $project_name) {
        return $this->log(
            $user_id,
            'project_created',
            'project',
            $project_id,
            "Created project: $project_name",
            null,
            null,
            ['project_name' => $project_name]
        );
    }
    
    public function logProjectUpdated($user_id, $project_id, $project_name, $changes) {
        return $this->log(
            $user_id,
            'project_updated',
            'project',
            $project_id,
            "Updated project: $project_name",
            null,
            null,
            ['project_name' => $project_name, 'changes' => $changes]
        );
    }
    
    public function logProjectStatusChanged($user_id, $project_id, $project_name, $old_status, $new_status) {
        return $this->log(
            $user_id,
            'project_status_changed',
            'project',
            $project_id,
            "Changed project '$project_name' status from $old_status to $new_status",
            $old_status,
            $new_status,
            ['project_name' => $project_name]
        );
    }
    
    public function logTaskCreated($user_id, $task_id, $task_title, $project_name) {
        return $this->log(
            $user_id,
            'task_created',
            'task',
            $task_id,
            "Created task: $task_title in project: $project_name",
            null,
            null,
            ['task_title' => $task_title, 'project_name' => $project_name]
        );
    }
    
    public function logTaskAssigned($user_id, $task_id, $task_title, $assigned_to_name) {
        return $this->log(
            $user_id,
            'task_assigned',
            'task',
            $task_id,
            "Assigned task '$task_title' to $assigned_to_name",
            null,
            $assigned_to_name,
            ['task_title' => $task_title, 'assigned_to' => $assigned_to_name]
        );
    }
    
    public function logTaskStatusChanged($user_id, $task_id, $task_title, $old_status, $new_status) {
        return $this->log(
            $user_id,
            'task_status_changed',
            'task',
            $task_id,
            "Changed task '$task_title' status from $old_status to $new_status",
            $old_status,
            $new_status,
            ['task_title' => $task_title]
        );
    }
    
    public function logTaskCommentAdded($user_id, $task_id, $task_title) {
        return $this->log(
            $user_id,
            'task_comment_added',
            'task',
            $task_id,
            "Added comment to task: $task_title",
            null,
            null,
            ['task_title' => $task_title]
        );
    }
    
    public function logTaskAttachmentAdded($user_id, $task_id, $task_title, $filename) {
        return $this->log(
            $user_id,
            'task_attachment_added',
            'task',
            $task_id,
            "Added attachment '$filename' to task: $task_title",
            null,
            $filename,
            ['task_title' => $task_title, 'filename' => $filename]
        );
    }
    
    public function logLogin($user_id, $username) {
        return $this->log(
            $user_id,
            'login',
            'system',
            null,
            "User $username logged in",
            null,
            null,
            ['username' => $username]
        );
    }
    
    public function logPasswordChanged($user_id, $username) {
        return $this->log(
            $user_id,
            'password_changed',
            'system',
            null,
            "User $username changed their password",
            null,
            null,
            ['username' => $username]
        );
    }
}
?>
