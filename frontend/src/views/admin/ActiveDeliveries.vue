<template>
  <div class="active-deliveries-container">
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h5 font-weight-bold">Active Deliveries</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Monitor and manage ongoing deliveries
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="refreshDeliveries">
          Refresh
        </v-btn>
      </v-card-title>
    </v-card>

    <!-- Filter Options -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Delivery Status"
              clearable
              hide-details
              density="comfortable"
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              hide-details
              density="comfortable"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.sortBy"
              :items="sortOptions"
              label="Sort By"
              hide-details
              density="comfortable"
              variant="outlined"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-overlay v-model="loading" class="d-flex align-center justify-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
      <v-btn class="ml-2" variant="text" @click="fetchDeliveries">Retry</v-btn>
    </v-alert>

    <!-- Active Deliveries Map -->
    <v-card class="mb-4">
      <v-card-title>Delivery Map</v-card-title>
      <v-card-text class="pa-0">
        <div class="delivery-map" style="height: 400px; background-color: #f5f5f5;">
          <!-- Map will be implemented here -->
          <div class="d-flex justify-center align-center" style="height: 100%;">
            <v-icon size="64" color="grey-lighten-2">mdi-map</v-icon>
            <p class="text-h6 ms-4 text-grey">Map view will be available here</p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Delivery List -->
    <v-card>
      <v-card-title>Active Deliveries</v-card-title>
      <v-card-text class="pa-0">
        <v-data-table
          :items="filteredDeliveries"
          :headers="headers"
          :loading="loading"
          :items-per-page="10"
          class="elevation-0"
        >
          <!-- Status column -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              text-color="white"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <!-- Driver column -->
          <template v-slot:item.driver="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-2">
                <v-img
                  :src="item.driver.photo || '/images/default-avatar.png'"
                  alt="Driver Photo"
                ></v-img>
              </v-avatar>
              {{ item.driver.name }}
            </div>
          </template>

          <!-- ETA column -->
          <template v-slot:item.eta="{ item }">
            <span :class="isLate(item) ? 'text-error' : ''">
              {{ formatTime(item.eta) }}
            </span>
          </template>

          <!-- Actions column -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="viewDelivery(item)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small" 
              variant="text"
              color="info"
              @click="contactDriver(item)"
            >
              <v-icon>mdi-phone</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="warning"
              @click="reassignDelivery(item)"
            >
              <v-icon>mdi-account-switch</v-icon>
            </v-btn>
          </template>

          <!-- Empty state -->
          <template v-slot:no-data>
            <div class="d-flex flex-column align-center pa-6">
              <v-icon size="64" color="grey-lighten-2">mdi-truck-delivery</v-icon>
              <p class="text-h6 mt-4">No active deliveries found</p>
              <p class="text-body-2 text-medium-emphasis text-center">
                There are currently no active deliveries matching your filters
              </p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Delivery Detail Dialog -->
    <v-dialog v-model="dialogs.detail" max-width="700">
      <v-card v-if="selectedDelivery">
        <v-card-title class="bg-primary text-white">
          Delivery Details
          <v-spacer></v-spacer>
          <v-btn icon variant="text" color="white" @click="dialogs.detail = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex mb-4">
            <div>
              <div class="text-subtitle-1 font-weight-bold">Order #{{ selectedDelivery.orderId }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatDateTime(selectedDelivery.createdAt) }}</div>
            </div>
            <v-spacer></v-spacer>
            <v-chip
              :color="getStatusColor(selectedDelivery.status)"
              text-color="white"
            >
              {{ selectedDelivery.status }}
            </v-chip>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="d-flex mb-4">
            <v-avatar size="48" class="mr-3">
              <v-img
                :src="selectedDelivery.driver?.photo || '/images/default-avatar.png'"
                alt="Driver Photo"
              ></v-img>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ selectedDelivery.driver?.name }}</div>
              <div class="text-caption text-medium-emphasis">Driver</div>
              <div class="d-flex mt-1">
                <v-btn size="small" variant="text" color="primary" class="mr-2">
                  <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                  Call
                </v-btn>
                <v-btn size="small" variant="text" color="primary">
                  <v-icon size="small" class="mr-1">mdi-message</v-icon>
                  Message
                </v-btn>
              </div>
            </div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="mb-4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Delivery Timeline</div>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="(event, index) in selectedDelivery.events"
                :key="index"
                :dot-color="getEventColor(event.type)"
                size="small"
              >
                <div class="d-flex justify-space-between">
                  <div class="text-body-2">{{ event.description }}</div>
                  <div class="text-caption text-medium-emphasis">{{ formatTime(event.timestamp) }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="mb-4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Route Information</div>
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-store</v-icon>
              <div>
                <div class="text-body-2">{{ selectedDelivery.restaurant?.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ selectedDelivery.restaurant?.address }}</div>
              </div>
            </div>
            <v-icon color="grey" class="ml-4 my-1">mdi-arrow-down</v-icon>
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-map-marker</v-icon>
              <div>
                <div class="text-body-2">{{ selectedDelivery.customer?.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ selectedDelivery.deliveryAddress }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="dialogs.detail = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reassign Dialog -->
    <v-dialog v-model="dialogs.reassign" max-width="500">
      <v-card>
        <v-card-title>Reassign Delivery</v-card-title>
        <v-card-text>
          <p class="mb-4">Select a new driver for this delivery:</p>
          <v-select
            v-model="reassignDriverId"
            :items="availableDrivers"
            item-title="name"
            item-value="id"
            label="Select Driver"
            variant="outlined"
            return-object
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar size="32">
                    <v-img :src="item.raw.photo || '/images/default-avatar.png'"></v-img>
                  </v-avatar>
                </template>
                <div class="d-flex align-center">
                  <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                </div>
                <template v-slot:append>
                  <v-chip size="small" color="success" v-if="item.raw.available">Available</v-chip>
                  <v-chip size="small" color="warning" v-else>{{ item.raw.deliveries }} orders</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.reassign = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmReassign" :disabled="!reassignDriverId">Reassign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';

export default {
  name: 'ActiveDeliveries',

  setup() {
    const toast = useToast();
    const loading = ref(false);
    const error = ref(null);
    const deliveries = ref([]);
    const selectedDelivery = ref(null);
    const reassignDriverId = ref(null);

    // Filter and sort state
    const filters = reactive({
      status: null,
      search: '',
      sortBy: 'newest'
    });

    // Dialog states
    const dialogs = reactive({
      detail: false,
      reassign: false
    });

    // Table headers
    const headers = [
      { title: 'Order ID', key: 'orderId', sortable: true },
      { title: 'Restaurant', key: 'restaurant.name', sortable: true },
      { title: 'Customer', key: 'customer.name', sortable: true },
      { title: 'Driver', key: 'driver', sortable: false },
      { title: 'Pickup Time', key: 'pickupTime', sortable: true },
      { title: 'ETA', key: 'eta', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ];

    // Filter options
    const statusOptions = [
      { title: 'Assigned', value: 'assigned' },
      { title: 'Picked Up', value: 'picked_up' },
      { title: 'On The Way', value: 'on_the_way' },
      { title: 'Arriving', value: 'arriving' },
      { title: 'Delivered', value: 'delivered' },
      { title: 'Delayed', value: 'delayed' }
    ];

    const sortOptions = [
      { title: 'Newest First', value: 'newest' },
      { title: 'Oldest First', value: 'oldest' },
      { title: 'ETA (Soonest)', value: 'eta_asc' },
      { title: 'ETA (Latest)', value: 'eta_desc' }
    ];

    // Available drivers for reassignment
    const availableDrivers = ref([
      { id: 1, name: 'John Smith', photo: '/images/driver1.jpg', available: true, deliveries: 0 },
      { id: 2, name: 'Sarah Johnson', photo: '/images/driver2.jpg', available: false, deliveries: 2 },
      { id: 3, name: 'Michael Brown', photo: '/images/driver3.jpg', available: true, deliveries: 0 },
      { id: 4, name: 'Jessica Williams', photo: '/images/driver4.jpg', available: false, deliveries: 1 }
    ]);

    // Sample data - in a real app this would come from an API
    const mockDeliveries = [
      {
        id: 1,
        orderId: 'ORD-10042',
        restaurant: { 
          id: 101, 
          name: 'Burger Palace', 
          address: '123 Main St, San Francisco, CA' 
        },
        customer: { 
          id: 201, 
          name: 'Alex Johnson', 
          phone: '+1-555-123-4567' 
        },
        driver: { 
          id: 2, 
          name: 'Sarah Johnson', 
          photo: '/images/driver2.jpg', 
          phone: '+1-555-987-6543' 
        },
        status: 'on_the_way',
        pickupTime: new Date(Date.now() - 1800000), // 30 minutes ago
        eta: new Date(Date.now() + 1200000), // 20 minutes from now
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        deliveryAddress: '456 Oak Ave, Apt 7B, San Francisco, CA',
        events: [
          { type: 'order_placed', description: 'Order placed', timestamp: new Date(Date.now() - 3600000) },
          { type: 'driver_assigned', description: 'Driver assigned', timestamp: new Date(Date.now() - 3000000) },
          { type: 'arrived_restaurant', description: 'Driver arrived at restaurant', timestamp: new Date(Date.now() - 2400000) },
          { type: 'order_pickup', description: 'Order picked up', timestamp: new Date(Date.now() - 1800000) },
          { type: 'on_the_way', description: 'Driver on the way', timestamp: new Date(Date.now() - 1500000) }
        ]
      },
      {
        id: 2,
        orderId: 'ORD-10043',
        restaurant: { 
          id: 102, 
          name: 'Pizza Heaven', 
          address: '789 Market St, San Francisco, CA' 
        },
        customer: { 
          id: 202, 
          name: 'Chris Smith', 
          phone: '+1-555-222-3333' 
        },
        driver: { 
          id: 4, 
          name: 'Jessica Williams', 
          photo: '/images/driver4.jpg', 
          phone: '+1-555-444-5555' 
        },
        status: 'assigned',
        pickupTime: null, // Not picked up yet
        eta: new Date(Date.now() + 2400000), // 40 minutes from now
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        deliveryAddress: '101 Pine St, San Francisco, CA',
        events: [
          { type: 'order_placed', description: 'Order placed', timestamp: new Date(Date.now() - 1800000) },
          { type: 'driver_assigned', description: 'Driver assigned', timestamp: new Date(Date.now() - 1200000) }
        ]
      },
      {
        id: 3,
        orderId: 'ORD-10041',
        restaurant: { 
          id: 103, 
          name: 'Sushi Express', 
          address: '555 Howard St, San Francisco, CA' 
        },
        customer: { 
          id: 203, 
          name: 'Taylor Wilson', 
          phone: '+1-555-666-7777' 
        },
        driver: { 
          id: 2, 
          name: 'Sarah Johnson', 
          photo: '/images/driver2.jpg', 
          phone: '+1-555-987-6543' 
        },
        status: 'delayed',
        pickupTime: new Date(Date.now() - 3600000), // 1 hour ago
        eta: new Date(Date.now() - 900000), // 15 minutes ago (delayed)
        createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
        deliveryAddress: '222 Folsom St, San Francisco, CA',
        events: [
          { type: 'order_placed', description: 'Order placed', timestamp: new Date(Date.now() - 5400000) },
          { type: 'driver_assigned', description: 'Driver assigned', timestamp: new Date(Date.now() - 4800000) },
          { type: 'arrived_restaurant', description: 'Driver arrived at restaurant', timestamp: new Date(Date.now() - 4200000) },
          { type: 'order_pickup', description: 'Order picked up', timestamp: new Date(Date.now() - 3600000) },
          { type: 'on_the_way', description: 'Driver on the way', timestamp: new Date(Date.now() - 3000000) },
          { type: 'delayed', description: 'Delivery delayed due to traffic', timestamp: new Date(Date.now() - 1200000) }
        ]
      }
    ];

    // Filtered deliveries based on search and filters
    const filteredDeliveries = computed(() => {
      let filtered = [...deliveries.value];

      // Apply status filter
      if (filters.status) {
        filtered = filtered.filter(d => d.status === filters.status);
      }

      // Apply search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(d => 
          d.orderId.toLowerCase().includes(search) ||
          d.restaurant.name.toLowerCase().includes(search) ||
          d.customer.name.toLowerCase().includes(search) ||
          d.driver.name.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'eta_asc':
          filtered.sort((a, b) => new Date(a.eta) - new Date(b.eta));
          break;
        case 'eta_desc':
          filtered.sort((a, b) => new Date(b.eta) - new Date(a.eta));
          break;
      }

      return filtered;
    });

    // Fetch deliveries from the server
    const fetchDeliveries = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // In a real app, this would be an API call
        // const response = await axios.get('/api/admin/deliveries');
        // deliveries.value = response.data.data;
        
        // For now, use mock data and add a delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        deliveries.value = mockDeliveries;
      } catch (err) {
        console.error('Error fetching deliveries:', err);
        error.value = 'Failed to load deliveries. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Refresh the deliveries list
    const refreshDeliveries = () => {
      fetchDeliveries();
      toast.info('Delivery list refreshed');
    };

    // View delivery details
    const viewDelivery = (delivery) => {
      selectedDelivery.value = delivery;
      dialogs.detail = true;
    };

    // Contact a driver
    const contactDriver = (delivery) => {
      // In a real app, this might open a chat window or dial a phone number
      toast.info(`Contacting driver: ${delivery.driver.name}`);
    };

    // Open the reassign dialog
    const reassignDelivery = (delivery) => {
      selectedDelivery.value = delivery;
      reassignDriverId.value = null;
      dialogs.reassign = true;
    };

    // Confirm driver reassignment
    const confirmReassign = async () => {
      try {
        if (!reassignDriverId.value || !selectedDelivery.value) {
          return;
        }

        // In a real app, this would be an API call
        // await axios.post(`/api/admin/deliveries/${selectedDelivery.value.id}/reassign`, {
        //   driverId: reassignDriverId.value.id
        // });

        // For now, just update the local state and show a success message
        toast.success(`Delivery reassigned to ${reassignDriverId.value.name}`);
        dialogs.reassign = false;
        
        // Refresh the list
        fetchDeliveries();
      } catch (err) {
        console.error('Error reassigning delivery:', err);
        toast.error('Failed to reassign delivery. Please try again.');
      }
    };

    // Helper functions
    const formatTime = (timestamp) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (timestamp) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    const getStatusColor = (status) => {
      if (!status) return 'grey';
      
      const colors = {
        'assigned': 'blue',
        'picked_up': 'purple',
        'on_the_way': 'amber',
        'arriving': 'green-darken-1',
        'delivered': 'success',
        'delayed': 'error'
      };
      
      return colors[status] || 'grey';
    };

    const getEventColor = (type) => {
      if (!type) return 'grey';
      
      const colors = {
        'order_placed': 'blue',
        'driver_assigned': 'indigo',
        'arrived_restaurant': 'deep-purple',
        'order_pickup': 'purple',
        'on_the_way': 'amber',
        'arriving': 'green-darken-1',
        'delivered': 'success',
        'delayed': 'error',
        'cancelled': 'error'
      };
      
      return colors[type] || 'grey';
    };

    const isLate = (delivery) => {
      if (!delivery.eta) return false;
      return new Date(delivery.eta) < new Date();
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchDeliveries();
    });

    return {
      loading,
      error,
      deliveries,
      filteredDeliveries,
      selectedDelivery,
      reassignDriverId,
      availableDrivers,
      filters,
      dialogs,
      headers,
      statusOptions,
      sortOptions,
      fetchDeliveries,
      refreshDeliveries,
      viewDelivery,
      contactDriver,
      reassignDelivery,
      confirmReassign,
      formatTime,
      formatDateTime,
      getStatusColor,
      getEventColor,
      isLate
    };
  }
};
</script>

<style scoped>
.active-deliveries-container {
  padding: 16px;
}

.delivery-map {
  border-radius: 4px;
  overflow: hidden;
}

.v-timeline {
  max-height: 250px;
  overflow-y: auto;
}
</style> 