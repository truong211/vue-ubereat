import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import store from '@/store'

const authRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'Login',
    component: () => import('@/components/auth/AuthForm.vue'),
    props: { mode: 'login' },
    meta: { requiresGuest: true }
  },
  {
    path: 'register',
    name: 'Register',
    component: () => import('@/components/auth/AuthForm.vue'),
    props: { mode: 'register' },
    meta: { requiresGuest: true }
  },
  {
    path: 'forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/components/auth/ForgotPassword.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: 'reset-password/:token',
    name: 'ResetPassword',
    component: () => import('@/components/auth/ResetPassword.vue'),
    meta: { requiresGuest: true },
    beforeEnter: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      // Check if token exists
      if (!to.params.token) {
        next({ name: 'ForgotPassword' })
      } else {
        next()
      }
    }
  },
  {
    path: 'logout',
    name: 'Logout',
    component: { template: '<div></div>' }, // Dummy component required for route definition
    beforeEnter: async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        await store.dispatch('auth/logout')
      } finally {
        next({ name: 'Login' })
      }
    }
  }
]

export default authRoutes