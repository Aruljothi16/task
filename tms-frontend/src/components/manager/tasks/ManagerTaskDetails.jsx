import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberService } from '../../../services/memberService';
import { managerService } from '../../../services/managerService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';
import { useToast } from '../../../context/ToastContext';
import {
    ArrowLeft,
    MessageSquare,
    Paperclip,
    FileText,
    Image as ImageIcon,
    Clock,
    Calendar,
    User,
    Folder,
    History,
    Send
} from 'lucide-react';

const ManagerTaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [members, setMembers] = useState([]);
    const [selectedTester, setSelectedTester] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadTask();
        loadMembers();
    }, [id]);

    const loadMembers = async () => {
        try {
            const data = await managerService.getTeamMembers();
            setMembers(data);
        } catch (error) {
            console.error('Failed to load team members:', error);
        }
    };

    const loadTask = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await memberService.getTaskDetails(id);
            setTask(data);
        } catch (error) {
            console.error('Failed to load task:', error);
            setError('Failed to load task details.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            await memberService.addTaskNote(id, comment);
            addToast('Comment added successfully', 'success');
            setComment('');
            loadTask();
        } catch (error) {
            console.error('Failed to add comment:', error);
            addToast('Failed to add comment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignTester = async () => {
        if (!selectedTester) return;
        setAssigning(true);
        try {
            // Assign to tester and update status to 'testing'
            await managerService.assignTask(id, selectedTester, 'testing');
            addToast('Task assigned to tester successfully', 'success');
            setShowAssignModal(false);
            loadTask();
        } catch (error) {
            console.error('Failed to assign tester:', error);
            addToast('Failed to assign tester', 'error');
        } finally {
            setAssigning(false);
        }
    };

    const handleAttachmentClick = (e, att) => {
        const isImage = att.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        if (isImage) {
            e.preventDefault();
            setPreviewImage(`http://localhost/Task-management/backend${att.file_path}`);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: '#28a745',
            medium: '#ffc107',
            high: '#dc3545'
        };
        return colors[priority] || 'var(--text-secondary)';
    };

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
            // Group items if they are from the same user and within 60 seconds
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

    if (loading) return <Loader />;

    if (error || !task) {
        return (
            <div className="content">
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>{error || 'Task not found'}</h3>
                    <button className="btn btn-primary" onClick={() => navigate('/manager/tasks')} style={{ marginTop: '1rem' }}>
                        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    const activities = getTimelineActivities();

    return (
        <div className="content">
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/manager/tasks')}
                    style={{ padding: '8px', minWidth: 'auto', borderRadius: '8px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Task Intelligence</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Deep dive into task progress, feedback, and deliverables.</p>
                </div>
                {task && task.status === 'completed' && !members.find(m => m.id === task.assigned_to && m.designation === 'Tester') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAssignModal(true)}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <User size={18} /> Assign to Tester
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Main Info */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{task.title}</h2>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Folder size={14} /> {task.project_name}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <User size={14} /> Assigned to: {task.assigned_to_name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                            <StatusBadge status={task.status} />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} /> Description
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {task.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* New Unified Timeline/Activity Feed */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={18} /> Task Activity & Discussion
                            </h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleAddComment} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
                                <div className="form-group">
                                    <textarea
                                        className="form-control"
                                        placeholder="Add feedback or comments for the team member..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows="3"
                                        disabled={submitting}
                                    />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
                                        {submitting ? 'Sending...' : <><Send size={16} /> Send Comment</>}
                                    </button>
                                </div>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {activities.length > 0 ? (
                                    activities.map((group, index) => (
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
                                    ))
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No activity yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Side Info */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Details</h3>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Priority</div>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backgroundColor: getPriorityColor(task.priority) + '20',
                                    color: getPriorityColor(task.priority),
                                    textTransform: 'capitalize'
                                }}>
                                    {task.priority || 'Medium'}
                                </span>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    <Calendar size={14} inline /> Due Date
                                </div>
                                <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    <User size={14} inline /> Assigned By
                                </div>
                                <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                                    {task.assigned_by_name || '-'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    <Clock size={14} inline /> Created At
                                </div>
                                <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                                    {new Date(task.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {previewImage && (
                <Modal
                    isOpen={!!previewImage}
                    onClose={() => setPreviewImage(null)}
                    title="Image Preview"
                >
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={previewImage}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
                        />
                        <div style={{ marginTop: '1rem' }}>
                            <a href={previewImage} download className="btn btn-primary" target="_blank" rel="noreferrer">
                                Download Original
                            </a>
                        </div>
                    </div>
                </Modal>
            )}


            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title="Assign for Testing"
            >
                <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Select a Quality Assurance (Tester) member to verify this completed task.
                    </p>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Select Tester</label>
                        <select
                            className="form-control"
                            value={selectedTester}
                            onChange={(e) => setSelectedTester(e.target.value)}
                        >
                            <option value="">-- Choose a Tester --</option>
                            {members
                                .filter(m => m.designation === 'Tester' || m.role === 'admin') // Include admins or just testers? Stick to Testers.
                                .map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.full_name} ({member.designation || member.role})
                                    </option>
                                ))}
                        </select>
                        {members.filter(m => m.designation === 'Tester').length === 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#dc2626' }}>
                                Warning: No users found with 'Tester' designation.
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAssignModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleAssignTester}
                            disabled={!selectedTester || assigning}
                        >
                            {assigning ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ManagerTaskDetails;
