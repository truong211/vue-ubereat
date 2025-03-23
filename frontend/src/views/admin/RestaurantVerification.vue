<template>
  <div class="restaurant-verification-page">
    <v-app-bar elevation="1" class="mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        to="/admin/restaurants"
      ></v-btn>
      <v-app-bar-title>Restaurant Verification</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip
        :color="getStatusColor(restaurant?.status)"
        size="small"
      >
        {{ formatStatus(restaurant?.status) }}
      </v-chip>
    </v-app-bar>

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>

    <template v-else-if="restaurant">
      <!-- Restaurant Info -->
      <v-card class="mb-4">
        <v-card-text>
          <div class="d-flex align-center mb-4">
            <v-avatar size="64" class="mr-4">
              <v-img :src="restaurant.logo || '/img/restaurant-placeholder.jpg'"></v-img>
            </v-avatar>
            <div>
              <h2 class="text-h5">{{ restaurant.name }}</h2>
              <p class="text-subtitle-1">{{ restaurant.cuisine }}</p>
            </div>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-account">
                  <v-list-item-title>Owner Name</v-list-item-title>
                  <v-list-item-subtitle>{{ restaurant.ownerName }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-email">
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ restaurant.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-phone">
                  <v-list-item-title>Phone</v-list-item-title>
                  <v-list-item-subtitle>{{ restaurant.phone }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-map-marker">
                  <v-list-item-title>Address</v-list-item-title>
                  <v-list-item-subtitle>{{ restaurant.address }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-calendar">
                  <v-list-item-title>Application Date</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(restaurant.createdAt) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-clock">
                  <v-list-item-title>Operating Hours</v-list-item-title>
                  <v-list-item-subtitle>{{ formatBusinessHours(restaurant.businessHours) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-currency-usd">
                  <v-list-item-title>Price Range</v-list-item-title>
                  <v-list-item-subtitle>{{ formatPriceRange(restaurant.priceRange) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-clock-fast">
                  <v-list-item-title>Delivery Time</v-list-item-title>
                  <v-list-item-subtitle>{{ restaurant.estimatedDeliveryTime }} minutes</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Verification Process -->
      <restaurant-verification :restaurant-id="restaurantId" />
    </template>

    <div v-else class="text-center">
      <p>Restaurant not found</p>
      <v-btn color="primary" to="/admin/restaurants">Back to Restaurants</v-btn>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import RestaurantVerification from '@/components/admin/RestaurantVerification.vue'

export default {
  name: 'AdminRestaurantVerification',

  components: {
    RestaurantVerification
  },

  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    const toast = useToast()

    // State
    const loading = ref(false)
    const restaurant = ref(null)

    // Methods
    const loadRestaurant = async () => {
      loading.value = true
      try {
        const response = await store.dispatch('admin/getRestaurants', {
          id: props.restaurantId
        })
        restaurant.value = response.data.restaurants[0]
        if (!restaurant.value) {
          toast.error('Restaurant not found')
        }
      } catch (error) {
        toast.error('Failed to load restaurant')
      } finally {
        loading.value = false
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatBusinessHours = (hours) => {
      if (!hours) return 'Not specified'
      return `${hours.open} - ${hours.close}`
    }

    const formatPriceRange = (range) => {
      const symbols = {
        low: '$',
        medium: '$$',
        high: '$$$',
        luxury: '$$$$'
      }
      return symbols[range] || 'Not specified'
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }

    const formatStatus = (status) => {
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
    }

    // Initialize
    onMounted(() => {
      loadRestaurant()
    })

    return {
      loading,
      restaurant,
      formatDate,
      formatBusinessHours,
      formatPriceRange,
      getStatusColor,
      formatStatus
    }
  }
}
</script>

<style scoped>
.restaurant-verification-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
</style>