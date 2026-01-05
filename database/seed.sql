-- Seed data for Task Management System
USE task_management_system;

-- Insert default admin user (password: admin123)
-- Password hash generated with: password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'admin'),
('manager1', 'manager1@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John Manager', 'manager'),
('manager2', 'manager2@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane Manager', 'manager'),
('member1', 'member1@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice Developer', 'member'),
('member2', 'member2@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob Developer', 'member'),
('member3', 'member3@tms.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Charlie Designer', 'member');

-- Insert sample projects
INSERT INTO projects (name, description, manager_id, status) VALUES
('Website Redesign', 'Complete redesign of company website', 2, 'active'),
('Mobile App Development', 'New mobile application for iOS and Android', 2, 'active'),
('API Integration', 'Integrate third-party APIs', 3, 'active'),
('Database Migration', 'Migrate legacy database to new system', 3, 'on_hold');

-- Insert project members
INSERT INTO project_members (project_id, user_id) VALUES
(1, 4), (1, 5), (1, 6),
(2, 4), (2, 5),
(3, 5), (3, 6),
(4, 4), (4, 6);

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, assigned_to, assigned_by, status, priority, due_date) VALUES
('Design Homepage', 'Create new homepage design mockup', 1, 6, 2, 'in_progress', 'high', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('Implement Login Page', 'Build login functionality with authentication', 1, 4, 2, 'pending', 'high', DATE_ADD(NOW(), INTERVAL 5 DAY)),
('Setup React Native', 'Initialize React Native project structure', 2, 4, 2, 'completed', 'medium', DATE_ADD(NOW(), INTERVAL 3 DAY)),
('API Authentication', 'Implement OAuth2 for API access', 3, 5, 3, 'in_progress', 'high', DATE_ADD(NOW(), INTERVAL 10 DAY)),
('Data Backup', 'Create backup strategy before migration', 4, 4, 3, 'pending', 'medium', DATE_ADD(NOW(), INTERVAL 14 DAY)),
('User Dashboard', 'Design and implement user dashboard', 1, 5, 2, 'pending', 'medium', DATE_ADD(NOW(), INTERVAL 8 DAY));
