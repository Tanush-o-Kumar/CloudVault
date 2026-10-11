import api from './client';

export const dashboardApi = {
  async getStats() {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },
};
