import React, { useState } from 'react';
import { memberService } from '../../../services/memberService';
import StatusBadge from '../../shared/StatusBadge';

const UpdateTaskStatus = ({ task, onStatusUpdate }) => {
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await memberService.updateTaskStatus(task.id, newStatus);
      setStatus(newStatus);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update task status');
      setStatus(task.status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
      <div className="form-group">
        <label className="form-label">
          <strong>Update Status:</strong>
        </label>
        <select
          className="form-control"
          value={status}
          onChange={handleStatusChange}
          disabled={loading}
          style={{ maxWidth: '300px' }}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        Current Status: <StatusBadge status={status} />
      </div>
    </div>
  );
};

export default UpdateTaskStatus;






