import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import HomeView from '../views/Home.vue'
import SearchPage from '../views/SearchPage.vue'

// Auth routes
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const VerifyEmail = () => import('@/views/auth/VerifyEmail.vue')
const VerifyOTP = () => import('@/views/auth/VerifyOTP.vue')
const ClearTokens = () => import('@/views/ClearTokens.vue')

// Payment methods route
const PaymentMethods = () => import('@/views/payment/PaymentMethods.vue')

// Admin routes
import { adminRoutes } from './admin.js';

const routes = [
  // Root route
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },

  // Auth routes
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: { guest: true }
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        meta: { guest: true }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword,
        meta: { guest: true }
      },
      {
        path: 'verify-email',
        name: 'VerifyEmail',
        component: VerifyEmail,
        meta: { guest: true }
      },
      {
        path: 'verify-otp',
        name: 'VerifyOTP',
        component: VerifyOTP,
        meta: { guest: true }
      }
    ]
  },

  // Direct login and register routes
  {
    path: '/login',
    name: 'DirectLogin',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'DirectRegister',
    component: Register,
    meta: { guest: true }
  },

  // Static pages
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/static/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/static/Contact.vue')
  },
  {
    path: '/promotions',
    name: 'Promotions',
    component: () => import('@/views/static/Promotions.vue')
  },

  // Protected routes that require authentication
  {
    path: '/profile',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'notifications',
        name: 'UserNotifications',
        component: () => import('@/views/user/UserNotifications.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'ProfileSettings',
        component: () => import('@/views/profile/Settings.vue')
      },
      {
        path: 'payment-methods',
        name: 'PaymentMethods',
        component: () => import('@/views/payment/PaymentMethods.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'UserReviews',
        component: () => import('@/views/profile/Reviews.vue')
      },
      {
        path: 'favorites',
        name: 'UserFavorites',
        component: () => import('@/views/user/Favorites.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'account-settings',
        name: 'AccountSettings',
        component: () => import('@/views/user/AccountSettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'addresses',
        name: 'Addresses',
        component: () => import('@/views/user/Addresses.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'vouchers',
        name: 'Vouchers',
        component: () => import('@/views/user/Vouchers.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // Cart and Order routes
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetails',
    component: () => import('@/views/OrderDetails.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/orders/:id/tracking',
    name: 'order-tracking',
    component: () => import('@/components/order/OrderTrackingVi.vue'),
    meta: {
      requiresAuth: true,
      title: 'Theo dõi đơn hàng'
    }
  },

  // Restaurant and Review routes
  {
    path: '/restaurant/:id',
    name: 'RestaurantDetail',
    component: () => import('@/views/RestaurantDetail.vue'),
    props: true
  },
  {
    path: '/restaurant/:id/reviews',
    name: 'RestaurantReviews',
    component: () => import('@/views/restaurant/Reviews.vue'),
    props: true
  },
  {
    path: '/restaurant/:id/analytics',
    name: 'RestaurantAnalytics',
    component: () => import('@/views/restaurant/RestaurantAnalytics.vue'),
    meta: {
      requiresAuth: true,
      roles: ['restaurant', 'admin']
    }
  },
  {
    path: '/restaurants',
    name: 'Restaurants',
    component: () => import('@/views/Restaurants.vue'),
    props: (route) => ({
      category: route.query.category,
      address: route.query.address,
      sort: route.query.sort
    })
  },

  // Product routes
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Products.vue'),
    props: (route) => ({
      category: route.query.category,
      restaurantId: route.query.restaurantId
    })
  },
  {
    path: '/products/:productId',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    props: true
  },
  {
    path: '/products/:productId/reviews',
    name: 'ProductReviews',
    component: () => import('@/views/product/Reviews.vue'),
    props: true
  },
  {
    path: '/products/category/:category',
    name: 'ProductsByCategory',
    component: () => import('@/views/Products.vue'),
    props: true
  },

  // Foods route
  {
    path: '/foods',
    name: 'Foods',
    component: () => import('@/views/Foods.vue')
  },

  // Import the admin routes
  adminRoutes,

  // Other routes...
  {
    path: '/search',
    name: 'search',
    component: SearchPage,
    meta: {
      title: 'Tìm kiếm nhà hàng'
    }
  },

  // Clear tokens utility page
  {
    path: '/clear-tokens',
    name: 'ClearTokens',
    component: ClearTokens,
    meta: { guest: true }
  },

  // Add settings routes after other main routes and before the 404 route
  {
    path: '/settings',
    component: () => import('@/views/settings/Settings.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'settings-account' }
      },
      {
        path: 'account',
        name: 'settings-account',
        component: () => import('@/views/user/AccountSettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'notifications',
        name: 'settings-notifications',
        component: () => import('@/views/settings/NotificationSettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'security',
        name: 'settings-security',
        component: () => import('@/components/user/SecuritySettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'payment-methods',
        name: 'settings-payment-methods',
        component: () => import('@/views/payment/PaymentMethods.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'addresses',
        name: 'settings-addresses',
        component: () => import('@/views/user/Addresses.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards for authentication
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check authentication status
    const isAuthenticated = store.getters['auth/isAuthenticated']

    if (!isAuthenticated) {
      // If not authenticated, check if we can restore the session
      const restored = await store.dispatch('auth/checkAuth')

      if (!restored) {
        // Redirect to login if session can't be restored
        next({
          path: '/auth/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }

  // Check if route is for guests only (login, register, etc.)
  if (to.matched.some(record => record.meta.guest)) {
    const isAuthenticated = store.getters['auth/isAuthenticated']

    if (isAuthenticated) {
      // If already authenticated, redirect to home
      next({ path: '/' })
      return
    }
  }

  // If role requirements are present, check user role
  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = store.getters['auth/user']?.role

    if (!to.meta.roles.includes(userRole)) {
      // If user doesn't have required role, redirect to appropriate page
      if (userRole === 'admin') {
        next({ path: '/admin' })
      } else if (userRole === 'restaurant') {
        next({ path: '/restaurant-admin' })
      } else {
        next({ path: '/' })
      }
      return
    }
  }

  next()
})

// Admin route guard
router.beforeEach((to, from, next) => {
  // Check if route requires admin role
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const userRole = store.getters['auth/user']?.role

    if (userRole !== 'admin') {
      // If not admin, redirect to home with error message
      store.dispatch('ui/showSnackbar', {
        message: 'Access denied. Admin privileges required.',
        color: 'error'
      })
      next({ path: '/' })
      return
    }
  }
  next()
})

export default router
