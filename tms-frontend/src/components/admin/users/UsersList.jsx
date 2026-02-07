import React, { useState, useEffect, useRef } from "react";
import { adminService } from '../../../services/adminService';
import {
  UserPlus, Edit, Trash2, Search, RefreshCw,
  User, Mail, Shield, Check, X,
  ChevronLeft, ChevronRight, Download, Filter,
  AlertCircle, Info, CheckCircle2
} from "lucide-react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [passwordDetails, setPasswordDetails] = useState(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "member",
    designation: "Developer",
    password: "" // Generated automatically
  });

  // Edit user form state
  const [editUser, setEditUser] = useState({
    id: "",
    username: "",
    full_name: "",
    email: "",
    role: "member",
    designation: ""
  });

  // Notification timer ref
  const notificationTimerRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear notification after timeout
  useEffect(() => {
    if (notification) {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }

      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, notification.duration || 5000);
    }

    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, [notification]);

  // Show notification function
  const showNotification = (message, type = "error", duration = 5000) => {
    setNotification({
      message,
      type,
      duration
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearNotification = () => {
    setNotification(null);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await adminService.getUsers();
      if (data) {
        setUsers(data);
      } else {
        setError("Failed to fetch users");
        showNotification("Failed to fetch users", "error");
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      setError(error.message || "Error fetching users");
      showNotification(error.message || "Error fetching users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = (name) => {
    const randomNum = Math.floor(Math.random() * 1000);
    return `${name.split(' ')[0]}${randomNum}!`;
  };

  const handleCreatePrepare = () => {
    setNewUser({
      name: "",
      email: "",
      role: "member",
      designation: "Developer",
      password: ""
    });
    setShowAddModal(true);
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim()) {
      showNotification("Please enter a valid name", "error");
      return;
    }
    if (!newUser.email.trim() || !isValidEmail(newUser.email)) {
      showNotification("Please enter a valid email address", "error");
      return;
    }

    const generatedPassword = generatePassword(newUser.name);

    const userPayload = {
      username: newUser.email.split('@')[0], // Simple username generation
      full_name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: generatedPassword,
      designation: newUser.role === 'member' ? newUser.designation : (newUser.role === 'manager' ? 'Manager' : 'Administrator')
    };

    try {
      const response = await adminService.createUser(userPayload);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        setPasswordDetails({
          email: newUser.email,
          password: generatedPassword
        });
        setShowAddModal(false);
        setShowPasswordModal(true);
        fetchUsers();
      } else {
        const errorMsg = response?.message || "Failed to add user";
        showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      showNotification(error.message || "Error adding user", "error");
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser.full_name.trim()) {
      showNotification("Please enter a valid name", "error");
      return;
    }

    try {
      const response = await adminService.updateUser(editUser);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        showNotification("User updated successfully!", "success");
        setShowEditModal(false);
        fetchUsers();
      } else {
        const errorMsg = response?.message || "Failed to update user";
        showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showNotification(error.message || "Error updating user", "error");
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await adminService.deleteUser(selectedUser.id);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        showNotification("User deleted successfully!", "success");
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        const errorMsg = response?.message || "Failed to delete user";
        showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showNotification(error.message || "Error deleting user", "error");
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = user.email?.toLowerCase().includes(searchLower) || false;
    const roleMatch = user.role?.toLowerCase().includes(searchLower) || false;

    // Note: API returns 'full_name', provided code used 'name'
    const matchesSearch = nameMatch || emailMatch || roleMatch;

    const matchesRole = filterRole === "all" || user.role === filterRole;
    // Note: User model might not have 'status', assume all are active for now or check data
    const matchesStatus = filterStatus === "all" || (user.status || 'active') === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const openEditModal = (user) => {
    setEditUser({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportUsers = () => {
    try {
      if (users.length === 0) {
        showNotification("No users to export", "warning");
        return;
      }
      const dataStr = JSON.stringify(users, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `users_export_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      showNotification(`Exported ${users.length} users successfully`, "success", 3000);
    } catch (error) {
      console.error("Error exporting users:", error);
      showNotification("Error exporting users", "error");
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "#3b82f6";
      case "manager": return "#8b5cf6";
      case "member": return "#10b981";
      default: return "#64748b";
    }
  };

  const getStatusColor = (status) => {
    return status === "active" ? "#10b981" : "#ef4444";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterStatus("all");
    setSortField("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
    showNotification("Filters reset successfully", "info", 2000);
  };

  const Notification = ({ notification }) => {
    if (!notification) return null;
    const { message, type } = notification;
    const notificationStyles = {
      success: { background: '#d1fae5', borderColor: '#10b981', color: '#065f46', icon: <CheckCircle2 size={20} /> },
      error: { background: '#fee2e2', borderColor: '#ef4444', color: '#7f1d1d', icon: <AlertCircle size={20} /> },
      warning: { background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e', icon: <AlertCircle size={20} /> },
      info: { background: '#dbeafe', borderColor: '#3b82f6', color: '#1e3a8a', icon: <Info size={20} /> }
    };
    const style = notificationStyles[type] || notificationStyles.error;
    return (
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px', maxWidth: '400px',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <div style={{
          padding: '16px 20px', background: style.background, border: `1px solid ${style.borderColor}`,
          borderRadius: '12px', color: style.color, boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500'
        }}>
          {style.icon}
          <div style={{ flex: 1 }}>{message}</div>
          <button onClick={clearNotification} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Notification notification={notification} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>Manage system users and their permissions</p>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            Total Users: {users.length} | Showing: {filteredUsers.length}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.addButton} onClick={handleCreatePrepare}>
            <UserPlus size={18} /> <span>Add User</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorMessage}>
            <AlertCircle size={18} style={{ marginRight: '8px' }} />
            <strong>Error:</strong> {error}
          </div>
          <button onClick={fetchUsers} style={styles.retryButton}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBox}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <Filter size={16} style={{ opacity: 0.6 }} />
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button style={styles.resetButton} onClick={resetFilters}>Reset Filters</button>
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading users...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <User size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
            <button style={styles.addButtonSmall} onClick={handleCreatePrepare}>
              <UserPlus size={16} /> Add First User
            </button>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("id")}>ID</th>
                  <th style={styles.th} onClick={() => handleSort("full_name")}>Name</th>
                  <th style={styles.th} onClick={() => handleSort("email")}>Email</th>
                  <th style={styles.th} onClick={() => handleSort("role")}>Role</th>
                  <th style={styles.th} onClick={() => handleSort("created_at")}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}><span style={styles.idBadge}>#{user.id}</span></td>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.avatar}>{user.full_name?.charAt(0).toUpperCase()}</div>
                        <div style={styles.userInfo}>
                          <div style={styles.userName}>{user.full_name}</div>
                          {user.username && <div style={styles.lastLogin}>@{user.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.emailCell}><Mail size={14} style={{ marginRight: 8, opacity: 0.6 }} />{user.email}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ ...styles.roleBadge, background: getRoleColor(user.role) + '20', color: getRoleColor(user.role), border: `1px solid ${getRoleColor(user.role)}30` }}>
                        {user.role === "admin" && <Shield size={14} />}
                        {(user.role === "manager" || user.role === "member") && <User size={14} />}
                        <span>{user.role}</span>
                      </div>
                    </td>
                    <td style={styles.td}><div style={styles.dateCell}>{user.created_at}</div></td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button style={styles.actionButton} onClick={() => openEditModal(user)} title="Edit User"><Edit size={16} /></button>
                        <button style={{ ...styles.actionButton, background: '#fee2e2', color: '#dc2626' }} onClick={() => openDeleteModal(user)} title="Delete User"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.pageButton}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                <button
                  style={styles.pageButton}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New User</h2>
              <button style={styles.modalClose} onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
                <div style={styles.inputWithIcon}>
                  <User style={styles.inputIcon} />
                  <input type="text" placeholder="Enter full name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} style={styles.input} required />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address <span style={styles.required}>*</span></label>
                <div style={styles.inputWithIcon}>
                  <Mail style={styles.inputIcon} />
                  <input type="email" placeholder="Enter email address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={styles.input} required />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Role <span style={styles.required}>*</span></label>
                <select
                  value={newUser.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    // Reset designation if role is not member
                    const designation = role === 'member' ? 'Developer' : (role === 'manager' ? 'Manager' : 'Administrator');
                    setNewUser({ ...newUser, role, designation });
                  }}
                  style={styles.select}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newUser.role === 'member' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Designation <span style={styles.required}>*</span></label>
                  <select
                    value={newUser.designation || 'Developer'}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    style={styles.select}
                  >
                    <option value="Developer">Developer</option>
                    <option value="Tester">Tester</option>

                  </select>
                </div>
              )}

              <div style={styles.helpText}>Default password will be generated automatically</div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={styles.saveButton} onClick={handleAddUser} disabled={!newUser.name || !newUser.email}>
                <UserPlus size={18} style={{ marginRight: 8 }} /> Add User
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Password Details Modal */}
      {
        showPasswordModal && passwordDetails && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>User Created Successfully!</h2>
                <button style={styles.modalClose} onClick={() => { setShowPasswordModal(false); setPasswordDetails(null); }}><X size={20} /></button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.successMessage}>
                  <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: 20 }} />
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>User Account Created</h3>
                  <div style={styles.credentialsBox}>
                    <div style={styles.credentialItem}><strong>Email:</strong> {passwordDetails.email}</div>
                    <div style={styles.credentialItem}><strong>Password:</strong> <span style={styles.passwordDisplay}>{passwordDetails.password}</span></div>
                  </div>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.saveButton} onClick={() => { setShowPasswordModal(false); setPasswordDetails(null); }}>Done</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit User Modal */}
      {
        showEditModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Edit User</h2>
                <button style={styles.modalClose} onClick={() => setShowEditModal(false)}><X size={20} /></button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <div style={styles.inputWithIcon}>
                    <User style={styles.inputIcon} />
                    <input type="text" value={editUser.full_name} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} style={styles.input} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWithIcon}>
                    <Mail style={styles.inputIcon} />
                    <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} style={styles.input} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      const designation = role === 'member' ? (editUser.designation || 'Developer') : (role === 'manager' ? 'Manager' : 'Administrator');
                      setEditUser({ ...editUser, role, designation });
                    }}
                    style={styles.select}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {editUser.role === 'member' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Designation</label>
                    <select
                      value={editUser.designation || 'Developer'}
                      onChange={(e) => setEditUser({ ...editUser, designation: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Developer">Developer</option>
                      <option value="Tester">Tester</option>
                      <option value="Designer">Designer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Business Analyst">Business Analyst</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.cancelButton} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button style={styles.saveButton} onClick={handleUpdateUser}><Check size={18} style={{ marginRight: 8 }} /> Update User</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Confirm Delete</h2>
                <button style={styles.modalClose} onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.warningMessage}>
                  <Trash2 size={32} style={{ color: '#ef4444', marginBottom: 16 }} />
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Delete {selectedUser?.full_name}?</h3>
                  <p>Are you sure? This cannot be undone.</p>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button style={{ ...styles.saveButton, background: '#ef4444' }} onClick={handleDeleteUser}><Trash2 size={18} style={{ marginRight: 8 }} /> Delete User</button>
              </div>
            </div>
          </div>
        )
      }
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div >
  );
}

const styles = {
  container: { padding: '20px', minHeight: '100vh', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '15px', margin: 0 },
  errorContainer: { padding: '15px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  errorMessage: { color: '#dc2626', display: 'flex', alignItems: 'center' },
  retryButton: { padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  headerActions: { display: 'flex', gap: '12px' },
  exportButton: { display: 'flex', gap: '8px', padding: '10px 16px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', alignItems: 'center' },
  refreshButton: { display: 'none' },
  addButton: { display: 'flex', gap: '8px', padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer', alignItems: 'center', whiteSpace: 'nowrap' }, filtersContainer: { display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' },
  searchBox: { flex: 1, position: 'relative', minWidth: '250px' },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
  searchInput: { width: '100%', padding: '12px 20px 12px 45px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none' },
  filterGroup: { display: 'flex', gap: '8px', alignItems: 'center' },
  filterSelect: { padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none', background: 'white' },
  resetButton: { padding: '10px 16px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer' },
  tableContainer: { background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflowX: 'auto' },
  loading: { padding: '100px', textAlign: 'center', color: 'var(--text-muted)' },
  spinner: { width: '40px', height: '40px', border: '3px solid var(--bg-body)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' },
  emptyState: { padding: '80px', textAlign: 'center', color: 'var(--text-muted)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--bg-body)', color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer' },
  tr: { borderBottom: '1px solid var(--bg-body)' },
  td: { padding: '16px', verticalAlign: 'middle' },
  idBadge: { padding: '4px 8px', background: 'var(--bg-body)', borderRadius: '6px', fontSize: '12px' },
  userCell: { display: 'flex', gap: '12px', alignItems: 'center' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontWeight: '500', color: 'var(--text-main)' },
  lastLogin: { fontSize: '12px', color: 'var(--text-muted)' },
  emailCell: { display: 'flex', alignItems: 'center' },
  roleBadge: { display: 'inline-flex', gap: '6px', alignItems: 'center', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },
  statusBadge: { display: 'flex', gap: '8px', alignItems: 'center' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  dateCell: { color: 'var(--text-secondary)', fontSize: '13px' },
  actions: { display: 'flex', gap: '8px' },
  actionButton: { padding: '8px', background: 'var(--bg-body)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex' },
  pagination: { display: 'flex', justifyContent: 'center', padding: '20px', gap: '8px' },
  pageButton: { padding: '8px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' },
  pageInfo: { display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '600' },
  modalClose: { background: 'transparent', border: 'none', cursor: 'pointer' },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '500' },
  required: { color: '#ef4444' },
  inputWithIcon: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: 'white' },
  helpText: { marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' },
  successMessage: { textAlign: 'center' },
  credentialsBox: { background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', margin: '20px 0', textAlign: 'left' },
  credentialItem: { marginBottom: '12px' },
  passwordDisplay: { background: 'var(--text-main)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' },
  modalFooter: { padding: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelButton: { padding: '10px 20px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' },
  saveButton: { padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  addButtonSmall: { display: 'flex', gap: '8px', padding: '10px 16px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', margin: '16px auto' },
};




