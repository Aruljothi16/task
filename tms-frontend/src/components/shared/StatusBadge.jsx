import React from 'react';

const StatusBadge = ({ status, type = 'task' }) => {
  const getStatusClass = () => {
    if (type === 'project') {
      switch (status) {
        case 'active':
          return 'badge badge-active';
        case 'completed':
          return 'badge badge-completed';
        case 'on_hold':
          return 'badge badge-on-hold';
        default:
          return 'badge';
      }
    } else {
      switch (status) {
        case 'pending':
          return 'badge badge-pending';
        case 'in_progress':
          return 'badge badge-in-progress';
        case 'completed':
          return 'badge badge-completed';
        case 'cancelled':
          return 'badge badge-cancelled';
        default:
          return 'badge';
      }
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span className={getStatusClass()} style={{
      display: 'inline-block',
      minWidth: '100px',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    }}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;







