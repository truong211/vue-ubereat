<template>
  <div class="map-restaurant-view">
    <v-card v-if="showMap" class="mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span class="text-h6">Restaurants Near You</span>
          <div v-if="userLocation" class="text-caption text-medium-emphasis">
            <v-icon size="small" class="mr-1">mdi-crosshairs-gps</v-icon>
            {{ userLocation.address || 'Current Location' }}
          </div>
        </div>
        <v-btn-group>
          <v-btn
            icon="mdi-crosshairs-gps"
            variant="tonal"
            @click="getCurrentLocation"
            :loading="isGettingLocation"
            :disabled="isGettingLocation"
          ></v-btn>
          <v-btn
            :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            variant="tonal"
            @click="expanded = !expanded"
          ></v-btn>
        </v-btn-group>
      </v-card-title>

      <v-expand-transition>
        <div v-show="expanded">
          <v-card-text class="pa-0">
            <div ref="mapContainer" style="height: 400px; width: 100%;"></div>
          </v-card-text>

          <v-card-text>
            <v-slider
              v-model="searchRadius"
              :min="1"
              :max="10"
              :step="0.5"
              label="Search Radius (km)"
              thumb-label="always"
              @update:model-value="updateSearchRadius"
            >
              <template v-slot:append>
                <v-text-field
                  v-model="searchRadius"
                  type="number"
                  style="width: 70px"
                  density="compact"
                  min="1"
                  max="10"
                  step="0.5"
                  hide-details
                  @update:model-value="updateSearchRadius"
                ></v-text-field>
              </template>
            </v-slider>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet icon issue in production
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

export default {
  name: 'MapRestaurantView',
  
  props: {
    restaurants: {
      type: Array,
      required: true
    },
    initialRadius: {
      type: Number,
      default: 5 // km
    }
  },
  
  emits: ['location-updated', 'calculate-distances'],
  
  setup(props, { emit }) {
    const mapContainer = ref(null);
    const map = ref(null);
    const showMap = ref(true);
    const expanded = ref(false);
    const searchRadius = ref(props.initialRadius);
    const radiusCircle = ref(null);
    const userLocation = ref(null);
    const isGettingLocation = ref(false);
    const markers = ref({
      user: null,
      restaurants: []
    });
    
    // Initialize map
    const initializeMap = () => {
      if (!mapContainer.value) return;
      
      // Create map if it doesn't exist
      if (!map.value) {
        // Default center (can be customized based on your target audience)
        const defaultCenter = [10.7769, 106.7009]; // Ho Chi Minh City
        
        map.value = L.map(mapContainer.value, {
          center: defaultCenter,
          zoom: 12
        });
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map.value);
      }
      
      // If user location exists, center map and add marker
      if (userLocation.value) {
        const { lat, lng } = userLocation.value;
        map.value.setView([lat, lng], 13);
        
        // Add/update user marker
        if (markers.value.user) {
          markers.value.user.setLatLng([lat, lng]);
        } else {
          markers.value.user = L.marker([lat, lng])
            .addTo(map.value)
            .bindPopup('Your Location');
        }
        
        // Add/update radius circle
        const radiusInMeters = searchRadius.value * 1000; // km to meters
        if (radiusCircle.value) {
          radiusCircle.value.setLatLng([lat, lng]);
          radiusCircle.value.setRadius(radiusInMeters);
        } else {
          radiusCircle.value = L.circle([lat, lng], {
            radius: radiusInMeters,
            color: '#1976D2',
            fillColor: '#1976D2',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(map.value);
        }
      }
      
      // Add restaurant markers
      updateRestaurantMarkers();
    };
    
    // Update restaurant markers on map
    const updateRestaurantMarkers = () => {
      // Clear existing restaurant markers
      markers.value.restaurants.forEach(marker => {
        map.value.removeLayer(marker);
      });
      markers.value.restaurants = [];
      
      // Exit if no map or no user location
      if (!map.value || !userLocation.value) return;
      
      // Add new restaurant markers
      props.restaurants.forEach(restaurant => {
        if (!restaurant.latitude || !restaurant.longitude) return;
        
        const lat = parseFloat(restaurant.latitude);
        const lng = parseFloat(restaurant.longitude);
        
        // Create custom icon with restaurant name initial
        const iconHtml = `<div style="background-color: #F44336; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${restaurant.name.charAt(0)}</div>`;
        const icon = L.divIcon({
          html: iconHtml,
          className: 'restaurant-marker-icon',
          iconSize: [32, 32]
        });
        
        const marker = L.marker([lat, lng], { icon })
          .addTo(map.value)
          .bindPopup(`
            <strong>${restaurant.name}</strong><br>
            ${restaurant.distance ? `${restaurant.distance.toFixed(1)}km away<br>` : ''}
            ${restaurant.rating ? `Rating: ${restaurant.rating}★<br>` : ''}
            ${restaurant.cuisine || ''}
          `);
        
        marker.on('click', () => {
          // You could emit an event here if you want to select a restaurant on click
        });
        
        markers.value.restaurants.push(marker);
      });
      
      // Fit bounds to show all markers if we have restaurants and a user location
      if (markers.value.restaurants.length > 0 && markers.value.user) {
        const allMarkers = [
          markers.value.user,
          ...markers.value.restaurants
        ];
        const group = L.featureGroup(allMarkers);
        map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    };
    
    // Get user's current location
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by your browser');
        return;
      }
      
      isGettingLocation.value = true;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Update state with user location
            userLocation.value = { 
              lat, 
              lng,
              address: 'Your Location' // You could use reverse geocoding here to get actual address
            };
            
            // Emit event for parent component
            emit('location-updated', userLocation.value);
            
            // Initialize/update map
            initializeMap();
            
            // Calculate distances to restaurants based on user position
            emit('calculate-distances', { lat, lng });
          } catch (error) {
            console.error('Error getting location:', error);
          } finally {
            isGettingLocation.value = false;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          isGettingLocation.value = false;
        }
      );
    };
    
    // Update search radius
    const updateSearchRadius = () => {
      if (radiusCircle.value && userLocation.value) {
        radiusCircle.value.setRadius(searchRadius.value * 1000); // km to meters
      }
    };
    
    // Watch for changes to restaurants prop
    watch(() => props.restaurants, () => {
      updateRestaurantMarkers();
    }, { deep: true });
    
    // Lifecycle hooks
    onMounted(() => {
      if (mapContainer.value) {
        initializeMap();
      }
    });
    
    onUnmounted(() => {
      if (map.value) {
        map.value.remove();
        map.value = null;
      }
    });
    
    return {
      mapContainer,
      showMap,
      expanded,
      searchRadius,
      userLocation,
      isGettingLocation,
      getCurrentLocation,
      updateSearchRadius
    };
  }
};
</script>

<style scoped>
.map-restaurant-view {
  margin-bottom: 20px;
}

/* Fix for Leaflet control layers */
:deep(.leaflet-control-container .leaflet-control) {
  z-index: 800;
}

:deep(.restaurant-marker-icon) {
  background: none;
  border: none;
}
</style>