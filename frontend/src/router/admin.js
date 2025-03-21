import AdminLayout from '@/views/admin/AdminLayout.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminRestaurants from '@/views/admin/Restaurants.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminDrivers from '@/views/admin/Drivers.vue'
import AdminOrders from '@/views/admin/Orders.vue'
import AdminCategories from '@/views/admin/Categories.vue'
import AdminPromotions from '@/views/admin/Promotions.vue'
import AdminReports from '@/views/admin/Reports.vue'
import AdminSettings from '@/views/admin/Settings.vue'
import ContentManagement from '@/views/admin/ContentManagement.vue'
import RestaurantVerification from '@/views/admin/RestaurantVerification.vue'
import SystemMonitoring from '@/views/admin/SystemMonitoring.vue'

// Admin route guard
const adminGuard = (to, from, next) => {
  const isAdmin = JSON.parse(localStorage.getItem('user'))?.role === 'admin'
  if (isAdmin) {
    next()
  } else {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
}

export const adminRoutes = {
  path: '/admin',
  component: AdminLayout,
  beforeEnter: adminGuard,
  children: [
    {
      path: '',
      redirect: '/admin/dashboard'
    },
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: {
        title: 'Admin Dashboard'
      }
    },
    {
      path: 'restaurants',
      name: 'AdminRestaurants',
      component: AdminRestaurants,
      meta: {
        title: 'Restaurant Management'
      }
    },
    {
      path: 'restaurants/pending',
      name: 'AdminPendingRestaurants',
      component: AdminRestaurants,
      props: { status: 'pending' },
      meta: {
        title: 'Pending Restaurant Applications'
      }
    },
    {
      path: 'restaurants/verification/:id',
      name: 'RestaurantVerification',
      component: RestaurantVerification,
      props: true,
      meta: {
        title: 'Restaurant Verification'
      }
    },
    {
      path: 'users',
      name: 'AdminUsers',
      component: AdminUsers,
      meta: {
        title: 'User Management'
      }
    },
    {
      path: 'drivers',
      name: 'AdminDrivers',
      component: AdminDrivers,
      meta: {
        title: 'Driver Management'
      }
    },
    {
      path: 'orders',
      name: 'AdminOrders',
      component: AdminOrders,
      meta: {
        title: 'Order Management'
      }
    },
    {
      path: 'categories',
      name: 'AdminCategories',
      component: AdminCategories,
      meta: {
        title: 'Category Management'
      }
    },
    {
      path: 'content',
      name: 'AdminContent',
      component: ContentManagement,
      meta: {
        title: 'Content Management'
      }
    },
    {
      path: 'promotions',
      name: 'AdminPromotions',
      component: AdminPromotions,
      meta: {
        title: 'Promotion Management'
      }
    },
    {
      path: 'reports',
      name: 'AdminReports',
      component: AdminReports,
      meta: {
        title: 'Reports & Analytics'
      }
    },
    {
      path: 'settings',
      name: 'AdminSettings',
      component: AdminSettings,
      meta: {
        title: 'System Settings'
      }
    },
    {
      path: 'system',
      name: 'AdminSystem',
      component: SystemMonitoring,
      meta: {
        title: 'System Monitoring'
      }
    }
  ]
}
