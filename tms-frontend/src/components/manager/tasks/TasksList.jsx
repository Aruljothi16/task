import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerService } from '../../../services/managerService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import CreateTask from './CreateTask';
import {
  Search, List, Calendar, User, Briefcase,
  ChevronRight, Filter, Target, AlertCircle
} from 'lucide-react';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredTasks(tasks);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredTasks(tasks.filter(task =>
        (task.title && task.title.toLowerCase().includes(lowerTerm)) ||
        (task.description && task.description.toLowerCase().includes(lowerTerm)) ||
        (task.project_name && task.project_name.toLowerCase().includes(lowerTerm)) ||
        (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(lowerTerm))
      ));
    }
  }, [searchTerm, tasks]);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await managerService.getTasks(selectedProject || null);
      setTasks(data || []);
      setFilteredTasks(data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  const handleRowClick = (taskId) => {
    navigate(`/manager/tasks/${taskId}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Global Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and manage all task assignments across your projects.</p>
        </div>
        <CreateTask onTaskCreated={handleTaskCreated} />
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by task title, member, or specific project name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '3rem', borderRadius: '8px', background: 'var(--bg-body)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}>
              <Filter size={18} /> Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No active tasks found</h3>
            <p>Try refining your search or create a new task to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-body)' }}>
                  <th style={{ padding: '1.25rem' }}>Task Designation</th>
                  <th>Assignment</th>
                  <th>Affiliation</th>
                  <th>Classification</th>
                  <th>Timeline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleRowClick(task.id)}
                    className="hover-row"
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}
                  >
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: #{task.id}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          {task.assigned_to_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{task.assigned_to_name || 'Unassigned'}</div>
                          {task.assigned_to_designation && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.assigned_to_designation}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Briefcase size={14} />
                        <span style={{ fontWeight: 500 }}>{task.project_name || 'Direct Task'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <StatusBadge status={task.status} />
                        <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase', width: 'fit-content' }}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksList;
