import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import SystemMonitoring from '@/views/admin/SystemMonitoring.vue';
// ...other imports

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
    // ...other admin routes
  ]
};