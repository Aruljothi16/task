import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerService } from '../../../services/managerService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import CreateTask from './CreateTask';
import { Search, List, Calendar, User, Briefcase, ChevronRight } from 'lucide-react';

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
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
          <CreateTask onTaskCreated={handleTaskCreated} />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ margin: '1rem 0' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem' }}>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleRowClick(task.id)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    <td>#{task.id}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{task.title}</td>
                    <td>{task.project_name || '-'}</td>
                    <td>{task.assigned_to_name || '-'}</td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      <span className={`badge badge-${task.priority}`} style={{ textTransform: 'capitalize' }}>
                        {task.priority}
                      </span>
                    </td>
                    <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
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
