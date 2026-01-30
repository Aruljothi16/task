import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../../services/adminService';
import Loader from '../../common/Loader';
import { useToast } from '../../../context/ToastContext';
import {
  FolderPlus, Edit, Trash2, Search, RefreshCw,
  Folder, Calendar, User, Clock, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Download, Filter,
  Activity, Grid, Plus, X, Check,
  Info
} from 'lucide-react';

export default function ProjectsList() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [notification, setNotification] = useState(null);

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    manager_id: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    tags: "",
    budget: ""
  });

  const [editProject, setEditProject] = useState({
    id: "",
    title: "",
    description: "",
    manager_id: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    tags: "",
    budget: ""
  });

  const notificationTimerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (notification) {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
    return () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    }
  }, [notification]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        adminService.getProjects(),
        adminService.getUsers()
      ]);
      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.manager_id || !newProject.due_date) {
      showNotification("Please fill in all required fields", "warning");
      return;
    }

    // Map fields to match API expectations if necessary (e.g. title vs name)
    const projectData = {
      name: newProject.title,
      description: newProject.description,
      manager_id: newProject.manager_id,
      status: newProject.status,
      due_date: newProject.due_date,
      priority: newProject.priority,
      // Add other fields if supported by backend create endpoint
    };

    try {
      const response = await adminService.createProject(projectData);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        showNotification("Project created successfully!");
        setShowCreateModal(false);
        setNewProject({
          title: "",
          description: "",
          manager_id: "",
          priority: "medium",
          status: "pending",
          due_date: "",
          tags: "",
          budget: ""
        });
        fetchData();
      } else {
        showNotification(response?.message || "Failed to create project", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showNotification("Error creating project", "error");
    }
  };

  const handleUpdateProject = async () => {
    const projectData = {
      id: editProject.id,
      name: editProject.title,
      description: editProject.description,
      manager_id: editProject.manager_id,
      status: editProject.status,
      due_date: editProject.due_date,
      priority: editProject.priority,
    };

    try {
      const response = await adminService.updateProject(projectData);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        showNotification("Project updated successfully!");
        setShowEditModal(false);
        fetchData();
      } else {
        showNotification(response?.message || "Failed to update project", "error");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      showNotification("Error updating project", "error");
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await adminService.deleteProject(selectedProject.id);

      if (response && (response.status === "success" || response.message?.includes('success'))) {
        showNotification("Project deleted successfully!");
        setShowDeleteModal(false);
        fetchData();
      } else {
        showNotification(response?.message || "Failed to delete project", "error");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      showNotification("Error deleting project", "error");
    }
  };


  // Filter projects
  const filteredProjects = projects.filter(project => {
    const title = project.name || project.title || ""; // Handle variable naming discrepancy
    const desc = project.description || "";
    const mgrName = project.manager_name || "";

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mgrName.toLowerCase().includes(searchTerm.toLowerCase());

    // Adjust status check if backend uses different enum values
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesPriority = filterPriority === "all" || project.priority === filterPriority;
    const matchesManager = filterManager === "all" || project.manager_id == filterManager;

    return matchesSearch && matchesStatus && matchesPriority && matchesManager;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // Map sortField 'title' to 'name' if necessary
    const fieldA = sortField === 'title' ? (a.name || a.title) : a[sortField];
    const fieldB = sortField === 'title' ? (b.name || b.title) : b[sortField];

    if (!fieldA) return 1;
    if (!fieldB) return -1;

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const openEditModal = (project) => {
    setEditProject({
      id: project.id,
      title: project.name || project.title,
      description: project.description,
      manager_id: project.manager_id,
      priority: project.priority,
      status: project.status,
      due_date: project.due_date,
      tags: project.tags || "",
      budget: project.budget || ""
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusColor = (status) => {
    // Common status mapping, adjust if backend sends specific strings
    switch (status) {
      case "completed": return "#10b981";
      case "in_progress": return "#3b82f6";
      case "active": return "#3b82f6"; // Map 'active' to blue
      case "pending": return "#f59e0b";
      case "on_hold": return "#64748b";
      case "cancelled": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#64748b";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return <AlertCircle size={14} />;
      case "medium": return <Clock size={14} />;
      case "low": return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={14} />;
      case "in_progress":
      case "active": return <Activity size={14} />;
      case "pending": return <Clock size={14} />;
      case "on_hold": return <AlertCircle size={14} />;
      case "cancelled": return <X size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (project) => {
    const status = project.status;
    if (status === 'completed') return 100;
    if (status === 'in_progress' || status === 'active') return 50;
    if (status === 'on_hold') return 25;
    return 0; // pending, cancelled
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterManager("all");
    setSortField("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
    showNotification("Filters reset", "info");
  };

  const exportProjects = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'projects_export.json');
    linkElement.click();
    showNotification("Projects exported successfully!");
  };

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === "completed").length,
    inProgress: projects.filter(p => p.status === "in_progress" || p.status === "active").length,
    pending: projects.filter(p => p.status === "pending").length,
    overdue: projects.filter(p => isOverdue(p.due_date)).length
  };

  const NotificationComponent = ({ notification }) => {
    if (!notification) return null;

    return (
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px', maxWidth: '400px',
        background: notification.type === 'error' ? '#fee2e2' : notification.type === 'success' ? '#d1fae5' : '#dbeafe',
        border: `1px solid ${notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#3b82f6'}`,
        borderRadius: '12px',
        padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
        color: notification.type === 'error' ? '#7f1d1d' : notification.type === 'success' ? '#065f46' : '#1e3a8a',
        animation: 'slideInRight 0.3s ease-out', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {notification.type === 'success' ? <CheckCircle2 size={24} /> : notification.type === 'error' ? <AlertCircle size={24} /> : <Info size={24} />}
        <div>{notification.message}</div>
        <button onClick={() => setNotification(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Notification Display */}
      <NotificationComponent notification={notification} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Project Management</h1>
          <p style={styles.subtitle}>Create, manage, and track all projects</p>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            Total Projects: {stats.total} | Active: {stats.inProgress} | Overdue: {stats.overdue}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>
            <FolderPlus size={18} /> <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
          <Grid size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
          <div style={styles.statNumber}>{stats.total}</div>
          <div style={styles.statLabel}>Total Projects</div>
        </div>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <CheckCircle2 size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
          <div style={styles.statNumber}>{stats.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <Activity size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
          <div style={styles.statNumber}>{stats.inProgress}</div>
          <div style={styles.statLabel}>In Progress</div>
        </div>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
          <AlertCircle size={24} style={{ opacity: 0.9, marginBottom: 12 }} />
          <div style={styles.statNumber}>{stats.overdue}</div>
          <div style={styles.statLabel}>Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBox}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <Filter size={16} style={{ opacity: 0.6 }} />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <select value={filterManager} onChange={(e) => { setFilterManager(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
            <option value="all">All Managers</option>
            {users.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.name}
              </option>
            ))}
          </select>
        </div>

        <button style={styles.resetButton} onClick={resetFilters}>Reset Filters</button>
      </div>

      {/* Projects Grid */}
      <div style={styles.projectsGrid}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading projects...</p>
          </div>
        ) : currentProjects.length === 0 ? (
          <div style={styles.emptyState}>
            <FolderPlus size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No projects found</h3>
            <p>Create your first project or try adjusting filters</p>
            <button style={styles.createButtonSmall} onClick={() => setShowCreateModal(true)}>
              <FolderPlus size={16} /> Create First Project
            </button>
          </div>
        ) : (
          currentProjects.map((project) => (
            <div key={project.id} style={styles.projectCard}>
              <div style={styles.cardHeader}>
                <div style={styles.projectTitleSection}>
                  <div style={{
                    ...styles.statusBadge,
                    background: getStatusColor(project.status) + '20',
                    borderColor: getStatusColor(project.status) + '40'
                  }}>
                    {getStatusIcon(project.status)}
                    <span>{project.status?.replace('_', ' ') || 'Pending'}</span>
                  </div>
                  <h3 style={styles.projectTitle} title={project.name || project.title}>
                    {project.name || project.title}
                  </h3>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.actionButton} onClick={() => openEditModal(project)} title="Edit Project">
                    <Edit size={16} />
                  </button>
                  <button style={{ ...styles.actionButton, background: '#fee2e2', color: '#dc2626' }} onClick={() => openDeleteModal(project)} title="Delete Project">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={styles.cardBody}>
                <p style={styles.projectDescription}>
                  {project.description || "No description provided"}
                </p>

                <div style={styles.projectMeta}>
                  <div style={styles.metaItem}>
                    <User size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                    <span style={styles.metaText}>
                      {project.manager_name || "Unassigned"}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <Calendar size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                    <span style={{
                      ...styles.metaText,
                      color: isOverdue(project.due_date) ? '#ef4444' : '#64748b',
                      fontWeight: isOverdue(project.due_date) ? '600' : '400'
                    }}>
                      {formatDate(project.due_date)}
                      {isOverdue(project.due_date) && " ⚠️"}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <div style={{
                      ...styles.priorityBadge,
                      background: getPriorityColor(project.priority) + '20',
                      color: getPriorityColor(project.priority),
                      border: `1px solid ${getPriorityColor(project.priority)}30`
                    }}>
                      {getPriorityIcon(project.priority)}
                      <span>{project.priority || 'medium'}</span>
                    </div>
                  </div>
                </div>

                {/* Tags if any */}
                {/*<div style={styles.tagsContainer}>...</div>*/}

                <div style={styles.progressSection}>
                  <div style={styles.progressLabel}>
                    <span>Progress</span>
                    <span>{calculateProgress(project)}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${calculateProgress(project)}%`,
                        background: getStatusColor(project.status)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button style={styles.viewDetailsButton} onClick={() => openDetailsModal(project)}>
                  View Details
                </button>
                <div style={styles.projectId}>ID: #{project.id}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageButton} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </button>
          <span style={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
          <button style={styles.pageButton} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Project</h2>
              <button style={styles.modalClose} onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Project Title <span style={styles.required}>*</span>
                </label>
                <input
                  type="text" placeholder="Enter project title" value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  style={styles.input} required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Enter project description" value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={styles.textarea} rows="4"
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Assign to Manager <span style={styles.required}>*</span>
                  </label>
                  <select
                    value={newProject.manager_id}
                    onChange={(e) => setNewProject({ ...newProject, manager_id: e.target.value })}
                    style={styles.select} required
                  >
                    <option value="">Select Manager</option>
                    {users.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
                      <option key={user.id} value={user.id}>{user.full_name || user.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Due Date *</label>
                  <input
                    type="date" value={newProject.due_date}
                    onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                    style={styles.input} required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Priority</label>
                  <select value={newProject.priority} onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })} style={styles.select}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })} style={styles.select}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button style={styles.saveButton} onClick={handleCreateProject} disabled={!newProject.title || !newProject.manager_id || !newProject.due_date}>
                <FolderPlus size={18} style={{ marginRight: 8 }} /> Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Project</h2>
              <button style={styles.modalClose} onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project Title</label>
                <input type="text" value={editProject.title} onChange={(e) => setEditProject({ ...editProject, title: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea rows="4" value={editProject.description} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} style={styles.textarea} />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Assign to Manager</label>
                  <select value={editProject.manager_id} onChange={(e) => setEditProject({ ...editProject, manager_id: e.target.value })} style={styles.select}>
                    <option value="">Select Manager</option>
                    {users.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
                      <option key={user.id} value={user.id}>{user.full_name || user.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Due Date</label>
                  <input type="date" value={editProject.due_date} onChange={(e) => setEditProject({ ...editProject, due_date: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Priority</label>
                  <select value={editProject.priority} onChange={(e) => setEditProject({ ...editProject, priority: e.target.value })} style={styles.select}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select value={editProject.status} onChange={(e) => setEditProject({ ...editProject, status: e.target.value })} style={styles.select}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={styles.saveButton} onClick={handleUpdateProject}><Check size={18} style={{ marginRight: 8 }} /> Update Project</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedProject && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Project Details</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailsSection}>
                <h3 style={styles.detailTitle}>{selectedProject.name || selectedProject.title}</h3>
                <p style={styles.detailDescription}>{selectedProject.description || "No description"}</p>

                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <strong>Project ID:</strong> #{selectedProject.id}
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Manager:</strong> {selectedProject.manager_name || "Unassigned"}
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Status:</strong>
                    <span style={{
                      color: getStatusColor(selectedProject.status),
                      fontWeight: '600',
                      marginLeft: 8
                    }}>
                      {selectedProject.status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Priority:</strong>
                    <span style={{
                      color: getPriorityColor(selectedProject.priority),
                      fontWeight: '600',
                      marginLeft: 8
                    }}>
                      {selectedProject.priority || 'medium'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Due Date:</strong>
                    <span style={{
                      color: isOverdue(selectedProject.due_date) ? '#ef4444' : '#1e293b',
                      fontWeight: isOverdue(selectedProject.due_date) ? '600' : '400'
                    }}>
                      {formatDate(selectedProject.due_date)}
                      {isOverdue(selectedProject.due_date) && " (Overdue)"}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Created:</strong> {formatDate(selectedProject.created_at)}
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowDetailsModal(false)}>Close</button>
              <button style={styles.saveButton} onClick={() => { setShowDetailsModal(false); openEditModal(selectedProject); }}>Edit Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Delete</h2>
              <button style={styles.modalClose} onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.warningMessage}>
                <Trash2 size={32} style={{ color: '#ef4444', marginBottom: 16 }} />
                <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
                  Delete "{selectedProject?.name || selectedProject?.title}"?
                </h3>
                <p>Are you sure you want to delete this project? This cannot be undone.</p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button style={{ ...styles.saveButton, background: '#ef4444' }} onClick={handleDeleteProject}>
                <Trash2 size={18} style={{ marginRight: 8 }} /> Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  container: { padding: '20px', minHeight: '100vh', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  title: { fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '15px', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { padding: '24px', borderRadius: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  statNumber: { fontSize: '32px', fontWeight: '700', marginBottom: '8px' },
  statLabel: { fontSize: '14px', opacity: 0.9 },
  headerActions: { display: 'flex', gap: '12px' },
  exportButton: { display: 'flex', gap: '8px', padding: '10px 16px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', alignItems: 'center' },
  refreshButton: { display: 'none' },
  createButton: { display: 'flex', gap: '8px', padding: '8px 16px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer', alignItems: 'center' },
  createButtonSmall: { display: 'flex', gap: '6px', padding: '8px 14px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', margin: '16px auto' },
  filtersContainer: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' },
  searchBox: { flex: 1, position: 'relative', minWidth: '250px' },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
  searchInput: { width: '100%', padding: '12px 20px 12px 45px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none' },
  filterGroup: { display: 'flex', gap: '8px' },
  filterSelect: { padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none', minWidth: '140px', background: 'white' },
  resetButton: { padding: '10px 16px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer' },
  projectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' },
  projectCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%' },
  cardHeader: { padding: '20px 20px 12px', borderBottom: '1px solid var(--bg-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectTitleSection: { flex: 1 },
  statusBadge: { display: 'inline-flex', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', marginBottom: '8px', alignItems: 'center' },
  projectTitle: { fontSize: '16px', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' },
  cardActions: { display: 'flex', gap: '4px' },
  actionButton: { padding: '6px', background: 'var(--bg-body)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex' },
  cardBody: { padding: '20px', flex: 1 },
  projectDescription: { color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px 0', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' },
  projectMeta: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  metaItem: { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' },
  metaText: { marginLeft: '6px' },
  priorityBadge: { display: 'inline-flex', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', alignItems: 'center' },
  progressSection: { marginTop: 'auto' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' },
  progressBar: { height: '6px', background: 'var(--bg-body)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  cardFooter: { padding: '16px 20px', borderTop: '1px solid var(--bg-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  viewDetailsButton: { padding: '8px 16px', background: 'var(--bg-body)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer' },
  projectId: { fontSize: '12px', color: 'var(--text-muted)' },
  loading: { padding: '100px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' },
  spinner: { width: '40px', height: '40px', border: '3px solid var(--bg-body)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' },
  emptyState: { padding: '80px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' },
  pagination: { display: 'flex', justifyContent: 'center', padding: '20px', gap: '8px' },
  pageButton: { padding: '8px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' },
  pageInfo: { display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--bg-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '600' },
  modalClose: { background: 'transparent', border: 'none', cursor: 'pointer' },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '20px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '500' },
  required: { color: '#ef4444' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', resize: 'vertical' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: 'white' },
  modalFooter: { padding: '24px', borderTop: '1px solid var(--bg-body)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelButton: { padding: '10px 20px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' },
  saveButton: { padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  warningMessage: { textAlign: 'center' },
  detailsSection: { padding: '10px 0' },
  detailTitle: { fontSize: '20px', fontWeight: '600', marginBottom: '12px' },
  detailDescription: { color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  detailItem: { fontSize: '14px', color: 'var(--text-main)' }
};



