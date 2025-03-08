<template>
  <div class="order-history-examples">
    <h2 class="text-h5 mb-4">Order History Component Examples</h2>
    
    <!-- Example 1: Basic List View -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic List View</h3>
      <v-card>
        <v-card-text>
          <order-history-list 
            :orders="orders" 
            :is-loading="isLoading"
            title="Recent Orders"
            @reorder="handleReorder"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 2: Card View -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Card View with Items</h3>
      <v-card>
        <v-card-text>
          <order-history-list 
            :orders="orders" 
            :is-loading="isLoading"
            display="card"
            title="Order History"
            :show-items="true"
            @reorder="handleReorder"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ cardExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 3: Simple Compact View -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Simple Compact View</h3>
      <v-card>
        <v-card-text>
          <order-history-list 
            :orders="orders.slice(0, 3)" 
            :is-loading="isLoading"
            display="simple"
            title="Quick Order History"
            :max-items="2"
            @reorder="handleReorder"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ simpleExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 4: Dashboard Widget -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Dashboard Widget</h3>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Recent Orders</span>
          <v-btn variant="text" size="small" to="/orders" color="primary">
            View All
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <order-history-list 
            :orders="orders" 
            :is-loading="isLoading"
            display="simple"
            :show-title="false"
            :show-view-all-link="false"
            :max-items="3"
            @reorder="handleReorder"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ dashboardExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 5: Custom Empty State -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Custom Empty State</h3>
      <v-card>
        <v-card-text>
          <order-history-list 
            :orders="[]" 
            :is-loading="false"
            empty-state-text="You haven't placed any orders yet. Start ordering your favorite food!"
            title="Order History"
          >
            <template v-slot:empty-actions>
              <v-btn color="primary" prepend-icon="mdi-silverware-fork-knife" class="mt-4">
                Find Restaurants
              </v-btn>
            </template>
          </order-history-list>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ emptyStateExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import OrderHistoryList from '@/components/order/OrderHistoryList.vue'

export default {
  name: 'OrderHistoryExample',
  
  components: {
    OrderHistoryList
  },
  
  setup() {
    const orders = ref([]);
    const isLoading = ref(true);
    
    // Mock order data
    const mockOrders = [
      {
        id: '987654',
        restaurant: {
          id: 1,
          name: 'Burger Palace',
          image: '/images/restaurants/burger-logo.jpg'
        },
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: [
          { name: 'Classic Cheeseburger', quantity: 2 },
          { name: 'French Fries', quantity: 1 },
          { name: 'Soft Drink', quantity: 2 }
        ],
        total: 32.10,
        status: 'delivered',
        rated: false
      },
      {
        id: '876543',
        restaurant: {
          id: 2,
          name: 'Pizza Hut',
          image: '/images/restaurants/pizza-hut.jpg'
        },
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        items: [
          { name: 'Pepperoni Pizza (Large)', quantity: 1 },
          { name: 'Garlic Breadsticks', quantity: 1 },
          { name: 'Sprite', quantity: 2 }
        ],
        total: 35.75,
        status: 'delivered',
        rated: true
      },
      {
        id: '765432',
        restaurant: {
          id: 3,
          name: 'Sushi Palace',
          image: '/images/restaurants/sushi.jpg'
        },
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        items: [
          { name: 'California Roll', quantity: 2 },
          { name: 'Spicy Tuna Roll', quantity: 1 },
          { name: 'Miso Soup', quantity: 2 }
        ],
        total: 45.20,
        status: 'delivered',
        rated: false
      },
      {
        id: '654321',
        restaurant: {
          id: 4,
          name: 'Taco Bell',
          image: '/images/restaurants/taco-bell.jpg'
        },
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        items: [
          { name: 'Crunchy Taco', quantity: 3 },
          { name: 'Burrito Supreme', quantity: 1 },
          { name: 'Nacho Fries', quantity: 1 }
        ],
        total: 22.45,
        status: 'cancelled',
        rated: false
      },
      {
        id: '123456',
        restaurant: {
          id: 1,
          name: 'Burger Palace',
          image: '/images/restaurants/burger-logo.jpg'
        },
        date: new Date(), // Today
        items: [
          { name: 'Veggie Burger', quantity: 1 },
          { name: 'Onion Rings', quantity: 1 },
          { name: 'Chocolate Milkshake', quantity: 1 }
        ],
        total: 21.97,
        status: 'in_progress',
        rated: false
      }
    ];
    
    // Load mock data
    onMounted(() => {
      setTimeout(() => {
        orders.value = mockOrders;
        isLoading.value = false;
      }, 1000);
    });
    
    // Example event handler
    const handleReorder = (order) => {
      console.log('Reordering items from order:', order.id);
      alert(`Added items from order #${order.id} to cart. Total: $${order.total.toFixed(2)}`);
    };
    
    // Code examples
    const basicExample = computed(() => {
      return `<order-history-list 
  :orders="orders" 
  :is-loading="isLoading"
  title="Recent Orders"
  @reorder="handleReorder"
/>`;
    });
    
    const cardExample = computed(() => {
      return `<order-history-list 
  :orders="orders" 
  :is-loading="isLoading"
  display="card"
  title="Order History"
  :show-items="true"
  @reorder="handleReorder"
/>`;
    });
    
    const simpleExample = computed(() => {
      return `<order-history-list 
  :orders="orders" 
  :is-loading="isLoading"
  display="simple"
  title="Quick Order History"
  :max-items="2"
  @reorder="handleReorder"
/>`;
    });
    
    const dashboardExample = computed(() => {
      return `<!-- Inside a dashboard card -->
<v-card-title class="d-flex justify-space-between align-center">
  <span>Recent Orders</span>
  <v-btn variant="text" size="small" to="/orders" color="primary">
    View All
    <v-icon end>mdi-chevron-right</v-icon>
  </v-btn>
</v-card-title>
<v-card-text>
  <order-history-list 
    :orders="orders" 
    :is-loading="isLoading"
    display="simple"
    :show-title="false"
    :show-view-all-link="false"
    :max-items="3"
    @reorder="handleReorder"
  />
</v-card-text>`;
    });
    
    const emptyStateExample = computed(() => {
      return `<order-history-list 
  :orders="[]" 
  :is-loading="false"
  empty-state-text="You haven't placed any orders yet. Start ordering your favorite food!"
  title="Order History"
>
  <template v-slot:empty-actions>
    <v-btn color="primary" prepend-icon="mdi-silverware-fork-knife" class="mt-4">
      Find Restaurants
    </v-btn>
  </template>
</order-history-list>`;
    });
    
    return {
      orders,
      isLoading,
      handleReorder,
      basicExample,
      cardExample,
      simpleExample,
      dashboardExample,
      emptyStateExample
    };
  }
};
</script>

<style scoped>
.order-history-examples {
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