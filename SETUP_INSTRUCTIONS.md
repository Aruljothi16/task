# Setup Instructions - Fix Login Issue

## Step 1: Database Setup

1. **Open phpMyAdmin**: http://localhost/phpmyadmin

2. **Create Database** (if not exists):
   - Click "New" in left sidebar
   - Database name: `task_management_system`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Create"

3. **Import Schema**:
   - Select `task_management_system` database
   - Click "Import" tab
   - Choose file: `database/schema.sql`
   - Click "Go"

4. **Import Seed Data**:
   - Still in `task_management_system` database
   - Click "Import" tab again
   - Choose file: `database/seed.sql`
   - Click "Go"

## Step 2: Fix Password Hashes

**Option A: Use Setup Script (Recommended)**
1. Open browser: http://localhost/Task-management/backend/setup_passwords.php
2. The script will update all password hashes
3. **IMPORTANT**: Delete `setup_passwords.php` after running for security!

**Option B: Manual SQL Update**
Run this in phpMyAdmin SQL tab:
```sql
USE task_management_system;

UPDATE users SET password = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' 
WHERE email IN ('admin@tms.com', 'manager1@tms.com', 'manager2@tms.com', 'member1@tms.com', 'member2@tms.com', 'member3@tms.com');
```

## Step 3: Test Database Connection

1. Open: http://localhost/Task-management/backend/api/test/connection.php
2. Should see: `{"status":"success","message":"Database connection successful","user_count":6}`

## Step 4: Verify Backend API

1. Test login endpoint directly:
   - Open browser console (F12)
   - Run this JavaScript:
   ```javascript
   fetch('http://localhost/Task-management/backend/api/auth/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({email: 'admin@tms.com', password: 'admin123'})
   }).then(r => r.json()).then(console.log)
   ```
   - Should return token and user data

## Step 5: Check Frontend API URL

Verify `tms-frontend/src/services/api.js` has:
```javascript
const API_BASE_URL = 'http://localhost/Task-management/backend';
```

## Step 6: Common Issues

### Issue: "Database connection failed"
- **Solution**: Check XAMPP MySQL is running
- Verify database name is `task_management_system`
- Check `backend/config/database.php` credentials

### Issue: "404 Route not found"
- **Solution**: Check `.htaccess` file exists in `backend/` folder
- Enable mod_rewrite in Apache
- Restart Apache

### Issue: "CORS error"
- **Solution**: Check `backend/config/headers.php` has correct origin
- Frontend should run on `http://localhost:3000`

### Issue: "Invalid email or password"
- **Solution**: Run `setup_passwords.php` to fix password hashes
- Verify users exist in database
- Check email spelling (case-sensitive)

## Login Credentials (After Setup)

- **Admin**: admin@tms.com / admin123
- **Manager**: manager1@tms.com / admin123  
- **Member**: member1@tms.com / admin123

## Next Steps

1. Start React app: `cd tms-frontend && npm start`
2. Open: http://localhost:3000
3. Login with admin credentials
4. Should redirect to `/admin` dashboard






