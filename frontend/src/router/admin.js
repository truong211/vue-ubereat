import AdminLayout from '@/views/admin/AdminLayout.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminRestaurants from '@/views/admin/Restaurants.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminDrivers from '@/views/admin/Drivers.vue'
import AdminPromotions from '@/views/admin/Promotions.vue'

// Admin route guard
const adminGuard = (to, from, next) => {
  const isAdmin = JSON.parse(localStorage.getItem('user'))?.role === 'admin'
  if (isAdmin) {
    next()
  } else {
    next('/auth/login')
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
      props: { 
        status: 'pending'
      },
      meta: {
        title: 'Pending Restaurant Applications'
      }
    },
    {
      path: 'restaurants/verification/:id',
      name: 'RestaurantVerification',
      component: () => import('@/views/admin/RestaurantVerification.vue'),
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
      path: 'promotions',
      name: 'AdminPromotions',
      component: AdminPromotions,
      meta: {
        title: 'Promotions'
      }
    }
  ]
}
