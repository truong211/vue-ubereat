import api from './api';

export default {
  // Promotion Categories
  getPromotionCategories: async () => {
    return api.get('/promotions/categories');
  },

  createPromotionCategory: async (data) => {
    return api.post('/promotions/categories', data);
  },

  updatePromotionCategory: async (id, data) => {
    return api.put(`/promotions/categories/${id}`, data);
  },

  // Promotion Campaigns
  getPromotionCampaigns: async (params) => {
    return api.get('/promotions/campaigns', { params });
  },

  createPromotionCampaign: async (data) => {
    return api.post('/promotions/campaigns', data);
  },

  updatePromotionCampaign: async (id, data) => {
    return api.put(`/promotions/campaigns/${id}`, data);
  },

  getCampaignStats: async (id, params) => {
    return api.get(`/promotions/campaigns/${id}/stats`, { params });
  },

  updateCampaignStatus: async (id, data) => {
    return api.patch(`/promotions/campaigns/${id}/status`, data);
  }
};