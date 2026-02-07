import React from 'react';
import StatusBadge from './StatusBadge';

const TaskCard = ({ task, onClick }) => {
  return (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="card-header">
        <h3 className="card-title">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>
      {task.description && (
        <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>
          {task.description.length > 100 
            ? task.description.substring(0, 100) + '...' 
            : task.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
        {task.project_name && <span>Project: {task.project_name}</span>}
        {task.assigned_to_name && <span>Assigned to: {task.assigned_to_name}</span>}
        {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};

export default TaskCard;







