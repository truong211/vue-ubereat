import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import HomeView from '../views/Home.vue'
import SearchPage from '../views/SearchPage.vue'
import Offers from '../views/Offers.vue'

// Import route modules
import { adminRoutes } from './admin.js'
import { driverRoutes } from './driver.js'
import restaurantRoutes from './restaurant.routes.js'
import paymentRoutes from './payment.routes.js'

// Auth routes
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const VerifyEmail = () => import('@/views/auth/VerifyEmail.vue')
const VerifyOTP = () => import('@/views/auth/VerifyOTP.vue')

// Static pages
const About = () => import('@/views/static/About.vue')
const Contact = () => import('@/views/static/Contact.vue')

// Main features
const Restaurants = () => import('@/views/Restaurants.vue')
const Orders = () => import('@/views/Orders.vue')
const Cart = () => import('@/views/Cart.vue')
const Foods = () => import('@/views/Foods.vue')

// Create router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/register',
      name: 'TopLevelRegister',
      component: Register,
      meta: { guest: true }
    },
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
          path: '/login',
          name: 'TopLevelLogin', 
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
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView
        },
        {
          path: 'search',
          name: 'search',
          component: SearchPage
        },
        {
          path: 'restaurants',
          name: 'restaurants',
          component: Restaurants
        },
        {
          path: 'foods',
          name: 'foods',
          component: Foods
        },
        {
          path: 'orders',
          name: 'orders',
          component: Orders,
          meta: { requiresAuth: true }
        },
        {
          path: 'cart',
          name: 'cart',
          component: Cart
        },
        {
          path: 'about',
          name: 'about',
          component: About
        },
        {
          path: 'contact',
          name: 'contact',
          component: Contact
        },
        {
          path: 'partner',
          name: 'partner',
          component: () => import('../views/Partner.vue')
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('@/views/static/Terms.vue')
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/static/Privacy.vue')
        },
        {
          path: 'cookies',
          name: 'cookies',
          component: () => import('@/views/static/Cookies.vue')
        },
        {
          path: 'groceries',
          name: 'groceries',
          component: () => import('../views/Groceries.vue')
        },
        {
          path: 'offers',
          name: 'offers',
          component: Offers
        },
        {
          path: 'help',
          name: 'help',
          component: () => import('../views/Help.vue')
        },
        {
          path: 'order-now',
          name: 'orderNow',
          component: () => import('../views/OrderNow.vue')
        },
        // User profile and related routes
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/user/Profile.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'profile/notifications',
          name: 'UserNotifications',
          component: () => import('@/views/user/UserNotifications.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'profile/membership',
          name: 'membership',
          component: () => import('../views/profile/Membership.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/user/Settings.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'favorites',
          name: 'Favorites',
          component: () => import('@/views/user/Favorites.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },
    // Include imported route modules
    adminRoutes,
    driverRoutes,
    ...restaurantRoutes,
    ...paymentRoutes
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  
  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuest = to.matched.some(record => record.meta.guest)

  // Get authentication status
  const isAuthenticated = authStore.isAuthenticated

  // Handle authentication requirement
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Handle guest-only routes
  if (isGuest && isAuthenticated) {
    const userRole = authStore.userRole

    // Redirect based on role
    if (userRole === 'admin') {
      next({ path: '/admin' })
    } else if (userRole === 'restaurant') {
      next({ path: '/restaurant/dashboard' })
    } else {
      next({ path: '/' })
    }
    return
  }

  // Handle admin routes
  if (to.path === '/admin' || to.path.startsWith('/admin/')) {
    if (!isAuthenticated) {
      next({ 
        path: '/login', 
        query: { redirect: to.fullPath } 
      })
      return
    }
    
    if (authStore.userRole !== 'admin') {
      uiStore.showSnackbar({
        text: 'Access denied. Admin privileges required.',
        color: 'error'
      })
      next({ path: '/' })
      return
    }
  }

  next()
})

export default router
