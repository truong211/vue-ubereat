import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

// Public pages
import Home from '../views/Home.vue';

// Route-level code-splitting for better performance
// This generates a separate chunk for each route
// which is lazy-loaded when the route is visited

// Auth routes
const Login = () => import('../views/auth/Login.vue');
const Register = () => import('../views/auth/Register.vue');
const ForgotPassword = () => import('../views/auth/ForgotPassword.vue');
const ResetPassword = () => import('../views/auth/ResetPassword.vue');

// Customer routes
const Restaurants = () => import('../views/Restaurants.vue');
const RestaurantDetail = () => import('../views/RestaurantDetail.vue');
const Cart = () => import('../views/Cart.vue');
const Checkout = () => import('../views/Checkout.vue');
const OrderConfirmation = () => import('../views/OrderConfirmation.vue');
const OrderTracking = () => import('../views/OrderTracking.vue');
const OrderHistory = () => import('../views/OrderHistory.vue');
const OrderDetail = () => import('../views/OrderDetail.vue');
const UserProfile = () => import('../views/UserProfile.vue');
const AddressBook = () => import('../views/AddressBook.vue');

// Restaurant admin routes
const RestaurantLayout = () => import('../views/restaurant/RestaurantLayout.vue');
const RestaurantDashboard = () => import('../views/restaurant/Dashboard.vue');
const RestaurantMenu = () => import('../views/restaurant/Menu.vue');
const RestaurantOrders = () => import('../views/restaurant/Orders.vue');
const RestaurantAnalytics = () => import('../views/restaurant/Analytics.vue');
const RestaurantSettings = () => import('../views/restaurant/Settings.vue');
const RestaurantPromotions = () => import('../views/restaurant/Promotions.vue');

// Driver routes
const DriverLayout = () => import('../views/driver/DriverLayout.vue');
const DriverDashboard = () => import('../views/driver/Dashboard.vue');
const DriverOrders = () => import('../views/driver/Orders.vue');
const DriverEarnings = () => import('../views/driver/Earnings.vue');
const DriverSettings = () => import('../views/driver/Settings.vue');

// Admin routes
const AdminLayout = () => import('../views/admin/AdminLayout.vue');
const AdminDashboard = () => import('../views/admin/Dashboard.vue');
const AdminUsers = () => import('../views/admin/Users.vue');
const AdminRestaurants = () => import('../views/admin/Restaurants.vue');
const AdminDrivers = () => import('../views/admin/Drivers.vue');
const AdminCategories = () => import('../views/admin/Categories.vue');
const AdminPromotions = () => import('../views/admin/Promotions.vue');
const AdminSettings = () => import('../views/admin/Settings.vue');

// Not found page
const NotFound = () => import('../views/NotFound.vue');

const routes = [
  // Public routes
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'Home' }
  },
  {
    path: '/restaurants',
    name: 'Restaurants',
    component: Restaurants,
    meta: { title: 'Restaurants' }
  },
  {
    path: '/restaurants/:id',
    name: 'RestaurantDetail',
    component: RestaurantDetail,
    meta: { title: 'Restaurant Menu' }
  },
  
  // Auth routes
  {
    path: '/auth/login',
    name: 'Login',
    component: Login,
    meta: { title: 'Login', guest: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: Register,
    meta: { title: 'Register', guest: true }
  },
  {
    path: '/auth/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { title: 'Forgot Password', guest: true }
  },
  {
    path: '/auth/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { title: 'Reset Password', guest: true }
  },
  
  // Customer routes (require authentication)
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { requiresAuth: true, title: 'Your Cart' }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    meta: { requiresAuth: true, title: 'Checkout' }
  },
  {
    path: '/order-confirmation/:id',
    name: 'OrderConfirmation',
    component: OrderConfirmation,
    meta: { requiresAuth: true, title: 'Order Confirmation' }
  },
  {
    path: '/orders/:id/tracking',
    name: 'OrderTracking',
    component: OrderTracking,
    meta: { requiresAuth: true, title: 'Track Your Order' }
  },
  {
    path: '/orders',
    name: 'OrderHistory',
    component: OrderHistory,
    meta: { requiresAuth: true, title: 'Order History' }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { requiresAuth: true, title: 'Order Details' }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile,
    meta: { requiresAuth: true, title: 'Your Profile' }
  },
  {
    path: '/addresses',
    name: 'AddressBook',
    component: AddressBook,
    meta: { requiresAuth: true, title: 'Address Book' }
  },
  {
    path: '/rewards',
    name: 'UserRewards',
    component: () => import('@/views/user/UserRewards.vue'),
    meta: { requiresAuth: true }
  },
  
  // Restaurant admin routes
  {
    path: '/restaurant',
    component: RestaurantLayout,
    meta: { requiresAuth: true, role: 'restaurant', title: 'Restaurant Dashboard' },
    children: [
      {
        path: '',
        name: 'RestaurantDashboard',
        component: RestaurantDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'menu',
        name: 'RestaurantMenu',
        component: RestaurantMenu,
        meta: { title: 'Menu Management' }
      },
      {
        path: 'orders',
        name: 'RestaurantOrders',
        component: RestaurantOrders,
        meta: { title: 'Orders' }
      },
      {
        path: 'analytics',
        name: 'RestaurantAnalytics',
        component: RestaurantAnalytics,
        meta: { title: 'Analytics' }
      },
      {
        path: 'promotions',
        name: 'RestaurantPromotions',
        component: RestaurantPromotions,
        meta: { title: 'Promotions' }
      },
      {
        path: 'settings',
        name: 'RestaurantSettings',
        component: RestaurantSettings,
        meta: { title: 'Settings' }
      }
    ]
  },
  
  // Driver routes
  {
    path: '/driver',
    component: DriverLayout,
    meta: { requiresAuth: true, role: 'driver', title: 'Driver Dashboard' },
    children: [
      {
        path: '',
        name: 'DriverDashboard',
        component: DriverDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'orders',
        name: 'DriverOrders',
        component: DriverOrders,
        meta: { title: 'Orders' }
      },
      {
        path: 'earnings',
        name: 'DriverEarnings',
        component: DriverEarnings,
        meta: { title: 'Earnings' }
      },
      {
        path: 'settings',
        name: 'DriverSettings',
        component: DriverSettings,
        meta: { title: 'Settings' }
      }
    ]
  },
  
  // Admin routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin', title: 'Admin Dashboard' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { title: 'User Management' }
      },
      {
        path: 'restaurants',
        name: 'AdminRestaurants',
        component: AdminRestaurants,
        meta: { title: 'Restaurant Management' }
      },
      {
        path: 'drivers',
        name: 'AdminDrivers',
        component: AdminDrivers,
        meta: { title: 'Driver Management' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: AdminCategories,
        meta: { title: 'Category Management' }
      },
      {
        path: 'promotions',
        name: 'AdminPromotions',
        component: AdminPromotions,
        meta: { title: 'Promotions' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { title: 'Settings' }
      }
    ]
  },
  
  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: 'Page Not Found' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If the user uses back/forward navigation
    if (savedPosition) {
      return savedPosition;
    }
    
    // Scroll to top when navigating to a new page
    return { top: 0 };
  },
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Update page title
  document.title = `${to.meta.title} | Food Delivery App` || 'Food Delivery App';
  
  // Start page loading animation
  store.dispatch('ui/startPageLoading');
  
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const isAuthenticated = store.getters['isAuthenticated'];
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      store.dispatch('ui/showSnackbar', {
        text: 'Please log in to access this page',
        color: 'info'
      });
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
    
    // Check for specific role requirement
    if (to.matched.some(record => record.meta.role)) {
      const requiredRole = to.matched.find(record => record.meta.role).meta.role;
      const userRole = store.getters['user']?.role;
      
      if (userRole !== requiredRole && userRole !== 'admin') {
        store.dispatch('ui/showSnackbar', {
          text: 'You do not have permission to access this page',
          color: 'error'
        });
        return next({ name: 'Home' });
      }
    }
  }
  
  // If the route is for guests only and the user is logged in, redirect to home
  if (to.matched.some(record => record.meta.guest) && store.getters['isAuthenticated']) {
    return next({ name: 'Home' });
  }
  
  next();
});

router.afterEach(() => {
  // End page loading animation after navigation completes
  setTimeout(() => {
    store.dispatch('ui/endPageLoading');
  }, 300);
});

export default router;
