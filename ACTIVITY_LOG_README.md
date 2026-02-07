# Activity Log Feature Documentation

## Overview

The Activity Log feature provides comprehensive tracking of all key actions performed in the Task Management System. It records user activities, project changes, task updates, and system events with detailed metadata and timestamps.

## Features

### 🎯 Core Capabilities

- **Comprehensive Tracking**: Logs all major system activities including:
  - User management (create, update, delete)
  - Project operations (create, update, status changes)
  - Task management (create, assign, update, status changes)
  - Comments and attachments
  - Authentication events (login, password changes)

- **Role-Based Access**:
  - **Admins**: View all system activities
  - **Managers**: View activities related to their projects and tasks
  - **Members**: (Can be extended to view their own activities)

- **Advanced Filtering**:
  - Filter by action type
  - Filter by entity type (user, project, task, system)
  - Date range filtering
  - Full-text search across activities
  - Real-time statistics (today, this week, this month)

- **Beautiful UI**:
  - Modern, responsive design
  - Color-coded activity types
  - Icon-based visual indicators
  - Smooth animations and transitions
  - Dark/Light theme support
  - Pagination for large datasets

### 📊 Activity Statistics

The dashboard shows quick stats:
- Activities today
- Activities this week
- Activities this month

### 🔍 Search & Filter

- **Search**: Find activities by user name, description, or any text
- **Action Type Filter**: Filter by specific actions (created, updated, deleted, etc.)
- **Entity Type Filter**: Filter by entity (user, project, task, system)
- **Date Range**: Filter activities within a specific date range

## Installation

### 1. Database Setup

Run the migration script to create the activity_log table:

```bash
cd backend
php migrate_activity_log.php
```

Or manually run the SQL schema:

```bash
mysql -u your_username -p task_management_system < database/activity_log_schema.sql
```

### 2. Backend Integration

The ActivityLogger class is ready to use. See `ACTIVITY_LOG_INTEGRATION.md` for detailed integration examples.

### 3. Frontend Access

The Activity Log is accessible from:
- **Admin Panel**: Click "Activity Log" in the sidebar or navigate to `/admin/activity`
- **Manager Panel**: Click "Activity Log" in the sidebar or navigate to `/manager/activity`

## Usage

### For Administrators

1. Log in to the admin panel
2. Click "Activity Log" in the sidebar
3. View all system activities
4. Use filters to narrow down specific activities
5. Search for specific users or actions

### For Managers

1. Log in to the manager panel
2. Click "Activity Log" in the sidebar
3. View activities related to your projects and tasks
4. Use filters to track specific changes
5. Monitor team activities

## Activity Types

### User Activities
- `user_created` - New user account created
- `user_updated` - User information updated
- `user_deleted` - User account deleted

### Project Activities
- `project_created` - New project created
- `project_updated` - Project information updated
- `project_deleted` - Project deleted
- `project_status_changed` - Project status changed

### Task Activities
- `task_created` - New task created
- `task_updated` - Task information updated
- `task_deleted` - Task deleted
- `task_assigned` - Task assigned to a user
- `task_reassigned` - Task reassigned to another user
- `task_status_changed` - Task status changed
- `task_priority_changed` - Task priority changed
- `task_comment_added` - Comment added to task
- `task_attachment_added` - File attached to task
- `task_attachment_deleted` - Attachment removed from task

### Team Activities
- `member_added` - Member added to project
- `member_removed` - Member removed from project

### System Activities
- `login` - User logged in
- `logout` - User logged out
- `password_changed` - User changed password

## Database Schema

The `activity_log` table stores:

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| user_id | INT | User who performed the action |
| action_type | ENUM | Type of action performed |
| entity_type | ENUM | Type of entity affected |
| entity_id | INT | ID of the affected entity |
| description | TEXT | Human-readable description |
| old_value | TEXT | Previous value (for updates) |
| new_value | TEXT | New value (for updates) |
| metadata | JSON | Additional metadata |
| ip_address | VARCHAR(45) | IP address of the user |
| user_agent | VARCHAR(500) | Browser/client information |
| created_at | TIMESTAMP | When the activity occurred |

## API Endpoints

### GET `/api/activity/list.php`

Fetch activity logs with optional filters.

**Query Parameters:**
- `limit` (int): Number of records to fetch (default: 50)
- `offset` (int): Offset for pagination (default: 0)
- `action_type` (string): Filter by action type
- `entity_type` (string): Filter by entity type
- `date_from` (date): Filter from date (YYYY-MM-DD)
- `date_to` (date): Filter to date (YYYY-MM-DD)
- `search` (string): Search term

**Response:**
```json
{
  "status": "success",
  "activities": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

## Integration Examples

See `ACTIVITY_LOG_INTEGRATION.md` for detailed code examples on how to integrate activity logging into your API endpoints.

## Performance Considerations

The activity_log table includes several indexes for optimal performance:
- Index on `user_id`
- Index on `action_type`
- Composite index on `entity_type` and `entity_id`
- Index on `created_at`
- Composite index on `user_id` and `created_at`

For very large datasets (millions of records), consider:
- Archiving old activities (older than 1 year)
- Implementing database partitioning
- Using a separate analytics database

## Future Enhancements

Potential improvements for the Activity Log feature:

1. **Export Functionality**: Export activities to CSV/PDF
2. **Real-time Updates**: WebSocket integration for live activity feed
3. **Activity Trends**: Charts and graphs showing activity patterns
4. **Email Notifications**: Alert users about specific activities
5. **Audit Reports**: Generate compliance and audit reports
6. **Activity Replay**: Visual timeline of project/task changes
7. **User Activity Profiles**: Detailed activity history per user
8. **Bulk Operations Tracking**: Track batch operations
9. **Undo Functionality**: Ability to revert certain actions

## Troubleshooting

### Activities not showing up
- Ensure the migration script ran successfully
- Check that ActivityLogger is properly integrated in your API endpoints
- Verify database connection and permissions

### Slow performance
- Check database indexes are created
- Consider adding more specific filters
- Reduce the limit parameter for pagination

### Permission issues
- Verify user authentication is working
- Check role-based filtering in the API

## Support

For issues or questions about the Activity Log feature:
1. Check the integration guide: `ACTIVITY_LOG_INTEGRATION.md`
2. Review the database schema: `database/activity_log_schema.sql`
3. Examine the ActivityLogger class: `backend/models/ActivityLogger.php`

## License

This feature is part of the Task Management System and follows the same license as the main project.
