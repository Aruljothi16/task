import React, { useState, useEffect } from 'react';
import { managerService } from '../../../services/managerService';
import Modal from '../../shared/Modal';

const AssignTask = ({ task, onTaskAssigned }) => {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showModal) {
      loadUsers();
    }
  }, [showModal]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the new managerService.getTeamMembers()
      const members = await managerService.getTeamMembers();
      
      // Debug log
      console.log('Loaded members:', members);
      
      // Handle different response structures
      let memberList = [];
      if (Array.isArray(members)) {
        memberList = members;
      } else if (members && members.members) {
        memberList = members.members;
      } else if (members && members.data) {
        memberList = members.data;
      }
      
      setUsers(memberList);
      
      if (memberList.length === 0) {
        setError('No team members found. Please add members first.');
      }
      
    } catch (err) {
      console.error('Failed to load team members:', err);
      setError('Failed to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      alert('Please select a team member to assign');
      return;
    }
    
    try {
      await managerService.assignTask(task.id, assignedTo);
      setShowModal(false);
      setAssignedTo('');
      if (onTaskAssigned) onTaskAssigned();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign task');
    }
  };

  return (
    <>
      <button
        className="btn btn-secondary"
        onClick={() => setShowModal(true)}
      >
        Reassign
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setAssignedTo('');
          setError('');
        }}
        title="Assign Task"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task</label>
            <input
              type="text"
              className="form-control"
              value={task.title}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Assign To</label>
            
            {loading ? (
              <div className="text-center p-3">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Loading team members...
              </div>
            ) : error ? (
              <div className="alert alert-warning">
                {error}
              </div>
            ) : (
              <>
                <select
                  className="form-control"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                >
                  <option value="">Select Team Member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  {users.length} team member(s) available
                </small>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!assignedTo || loading}
            >
              Assign Task
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowModal(false);
                setAssignedTo('');
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AssignTask;


