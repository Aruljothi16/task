import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import Loader from '../../common/Loader';
import StatusBadge from '../../shared/StatusBadge';
import { Search } from 'lucide-react';

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
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Tasks Overview</h1>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '2.5rem', width: '250px' }}
          />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Assigned By</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.project_name || '-'}</td>
                <td>{task.assigned_to_name || '-'}</td>
                <td>{task.assigned_by_name || '-'}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>
                  <span className={`badge badge-${task.priority}`}>
                    {task.priority}
                  </span>
                </td>
                <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No tasks found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskStatus;


