import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminDashboard from '@/views/admin/AdminDashboard.vue'
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
import RestaurantDetail from '@/views/admin/RestaurantDetail.vue'
import SystemMonitoring from '@/views/admin/SystemMonitoring.vue'
import StaffManagement from '@/views/admin/StaffManagement.vue'
import DeliverySettings from '@/views/admin/DeliverySettings.vue'
import ActiveDeliveries from '@/views/admin/ActiveDeliveries.vue'
import SupportManagement from '@/views/admin/SupportManagement.vue'
import CustomerAccounts from '@/views/admin/CustomerAccounts.vue'
import SupportTicketDetails from '@/views/admin/SupportTicketDetails.vue'
import CustomerAccountDetails from '@/views/admin/CustomerAccountDetails.vue'
// No need to import AdminLogin as we're using unified login
import store from '@/store'

// Admin route guard
const adminGuard = async (to, from, next) => {
  // No need to skip check for admin login page as we're using unified login

  try {
    console.log('adminGuard: Checking authentication state for path', to.path);

    // Get authentication status from store
    const isAuthenticated = store.getters['auth/isAuthenticated'];
    const currentUser = store.getters['auth/user'];

    console.log('adminGuard: Initial auth check - authenticated:', isAuthenticated, 'user role:', currentUser?.role, 'user:', currentUser);

    // If already authenticated with admin role, allow access
    if (isAuthenticated && currentUser && currentUser.role === 'admin') {
      console.log('adminGuard: User already authenticated as admin, proceeding to', to.path);
      next();
      return;
    } else {
      console.log('adminGuard: User is not properly authenticated as admin');
    }

    // Try to restore auth state if not already authenticated
    try {
      console.log('adminGuard: Attempting to restore auth state');
      const authResult = await store.dispatch('auth/checkAuth');
      console.log('adminGuard: Auth check result:', authResult);

      // Check auth state after checkAuth
      const currentUser = store.getters['auth/user'];
      const isAuthenticated = store.getters['auth/isAuthenticated'];

      console.log('adminGuard: After checkAuth - authenticated?', isAuthenticated, 'User role:', currentUser?.role);

      // If we have an authenticated admin user, allow access
      if (isAuthenticated && currentUser && currentUser.role === 'admin') {
        console.log('adminGuard: Access granted to admin user after checkAuth');
        next();
        return;
      }
    } catch (error) {
      console.error('adminGuard: Error during checkAuth:', error);
    }

    // If still not authenticated as admin, try to refresh token
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        console.log('adminGuard: Attempting token refresh');
        // Attempt to refresh the token
        await store.dispatch('auth/refreshToken');

        // Load user data after token refresh
        await store.dispatch('auth/loadUser');

        const updatedUser = store.getters['auth/user'];
        const isAuthenticated = store.getters['auth/isAuthenticated'];

        console.log('adminGuard: After refresh - authenticated?', isAuthenticated, 'User role:', updatedUser?.role);

        if (isAuthenticated && updatedUser && updatedUser.role === 'admin') {
          console.log('adminGuard: Access granted after token refresh');
          next();
          return;
        }
      }
    } catch (error) {
      console.error('adminGuard: Token refresh failed:', error.message);
      if (error.response) {
        console.error('adminGuard: Server response:', error.response.data);
      }
    }

    console.log('adminGuard: Access denied - redirecting to login');
    // If we get here, redirect to the login page
    next({
      path: '/login',
      query: {
        redirect: to.fullPath,
        message: 'Please log in with an admin account'
      }
    });
  } catch (error) {
    console.error('adminGuard error:', error);
    // Redirect to the login page
    next({
      path: '/login',
      query: {
        redirect: to.fullPath,
        error: 'An error occurred while checking authentication'
      }
    });
  }
};


const adminRoutes = {
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAuth: true, requiresAdmin: true },
  beforeEnter: adminGuard,
  children: [
    {
      path: '',
      name: 'AdminRoot',
      redirect: { name: 'AdminDashboard' },
      meta: { requiresAdmin: true }
    },
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: {
        title: 'Admin Dashboard',
        requiresAdmin: true
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
      path: 'restaurants/:id',
      name: 'RestaurantDetail',
      component: RestaurantDetail,
      props: true,
      meta: {
        title: 'Restaurant Details'
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
      path: 'users/:id',
      name: 'AdminUserDetail',
      component: () => import('@/views/admin/UserDetail.vue'),
      props: true,
      meta: {
        title: 'User Details'
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
      path: 'products',
      name: 'AdminProducts',
      component: () => import('@/views/admin/Products.vue'),
      meta: {
        title: 'Product Management'
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
      path: 'support',
      name: 'SupportManagement',
      component: SupportManagement,
      meta: {
        title: 'Quản Lý Hỗ Trợ Khách Hàng'
      }
    },
    {
      path: 'support/tickets/:id',
      name: 'SupportTicketDetails',
      component: SupportTicketDetails,
      props: true,
      meta: {
        title: 'Chi Tiết Yêu Cầu Hỗ Trợ'
      }
    },
    {
      path: 'customer-accounts',
      name: 'CustomerAccounts',
      component: CustomerAccounts,
      meta: {
        title: 'Quản Lý Tài Khoản Khách Hàng'
      }
    },
    {
      path: 'customer-accounts/:id',
      name: 'CustomerAccountDetails',
      component: CustomerAccountDetails,
      props: true,
      meta: {
        title: 'Chi Tiết Tài Khoản Khách Hàng'
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

// Export only the admin routes
export { adminRoutes } // <<< MODIFIED
