import api from './api';

export const managerService = {
  getMyProjects: async () => {
    const response = await api.get('/api/projects/list.php');
    return response.data.projects;
  },

  createProject: async (projectData) => {
    const response = await api.post('/api/projects/create.php', projectData);
    return response.data;
  },

  updateProject: async (projectData) => {
    const response = await api.post('/api/projects/update.php', projectData);
    return response.data;
  },

  getTasks: async (projectId = null) => {
    const url = projectId
      ? `/api/tasks/list.php?project_id=${projectId}`
      : '/api/tasks/list.php';
    const response = await api.get(url);
    return response.data.tasks;
  },

  createTask: async (taskData) => {
    const response = await api.post('/api/tasks/create.php', taskData);
    return response.data;
  },

  assignTask: async (taskId, userId) => {
    const response = await api.post('/api/tasks/assign.php', {
      task_id: taskId,
      assigned_to: userId,
    });
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/dashboard/summary.php');
    return response.data.summary;
  },

  // NEW METHOD: Get team members (users with member role)
  getTeamMembers: async () => {
    try {
      const response = await api.get('/api/tasks/members.php');
      return response.data.members || response.data.users || response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },
};

