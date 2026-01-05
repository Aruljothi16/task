import React, { useState, useEffect } from 'react';
import { managerService } from '../../../services/managerService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';
import { useAuth } from '../../../context/AuthContext';
import { Edit2, Search, Plus } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const MyProjects = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    due_date: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredProjects(projects.filter(project =>
        (project.name && project.name.toLowerCase().includes(lowerTerm)) ||
        (project.description && project.description.toLowerCase().includes(lowerTerm))
      ));
    }
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      const data = await managerService.getMyProjects();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      start_date: '',
      due_date: '',
      priority: 'medium'
    });
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date || '',
      due_date: project.due_date || '',
      priority: project.priority || 'medium'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await managerService.updateProject({
          ...formData,
          id: editingProject.id
        });
        addToast('Project updated successfully', 'success');
      } else {
        await managerService.createProject({
          ...formData,
          manager_id: user.id, // Manager assigns to self
        });
        addToast('Project created successfully', 'success');
      }
      setShowModal(false);
      loadProjects();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to save project', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>My Projects</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search my projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Create Project
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td>
                  <div style={{ fontWeight: '500' }}>{project.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {project.description && project.description.length > 50
                      ? project.description.substring(0, 50) + '...'
                      : project.description}
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${project.priority || 'medium'}`}>
                    {project.priority || 'medium'}
                  </span>
                </td>
                <td>{project.due_date ? new Date(project.due_date).toLocaleDateString() : '-'}</td>
                <td>
                  <StatusBadge status={project.status} type="project" />
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => handleEdit(project)}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No projects found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? 'Edit Project' : 'Create Project'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyProjects;


