<template>
  <div class="restaurant-locator">
    <!-- Location Input Section -->
    <v-card class="mb-4">
      <v-card-title>Find Restaurants Near You</v-card-title>
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="locationInput"
              label="Enter your address"
              outlined
              dense
              :loading="isGeocodingLoading"
              :error="!!geocodingError"
              :error-messages="geocodingError"
              @keyup.enter="searchLocation"
            >
              <template v-slot:append>
                <v-btn
                  color="primary"
                  icon
                  @click="getCurrentLocation"
                  :loading="isGettingCurrentLocation"
                >
                  <v-icon>mdi-crosshairs-gps</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn
              color="primary"
              block
              @click="searchLocation"
              :loading="isGeocodingLoading"
            >
              Search
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Map Display -->
    <v-card v-if="userLocation" class="mb-4">
      <v-card-text class="pa-0">
        <div ref="mapContainer" style="height: 300px; width: 100%;"></div>
      </v-card-text>
    </v-card>
    
    <!-- Nearby Restaurants -->
    <v-card v-if="nearbyRestaurants.length">
      <v-card-title>Restaurants Near You</v-card-title>
      
      <v-card-text class="pa-0">
        <v-list>
          <v-list-item
            v-for="restaurant in nearbyRestaurants"
            :key="restaurant.id"
            :to="`/restaurant/${restaurant.id}`"
          >
            <v-list-item-avatar size="60" rounded>
              <v-img :src="restaurant.image || '/img/placeholder.jpg'" cover></v-img>
            </v-list-item-avatar>
            
            <v-list-item-content>
              <v-list-item-title class="text-h6">{{ restaurant.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <div class="d-flex align-center">
                  <v-rating
                    :model-value="restaurant.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                    half-increments
                  ></v-rating>
                  <span class="ml-1 text-caption">({{ restaurant.reviewCount }})</span>
                </div>
              </v-list-item-subtitle>
              <v-list-item-subtitle class="mt-1">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ restaurant.distance.toFixed(1) }} miles away
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <v-alert
      v-else-if="userLocation && !isLoading"
      type="info"
      class="mt-4"
    >
      No restaurants found in your area.
    </v-alert>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'RestaurantLocator',
  
  props: {
    initialRadius: {
      type: Number,
      default: 5 // miles
    }
  },
  
  setup(props) {
    const mapContainer = ref(null);
    const map = ref(null);
    const userLocation = ref(null);
    const locationInput = ref('');
    const isGeocodingLoading = ref(false);
    const isGettingCurrentLocation = ref(false);
    const geocodingError = ref('');
    const searchRadius = ref(props.initialRadius);
    const markers = ref({
      user: null,
      restaurants: []
    });
    const radiusCircle = ref(null);
    const isLoading = ref(false);
    const nearbyRestaurants = ref([]);
    
    // Initialize map
    onMounted(() => {
      if (mapContainer.value) {
        initializeMap();
      }
    });
    
    // Clean up on unmount
    onUnmounted(() => {
      if (map.value) {
        map.value.remove();
        map.value = null;
      }
    });
    
    // Initialize map
    const initializeMap = () => {
      // Create map if it doesn't exist
      if (!map.value) {
        // Default center (NYC)
        const defaultCenter = [40.7128, -74.0060];
        
        map.value = L.map(mapContainer.value, {
          center: defaultCenter,
          zoom: 12
        });
        
        // Add tile layer
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
        const radiusInMeters = searchRadius.value * 1609.34; // miles to meters
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
    };
    
    // Update restaurant markers on map
    const updateRestaurantMarkers = () => {
      // Clear existing restaurant markers
      markers.value.restaurants.forEach(marker => {
        map.value.removeLayer(marker);
      });
      markers.value.restaurants = [];
      
      // Add new restaurant markers
      nearbyRestaurants.value.forEach(restaurant => {
        const marker = L.marker([restaurant.lat, restaurant.lng])
          .addTo(map.value)
          .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.distance.toFixed(1)} miles away`);
        
        markers.value.restaurants.push(marker);
      });
      
      // Fit bounds to show all markers
      if (markers.value.restaurants.length > 0) {
        const group = L.featureGroup([
          markers.value.user,
          ...markers.value.restaurants
        ]);
        map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    };
    
    // Search for restaurants near a location
    const searchNearbyRestaurants = async () => {
      if (!userLocation.value) return;
      
      isLoading.value = true;
      
      try {
        // For demo, generate mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // simulate API delay
        
        nearbyRestaurants.value = generateMockRestaurants(
          userLocation.value.lat,
          userLocation.value.lng,
          searchRadius.value
        );
        
        // Update map with restaurant markers
        updateRestaurantMarkers();
      } catch (error) {
        console.error('Error fetching nearby restaurants:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    // Get geocoding from address string
    const searchLocation = async () => {
      if (!locationInput.value.trim()) return;
      
      isGeocodingLoading.value = true;
      geocodingError.value = '';
      
      try {
        // For demo, simulate with random coordinates near NYC
        await new Promise(resolve => setTimeout(resolve, 800)); // simulate API delay
        
        // Center around NYC with some randomness
        const lat = 40.7128 + (Math.random() * 0.1 - 0.05);
        const lng = -74.0060 + (Math.random() * 0.1 - 0.05);
        
        // Update user location
        userLocation.value = { lat, lng, address: locationInput.value };
        
        // Update map
        initializeMap();
        
        // Search for restaurants
        searchNearbyRestaurants();
        
      } catch (error) {
        console.error('Geocoding error:', error);
        geocodingError.value = 'Could not find this location. Please try a different address.';
      } finally {
        isGeocodingLoading.value = false;
      }
    };
    
    // Get current location using browser geolocation
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        geocodingError.value = 'Geolocation is not supported by your browser';
        return;
      }
      
      isGettingCurrentLocation.value = true;
      geocodingError.value = '';
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // For demo, simulate address
            await new Promise(resolve => setTimeout(resolve, 500));
            const address = 'Your Current Location';
            
            // Update state
            userLocation.value = { lat, lng, address };
            locationInput.value = address;
            
            // Update map
            initializeMap();
            
            // Search for restaurants
            searchNearbyRestaurants();
          } catch (error) {
            console.error('Error in reverse geocoding:', error);
            geocodingError.value = 'Could not determine your address';
          } finally {
            isGettingCurrentLocation.value = false;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          geocodingError.value = 'Unable to get your location. Please enter an address.';
          isGettingCurrentLocation.value = false;
        }
      );
    };
    
    // Generate mock restaurant data
    const generateMockRestaurants = (centerLat, centerLng, radius) => {
      const numRestaurants = 5 + Math.floor(Math.random() * 5); // 5-9 restaurants
      const restaurants = [];
      
      const restaurantTypes = [
        'Italian', 'Chinese', 'Mexican', 'Japanese', 'Thai'
      ];
      
      for (let i = 0; i < numRestaurants; i++) {
        // Random location within radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius; // in miles
        
        // Convert distance to lat/lng offset (approximate)
        const latOffset = distance * Math.cos(angle) * 0.015;
        const lngOffset = distance * Math.sin(angle) * 0.015;
        
        const lat = centerLat + latOffset;
        const lng = centerLng + lngOffset;
        
        // Calculate actual distance (approximate)
        const actualDistance = calculateDistance(
          centerLat, centerLng,
          lat, lng
        );
        
        restaurants.push({
          id: 1000 + i,
          name: `${restaurantTypes[i % restaurantTypes.length]} Restaurant ${i+1}`,
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: Math.floor(10 + Math.random() * 90),
          distance: actualDistance,
          lat: lat,
          lng: lng
        });
      }
      
      return restaurants;
    };
    
    // Calculate distance between two points (haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8; // Earth's radius in miles
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Convert degrees to radians
    const toRad = (degrees) => {
      return degrees * Math.PI / 180;
    };
    
    return {
      mapContainer,
      userLocation,
      locationInput,
      isGeocodingLoading,
      isGettingCurrentLocation,
      geocodingError,
      nearbyRestaurants,
      isLoading,
      searchLocation,
      getCurrentLocation
    };
  }
};
</script>

<style scoped>
/* Ensure Leaflet map displays properly */
:deep(.leaflet-control-container) {
  position: absolute;
  z-index: 1000;
}
</style> 