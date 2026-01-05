import React, { useState, useEffect } from 'react';
import { managerService } from '../../../services/managerService';
import Loader from '../../common/Loader';

const ManagerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await managerService.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <h1>Manager Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{summary?.my_projects || 0}</div>
          <div className="stat-label">My Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.my_tasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Tasks by Status</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {summary?.tasks_by_status?.map((item, index) => (
              <tr key={index}>
                <td>{item.status}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;





