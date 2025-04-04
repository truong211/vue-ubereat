import axios from 'axios';

class AdminService {
  async getUsers(params = {}) {
    try {
      const response = await axios.get('/api/admin/users', { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch users';
      throw new Error(message);
    }
  }

  async getUserById(id) {
    try {
      const response = await axios.get(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch user details';
      throw new Error(message);
    }
  }

  async createUser(userData) {
    try {
      const response = await axios.post('/api/admin/users', userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create user';
      throw new Error(message);
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await axios.put(`/api/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to update user';
      throw new Error(message);
    }
  }

  async updateUserStatus(id, status, reason) {
    try {
      const response = await axios.patch(`/api/admin/users/${id}/status`, { status, reason });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to update user status';
      throw new Error(message);
    }
  }
}

export default new AdminService();