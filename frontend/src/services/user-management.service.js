import axios from 'axios'

class UserManagementService {
  async updateUserRole(userId, role) {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role })
      return response.data
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update user role'
    }
  }

  async toggleUserStatus(userId, status, reason) {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/status`, { 
        status,
        reason
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update user status'
    }
  }

  async exportUsers(filters = {}) {
    try {
      const response = await axios.get('/api/admin/users/export', {
        params: filters,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'users.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      throw error.response?.data?.message || 'Failed to export users'
    }
  }
}

export default new UserManagementService()