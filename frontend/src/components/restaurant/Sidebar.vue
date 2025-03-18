// ...existing code...
    <v-list-item
      prepend-icon="mdi-cog"
      title="Settings"
      :to="{ name: 'RestaurantSettings' }"
      :active="$route.name === 'RestaurantSettings'"
    ></v-list-item>
// ...existing code...