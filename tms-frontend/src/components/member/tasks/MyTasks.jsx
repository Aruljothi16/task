import React, { useState, useEffect } from 'react';
import { memberService } from '../../../services/memberService';
import Loader from '../../common/Loader';
import { useNavigate } from 'react-router-dom';
import {
  Search, List, Calendar, ChevronRight,
  Filter, Target, Clock, CheckCircle2, AlertCircle,
  Grid, Kanban
} from 'lucide-react';
import StatusBadge from '../../shared/StatusBadge';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const navigate = useNavigate();

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
        (task.description && task.description.toLowerCase().includes(lowerTerm)) ||
        (task.project_name && task.project_name.toLowerCase().includes(lowerTerm))
      ));
    }
  }, [searchTerm, tasks]);

  const loadTasks = async () => {
    try {
      const data = await memberService.getMyTasks();
      setTasks(data || []);
      setFilteredTasks(data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    navigate(`/member/tasks/${task.id}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Assigned Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Focus on your current responsibilities and upcoming deadlines.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by task title or project affiliation..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '3rem', borderRadius: '8px', background: 'var(--bg-body)' }}
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-body)', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button onClick={() => setViewMode('list')} style={{ padding: '8px', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center' }}>
              <List size={20} />
            </button>
            <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center' }}>
              <Kanban size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>Clear Runway!</h3>
              <p>You have no pending tasks assigned at the moment.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-body)' }}>
                    <th style={{ padding: '1.25rem' }}>Task Details</th>
                    <th>Project</th>
                    <th>Classification</th>
                    <th>Timeline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="hover-row"
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}
                    >
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{task.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description || 'No additional details provided.'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {task.project_name || 'Personal Task'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <StatusBadge status={task.status} />
                          <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.65rem' }}>
                            {task.priority}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="var(--accent)" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="card"
              onClick={() => handleTaskClick(task)}
              style={{
                marginBottom: 0,
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderLeft: `4px solid ${task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--success)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>#{task.id}</div>
                <StatusBadge status={task.status} />
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{task.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', height: '2.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {task.description || 'No description provided for this task.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Calendar size={14} />
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {task.project_name ? task.project_name.substring(0, 15) + '...' : 'INDEPENDENT'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;






