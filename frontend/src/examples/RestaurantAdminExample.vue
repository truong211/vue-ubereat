<template>
  <div class="restaurant-admin-examples">
    <h2 class="text-h5 mb-4">Restaurant Management Examples</h2>

    <!-- Example 1: Basic Restaurant Dashboard -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Restaurant Dashboard</h3>
      <v-card>
        <v-card-text>
          <restaurant-admin
            :initial-tab="'orders'"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Menu Management -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Menu Management</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Menu Categories -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Categories
                  <v-btn
                    color="primary"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="addCategory"
                  >
                    Add
                  </v-btn>
                </v-card-title>

                <v-list select-strategy="single-select" v-model="selectedCategory">
                  <v-list-item
                    v-for="category in menuCategories"
                    :key="category.id"
                    :value="category"
                  >
                    <template v-slot:prepend>
                      <v-icon>{{ category.icon }}</v-icon>
                    </template>
                    
                    <v-list-item-title>{{ category.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ category.items.length }} items
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Menu Items -->
            <v-col cols="12" md="8">
              <restaurant-admin
                :initial-tab="'menu'"
                :selected-category="selectedCategory?.id"
                @item-added="handleItemAdded"
                @item-updated="handleItemUpdated"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ menuExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Real-time Order Management -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Order Management</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Active Orders -->
            <v-col cols="12" md="8">
              <restaurant-admin
                :initial-tab="'orders'"
                :auto-refresh="true"
                :refresh-interval="30"
                @order-accepted="handleOrderAccepted"
                @order-ready="handleOrderReady"
              />
            </v-col>

            <!-- Order Stats -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Today's Stats</v-card-title>
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-clipboard-text</v-icon>
                    </template>
                    <v-list-item-title>Total Orders</v-list-item-title>
                    <v-list-item-subtitle>{{ orderStats.total }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Completed</v-list-item-title>
                    <v-list-item-subtitle>{{ orderStats.completed }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="warning">mdi-clock</v-icon>
                    </template>
                    <v-list-item-title>Average Prep Time</v-list-item-title>
                    <v-list-item-subtitle>{{ orderStats.avgPrepTime }} min</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="error">mdi-alert-circle</v-icon>
                    </template>
                    <v-list-item-title>Late Orders</v-list-item-title>
                    <v-list-item-subtitle>{{ orderStats.late }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ orderExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 4: Settings Management -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Restaurant Settings</h3>
      <v-card>
        <v-card-text>
          <restaurant-admin
            :initial-tab="'settings'"
            @settings-updated="handleSettingsUpdated"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ settingsExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import RestaurantAdmin from '@/components/restaurant/RestaurantAdmin.vue'

export default {
  name: 'RestaurantAdminExample',
  
  components: {
    RestaurantAdmin
  },
  
  setup() {
    // State
    const selectedCategory = ref(null)
    
    // Mock data
    const menuCategories = ref([
      {
        id: 1,
        name: 'Appetizers',
        icon: 'mdi-food',
        items: [
          { id: 1, name: 'Spring Rolls', price: 6.99 },
          { id: 2, name: 'Salad', price: 8.99 }
        ]
      },
      {
        id: 2,
        name: 'Main Course',
        icon: 'mdi-food-turkey',
        items: [
          { id: 3, name: 'Burger', price: 12.99 },
          { id: 4, name: 'Pizza', price: 15.99 }
        ]
      }
    ])
    
    const orderStats = ref({
      total: 45,
      completed: 38,
      avgPrepTime: 18,
      late: 2
    })
    
    // Event handlers
    const addCategory = () => {
      console.log('Add category clicked')
    }
    
    const handleItemAdded = (item) => {
      console.log('Item added:', item)
    }
    
    const handleItemUpdated = (item) => {
      console.log('Item updated:', item)
    }
    
    const handleOrderAccepted = (order) => {
      console.log('Order accepted:', order)
    }
    
    const handleOrderReady = (order) => {
      console.log('Order ready:', order)
    }
    
    const handleSettingsUpdated = (settings) => {
      console.log('Settings updated:', settings)
    }
    
    // Code examples
    const basicExample = computed(() => {
      return `<restaurant-admin
  :initial-tab="'orders'"
/>`
    })
    
    const menuExample = computed(() => {
      return `<restaurant-admin
  :initial-tab="'menu'"
  :selected-category="selectedCategory?.id"
  @item-added="handleItemAdded"
  @item-updated="handleItemUpdated"
/>`
    })
    
    const orderExample = computed(() => {
      return `<restaurant-admin
  :initial-tab="'orders'"
  :auto-refresh="true"
  :refresh-interval="30"
  @order-accepted="handleOrderAccepted"
  @order-ready="handleOrderReady"
/>`
    })
    
    const settingsExample = computed(() => {
      return `<restaurant-admin
  :initial-tab="'settings'"
  @settings-updated="handleSettingsUpdated"
/>`
    })
    
    return {
      selectedCategory,
      menuCategories,
      orderStats,
      addCategory,
      handleItemAdded,
      handleItemUpdated,
      handleOrderAccepted,
      handleOrderReady,
      handleSettingsUpdated,
      basicExample,
      menuExample,
      orderExample,
      settingsExample
    }
  }
}
</script>

<style scoped>
.restaurant-admin-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>