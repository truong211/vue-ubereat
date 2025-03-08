import DriverLayout from '@/views/driver/DriverLayout.vue'
import DriverDashboard from '@/views/driver/Dashboard.vue'
import DriverOrders from '@/views/driver/Orders.vue'
import DriverEarnings from '@/views/driver/Earnings.vue'
import DriverPerformance from '@/views/driver/Performance.vue'
import DriverSettings from '@/views/driver/Settings.vue'
import DriverProfile from '@/views/driver/Profile.vue'

// Driver route guard
const driverGuard = (to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.role === 'driver') {
    next()
  } else {
    next('/auth/login')
  }
}

export const driverRoutes = {
  path: '/driver',
  component: DriverLayout,
  beforeEnter: driverGuard,
  children: [
    {
      path: '',
      redirect: '/driver/dashboard'
    },
    {
      path: 'dashboard',
      name: 'DriverDashboard',
      component: DriverDashboard,
      meta: {
        title: 'Driver Dashboard'
      }
    },
    {
      path: 'orders',
      name: 'DriverOrders',
      component: DriverOrders,
      meta: {
        title: 'Orders'
      }
    },
    {
      path: 'orders/:id',
      name: 'DriverOrderDetail',
      component: () => import('@/views/driver/OrderDetail.vue'),
      props: true,
      meta: {
        title: 'Order Details'
      }
    },
    {
      path: 'earnings',
      name: 'DriverEarnings',
      component: DriverEarnings,
      meta: {
        title: 'Earnings'
      }
    },
    {
      path: 'performance',
      name: 'DriverPerformance',
      component: DriverPerformance,
      meta: {
        title: 'Performance'
      }
    },
    {
      path: 'profile',
      name: 'DriverProfile',
      component: DriverProfile,
      meta: {
        title: 'Profile'
      }
    },
    {
      path: 'settings',
      name: 'DriverSettings',
      component: DriverSettings,
      meta: {
        title: 'Settings'
      }
    }
  ]
}
