import React, { useState, useEffect } from 'react';
import { managerService } from '../../../services/managerService';
import Modal from '../../shared/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Plus } from 'lucide-react';

const CreateTask = ({ onTaskCreated }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    if (showModal) {
      loadProjects();
      loadUsers();
    }
  }, [showModal]);

  const loadProjects = async () => {
    try {
      const data = await managerService.getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      addToast('Failed to load projects', 'error');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const members = await managerService.getTeamMembers();
      let memberList = [];
      if (Array.isArray(members)) {
        memberList = members;
      } else if (members && members.members) {
        memberList = members.members;
      } else if (members && members.data) {
        memberList = members.data;
      }

      setUsers(memberList);

      if (memberList.length === 0) {
        setError('No team members found. Please add members first.');
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
      let errorMessage = 'Failed to load team members. ';
      if (err.response) {
        errorMessage += `Server error: ${err.response.data?.message || err.response.statusText} (${err.response.status})`;
      } else if (err.request) {
        errorMessage += 'No response from server.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await managerService.createTask(formData);
      addToast('Task created successfully', 'success');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        project_id: '',
        assigned_to: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
      });
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to create task', 'error');
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '10px 20px' }}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Create Task
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Task"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select
              className="form-control"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              required
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>

            {loading ? (
              <div className="text-center p-3">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Loading team members...
              </div>
            ) : error ? (
              <div className="alert alert-warning">
                {error}
              </div>
            ) : (
              <>
                <select
                  className="form-control"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  required
                >
                  <option value="">Select Member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  {users.length} team member(s) available
                </small>
              </>
            )}
          </div>
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
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CreateTask;




