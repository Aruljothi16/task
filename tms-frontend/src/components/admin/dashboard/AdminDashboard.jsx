import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import Loader from '../../common/Loader';
import {
  FolderKanban,
  CheckCircle2,
  Activity,
  AlertCircle,
  Users,
  LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    totalUsers: 0,
    activeUsers: 0,
    managers: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects and users using existing service
      const [projectsData, usersData] = await Promise.all([
        adminService.getProjects(),
        adminService.getUsers()
      ]);

      if (projectsData) {
        setProjects(projectsData);

        // Calculate project stats
        const now = new Date();
        const completed = projectsData.filter(p => p.status === "completed").length;
        const inProgress = projectsData.filter(p => p.status === "in_progress").length;
        const pending = projectsData.filter(p => p.status === "pending").length;
        const overdue = projectsData.filter(p => {
          if (!p.due_date) return false;
          return new Date(p.due_date) < now && p.status !== "completed";
        }).length;

        // Calculate user stats
        let totalUsers = 0;
        let activeUsers = 0;
        let managers = 0;

        if (usersData) {
          setUsers(usersData);
          totalUsers = usersData.length;
          // Assuming all users in the list are active for now, or check for status if available
          // The previous code checked for 'active' status. If logic is missing in backend, we show total.
          // Let's assume we show total as active for now or check if 'status' field exists in user model (it does not in the View I saw, but let's check).
          // Checking User.php... it has: id, username, email, full_name, role, designation. No status.
          // So Active Users = Total Users for now.
          activeUsers = totalUsers;
          managers = usersData.filter(u => u.role === "manager").length;
        }

        setStats({
          totalProjects: projectsData.length,
          completed,
          inProgress,
          pending,
          overdue,
          totalUsers,
          activeUsers,
          managers
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get recent projects (last 5)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // Get project status distribution for chart
  const projectStatusData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    data: [stats.completed, stats.inProgress, stats.pending, stats.overdue],
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
  };

  // Get user role distribution
  const getUserRoleCount = (role) => {
    if (!users.length) return 0;
    return users.filter(u => u.role === role).length;
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
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
              Admin Dashboard
            </h1>

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
            </div>
          </div>

          {/* Stats Grid - Updated with Project Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
            alignItems: "stretch"
          }}>
            {/* Total Projects */}
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
                justifyContent: "space-between",
                boxSizing: "border-box"
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
                <div style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.3"
                }}>
                  Total Projects
                </div>
                <FolderKanban size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                margin: 0,
                lineHeight: 1
              }}>
                {loading ? "-" : stats.totalProjects}
              </div>
            </div>

            {/* Completed Projects */}
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
                justifyContent: "space-between",
                boxSizing: "border-box"
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
                <div style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.3"
                }}>
                  Completed
                </div>
                <CheckCircle2 size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                margin: 0,
                lineHeight: 1
              }}>
                {loading ? "-" : stats.completed}
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
                justifyContent: "space-between",
                boxSizing: "border-box"
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
                <div style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.3"
                }}>
                  In Progress
                </div>
                <Activity size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                margin: 0,
                lineHeight: 1
              }}>
                {loading ? "-" : stats.inProgress}
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
                justifyContent: "space-between",
                boxSizing: "border-box"
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
                <div style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.3"
                }}>
                  Overdue
                </div>
                <AlertCircle size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                margin: 0,
                lineHeight: 1
              }}>
                {loading ? "-" : stats.overdue}
              </div>
            </div>

            {/* Total Users */}
            <div
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.3s, box-shadow 0.3s",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box"
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
                <div style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.3"
                }}>
                  Total Users
                </div>
                <Users size={20} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                margin: 0,
                lineHeight: 1
              }}>
                {loading ? "-" : stats.totalUsers}
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
            width: "100%",
            alignItems: "start"
          }}>
            {/* Recent Projects Card */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1e293b",
                  margin: 0,
                  lineHeight: "1.3"
                }}>
                  Recent Projects
                </h3>
                <span style={{
                  fontSize: '12px',
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  Last 5
                </span>
              </div>

              {loading ? (
                <div style={{
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "40px 20px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0 }}>Loading projects...</p>
                </div>
              ) : recentProjects.length === 0 ? (
                <div style={{
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "40px 20px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0 }}>No projects yet</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1
                }}>
                  {recentProjects.map((project) => (
                    <div key={project.id} style={{
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      transition: 'all 0.3s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '6px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {project.name || project.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: project.status === 'completed' ? '#10b981' :
                            project.status === 'in_progress' ? '#3b82f6' :
                              project.status === 'pending' ? '#f59e0b' : '#64748b',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {project.status?.replace('_', ' ') || 'Pending'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Manager: {project.manager_name || 'Unassigned'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        Due: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project Status Distribution Card */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                margin: "0 0 20px 0",
                lineHeight: "1.3"
              }}>
                Project Status
              </h3>

              {loading ? (
                <div style={{
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "40px 20px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0 }}>Loading data...</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  flex: 1
                }}>
                  {projectStatusData.labels.map((label, index) => {
                    const count = projectStatusData.data[index];
                    const percentage = stats.totalProjects > 0 ?
                      Math.round((count / stats.totalProjects) * 100) : 0;

                    return (
                      <div key={label} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: projectStatusData.colors[index]
                            }} />
                            <span style={{
                              fontSize: '14px',
                              color: '#1e293b',
                              fontWeight: '500'
                            }}>
                              {label}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: '#64748b',
                            fontWeight: '600'
                          }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#f1f5f9',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: projectStatusData.colors[index],
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Statistics Card */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                margin: "0 0 20px 0",
                lineHeight: "1.3"
              }}>
                User Statistics
              </h3>

              {loading ? (
                <div style={{
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "40px 20px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0 }}>Loading user data...</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  flex: 1
                }}>
                  {/* Active Users */}
                  <div style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        Active Users
                      </div>
                      <div style={{
                        fontSize: '20px',
                        color: '#10b981',
                        fontWeight: '700'
                      }}>
                        {stats.activeUsers}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      Out of {stats.totalUsers} total users
                    </div>
                  </div>

                  {/* User Role Distribution */}
                  <div style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      fontWeight: '500',
                      marginBottom: '12px'
                    }}>
                      User Roles
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {[
                        { role: 'admin', label: 'Admin', count: getUserRoleCount('admin'), color: '#3b82f6' },
                        { role: 'manager', label: 'Manager', count: getUserRoleCount('manager'), color: '#8b5cf6' },
                        { role: 'member', label: 'Member', count: getUserRoleCount('member'), color: '#10b981' }
                      ].map((item) => (
                        <div key={item.role} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: item.color
                            }} />
                            <span style={{
                              fontSize: '13px',
                              color: '#1e293b'
                            }}>
                              {item.label}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: '#64748b',
                            fontWeight: '600'
                          }}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <div style={{
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        color: '#3b82f6',
                        fontWeight: '700',
                        marginBottom: '4px'
                      }}>
                        {stats.managers}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        Managers
                      </div>
                    </div>
                    <div style={{
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        color: stats.pending > 0 ? '#f59e0b' : '#10b981',
                        fontWeight: '700',
                        marginBottom: '4px'
                      }}>
                        {stats.pending}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        Pending Projects
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;







