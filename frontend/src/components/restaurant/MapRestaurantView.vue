<template>
  <div class="map-view-container">
    <!-- Map Toggle Button -->
    <div class="map-toggle">
      <v-btn
        :color="showMap ? 'primary' : ''"
        @click="toggleMap"
        icon="mdi-map"
        :variant="showMap ? 'flat' : 'outlined'"
      ></v-btn>
    </div>
    
    <v-expand-transition>
      <div v-if="showMap" class="map-container mb-4">
        <v-card height="400px" class="map-card">
          <div ref="mapElement" class="map-element"></div>
          <div class="map-overlay">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-crosshairs-gps"
              @click="centerToUserLocation"
              :loading="locating"
            >
              Use my location
            </v-btn>
          </div>
          <div v-if="selectedRestaurant" class="restaurant-info-overlay">
            <v-card class="restaurant-card">
              <v-img
                :src="selectedRestaurant.image_url || '/img/icons/restaurant-placeholder.jpg'"
                height="80"
                cover
                class="restaurant-image"
              ></v-img>
              <v-card-title class="pt-2 pb-0">
                {{ selectedRestaurant.name }}
              </v-card-title>
              <v-card-subtitle class="pb-1 d-flex align-center">
                <v-rating
                  :model-value="selectedRestaurant.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="x-small"
                ></v-rating>
                <span class="ml-1 text-caption">{{ selectedRestaurant.rating.toFixed(1) }}</span>
                <v-spacer></v-spacer>
                <span class="text-caption">{{ formatDistance(selectedRestaurant.distance) }}</span>
              </v-card-subtitle>
              <v-card-actions class="pt-0">
                <v-spacer></v-spacer>
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  @click="viewRestaurant(selectedRestaurant.id)"
                >
                  View Menu
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-card>
      </div>
    </v-expand-transition>
  </div>
</template>

<script>
import { useMapService } from '@/composables/useMapService';
import { useToast } from '@/composables/useToast';

export default {
  name: 'MapRestaurantView',
  
  props: {
    restaurants: {
      type: Array,
      required: true
    }
  },
  
  data() {
    return {
      showMap: false,
      map: null,
      markers: [],
      selectedRestaurant: null,
      userLocation: null,
      locating: false
    };
  },
  
  setup() {
    const {
      initMap,
      addMarker,
      fitMapBounds,
      getCurrentPosition
    } = useMapService();
    
    const { showError } = useToast();
    
    return {
      initMap,
      addMarker,
      fitMapBounds,
      getCurrentPosition,
      showError
    };
  },
  
  watch: {
    restaurants: {
      handler(newRestaurants) {
        this.updateMarkers(newRestaurants);
      },
      deep: true
    },
    
    showMap(newValue) {
      if (newValue && !this.map && this.$refs.mapElement) {
        this.$nextTick(() => {
          this.initializeMap();
        });
      }
    }
  },
  
  methods: {
    toggleMap() {
      this.showMap = !this.showMap;
      this.$emit('map-toggled', this.showMap);
    },
    
    async initializeMap() {
      if (!this.$refs.mapElement) return;
      
      try {
        // Default center - can be configured to user's city or country default
        const center = { lat: 10.8231, lng: 106.6297 }; // Ho Chi Minh City
        
        this.map = await this.initMap(this.$refs.mapElement, {
          zoom: 13,
          center
        });
        
        // Add markers for all restaurants
        this.updateMarkers(this.restaurants);
        
        // Try to get user location
        this.centerToUserLocation();
      } catch (error) {
        console.error('Error initializing map:', error);
        this.showError('Could not initialize map. Please try again later.');
      }
    },
    
    updateMarkers(restaurants) {
      if (!this.map) return;
      
      // Clear existing markers
      this.markers.forEach(marker => {
        marker.setMap(null);
      });
      this.markers = [];
      
      // Add new markers
      restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const marker = this.addMarker(
            this.map,
            {
              lat: parseFloat(restaurant.latitude),
              lng: parseFloat(restaurant.longitude)
            },
            {
              title: restaurant.name,
              icon: 'restaurant'
            }
          );
          
          // Add click listener to show info window
          marker.addListener('click', () => {
            this.selectRestaurant(restaurant);
          });
          
          this.markers.push(marker);
        }
      });
      
      // Fit map to show all markers
      if (this.markers.length > 0) {
        this.fitMapBounds(this.map, this.markers);
      }
    },
    
    selectRestaurant(restaurant) {
      this.selectedRestaurant = restaurant;
    },
    
    viewRestaurant(id) {
      this.$router.push({ name: 'RestaurantDetail', params: { id } });
    },
    
    async centerToUserLocation() {
      try {
        this.locating = true;
        const position = await this.getCurrentPosition();
        this.userLocation = position;
        
        // Update map center to user location
        if (this.map) {
          this.map.setCenter(position);
          this.map.setZoom(14);
          
          // Add a marker for the user's location if not already added
          const userMarker = this.addMarker(
            this.map,
            position,
            {
              title: 'Your Location',
              icon: 'user'
            }
          );
          
          // Calculate distance for each restaurant
          this.updateRestaurantDistances(position);
          
          // Notify parent about user location update
          this.$emit('location-updated', position);
        }
      } catch (error) {
        console.error('Error getting user location:', error);
        this.showError('Could not access your location. Please check your browser settings.');
      } finally {
        this.locating = false;
      }
    },
    
    updateRestaurantDistances(userPosition) {
      // This would typically be handled by the store or parent component
      // But we'll emit an event to notify the parent
      this.$emit('calculate-distances', userPosition);
    },
    
    formatDistance(distance) {
      if (!distance) return 'Distance unknown';
      
      if (distance < 1) {
        // Convert to meters if less than 1km
        return `${Math.round(distance * 1000)}m away`;
      }
      
      return `${distance.toFixed(1)}km away`;
    }
  }
};
</script>

<style scoped>
.map-view-container {
  position: relative;
}

.map-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.map-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.map-card {
  position: relative;
}

.map-element {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
}

.restaurant-info-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 1;
}

.restaurant-card {
  max-width: 300px;
  margin: 0 auto;
}

.restaurant-image {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
</style>