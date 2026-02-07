-- Enhanced Activity Log Schema
-- Comprehensive activity tracking for all system actions

USE task_management_system;

-- Drop existing table if you want to recreate with new structure
-- DROP TABLE IF EXISTS activity_log;

-- Comprehensive Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance on common queries
CREATE INDEX idx_action_created ON activity_log(action_type, created_at DESC);
CREATE INDEX idx_entity_created ON activity_log(entity_type, entity_id, created_at DESC);
