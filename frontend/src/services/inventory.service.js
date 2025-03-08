import api from './api.service'

class InventoryService {
  /**
   * Get current inventory levels
   * @param {string} restaurantId Restaurant ID
   * @returns {Promise<Object>} Inventory data
   */
  async getInventoryLevels(restaurantId) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/levels`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch inventory levels:', error)
      throw error
    }
  }

  /**
   * Get inventory items
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Inventory items
   */
  async getInventoryItems(restaurantId, options = {}) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/items`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
      throw error
    }
  }

  /**
   * Update item stock level
   * @param {string} restaurantId Restaurant ID
   * @param {string} itemId Item ID
   * @param {Object} data Update data
   * @returns {Promise<Object>} Updated item
   */
  async updateStockLevel(restaurantId, itemId, data) {
    try {
      const response = await api.patch(
        `/inventory/${restaurantId}/items/${itemId}/stock`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Failed to update stock level:', error)
      throw error
    }
  }

  /**
   * Add new inventory item
   * @param {string} restaurantId Restaurant ID
   * @param {Object} item Item data
   * @returns {Promise<Object>} Created item
   */
  async addInventoryItem(restaurantId, item) {
    try {
      const response = await api.post(
        `/inventory/${restaurantId}/items`,
        item
      )
      return response.data
    } catch (error) {
      console.error('Failed to add inventory item:', error)
      throw error
    }
  }

  /**
   * Update inventory item
   * @param {string} restaurantId Restaurant ID
   * @param {string} itemId Item ID
   * @param {Object} data Update data
   * @returns {Promise<Object>} Updated item
   */
  async updateInventoryItem(restaurantId, itemId, data) {
    try {
      const response = await api.put(
        `/inventory/${restaurantId}/items/${itemId}`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Failed to update inventory item:', error)
      throw error
    }
  }

  /**
   * Delete inventory item
   * @param {string} restaurantId Restaurant ID
   * @param {string} itemId Item ID
   * @returns {Promise<void>}
   */
  async deleteInventoryItem(restaurantId, itemId) {
    try {
      await api.delete(`/inventory/${restaurantId}/items/${itemId}`)
    } catch (error) {
      console.error('Failed to delete inventory item:', error)
      throw error
    }
  }

  /**
   * Get stock alerts
   * @param {string} restaurantId Restaurant ID
   * @returns {Promise<Object>} Alert data
   */
  async getStockAlerts(restaurantId) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/alerts`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error)
      throw error
    }
  }

  /**
   * Get reorder suggestions
   * @param {string} restaurantId Restaurant ID
   * @returns {Promise<Object>} Reorder suggestions
   */
  async getReorderSuggestions(restaurantId) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/reorder`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch reorder suggestions:', error)
      throw error
    }
  }

  /**
   * Place reorder
   * @param {string} restaurantId Restaurant ID
   * @param {Object} order Order data
   * @returns {Promise<Object>} Order confirmation
   */
  async placeReorder(restaurantId, order) {
    try {
      const response = await api.post(
        `/inventory/${restaurantId}/reorder`,
        order
      )
      return response.data
    } catch (error) {
      console.error('Failed to place reorder:', error)
      throw error
    }
  }

  /**
   * Get inventory usage report
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Report options
   * @returns {Promise<Object>} Usage report
   */
  async getUsageReport(restaurantId, options = {}) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/usage`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch usage report:', error)
      throw error
    }
  }

  /**
   * Get waste report
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Report options
   * @returns {Promise<Object>} Waste report
   */
  async getWasteReport(restaurantId, options = {}) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/waste`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch waste report:', error)
      throw error
    }
  }

  /**
   * Record waste
   * @param {string} restaurantId Restaurant ID
   * @param {Object} data Waste data
   * @returns {Promise<Object>} Recorded waste
   */
  async recordWaste(restaurantId, data) {
    try {
      const response = await api.post(
        `/inventory/${restaurantId}/waste`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Failed to record waste:', error)
      throw error
    }
  }

  /**
   * Get cost analysis
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Analysis options
   * @returns {Promise<Object>} Cost analysis
   */
  async getCostAnalysis(restaurantId, options = {}) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/costs`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch cost analysis:', error)
      throw error
    }
  }

  /**
   * Get supplier list
   * @param {string} restaurantId Restaurant ID
   * @returns {Promise<Object>} Supplier list
   */
  async getSuppliers(restaurantId) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/suppliers`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      throw error
    }
  }

  /**
   * Add supplier
   * @param {string} restaurantId Restaurant ID
   * @param {Object} supplier Supplier data
   * @returns {Promise<Object>} Created supplier
   */
  async addSupplier(restaurantId, supplier) {
    try {
      const response = await api.post(
        `/inventory/${restaurantId}/suppliers`,
        supplier
      )
      return response.data
    } catch (error) {
      console.error('Failed to add supplier:', error)
      throw error
    }
  }

  /**
   * Get purchase history
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Purchase history
   */
  async getPurchaseHistory(restaurantId, options = {}) {
    try {
      const response = await api.get(`/inventory/${restaurantId}/purchases`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch purchase history:', error)
      throw error
    }
  }
}

export default new InventoryService()