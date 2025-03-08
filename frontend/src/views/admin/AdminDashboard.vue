<template>
  <div class="admin-dashboard">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Admin Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Stats cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 stats-card" height="140">
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">TOTAL ORDERS</div>
              <div class="text-h3 font-weight-bold">{{ stats.totalOrders }}</div>
              <div :class="['mt-2', stats.ordersChange >= 0 ? 'text-success' : 'text-error']">
                <v-icon size="small" :icon="stats.ordersChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"></v-icon>
                {{ Math.abs(stats.ordersChange) }}% from last week
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 stats-card" height="140">
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">REVENUE</div>
              <div class="text-h3 font-weight-bold">${{ stats.revenue.toLocaleString() }}</div>
              <div :class="['mt-2', stats.revenueChange >= 0 ? 'text-success' : 'text-error']">
                <v-icon size="small" :icon="stats.revenueChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"></v-icon>
                {{ Math.abs(stats.revenueChange) }}% from last week
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 stats-card" height="140">
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">USERS</div>
              <div class="text-h3 font-weight-bold">{{ stats.users }}</div>
              <div :class="['mt-2', stats.usersChange >= 0 ? 'text-success' : 'text-error']">
                <v-icon size="small" :icon="stats.usersChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"></v-icon>
                {{ Math.abs(stats.usersChange) }}% from last week
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 stats-card" height="140">
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">RESTAURANTS</div>
              <div class="text-h3 font-weight-bold">{{ stats.restaurants }}</div>
              <div :class="['mt-2', stats.restaurantsChange >= 0 ? 'text-success' : 'text-error']">
                <v-icon size="small" :icon="stats.restaurantsChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"></v-icon>
                {{ Math.abs(stats.restaurantsChange) }}% from last week
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Revenue & Orders Trend
            <v-spacer></v-spacer>
            <v-select
              v-model="chartPeriod"
              :items="chartPeriods"
              label="Period"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 150px"
            ></v-select>
          </v-card-title>

          <v-card-text class="pt-0">
            <div class="chart-container">
              <!-- Placeholder for revenue chart - would use a chart library like Chart.js in real implementation -->
              <v-img src="/images/admin/revenue-chart.png" height="300"></v-img>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-pie</v-icon>
            Order Status
          </v-card-title>

          <v-card-text class="pt-0">
            <div class="chart-container">
              <!-- Placeholder for pie chart -->
              <v-img src="/images/admin/order-status-chart.png" height="300"></v-img>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Orders Table -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-text</v-icon>
            Recent Orders
            <v-spacer></v-spacer>
            <v-btn 
              variant="text" 
              color="primary" 
              :to="{ name: 'AdminOrders' }"
              prepend-icon="mdi-eye"
            >
              View All
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pa-0">
            <v-table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td>{{ order.id }}</td>
                  <td>{{ order.customer }}</td>
                  <td>{{ order.restaurant }}</td>
                  <td>{{ formatDate(order.date) }}</td>
                  <td>${{ order.amount.toFixed(2) }}</td>
                  <td>
                    <v-chip
                      :color="getStatusColor(order.status)"
                      size="small"
                      :text-color="order.status === 'cancelled' ? 'white' : undefined"
                    >
                      {{ getStatusText(order.status) }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-eye"
                      variant="text"
                      size="small"
                      density="comfortable"
                      :to="{ name: 'AdminOrderDetail', params: { id: order.id } }"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Top Restaurants Card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-store</v-icon>
            Top Restaurants
          </v-card-title>

          <v-divider></v-divider>

          <v-list>
            <v-list-item
              v-for="(restaurant, index) in topRestaurants"
              :key="restaurant.id"
              :to="{ name: 'AdminRestaurantDetail', params: { id: restaurant.id } }"
            >
              <template v-slot:prepend>
                <div class="mr-4 font-weight-bold">#{{ index + 1 }}</div>
                <v-avatar size="32">
                  <v-img :src="restaurant.image" cover></v-img>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
              
              <template v-slot:append>
                <div class="d-flex align-center">
                  <span class="text-subtitle-2 mr-2">${{ restaurant.revenue }}</span>
                  <v-icon 
                    :color="restaurant.change >= 0 ? 'success' : 'error'"
                    :icon="restaurant.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                    size="small"
                  ></v-icon>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'AdminRestaurants' }"
            >
              View All Restaurants
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Recent Users Card -->
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-multiple</v-icon>
            New Users
          </v-card-title>

          <v-divider></v-divider>

          <v-list>
            <v-list-item
              v-for="user in recentUsers"
              :key="user.id"
              :to="{ name: 'AdminUserDetail', params: { id: user.id } }"
            >
              <template v-slot:prepend>
                <v-avatar :color="user.avatar ? undefined : 'primary'">
                  <v-img v-if="user.avatar" :src="user.avatar" cover></v-img>
                  <span v-else class="text-white">{{ getInitials(user.name) }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="text-caption">
                  Joined {{ formatDate(user.joinDate) }}
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'AdminUsers' }"
            >
              View All Users
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      // Chart controls
      chartPeriod: 'week',
      chartPeriods: [
        { title: 'Today', value: 'today' },
        { title: 'This Week', value: 'week' },
        { title: 'This Month', value: 'month' },
        { title: 'This Year', value: 'year' }
      ],
      
      // Statistics data
      stats: {
        totalOrders: 1248,
        ordersChange: 12.5,
        revenue: 28456,
        revenueChange: 8.2,
        users: 3652,
        usersChange: 5.7,
        restaurants: 124,
        restaurantsChange: -2.1
      },
      
      // Recent orders
      recentOrders: [
        {
          id: '1234567',
          customer: 'John Doe',
          restaurant: 'Burger Palace',
          date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          amount: 32.50,
          status: 'delivered'
        },
        {
          id: '1234566',
          customer: 'Jane Smith',
          restaurant: 'Pizza Hut',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          amount: 45.80,
          status: 'on_the_way'
        },
        {
          id: '1234565',
          customer: 'Robert Johnson',
          restaurant: 'Sushi Palace',
          date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          amount: 68.25,
          status: 'preparing'
        },
        {
          id: '1234564',
          customer: 'Mary Williams',
          restaurant: 'Taco Bell',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          amount: 22.75,
          status: 'delivered'
        },
        {
          id: '1234563',
          customer: 'David Brown',
          restaurant: 'Panda Express',
          date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          amount: 18.50,
          status: 'cancelled'
        }
      ],
      
      // Top restaurants
      topRestaurants: [
        { id: 1, name: 'Burger Palace', image: '/images/restaurants/burger-logo.jpg', revenue: '5,240', change: 8.5 },
        { id: 2, name: 'Pizza Hut', image: '/images/restaurants/pizza-hut.jpg', revenue: '4,830', change: 12.3 },
        { id: 3, name: 'Sushi Palace', image: '/images/restaurants/sushi.jpg', revenue: '3,670', change: -2.1 },
        { id: 4, name: 'Taco Bell', image: '/images/restaurants/taco-bell.jpg', revenue: '3,125', change: 5.8 },
        { id: 5, name: 'Panda Express', image: '/images/restaurants/panda-express.jpg', revenue: '2,890', change: 1.2 }
      ],
      
      // Recent users
      recentUsers: [
        { 
          id: 1, 
          name: 'Alice Johnson', 
          email: 'alice@example.com', 
          avatar: '/images/avatars/avatar1.jpg', 
          joinDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        { 
          id: 2, 
          name: 'Bob Smith', 
          email: 'bob@example.com', 
          avatar: null, 
          joinDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        { 
          id: 3, 
          name: 'Carol Williams', 
          email: 'carol@example.com', 
          avatar: '/images/avatars/avatar3.jpg', 
          joinDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        { 
          id: 4, 
          name: 'Dave Miller', 
          email: 'dave@example.com', 
          avatar: null, 
          joinDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
        }
      ]
    };
  },
  methods: {
    formatDate(date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateObj = new Date(date);
      
      if (dateObj >= today) {
        // Today
        return `Today ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      } else if (dateObj >= new Date(today.getTime() - 24 * 60 * 60 * 1000)) {
        // Yesterday
        return `Yesterday ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      } else if (dateObj >= new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)) {
        // Within the last week
        return `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })} ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      } else {
        // Older
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    },
    
    getStatusColor(status) {
      const statusColors = {
        'pending': 'warning',
        'confirmed': 'info',
        'preparing': 'info',
        'ready': 'info',
        'on_the_way': 'info',
        'delivered': 'success',
        'cancelled': 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    getStatusText(status) {
      const statusTexts = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'ready': 'Ready',
        'on_the_way': 'On The Way',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
      };
      
      return statusTexts[status] || 'Unknown';
    },
    
    getInitials(name) {
      if (!name) return '?';
      
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`;
      }
      
      return name.substring(0, 2).toUpperCase();
    }
  }
};
</script>

<style scoped>
.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.text-success {
  color: #4CAF50;
}

.text-error {
  color: #F44336;
}

.chart-container {
  height: 300px;
  position: relative;
}
</style> 