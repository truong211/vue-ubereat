// Add to existing API service methods
  
  // Promotion Categories
  async getPromotionCategories() {
    return api.get('/promotions/categories');
  },

  async createPromotionCategory(data) {
    return api.post('/promotions/categories', data);
  },

  async updatePromotionCategory(id, data) {
    return api.put(`/promotions/categories/${id}`, data);
  },

  // Promotion Campaigns
  async getPromotionCampaigns(params) {
    return api.get('/promotions/campaigns', { params });
  },

  async createPromotionCampaign(data) {
    return api.post('/promotions/campaigns', data);
  },

  async updatePromotionCampaign(id, data) {
    return api.put(`/promotions/campaigns/${id}`, data);
  },

  async getCampaignStats(id, params) {
    return api.get(`/promotions/campaigns/${id}/stats`, { params });
  },

  async updateCampaignStatus(id, data) {
    return api.patch(`/promotions/campaigns/${id}/status`, data);
  },

  // Add to existing export or object