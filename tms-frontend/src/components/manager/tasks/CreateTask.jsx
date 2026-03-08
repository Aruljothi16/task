import React, { useState, useEffect } from 'react';
import { managerService } from '../../../services/managerService';
import Modal from '../../shared/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Plus, Sparkles } from 'lucide-react';

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
  const [aiSuggestions, setAiSuggestions] = useState({
    priority: null,
    suggestedMembers: [],
    subtasks: [],
    loading: false
  });

  const generateSubtasks = async () => {
    if (!formData.title) return;
    setAiSuggestions(prev => ({ ...prev, loading: true }));

    try {
      const data = await managerService.generateSubtasks(formData.title, formData.description);
      if (data && data.subtasks) {

        setAiSuggestions(prev => ({ ...prev, subtasks: data.subtasks }));
      }
    } catch (err) {
      console.error('Subtask Error:', err);
    } finally {
      setAiSuggestions(prev => ({ ...prev, loading: false }));
    }
  };



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

  const getAiPriority = async (title, description) => {
    if (!title || title.length < 3) return; // Reduced from 5 to 3 for better responsiveness

    setAiSuggestions(prev => ({ ...prev, loading: true }));
    try {
      const data = await managerService.predictPriority(title, description, {
        project_id: formData.project_id,
        due_date: formData.due_date
      });
      if (data && data.prediction) {
        console.log('AI Priority Response:', data);
        setAiSuggestions(prev => ({
          ...prev,
          priority: data.prediction,
          priorityReason: data.reason || 'Keyword analysis'
        }));
      }
    } catch (err) {
      console.error('AI Priority Error:', err);
    } finally {
      setAiSuggestions(prev => ({ ...prev, loading: false }));
    }
  };

  const getWorkloadAdvice = async (projectId) => {
    if (!projectId) return;

    try {
      const data = await managerService.analyzeWorkload(projectId);
      if (data && data.suggested_member_ids) {
        setAiSuggestions(prev => ({ ...prev, suggestedMembers: data.suggested_member_ids.map(id => parseInt(id)) }));
      }
    } catch (err) {
      console.error('Workload Analysis Error:', err);
    }
  };

  // Debounce for AI priority
  useEffect(() => {
    if (!formData.title || formData.title.length < 3) return;
    const timer = setTimeout(() => {
      getAiPriority(formData.title, formData.description);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.title, formData.description, formData.project_id, formData.due_date]);

  // Fetch workload advice when project changes
  useEffect(() => {
    if (formData.project_id) getWorkloadAdvice(formData.project_id);
  }, [formData.project_id, showModal]);

  // Auto-select first suggested member if none selected
  useEffect(() => {
    if (aiSuggestions.suggestedMembers && aiSuggestions.suggestedMembers.length > 0 && !formData.assigned_to) {
      setFormData(prev => ({ ...prev, assigned_to: aiSuggestions.suggestedMembers[0].toString() }));
    }
  }, [aiSuggestions.suggestedMembers]);

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
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn btn-sm btn-soft-primary"
                onClick={generateSubtasks}
                style={{ whiteSpace: 'nowrap' }}
                disabled={!formData.title}
              >
                <Sparkles size={14} className="me-1" /> AI Subtasks
              </button>
            </div>

            {aiSuggestions.subtasks.length > 0 && (
              <div className="mt-2 p-3 bg-light rounded border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold text-primary d-flex align-items-center gap-1">
                    <Sparkles size={16} /> Suggested Checklist:
                  </small>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    onClick={() => {
                      const checklist = aiSuggestions.subtasks.map(s => `[ ] ${s}`).join('\n');
                      setFormData(prev => ({ ...prev, description: prev.description + (prev.description ? '\n\n' : '') + "**AI Suggested Checklist:**\n" + checklist }));
                      setAiSuggestions(prev => ({ ...prev, subtasks: [] }));
                    }}
                  >
                    Add to Description
                  </button>
                </div>
                <div className="small">
                  {aiSuggestions.subtasks.map((s, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                      <span className="text-muted">•</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
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
            {aiSuggestions.suggestedMembers.length > 0 && (
              <small className="text-info mt-1 d-flex align-items-center gap-1">
                <Sparkles size={14} /> AI Recommendation: {aiSuggestions.suggestedMembers.length} member(s) have the least workload.
              </small>
            )}
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
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-control"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    required
                    style={{
                      borderColor: aiSuggestions.suggestedMembers.includes(parseInt(formData.assigned_to)) ? 'var(--primary)' : ''
                    }}
                  >
                    <option value="">Select Member</option>
                    {users
                      .filter(u =>
                        u?.role === 'member' &&
                        u?.designation?.toLowerCase() !== 'tester' &&
                        u?.designation?.toLowerCase() !== 'manager'
                      )
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                          {aiSuggestions.suggestedMembers.includes(parseInt(user.id)) ? ' - (AI Recommended)' : ''}
                        </option>
                      ))}
                  </select>
                  {aiSuggestions.suggestedMembers.includes(parseInt(formData.assigned_to)) && (
                    <span style={{
                      position: 'absolute',
                      right: '35px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      color: 'var(--primary)'
                    }}>
                      <Sparkles size={16} />
                    </span>
                  )}
                </div>
                {aiSuggestions.suggestedMembers.length > 0 && (
                  <div className="mt-1 d-flex justify-content-between align-items-center">
                    <span className="badge bg-soft-primary text-primary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
                      <Sparkles size={12} /> AI Suggestion: {aiSuggestions.suggestedMembers.length > 1
                        ? `${aiSuggestions.suggestedMembers.length} members have the least workload`
                        : 'Member with least workload'}
                    </span>
                    {!aiSuggestions.suggestedMembers.includes(parseInt(formData.assigned_to)) && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, assigned_to: aiSuggestions.suggestedMembers[0].toString() }));
                        }}
                      >
                        Apply Best Recommendation
                      </button>
                    )}
                  </div>
                )}
                <small className="form-text text-muted">
                  {users.filter(u => u?.role === 'member' && u?.designation?.toLowerCase() !== 'tester' && u?.designation?.toLowerCase() !== 'manager').length} team member(s) available
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
            {aiSuggestions.priority && (
              <div className="mt-1 d-flex justify-content-between align-items-center">
                <small className="text-primary d-flex align-items-center gap-1">
                  <Sparkles size={14} /> <span>AI Suggests: <strong>{aiSuggestions.priority.toUpperCase()}</strong></span>
                  {aiSuggestions.priorityReason && <span className="ms-1 text-muted">({aiSuggestions.priorityReason})</span>}
                </small>
                {formData.priority !== aiSuggestions.priority && (
                  <button
                    type="button"
                    className="btn btn-link btn-xs p-0 text-decoration-none"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => setFormData(prev => ({ ...prev, priority: aiSuggestions.priority }))}
                  >
                    Apply Suggestion
                  </button>
                )}
              </div>
            )}
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
      </Modal >
    </>
  );
};

export default CreateTask;




