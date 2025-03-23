<template>
  <div class="restaurant-map">
    <div id="map-container" ref="mapContainer"></div>

    <!-- Selected Restaurant Info -->
    <v-card
      v-if="selectedRestaurant"
      class="selected-restaurant-info"
      elevation="4"
    >
      <v-card-text>
        <div class="d-flex align-center">
          <v-avatar size="48" class="mr-3">
            <v-img :src="selectedRestaurant.image" cover></v-img>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ selectedRestaurant.name }}</div>
            <div class="d-flex align-center text-body-2">
              <v-rating
                :model-value="selectedRestaurant.rating"
                density="compact"
                size="small"
                readonly
                half-increments
              ></v-rating>
              <span class="ml-1">({{ selectedRestaurant.reviewCount }})</span>
            </div>
          </div>
        </div>

        <div class="mt-2">
          <div class="text-body-2">{{ selectedRestaurant.address }}</div>
          <div class="d-flex align-center text-body-2 mt-1">
            <v-icon size="small" color="primary">mdi-map-marker</v-icon>
            <span class="ml-1">{{ formatDistance(selectedRestaurant.distance) }}</span>
            <v-divider vertical class="mx-2"></v-divider>
            <v-icon size="small" color="primary">mdi-clock-outline</v-icon>
            <span class="ml-1">{{ selectedRestaurant.deliveryTime }} min</span>
          </div>
        </div>

        <v-btn
          block
          color="primary"
          class="mt-3"
          :to="{ name: 'RestaurantDetail', params: { id: selectedRestaurant.id }}"
        >
          View Restaurant
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapService } from '@/composables/useMapService'

export default {
  name: 'RestaurantMap',

  props: {
    restaurants: {
      type: Array,
      required: true
    },
    selectedRestaurant: {
      type: Object,
      default: null
    },
    initialCenter: {
      type: Object,
      default: () => ({ lat: 10.7769, lng: 106.7009 }) // Ho Chi Minh City
    },
    initialZoom: {
      type: Number,
      default: 13
    }
  },

  emits: ['restaurant-clicked'],

  setup(props, { emit }) {
    const { formatDistance } = useMapService()
    const mapContainer = ref(null)
    const map = ref(null)
    const markers = ref([])
    const selectedMarker = ref(null)

    const initializeMap = () => {
      // Create map instance
      map.value = L.map(mapContainer.value).setView(
        [props.initialCenter.lat, props.initialCenter.lng],
        props.initialZoom
      )

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map.value)

      // Add restaurants markers
      updateMarkers()
    }

    const updateMarkers = () => {
      // Clear existing markers
      markers.value.forEach(marker => marker.remove())
      markers.value = []

      // Add new markers
      props.restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const marker = L.marker([restaurant.latitude, restaurant.longitude], {
            icon: createCustomIcon(restaurant)
          })
            .addTo(map.value)
            .on('click', () => handleMarkerClick(restaurant, marker))

          markers.value.push(marker)
        }
      })

      // Fit bounds to show all markers
      if (markers.value.length > 0) {
        const group = L.featureGroup(markers.value)
        map.value.fitBounds(group.getBounds(), { padding: [50, 50] })
      }
    }

    const createCustomIcon = (restaurant) => {
      const isSelected = props.selectedRestaurant?.id === restaurant.id

      return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-content ${isSelected ? 'selected' : ''}">
                <i class="v-icon mdi mdi-store"></i>
                ${restaurant.deliveryFee === 0 ? '<span class="free-badge">Free</span>' : ''}
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }

    const handleMarkerClick = (restaurant, marker) => {
      // Remove previous selection
      if (selectedMarker.value) {
        selectedMarker.value.getElement().classList.remove('selected')
      }

      // Update selection
      selectedMarker.value = marker
      marker.getElement().classList.add('selected')

      emit('restaurant-clicked', restaurant)
    }

    // Watch for restaurant changes
    watch(() => props.restaurants, updateMarkers, { deep: true })

    // Watch for selected restaurant changes
    watch(() => props.selectedRestaurant, () => {
      markers.value.forEach(marker => {
        const markerElement = marker.getElement()
        if (markerElement) {
          markerElement.classList.remove('selected')
          if (props.selectedRestaurant && 
              marker.getLatLng().lat === props.selectedRestaurant.latitude &&
              marker.getLatLng().lng === props.selectedRestaurant.longitude) {
            markerElement.classList.add('selected')
          }
        }
      })
    })

    // Lifecycle hooks
    onMounted(() => {
      initializeMap()
    })

    onUnmounted(() => {
      if (map.value) {
        map.value.remove()
      }
    })

    return {
      mapContainer,
      formatDistance
    }
  }
}
</script>

<style scoped>
.restaurant-map {
  position: relative;
  width: 100%;
  height: 100%;
}

#map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.selected-restaurant-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 300px;
  z-index: 1000;
}

:deep(.custom-marker) {
  background: none;
  border: none;
}

:deep(.marker-content) {
  width: 40px;
  height: 40px;
  background-color: var(--v-primary-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  position: relative;
}

:deep(.marker-content.selected) {
  transform: scale(1.2);
  background-color: var(--v-secondary-base);
}

:deep(.marker-content:hover) {
  transform: scale(1.1);
}

:deep(.marker-content .free-badge) {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: var(--v-success-base);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}
</style>