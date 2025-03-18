import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// Import components
import HomePage from '@/components/home/HomePage.vue';
import LoginForm from '@/components/auth/LoginForm.vue';
import RegisterForm from '@/components/auth/RegisterForm.vue';
import ForgotPassword from '@/components/auth/ForgotPassword.vue';
import ResetPassword from '@/components/auth/ResetPassword.vue';
import VerifyEmail from '@/components/auth/VerifyEmail.vue';
import UserProfile from '@/components/profile/UserProfile.vue';
import OrderTracking from '@/components/order/OrderTracking.vue';
import PaymentStatusPage from '@/components/payment/PaymentStatusPage.vue';
import StaticPage from '@/components/static/StaticPage.vue';

// Route definitions
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { title: 'Home' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { title: 'Login', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterForm,
    meta: { title: 'Register', guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { title: 'Forgot Password', guest: true }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { title: 'Reset Password', guest: true }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { title: 'Verify Email' }
  },
  {
    path: '/verify-email/:token',
    name: 'verify-email',
    component: VerifyEmail,
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: UserProfile,
    meta: { title: 'My Profile', requiresAuth: true }
  },
  {
    path: '/order/:id/tracking',
    name: 'OrderTracking',
    component: OrderTracking,
    props: true,
    meta: { title: 'Track Order', requiresAuth: true }
  },
  // Lazy-loaded routes for better performance
  {
    path: '/restaurants',
    name: 'Restaurants',
    component: () => import('@/components/restaurant/RestaurantList.vue'),
    meta: { title: 'Restaurants' }
  },
  {
    path: '/restaurants/:id',
    name: 'RestaurantDetail',
    component: () => import('@/components/restaurant/RestaurantDetail.vue'),
    props: true,
    meta: { title: 'Restaurant Details' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/components/cart/CartView.vue'),
    meta: { title: 'Shopping Cart' }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/components/checkout/CheckoutPage.vue'),
    meta: { title: 'Checkout', requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/components/order/OrderList.vue'),
    meta: { title: 'My Orders', requiresAuth: true }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/components/order/OrderDetail.vue'),
    props: true,
    meta: { title: 'Order Details', requiresAuth: true }
  },
  /* Commented out until component is created
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/components/favorites/FavoritesList.vue'),
    meta: { title: 'My Favorites', requiresAuth: true }
  },
  */
  {
    path: '/addresses',
    name: 'Addresses',
    component: () => import('@/components/address/AddressList.vue'),
    meta: { title: 'My Addresses', requiresAuth: true }
  },
  /* Commented out until component is created
  {
    path: '/payment-methods',
    name: 'PaymentMethods',
    component: () => import('@/components/payment/PaymentMethodList.vue'),
    meta: { title: 'Payment Methods', requiresAuth: true }
  },
  */
  /* Commented out until component is created
  {
    path: '/about',
    name: 'About',
    component: () => import('@/components/static/AboutPage.vue'),
    meta: { title: 'About Us' }
  },
  */
  /* Commented out until component is created
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/components/static/ContactPage.vue'),
    meta: { title: 'Contact Us' }
  },
  */
  /* Commented out until component is created
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/components/static/TermsPage.vue'),
    meta: { title: 'Terms of Service' }
  },
  */
  /* Commented out until component is created
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/components/static/PrivacyPage.vue'),
    meta: { title: 'Privacy Policy' }
  },
  */
  {
    path: '/payment/status',
    name: 'PaymentStatus',
    component: PaymentStatusPage,
    meta: {
      requiresAuth: true,
      title: 'Payment Status'
    }
  },
  {
    path: '/pages/:slug',
    name: 'StaticPage',
    component: StaticPage,
    props: true,
    meta: { title: route => route.params.slug }
  },
  // 404 page - using a simple component for now
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: { 
      template: '<div class="not-found"><h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p><router-link to="/">Go Home</router-link></div>' 
    },
    meta: { title: 'Page Not Found' }
  }
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} | UberEat` : 'UberEat';
  
  // Check authentication for protected routes
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login page if authentication is required
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    });
  } else if (to.meta.guest && isAuthenticated) {
    // Redirect to home page if the route is for guests only
    next({ name: 'Home' });
  } else {
    // Proceed as normal
    next();
  }
});

export default router;
