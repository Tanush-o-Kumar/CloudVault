import api from './client';

export const filesApi = {
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  async getFiles({ q, type, page = 1, pageSize = 20 } = {}) {
    const params = { page, page_size: pageSize };
    if (q) params.q = q;
    if (type && type !== 'all') params.type = type;

    const response = await api.get('/api/files', { params });
    return response.data;
  },

  async getFile(fileId) {
    const response = await api.get(`/api/files/${fileId}`);
    return response.data;
  },

  async downloadFile(fileId, filename) {
    const response = await api.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create a Blob from the response data
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async deleteFile(fileId) {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },
};
