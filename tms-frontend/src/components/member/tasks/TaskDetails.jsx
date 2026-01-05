import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberService } from '../../../services/memberService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';
import { useToast } from '../../../context/ToastContext';

import {
  ArrowLeft,
  FileText,
  Folder,
  User,
  Target,
  Calendar,
  Clock,
  RefreshCw,
  Edit3,
  History,
  Paperclip,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Save,
  RotateCcw
} from 'lucide-react';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Preview
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await memberService.getTaskDetails(id);
      console.log('Loaded task:', data);
      setTask(data);
      setSelectedStatus(data.status);
    } catch (error) {
      console.error('Failed to load task:', error);
      let errorMessage = 'Failed to load task. ';
      if (error.response) {
        errorMessage += `${error.response.data?.message || error.response.statusText} (${error.response.status})`;
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (selectedStatus === task.status && !progressNote && attachments.length === 0) {
      addToast('Please make a change to update the task', 'warning');
      return;
    }

    setUpdating(true);
    try {
      if (selectedStatus !== task.status) {
        await memberService.updateTaskStatus(id, selectedStatus);
      }
      if (progressNote.trim()) {
        await memberService.addTaskNote(id, progressNote);
      }
      if (attachments.length > 0) {
        for (const file of attachments) {
          await memberService.uploadAttachment(id, file);
        }
      }
      addToast('Task updated successfully!', 'success');
      await loadTask();
      setProgressNote('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to update task:', error);
      addToast(error.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAttachmentClick = (e, att) => {
    const isImage = att.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (isImage) {
      e.preventDefault();
      setPreviewImage(`http://localhost/Task-management/backend${att.file_path}`);
    }
    // Else let default behavior (download/open in new tab) happen
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || 'var(--text-secondary)';
  };

  if (loading) return <Loader />;

  if (error || !task) {
    return (
      <div className="content">
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><AlertCircle size={48} color="var(--danger)" /></div>
            <h3>{error || 'Task not found'}</h3>
            <button className="btn btn-primary" onClick={() => navigate('/member/tasks')}>
              <ArrowLeft size={18} /> Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTimelineActivities = () => {
    if (!task) return [];
    const activities = [
      ...(task.notes || []).map(n => ({ ...n, itemType: 'note' })),
      ...(task.attachments || []).map(a => ({ ...a, itemType: 'attachment' }))
    ];
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const groups = [];
    activities.forEach(item => {
      const lastGroup = groups[groups.length - 1];
      const itemTime = new Date(item.created_at).getTime();
      if (lastGroup && lastGroup.user_name === item.user_name && Math.abs(lastGroup.time - itemTime) < 60000) {
        lastGroup.items.push(item);
      } else {
        groups.push({
          user_name: item.user_name,
          time: itemTime,
          created_at: item.created_at,
          items: [item]
        });
      }
    });
    return groups;
  };

  const activities = getTimelineActivities();

  return (
    <div className="content">
      {/* Header with Back Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/member/tasks')}
        >
          <ArrowLeft size={18} /> Back to Tasks
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Task Details</h1>
        </div>
      </div>

      {/* Main Task Information Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ flex: 1 }}>
            <h2 className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{task.title}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Task ID: #{task.id}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Task Description */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Description
          </h3>
          <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Task Metadata Grid */}
        <div style={{
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Folder size={14} /> Project
            </div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
              {task.project_name || '-'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} /> Assigned By
            </div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
              {task.assigned_by_name || '-'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={14} /> Priority
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                backgroundColor: getPriorityColor(task.priority) + '25',
                color: getPriorityColor(task.priority),
                textTransform: 'capitalize'
              }}>
                {task.priority}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Due Date
            </div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Created
            </div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
              {new Date(task.created_at).toLocaleDateString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={14} /> Last Updated
            </div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
              {new Date(task.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Update Task Status Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} /> Update Task Progress
          </h3>
        </div>

        <form onSubmit={handleStatusUpdate} style={{ padding: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Status *
            </label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={updating}
              style={{ maxWidth: '400px' }}
            >
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Progress Notes (Optional)
            </label>
            <textarea
              className="form-control"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              disabled={updating}
              rows="4"
              placeholder="Add notes..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Attachments (Optional)
            </label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              disabled={updating}
              multiple
              style={{ padding: '0.75rem' }}
            />
            {attachments.length > 0 && (
              <div style={{ marginTop: '0.75rem', color: 'var(--text-main)' }}>
                <strong>Selected files:</strong>
                <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                  {attachments.map((file, index) => (
                    <li key={index} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Paperclip size={14} /> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)'
          }}>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              {updating ? 'Updating...' : <><Save size={18} /> Save Update</>}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedStatus(task.status);
                setProgressNote('');
                setAttachments([]);
              }}
              disabled={updating}
            >
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </form>
      </div>

      {/* Task History Section */}
      {activities.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} /> Task History & Activity
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {activities.map((group, index) => (
                <div key={index} style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: '1.5rem', position: 'relative' }}>
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-7px',
                    top: '0',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    border: '2px solid var(--bg-surface)'
                  }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{group.user_name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(group.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {group.items.map((item, i) => (
                      <div key={i}>
                        {item.itemType === 'note' ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '8px' }}>
                            {item.note}
                          </p>
                        ) : (
                          <a
                            href={`http://localhost/Task-management/backend${item.file_path}`}
                            onClick={(e) => handleAttachmentClick(e, item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="activity-attachment"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '0.75rem 1rem',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              backgroundColor: 'var(--bg-card)',
                              transition: 'all 0.2s ease',
                              width: 'fit-content',
                              maxWidth: '100%'
                            }}
                          >
                            {item.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <ImageIcon size={20} color="var(--primary)" />
                            ) : (
                              <FileText size={20} color="var(--text-muted)" />
                            )}
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.file_name}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              ({(item.file_size / 1024).toFixed(1)} KB)
                            </span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="Image Preview"
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={previewImage}
              alt="Attachment Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a href={previewImage} download target="_blank" rel="noreferrer" className="btn btn-primary">
              <Download size={18} /> Download Image
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaskDetails;


