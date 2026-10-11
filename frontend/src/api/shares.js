import api from './client';

export const sharesApi = {
  async shareFile(fileId, recipientEmail, permission = 'read') {
    const response = await api.post(`/api/files/${fileId}/shares`, {
      recipient_email: recipientEmail,
      permission,
    });
    return response.data;
  },

  async getFileShares(fileId) {
    const response = await api.get(`/api/files/${fileId}/shares`);
    return response.data;
  },

  async revokeShare(fileId, shareId) {
    const response = await api.delete(`/api/files/${fileId}/shares/${shareId}`);
    return response.data;
  },

  async getReceivedShares() {
    const response = await api.get('/api/shares/received');
    return response.data;
  },

  async getSentShares() {
    const response = await api.get('/api/shares/sent');
    return response.data;
  },
};
