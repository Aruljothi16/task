# Task Management System (TMS)

A comprehensive Role-Based Task Management System built with React, PHP, and MySQL. This system provides different interfaces and functionalities for Admin, Manager, and Member roles.

## 🏗️ Project Structure

```
task-management-system/
├── frontend/                      # React.js Application
│   ├── public/
│   ├── src/
│   │   ├── assets/styles/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── manager/
│   │   │   ├── member/
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── routes/
│   └── package.json
│
├── backend/                       # PHP REST API
│   ├── api/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── dashboard/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   └── index.php
│
└── database/
    ├── schema.sql
    └── seed.sql
```

## 🔐 Role Responsibilities

### 👑 Admin
- Dashboard with overall statistics
- Manage users & roles
- View all projects
- View all tasks and their status
- System settings

### 🧑‍💼 Manager
- Dashboard with project statistics
- Manage own projects
- Create & assign tasks
- Track task progress
- Settings

### 👨‍💻 Member
- Dashboard with personal task statistics
- View assigned tasks
- Update task status
- Settings

## 🚀 Setup Instructions

### Prerequisites
- XAMPP (PHP 7.4+, MySQL, Apache)
- Node.js (v14+)
- npm or yarn

### Database Setup

1. **Start XAMPP** and ensure MySQL is running

2. **Create Database**:
   ```bash
   # Open phpMyAdmin (http://localhost/phpmyadmin)
   # Or use MySQL command line:
   mysql -u root -p
   ```

3. **Import Schema**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Seed Data**:
   ```bash
   mysql -u root -p < database/seed.sql
   ```

### Backend Setup

1. **Configure Database** (if needed):
   Edit `backend/config/database.php` to match your MySQL credentials:
   ```php
   private $host = "localhost";
   private $db_name = "task_management_system";
   private $username = "root";
   private $password = "";
   ```

2. **Configure API Base URL**:
   The backend should be accessible at: `http://localhost/Task-management/backend`

3. **Set Permissions**:
   ```bash
   chmod -R 755 backend/uploads
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd tms-frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure API URL** (if needed):
   Edit `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://localhost/Task-management/backend';
   ```

4. **Start Development Server**:
   ```bash
   npm start
   ```

5. **Access Application**:
   Open `http://localhost:3000` in your browser

## 🔑 Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin**:
  - Email: `admin@tms.com`
  - Password: `admin123`

- **Manager**:
  - Email: `manager1@tms.com`
  - Password: `admin123`

- **Member**:
  - Email: `member1@tms.com`
  - Password: `admin123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin Only)
- `GET /api/users/list` - List all users
- `POST /api/users/create` - Create new user
- `PUT /api/users/update` - Update user

### Projects
- `GET /api/projects/list` - List projects (role-based)
- `POST /api/projects/create` - Create project (Manager+)

### Tasks
- `GET /api/tasks/list` - List tasks (role-based)
- `POST /api/tasks/create` - Create task (Manager+)
- `POST /api/tasks/assign` - Assign/reassign task (Manager+)
- `POST /api/tasks/update-status` - Update task status (Member+)

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard statistics (role-based)

## 🛠️ Technologies Used

### Frontend
- React 19.2.3
- React Router DOM 6.20.0
- Axios 1.6.0
- CSS3

### Backend
- PHP 7.4+
- MySQL
- JWT (JSON Web Tokens) for authentication
- PDO for database operations

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- CORS configuration
- SQL injection prevention (PDO prepared statements)
- XSS protection

## 📝 Features

- ✅ User authentication and authorization
- ✅ Role-based dashboard
- ✅ User management (Admin)
- ✅ Project management (Manager)
- ✅ Task creation and assignment (Manager)
- ✅ Task status updates (Member)
- ✅ Real-time task tracking
- ✅ Responsive design
- ✅ Modern UI/UX

## 🐛 Troubleshooting

### Backend Issues

1. **CORS Errors**:
   - Ensure `backend/config/headers.php` has correct origin
   - Check Apache mod_headers is enabled

2. **Database Connection**:
   - Verify MySQL is running
   - Check credentials in `backend/config/database.php`

3. **404 Errors**:
   - Ensure `.htaccess` is configured for URL rewriting
   - Check Apache mod_rewrite is enabled

### Frontend Issues

1. **API Connection Errors**:
   - Verify backend URL in `src/services/api.js`
   - Check CORS settings in backend

2. **Build Errors**:
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## 📄 License

This project is open source and available for educational purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ using React, PHP, and MySQL**







