import api from './api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/api/users/list.php');
    return response.data.users;
  },

  createUser: async (userData) => {
    const response = await api.post('/api/users/create.php', userData);
    return response.data;
  },

  updateUser: async (userData) => {
    const response = await api.post('/api/users/update.php', userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.post('/api/users/delete.php', { id: userId });
    return response.data;
  },

  getProjects: async () => {
    const response = await api.get('/api/projects/list.php');
    return response.data.projects;
  },

  createProject: async (projectData) => {
    const response = await api.post('/api/projects/create.php', projectData);
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await api.post('/api/projects/delete.php', { id: projectId });
    return response.data;
  },

  updateProject: async (projectData) => {
    const response = await api.post('/api/projects/update.php', projectData);
    return response.data;
  },

  getTasks: async () => {
    const response = await api.get('/api/tasks/list.php');
    return response.data.tasks;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/dashboard/summary.php');
    return response.data.summary;
  },
};







