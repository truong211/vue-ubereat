import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

// Auth routes
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const VerifyEmail = () => import('@/views/auth/VerifyEmail.vue')
const VerifyOTP = () => import('@/views/auth/VerifyOTP.vue')

// Payment methods route
const PaymentMethods = () => import('@/views/payment/PaymentMethods.vue')

// Admin routes
import adminRoutes from './admin.routes';
import Analytics from '@/views/admin/Analytics.vue';

const routes = [
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
  
  // Protected routes that require authentication
  {
    path: '/profile',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue')
      },
      {
        path: 'settings',
        name: 'ProfileSettings',
        component: () => import('@/views/profile/Settings.vue')
      },
      {
        path: 'payment-methods',
        name: 'PaymentMethods',
        component: PaymentMethods
      },
      {
        path: 'reviews',
        name: 'UserReviews',
        component: () => import('@/views/profile/Reviews.vue')
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
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'RestaurantDetail',
        component: () => import('@/views/RestaurantDetail.vue'),
        props: true
      },
      {
        path: 'reviews',
        name: 'RestaurantReviews',
        component: () => import('@/views/restaurant/Reviews.vue'),
        props: true
      },
      {
        path: 'analytics',
        name: 'RestaurantAnalytics',
        component: () => import('@/views/restaurant/RestaurantAnalytics.vue'),
        meta: {
          requiresAuth: true,
          roles: ['restaurant', 'admin']
        }
      }
    ]
  },
  
  // Admin routes
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: Analytics,
        meta: { title: 'System Analytics' }
      }
    ]
  },

  // Other routes...
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  
  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
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
