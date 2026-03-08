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

  deleteProject: async (projectId) => {
    const response = await api.post('/api/projects/delete.php', { id: projectId });
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

  assignTask: async (taskId, userId, status = null) => {
    const payload = {
      task_id: taskId,
      assigned_to: userId,
    };
    if (status) payload.status = status;

    const response = await api.post('/api/tasks/assign.php', payload);
    return response.data;
  },

  importProjects: async (projects) => {
    const response = await api.post('/api/projects/import.php', { projects });
    return response.data;
  },

  importTasks: async (tasks) => {
    const response = await api.post('/api/tasks/import.php', { tasks });
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

  // AI/ML Methods
  predictPriority: async (title, description = '', extra = {}) => {
    const response = await api.post('/api/ai/suggest-priority.php', { title, description, ...extra });
    return response.data;
  },

  analyzeWorkload: async (projectId) => {
    const response = await api.post('/api/ai/analyze-workload.php', { project_id: projectId });
    return response.data;
  },

  chat: async (message) => {
    const response = await api.post('/api/ai/chat.php', { message });
    return response.data;
  },


  generateSubtasks: async (title, description = '') => {
    const response = await api.post('/api/ai/generate-subtasks.php', { title, description });
    return response.data;
  },


  getRisk: async (userId, complexity = 'medium') => {
    const response = await api.post('/api/ai/get-risk.php', { user_id: userId, complexity });
    return response.data;
  },

  getTeamMood: async () => {
    const response = await api.get('/api/ai/get-team-mood.php');
    return response.data;
  },
};



