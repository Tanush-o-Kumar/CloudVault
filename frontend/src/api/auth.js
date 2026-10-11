import api from './client';

export const authApi = {
  async register(fullName, email, password) {
    const response = await api.post('/api/auth/register', {
      full_name: fullName,
      email,
      password,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  async getMe() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};
