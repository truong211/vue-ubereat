import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import store from '@/store'
import authRoutes from './auth'
import './types'
// Import the admin routes from admin.js
import { adminRoutes } from './admin.js'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      // Foods
      {
        path: 'foods',
        name: 'Foods',
        component: () => import('@/views/Foods.vue')
      },
      // Restaurants
      {
        path: 'restaurants',
        name: 'Restaurants',
        component: () => import('@/views/Restaurants.vue')
      },
      {
        path: 'restaurants/:id',
        name: 'RestaurantDetail',
        component: () => import('@/views/RestaurantDetail.vue'),
        props: true
      },
      // User profile and related
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
        path: 'rewards',
        name: 'Rewards',
        component: () => import('@/views/user/Rewards.vue'),
        meta: { requiresAuth: true }
      },
      // Cart and checkout
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/Cart.vue')
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('@/views/Checkout.vue'),
        meta: { requiresAuth: true }
      },
      // Orders
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetails.vue'),
        meta: { requiresAuth: true },
        props: true
      },
      {
        path: 'track/:id',
        name: 'OrderTracking',
        component: () => import('@/views/OrderTracking.vue'),
        meta: { requiresAuth: true },
        props: true
      }
    ]
  },
  {
    path: '/restaurant',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, roles: ['restaurant', 'admin'] },
    children: [
      {
        path: 'dashboard',
        name: 'RestaurantDashboard',
        component: () => import('@/views/restaurant/Dashboard.vue')
      },
      {
        path: 'menu',
        name: 'MenuManagement',
        component: () => import('@/views/restaurant/MenuManagement.vue')
      }
    ]
  },

  // Use the admin routes imported from admin.js
  adminRoutes,

  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresGuest: true },
    children: authRoutes
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiredRoles = to.matched
    .filter(record => record.meta.roles)
    .flatMap(record => record.meta.roles || [])

  // Check authentication status
  const isAuthenticated = !!store.state.auth.accessToken
  const userRole = store.state.auth.user?.role

  // Handle authentication requirements
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Handle guest-only routes
  if (requiresGuest && isAuthenticated) {
    next('/')
    return
  }

  // Handle role-based access
  if (requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      next({
        path: '/',
        query: { error: 'unauthorized' }
      })
      return
    }
  }

  // If all checks pass, proceed
  next()
})

export default router