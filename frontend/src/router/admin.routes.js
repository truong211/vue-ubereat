import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import SystemMonitoring from '@/views/admin/SystemMonitoring.vue';
import { defineAsyncComponent } from 'vue'

export default {
  path: '/admin',
  component: () => import('@/layouts/AdminLayout.vue'),
  meta: { requiresAuth: true, requiresAdmin: true },
  children: [
    {
      path: '',
      name: 'AdminDashboard',
      component: AdminDashboard
    },
    {
      path: 'system',
      name: 'SystemMonitoring',
      component: SystemMonitoring
    },
    {
      path: 'restaurants',
      name: 'AdminRestaurants',
      component: () => import('../views/admin/Restaurants.vue')
    },
    {
      path: 'restaurants/:id/verification',
      name: 'RestaurantVerification',
      component: () => import('../views/admin/RestaurantVerification.vue'),
      props: true
    },
    {
      path: 'promotions',
      name: 'admin-promotions',
      component: () => import('@/views/admin/Promotions.vue')
    },
    {
      path: 'promotion-campaigns',
      name: 'admin-promotion-campaigns',
      component: () => import('@/views/admin/PromotionCampaigns.vue')
    },
    // ...other admin routes
  ]
};