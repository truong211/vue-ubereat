export default [
  {
    path: '/payment/callback/:provider',
    name: 'PaymentCallback',
    component: () => import('@/components/payment/PaymentCallback.vue'),
    meta: {
      requiresAuth: true,
      title: 'Payment Verification'
    }
  },
  {
    path: '/payment/receipt/:id',
    name: 'PaymentReceipt',
    component: () => import('@/components/payment/PaymentReceipt.vue'),
    meta: {
      requiresAuth: true,
      title: 'Payment Receipt'
    }
  },
  {
    path: '/admin/payments',
    name: 'AdminPayments',
    component: () => import('@/views/admin/PaymentManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Payment Management'
    },
    children: [
      {
        path: 'reconciliation',
        name: 'PaymentReconciliation',
        component: () => import('@/views/admin/PaymentReconciliation.vue')
      },
      {
        path: 'reports',
        name: 'PaymentReports',
        component: () => import('@/views/admin/PaymentReports.vue')
      }
    ]
  }
];