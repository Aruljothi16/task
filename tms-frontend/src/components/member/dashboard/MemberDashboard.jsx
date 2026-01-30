import React, { useState, useEffect } from 'react';
import { memberService } from '../../../services/memberService';
import Loader from '../../common/Loader';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MemberDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, tasksData] = await Promise.all([
        memberService.getDashboardSummary(),
        memberService.getMyTasks()
      ]);

      setSummary(summaryData);
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // derived stats
  const totalTasks = summary?.my_tasks || 0;

  const inProgress = summary?.tasks_by_status?.find(s => s.status === 'in_progress')?.count || 0;
  const completed = summary?.tasks_by_status?.find(s => s.status === 'completed')?.count || 0;
  const pending = summary?.tasks_by_status?.find(s => s.status === 'pending')?.count || 0;

  // Calculate overdue
  const now = new Date();
  const overdueCount = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < now;
  }).length;

  // Get recent tasks (last 5)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // Task Status Data for Chart
  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    data: [
      completed,
      inProgress,
      pending,
      overdueCount
    ],
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <div style={{
        padding: '0',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: "30px" }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
                My Workspace
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Track your assigned tasks and progress</p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
            alignItems: "stretch"
          }}>
            {/* Total Tasks */}
            <div
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.3s, box-shadow 0.3s",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "500", marginBottom: "12px" }}>
                  Total Tasks
                </div>
                <CheckSquare size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: "700", lineHeight: 1 }}>
                {totalTasks}
              </div>
            </div>

            {/* Completed */}
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.3s, box-shadow 0.3s",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "500", marginBottom: "12px" }}>
                  Completed
                </div>
                <CheckCircle2 size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: "700", lineHeight: 1 }}>
                {completed}
              </div>
            </div>

            {/* In Progress */}
            <div
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.3s, box-shadow 0.3s",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "500", marginBottom: "12px" }}>
                  In Progress
                </div>
                <Activity size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: "700", lineHeight: 1 }}>
                {inProgress}
              </div>
            </div>

            {/* Overdue */}
            <div
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.3s, box-shadow 0.3s",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "500", marginBottom: "12px" }}>
                  Overdue
                </div>
                <AlertCircle size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: "700", lineHeight: 1 }}>
                {overdueCount}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "30px",
            width: "100%",
            alignItems: "start"
          }}>
            {/* Recent Tasks Card */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Recent Tasks
                </h3>
              </div>

              {recentTasks.length === 0 ? (
                <div style={{
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "40px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0 }}>No tasks yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {recentTasks.map((task) => (
                    <div key={task.id} style={{
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      transition: 'all 0.3s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {task.title || task.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: task.status === 'completed' ? '#10b981' :
                            task.status === 'in_progress' ? '#3b82f6' : '#64748b',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {task.status?.replace('_', ' ') || 'Pending'}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Status Distribution */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Task Progress
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                {taskStatusData.labels.map((label, index) => {
                  const count = taskStatusData.data[index];
                  const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: taskStatusData.colors[index] }} />
                          <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{count} ({percentage}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: taskStatusData.colors[index], borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;






