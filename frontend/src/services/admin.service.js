import axios from 'axios';

class AdminService {
  async getUsers(params = {}) {
    try {
      const response = await axios.get('/api/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch users';
    }
  }

  async getUserById(id) {
    try {
      const response = await axios.get(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch user details';
    }
  }

  async createUser(userData) {
    try {
      const response = await axios.post('/api/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create user';
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await axios.put(`/api/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update user';
    }
  }

  async updateUserStatus(id, status, reason) {
    try {
      const response = await axios.patch(`/api/admin/users/${id}/status`, { status, reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update user status';
    }
  }
}

export default new AdminService();