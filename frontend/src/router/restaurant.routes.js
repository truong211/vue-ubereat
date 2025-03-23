const routes = [
  {
    path: '/restaurant',
    component: () => import('@/layouts/RestaurantLayout.vue'),
    meta: { requiresAuth: true, requiresRestaurant: true },
    children: [
      {
        path: '',
        redirect: { name: 'RestaurantDashboard' }
      },
      {
        path: 'dashboard',
        name: 'RestaurantDashboard',
        component: () => import('@/views/restaurant/Dashboard.vue'),
        meta: { title: 'Tổng Quan' }
      },
      {
        path: 'orders',
        name: 'RestaurantOrders',
        component: () => import('@/components/restaurant/OrderManagement.vue'),
        meta: { title: 'Quản Lý Đơn Hàng' }
      },
      {
        path: 'settings',
        name: 'RestaurantSettings',
        component: () => import('../views/restaurant/SettingsManagement.vue'),
        meta: {
          requiresAuth: true,
          requiresRestaurant: true
        }
      },
      {
        path: 'analytics',
        name: 'RestaurantAnalytics',
        component: () => import('@/components/restaurant/RestaurantAnalytics.vue'),
        meta: {
          requiresAuth: true,
          title: 'Analytics & Reports'
        }
      }
    ]
  }
]

export default routes