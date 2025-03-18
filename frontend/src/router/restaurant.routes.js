// ...existing code...

{
  path: 'settings',
  name: 'RestaurantSettings',
  component: () => import('../views/restaurant/SettingsManagement.vue'),
  meta: {
    requiresAuth: true,
    requiresRestaurant: true
  }
}

// ...existing code...