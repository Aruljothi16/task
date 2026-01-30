import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import { Search, ListFilter, Calendar, User, Briefcase, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const TaskStatus = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredTasks(tasks);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredTasks(tasks.filter(task =>
        (task.title && task.title.toLowerCase().includes(lowerTerm)) ||
        (task.project_name && task.project_name.toLowerCase().includes(lowerTerm)) ||
        (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(lowerTerm)) ||
        (task.assigned_by_name && task.assigned_by_name.toLowerCase().includes(lowerTerm))
      ));
    }
  }, [searchTerm, tasks]);

  const loadTasks = async () => {
    try {
      const data = await adminService.getTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Global Task Hub</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitoring system-wide task progression and resource distribution.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search across all tasks, projects, or team members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '3rem', borderRadius: '8px', background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-body)' }}>
              <ListFilter size={18} /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr style={{ background: 'var(--bg-body)', borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '1.5rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Task Detail</th>
              <th style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Affiliation</th>
              <th style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Personnel</th>
              <th style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Timeline</th>
              <th style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Classification</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="hover-row">
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(67, 97, 238, 0.05)', color: 'var(--primary)' }}>
                      <TaskIcon status={task.status} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: #{task.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Briefcase size={14} />
                    <span style={{ fontWeight: 600 }}>{task.project_name || 'Individual Task'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>{task.assigned_to_name || 'Pending'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronRight size={10} />
                      From: {task.assigned_by_name || 'System'}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: isOverdue(task.due_date, task.status) ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    <Calendar size={14} />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <StatusBadge status={task.status} />
                    <span className={`badge badge-${task.priority}`} style={{ width: 'fit-content', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {task.priority} Priority
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px dashed var(--border-light)', marginTop: '2rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No matching tasks discovered</h3>
          <p style={{ color: 'var(--text-muted)' }}>Broaden your search criteria or clear active filters</p>
        </div>
      )}
    </div>
  );
};

const TaskIcon = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'completed': return <CheckCircle2 size={20} />;
    case 'in_progress': return <Clock size={20} />;
    default: return <AlertCircle size={20} />;
  }
};

const isOverdue = (date, status) => {
  if (!date || status === 'completed') return false;
  return new Date(date) < new Date();
};

export default TaskStatus;



