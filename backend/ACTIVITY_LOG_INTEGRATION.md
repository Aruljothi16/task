# Activity Log Integration Guide

This guide shows you how to integrate activity logging into your existing API endpoints.

## Setup

1. **Run the migration script** to create the activity_log table:
   ```bash
   php backend/migrate_activity_log.php
   ```

2. **Include the ActivityLogger** in your API files:
   ```php
   require_once __DIR__ . '/../../models/ActivityLogger.php';
   ```

## Usage Examples

### Example 1: Logging User Creation (in api/users/create.php)

```php
<?php
require_once __DIR__ . '/../../config/headers.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/ActivityLogger.php';
require_once __DIR__ . '/../../middleware/role.php';

$user_data = authenticate();
requireRole(['admin']);

$database = new Database();
$db = $database->getConnection();
$logger = new ActivityLogger($db);

$data = json_decode(file_get_contents("php://input"));

// ... your existing user creation code ...

// After successful user creation:
$logger->logUserCreated(
    $user_data['id'],           // Who performed the action
    $new_user_id,               // ID of created user
    $data->username,            // Username
    $data->role                 // Role
);
?>
```

### Example 2: Logging Project Updates (in api/projects/update.php)

```php
<?php
require_once __DIR__ . '/../../models/ActivityLogger.php';

// ... existing code ...

$database = new Database();
$db = $database->getConnection();
$logger = new ActivityLogger($db);

// Get old project data before update
$stmt = $db->prepare("SELECT * FROM projects WHERE id = :id");
$stmt->execute(['id' => $data->id]);
$old_project = $stmt->fetch(PDO::FETCH_ASSOC);

// ... perform update ...

// Log the update
$changes = [];
if ($old_project['name'] !== $data->name) {
    $changes['name'] = ['from' => $old_project['name'], 'to' => $data->name];
}
if ($old_project['status'] !== $data->status) {
    $changes['status'] = ['from' => $old_project['status'], 'to' => $data->status];
}

$logger->logProjectUpdated(
    $user_data['id'],
    $data->id,
    $data->name,
    $changes
);
?>
```

### Example 3: Logging Task Status Changes (in api/tasks/update.php)

```php
<?php
require_once __DIR__ . '/../../models/ActivityLogger.php';

// ... existing code ...

$logger = new ActivityLogger($db);

// Get task info
$stmt = $db->prepare("SELECT title, status FROM tasks WHERE id = :id");
$stmt->execute(['id' => $task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

// If status changed
if ($old_status !== $new_status) {
    $logger->logTaskStatusChanged(
        $user_data['id'],
        $task_id,
        $task['title'],
        $old_status,
        $new_status
    );
}
?>
```

### Example 4: Logging Task Assignment (in api/tasks/assign.php)

```php
<?php
require_once __DIR__ . '/../../models/ActivityLogger.php';

// ... existing code ...

$logger = new ActivityLogger($db);

// Get assigned user name
$stmt = $db->prepare("SELECT full_name FROM users WHERE id = :id");
$stmt->execute(['id' => $assigned_to_id]);
$assigned_user = $stmt->fetch(PDO::FETCH_ASSOC);

// Get task title
$stmt = $db->prepare("SELECT title FROM tasks WHERE id = :id");
$stmt->execute(['id' => $task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

$logger->logTaskAssigned(
    $user_data['id'],
    $task_id,
    $task['title'],
    $assigned_user['full_name']
);
?>
```

### Example 5: Logging Comments (in api/tasks/notes/create.php)

```php
<?php
require_once __DIR__ . '/../../../models/ActivityLogger.php';

// ... existing code ...

$logger = new ActivityLogger($db);

// Get task title
$stmt = $db->prepare("SELECT title FROM tasks WHERE id = :id");
$stmt->execute(['id' => $task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

$logger->logTaskCommentAdded(
    $user_data['id'],
    $task_id,
    $task['title']
);
?>
```

### Example 6: Logging File Attachments (in api/tasks/attachments/upload.php)

```php
<?php
require_once __DIR__ . '/../../../models/ActivityLogger.php';

// ... existing code ...

$logger = new ActivityLogger($db);

// After successful file upload
$logger->logTaskAttachmentAdded(
    $user_data['id'],
    $task_id,
    $task['title'],
    $uploaded_filename
);
?>
```

### Example 7: Logging Login (in api/auth/login.php)

```php
<?php
require_once __DIR__ . '/../../models/ActivityLogger.php';

// ... existing code ...

// After successful login
$logger = new ActivityLogger($db);
$logger->logLogin($user['id'], $user['username']);
?>
```

### Example 8: Logging Password Changes (in api/users/change-password.php)

```php
<?php
require_once __DIR__ . '/../../models/ActivityLogger.php';

// ... existing code ...

// After successful password change
$logger = new ActivityLogger($db);
$logger->logPasswordChanged($user_data['id'], $user_data['username']);
?>
```

## Custom Activity Logging

For custom activities not covered by the convenience methods:

```php
$logger->log(
    $user_id,                    // User performing the action
    'custom_action_type',        // Action type (must be in ENUM or add to schema)
    'entity_type',               // Entity type (user, project, task, etc.)
    $entity_id,                  // ID of the entity (optional)
    'Human readable description', // Description
    $old_value,                  // Old value (optional)
    $new_value,                  // New value (optional)
    ['key' => 'value']          // Additional metadata (optional)
);
```

## Best Practices

1. **Always log after successful operations** - Don't log failed attempts unless it's for security
2. **Use descriptive messages** - Make descriptions human-readable
3. **Include relevant metadata** - Store additional context in the metadata field
4. **Don't log sensitive data** - Never log passwords or sensitive information
5. **Be consistent** - Use the same action types for similar operations
6. **Handle errors gracefully** - Activity logging failures shouldn't break your API

## Adding New Action Types

To add new action types, update the ENUM in the database schema:

```sql
ALTER TABLE activity_log 
MODIFY COLUMN action_type ENUM(
    'user_created', 'user_updated', 'user_deleted',
    'project_created', 'project_updated', 'project_deleted', 'project_status_changed',
    'task_created', 'task_updated', 'task_deleted', 'task_assigned', 'task_reassigned',
    'task_status_changed', 'task_priority_changed', 'task_comment_added',
    'task_attachment_added', 'task_attachment_deleted',
    'member_added', 'member_removed',
    'login', 'logout', 'password_changed',
    'your_new_action_type'  -- Add your new type here
) NOT NULL;
```

## Viewing Activity Logs

- **Admin Panel**: Navigate to `/admin/activity`
- **Manager Panel**: Navigate to `/manager/activity`

Both interfaces provide:
- Real-time activity feed
- Advanced filtering by action type, entity type, date range
- Search functionality
- Pagination for large datasets
- Activity statistics (today, this week, this month)
