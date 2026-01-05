import api from './api';

export const memberService = {
  getMyTasks: async () => {
    const response = await api.get('/api/tasks/list.php');
    return response.data.tasks;
  },

  getTaskDetails: async (taskId) => {
    const response = await api.get(`/api/tasks/get.php?id=${taskId}`);
    return response.data.task;
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await api.post('/api/tasks/update-status.php', {
      task_id: taskId,
      status: status,
    });
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/dashboard/summary.php');
    return response.data.summary;
  },

  addTaskNote: async (taskId, note) => {
    const response = await api.post('/api/tasks/add-note.php', {
      task_id: taskId,
      note: note,
    });
    return response.data;
  },

  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('file', file);

    const response = await api.post('/api/tasks/upload-attachment.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

