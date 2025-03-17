<template>
  <div class="map-container">
    <div id="map" ref="mapContainer" style="width: 100%; height: 100%;"></div>
    
    <!-- Loading overlay -->
    <div v-if="loading" class="map-loading-overlay">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Distance and ETA info card -->
    <div v-if="showDistanceCard && !loading" class="map-info-card">
      <div class="d-flex align-center mb-1">
        <v-icon size="small" color="primary" class="mr-1">mdi-map-marker-distance</v-icon>
        <span>Distance: {{ formattedDistance }}</span>
      </div>
      <div class="d-flex align-center">
        <v-icon size="small" color="primary" class="mr-1">mdi-clock-outline</v-icon>
        <span>ETA: {{ formattedETA }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapView',
  
  props: {
    userLocation: {
      type: Object,
      required: true,
      validator: loc => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
    },
    driverLocation: {
      type: Object,
      required: false,
      default: null
    },
    restaurantLocation: {
      type: Object,
      required: false,
      default: null
    },
    orderStatus: {
      type: String,
      required: false,
      default: null
    },
    interactive: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      map: null,
      userMarker: null,
      driverMarker: null,
      restaurantMarker: null,
      driverPath: null,
      loading: true,
      routeDistanceMeters: null,
      routeETA: null,
      directionsService: null,
      directionsRenderer: null,
      markersInitialized: false
    };
  },
  
  computed: {
    mapOptions() {
      return {
        zoom: 14,
        center: this.userLocation,
        mapTypeControl: this.interactive,
        streetViewControl: this.interactive,
        fullscreenControl: this.interactive,
        zoomControl: this.interactive,
        styles: [
          // Custom map styling could be added here
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };
    },
    
    driverIcon() {
      return {
        url: '/img/driver-marker.png',
        // Fallback to material icon if image not available
        scaledSize: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 16)
      };
    },
    
    restaurantIcon() {
      return {
        url: '/img/restaurant-marker.png',
        // Fallback to material icon if image not available
        scaledSize: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
      };
    },
    
    userIcon() {
      return {
        url: '/img/user-marker.png',
        // Fallback to material icon if image not available
        scaledSize: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
      };
    },
    
    formattedDistance() {
      if (!this.routeDistanceMeters) return 'Calculating...';
      
      if (this.routeDistanceMeters < 1000) {
        return `${this.routeDistanceMeters.toFixed(0)} m`;
      } else {
        return `${(this.routeDistanceMeters / 1000).toFixed(1)} km`;
      }
    },
    
    formattedETA() {
      if (!this.routeETA) return 'Calculating...';
      
      const now = new Date();
      const eta = new Date(now.getTime() + this.routeETA * 1000);
      
      return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    showDistanceCard() {
      return this.driverLocation && this.userLocation && 
             this.orderStatus && 
             this.orderStatus !== 'delivered';
    }
  },
  
  watch: {
    driverLocation: {
      handler(newLocation) {
        if (newLocation && this.map) {
          this.updateDriverMarker();
          this.calculateRoute();
        }
      },
      deep: true
    },
    
    restaurantLocation: {
      handler(newLocation) {
        if (newLocation && this.map && !this.restaurantMarker) {
          this.createRestaurantMarker();
        }
      },
      deep: true
    },
    
    orderStatus(newStatus) {
      // Update map visuals based on order status
      if (newStatus === 'delivered') {
        // Remove route when delivered
        if (this.directionsRenderer) {
          this.directionsRenderer.setMap(null);
        }
      } else if (newStatus === 'picking_up' && this.driverLocation && this.restaurantLocation) {
        // Show route to restaurant when picking up
        this.calculateRoute(this.driverLocation, this.restaurantLocation);
      } else if (newStatus === 'on_the_way' && this.driverLocation) {
        // Show route to user when on the way
        this.calculateRoute();
      }
    }
  },
  
  mounted() {
    // Load Google Maps API
    this.initializeMap();
  },
  
  methods: {
    initializeMap() {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        this.setupMap();
      } else {
        // Google Maps API would normally be loaded via a script tag in index.html
        // For this component, we'll assume it's already available
        console.error('Google Maps API not loaded');
        this.loading = false;
      }
    },
    
    setupMap() {
      try {
        // Create the map
        this.map = new google.maps.Map(this.$refs.mapContainer, this.mapOptions);
        
        // Initialize directions services
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2196F3',
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        this.directionsRenderer.setMap(this.map);
        
        // Create markers
        this.createUserMarker();
        if (this.driverLocation) {
          this.createDriverMarker();
        }
        if (this.restaurantLocation) {
          this.createRestaurantMarker();
        }
        
        // Calculate route if driver and user locations are available
        if (this.driverLocation && this.userLocation) {
          this.calculateRoute();
        }
        
        // Fit bounds to include all markers
        this.fitMapBounds();
        
        this.markersInitialized = true;
        this.loading = false;
        
        // Add listener for when map is idle
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
          this.loading = false;
        });
      } catch (error) {
        console.error('Error setting up map:', error);
        this.loading = false;
      }
    },
    
    createUserMarker() {
      if (!this.map || !this.userLocation) return;
      
      try {
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10
        };
        
        this.userMarker = new google.maps.Marker({
          position: this.userLocation,
          map: this.map,
          icon: icon,
          title: 'Delivery Location',
          zIndex: 1
        });
      } catch (error) {
        console.error('Error creating user marker:', error);
      }
    },
    
    createDriverMarker() {
      if (!this.map || !this.driverLocation) return;
      
      try {
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#2196F3',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 8
        };
        
        this.driverMarker = new google.maps.Marker({
          position: this.driverLocation,
          map: this.map,
          icon: icon,
          title: 'Driver',
          zIndex: 2
        });
        
        // Create a motorcycle icon above the circle
        const motorcycleIcon = document.createElement('div');
        motorcycleIcon.innerHTML = '<i class="mdi mdi-motorbike" style="font-size: 20px; color: white;"></i>';
        
        // For a more advanced implementation, you could use custom overlays to create animated markers
      } catch (error) {
        console.error('Error creating driver marker:', error);
      }
    },
    
    createRestaurantMarker() {
      if (!this.map || !this.restaurantLocation) return;
      
      try {
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#F44336',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10
        };
        
        this.restaurantMarker = new google.maps.Marker({
          position: this.restaurantLocation,
          map: this.map,
          icon: icon,
          title: 'Restaurant',
          zIndex: 1
        });
      } catch (error) {
        console.error('Error creating restaurant marker:', error);
      }
    },
    
    updateDriverMarker() {
      if (!this.driverMarker) {
        this.createDriverMarker();
        return;
      }
      
      try {
        // Update marker position with animation
        this.driverMarker.setPosition(this.driverLocation);
        
        // Optionally update marker rotation based on heading
        // This would require calculating the heading from previous position
      } catch (error) {
        console.error('Error updating driver marker:', error);
      }
    },
    
    calculateRoute(origin = this.driverLocation, destination = this.userLocation) {
      if (!origin || !destination || !this.directionsService) return;
      
      try {
        this.directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
          if (status === 'OK' && response) {
            this.directionsRenderer.setDirections(response);
            
            // Extract distance and duration
            const route = response.routes[0];
            if (route && route.legs[0]) {
              this.routeDistanceMeters = route.legs[0].distance.value;
              this.routeETA = route.legs[0].duration.value;
              
              // Emit updated ETA
              this.$emit('eta-updated', {
                eta: new Date(Date.now() + (this.routeETA * 1000)),
                distance: this.routeDistanceMeters
              });
            }
          } else {
            console.error('Directions request failed:', status);
          }
        });
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    },
    
    fitMapBounds() {
      if (!this.map) return;
      
      try {
        const bounds = new google.maps.LatLngBounds();
        
        // Add markers to bounds
        if (this.userMarker) bounds.extend(this.userMarker.getPosition());
        if (this.driverMarker) bounds.extend(this.driverMarker.getPosition());
        if (this.restaurantMarker) bounds.extend(this.restaurantMarker.getPosition());
        
        // Make sure we have at least two points
        if (bounds.isEmpty() && this.userLocation) {
          bounds.extend(this.userLocation);
          // Add a small offset to create a valid bounds
          bounds.extend({
            lat: this.userLocation.lat + 0.01,
            lng: this.userLocation.lng + 0.01
          });
        }
        
        // Apply bounds with padding
        this.map.fitBounds(bounds, 50);
      } catch (error) {
        console.error('Error fitting map bounds:', error);
      }
    }
  },
  
  beforeUnmount() {
    // Clean up event listeners if necessary
  }
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.map-info-card {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: white;
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>