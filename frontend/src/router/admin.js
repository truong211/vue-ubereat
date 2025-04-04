import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminRestaurants from '@/views/admin/Restaurants.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminDrivers from '@/views/admin/Drivers.vue'
import AdminOrders from '@/views/admin/Orders.vue'
import AdminCategories from '@/views/admin/Categories.vue'
import AdminPromotions from '@/views/admin/Promotions.vue'
import Analytics from '@/views/admin/Analytics.vue'
import AdminSettings from '@/views/admin/Settings.vue'
import ContentManagement from '@/views/admin/ContentManagement.vue'
import RestaurantVerification from '@/views/admin/RestaurantVerification.vue'
import SystemMonitoring from '@/views/admin/SystemMonitoring.vue'
import StaffManagement from '@/views/admin/StaffManagement.vue'
import DeliverySettings from '@/views/admin/DeliverySettings.vue'
import ActiveDeliveries from '@/views/admin/ActiveDeliveries.vue'

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
      path: 'tables/:tableName',
      name: 'TableManagement',
      component: () => import('@/views/admin/TableManagement.vue'),
      props: true,
      meta: {
        title: 'Table Management'
      }
    },
    {
      path: 'tables/:tableName/create',
      name: 'TableCreate',
      component: () => import('@/views/admin/TableForm.vue'),
      props: route => ({ 
        tableName: route.params.tableName,
        isEdit: false,
        id: null
      }),
      meta: {
        title: 'Create Record'
      }
    },
    {
      path: 'tables/:tableName/edit/:id',
      name: 'TableEdit',
      component: () => import('@/views/admin/TableForm.vue'),
      props: route => ({ 
        tableName: route.params.tableName,
        isEdit: true,
        id: route.params.id
      }),
      meta: {
        title: 'Edit Record'
      }
    },
    {
      path: 'tables/:tableName/view/:id',
      name: 'TableView',
      component: () => import('@/views/admin/TableView.vue'),
      props: true,
      meta: {
        title: 'View Record'
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
      component: Analytics,
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
      path: 'staff-management',
      name: 'StaffManagement',
      component: StaffManagement,
      meta: {
        title: 'Staff Permissions Management'
      }
    },
    {
      path: 'delivery-settings',
      name: 'DeliverySettings',
      component: DeliverySettings,
      meta: {
        title: 'Delivery Configuration'
      }
    },
    {
      path: 'deliveries',
      name: 'ActiveDeliveries',
      component: ActiveDeliveries,
      meta: {
        title: 'Active Deliveries'
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
