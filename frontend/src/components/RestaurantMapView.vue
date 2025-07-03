<template>
  <div class="restaurant-map-container">
    <div class="map-header d-flex align-center mb-3">
      <h3 class="text-h6">Restaurants Near You</h3>
      <v-spacer></v-spacer>
      <v-btn-toggle v-model="viewMode" mandatory class="mr-2">
        <v-btn icon="mdi-view-list" value="list" size="small"></v-btn>
        <v-btn icon="mdi-map" value="map" size="small"></v-btn>
      </v-btn-toggle>
      <v-select
        v-model="radiusFilter"
        :items="radiusOptions"
        label="Radius"
        variant="outlined"
        density="compact"
        style="max-width: 120px"
        @update:model-value="filterByRadius"
      ></v-select>
    </div>

    <!-- Map View -->
    <div v-show="viewMode === 'map'" class="map-section">
      <div ref="mapContainer" class="restaurant-map" style="height: 500px; border-radius: 8px;"></div>
      
      <!-- Restaurant Info Card Overlay -->
      <div v-if="selectedRestaurant" class="restaurant-info-overlay">
        <v-card max-width="350">
          <v-img
            :src="selectedRestaurant.image"
            height="120"
            cover
          ></v-img>
          <v-card-title class="pb-2">{{ selectedRestaurant.name }}</v-card-title>
          <v-card-text class="pt-1">
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="selectedRestaurant.rating"
                readonly
                density="compact"
                size="small"
                class="mr-2"
              ></v-rating>
              <span class="text-caption">{{ selectedRestaurant.rating }}</span>
            </div>
            <div class="restaurant-details">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2">mdi-map-marker-distance</v-icon>
                <span class="text-body-2">{{ selectedRestaurant.distance }} km away</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                <span class="text-body-2">{{ selectedRestaurant.deliveryTime }} min delivery</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-currency-usd</v-icon>
                <span class="text-body-2">{{ selectedRestaurant.priceRange }}</span>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn 
              color="primary" 
              variant="flat" 
              @click="viewRestaurant(selectedRestaurant.id)"
              block
            >
              View Menu
            </v-btn>
          </v-card-actions>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            class="close-overlay-btn"
            @click="selectedRestaurant = null"
          ></v-btn>
        </v-card>
      </div>
    </div>

    <!-- List View -->
    <div v-show="viewMode === 'list'" class="list-section">
      <v-row>
        <v-col
          v-for="restaurant in nearbyRestaurants"
          :key="restaurant.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card hover @click="selectRestaurant(restaurant)">
            <v-img
              :src="restaurant.image"
              height="150"
              cover
            ></v-img>
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <h4 class="text-subtitle-1">{{ restaurant.name }}</h4>
                <v-spacer></v-spacer>
                <v-chip size="small" color="primary">
                  {{ restaurant.rating }}
                  <v-icon size="small" class="ml-1">mdi-star</v-icon>
                </v-chip>
              </div>
              <div class="restaurant-meta">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption">
                    <v-icon size="small">mdi-map-marker-distance</v-icon>
                    {{ restaurant.distance }} km
                  </span>
                  <span class="text-caption">
                    <v-icon size="small">mdi-clock-outline</v-icon>
                    {{ restaurant.deliveryTime }} min
                  </span>
                  <span class="text-caption">{{ restaurant.priceRange }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import mapService from '@/services/map.service'

const props = defineProps({
  userLocation: {
    type: Object,
    required: true
  },
  restaurants: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['restaurant-selected', 'location-updated'])

const router = useRouter()

// Refs
const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const userMarker = ref(null)
const radiusCircle = ref(null)
const selectedRestaurant = ref(null)
const nearbyRestaurants = ref([])
const loading = ref(false)

// UI State
const viewMode = ref('map')
const radiusFilter = ref(5)
const radiusOptions = [
  { title: '1 km', value: 1 },
  { title: '3 km', value: 3 },
  { title: '5 km', value: 5 },
  { title: '10 km', value: 10 },
  { title: '15 km', value: 15 }
]

// Methods
const initializeMap = async () => {
  if (!mapContainer.value || !props.userLocation) return

  try {
    await mapService.initialize()
    
    // Create map
    map.value = new google.maps.Map(mapContainer.value, {
      zoom: 13,
      center: props.userLocation,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    // Add user location marker
    addUserMarker()
    
    // Add radius circle
    addRadiusCircle()
    
    // Calculate and display nearby restaurants
    await calculateNearbyRestaurants()
    
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

const addUserMarker = () => {
  if (!map.value || !props.userLocation) return

  userMarker.value = new google.maps.Marker({
    position: props.userLocation,
    map: map.value,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 10
    },
    title: 'Your Location'
  })
}

const addRadiusCircle = () => {
  if (!map.value || !props.userLocation) return

  radiusCircle.value = new google.maps.Circle({
    strokeColor: '#4285F4',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#4285F4',
    fillOpacity: 0.1,
    map: map.value,
    center: props.userLocation,
    radius: radiusFilter.value * 1000 // Convert km to meters
  })
}

const calculateNearbyRestaurants = async () => {
  if (!props.restaurants.length) return

  loading.value = true
  
  try {
    const restaurantsWithDistance = []
    
    // Calculate distance and delivery time for each restaurant
    for (const restaurant of props.restaurants) {
      if (!restaurant.location) continue

      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        props.userLocation.lat,
        props.userLocation.lng,
        restaurant.location.lat,
        restaurant.location.lng
      )

      // Estimate delivery time based on distance
      const deliveryTime = estimateDeliveryTime(distance)

      // Check if restaurant is within radius
      if (distance <= radiusFilter.value) {
        restaurantsWithDistance.push({
          ...restaurant,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          deliveryTime: deliveryTime
        })
      }
    }

    // Sort by distance
    restaurantsWithDistance.sort((a, b) => a.distance - b.distance)
    
    nearbyRestaurants.value = restaurantsWithDistance
    
    // Add restaurant markers to map
    addRestaurantMarkers()
    
  } catch (error) {
    console.error('Error calculating nearby restaurants:', error)
  } finally {
    loading.value = false
  }
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const estimateDeliveryTime = (distance) => {
  // Base delivery time calculation
  // Assumptions: 5 min preparation + travel time at 30 km/h average speed + 5 min buffer
  const preparationTime = 10 // minutes
  const averageSpeed = 25 // km/h in city traffic
  const travelTime = (distance / averageSpeed) * 60 // minutes
  const buffer = 5 // minutes
  
  return Math.round(preparationTime + travelTime + buffer)
}

const addRestaurantMarkers = () => {
  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  nearbyRestaurants.value.forEach(restaurant => {
    if (!restaurant.location) return

    const marker = new google.maps.Marker({
      position: restaurant.location,
      map: map.value,
      icon: {
        url: '/img/restaurant-marker.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      title: restaurant.name
    })

    // Add click listener
    marker.addListener('click', () => {
      selectRestaurant(restaurant)
    })

    markers.value.push(marker)
  })
}

const selectRestaurant = (restaurant) => {
  selectedRestaurant.value = restaurant
  
  if (map.value) {
    // Center map on selected restaurant
    map.value.panTo(restaurant.location)
    map.value.setZoom(15)
  }
  
  emit('restaurant-selected', restaurant)
}

const viewRestaurant = (restaurantId) => {
  router.push(`/restaurant/${restaurantId}`)
}

const filterByRadius = async () => {
  // Update radius circle
  if (radiusCircle.value) {
    radiusCircle.value.setRadius(radiusFilter.value * 1000)
  }
  
  // Recalculate nearby restaurants
  await calculateNearbyRestaurants()
  
  // Adjust map zoom based on radius
  const zoom = radiusFilter.value <= 1 ? 15 : 
               radiusFilter.value <= 3 ? 13 : 
               radiusFilter.value <= 5 ? 12 : 
               radiusFilter.value <= 10 ? 11 : 10
  
  if (map.value) {
    map.value.setZoom(zoom)
  }
}

// Watchers
watch(() => props.userLocation, async (newLocation) => {
  if (newLocation && map.value) {
    // Update user marker
    if (userMarker.value) {
      userMarker.value.setPosition(newLocation)
    }
    
    // Update radius circle
    if (radiusCircle.value) {
      radiusCircle.value.setCenter(newLocation)
    }
    
    // Recalculate restaurants
    await calculateNearbyRestaurants()
    
    // Center map on new location
    map.value.setCenter(newLocation)
  }
}, { deep: true })

watch(() => props.restaurants, async () => {
  if (props.restaurants.length) {
    await calculateNearbyRestaurants()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  initializeMap()
})
</script>

<style scoped>
.restaurant-map-container {
  position: relative;
}

.restaurant-map {
  width: 100%;
  border: 1px solid #e0e0e0;
}

.restaurant-info-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  max-width: 350px;
}

.close-overlay-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 15;
}

.restaurant-details {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.restaurant-meta {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}
</style>