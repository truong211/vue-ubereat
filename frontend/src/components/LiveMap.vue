<template>
  <div class="live-map" ref="mapContainer">
    <slot v-if="loading" name="loading">
      <div class="loading-overlay">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
    </slot>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'LiveMap',
  
  props: {
    deliveryAddress: {
      type: Object,
      required: true,
      validator: value => value && typeof value.lat === 'number' && typeof value.lng === 'number'
    },
    restaurantLocation: {
      type: Object,
      required: true,
      validator: value => value && typeof value.lat === 'number' && typeof value.lng === 'number'
    },
    driverLocation: {
      type: Object,
      default: null,
      validator: value => !value || (typeof value.lat === 'number' && typeof value.lng === 'number')
    },
    routePoints: {
      type: Array,
      default: () => []
    },
    eta: {
      type: Number,
      default: null
    }
  },

  emits: ['map-ready'],

  setup(props, { emit }) {
    const mapContainer = ref(null)
    const map = ref(null)
    const markers = ref({})
    const routeLine = ref(null)
    const loading = ref(true)

    let L // Leaflet instance

    const initializeMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const leaflet = await import('leaflet')
      L = leaflet.default

      // Create custom markers
      const createCustomIcon = (iconUrl, size = [32, 32]) => {
        return L.icon({
          iconUrl,
          iconSize: size,
          iconAnchor: [size[0]/2, size[1]],
          popupAnchor: [0, -size[1]]
        })
      }

      // Initialize map centered on restaurant
      map.value = L.map(mapContainer.value).setView(
        [props.restaurantLocation.lat, props.restaurantLocation.lng],
        13
      )

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value)

      // Add markers
      markers.value.restaurant = L.marker(
        [props.restaurantLocation.lat, props.restaurantLocation.lng],
        {
          icon: createCustomIcon('/img/icons/restaurant-marker.png'),
          title: 'Restaurant'
        }
      )
        .addTo(map.value)
        .bindPopup('Restaurant Location')

      markers.value.delivery = L.marker(
        [props.deliveryAddress.lat, props.deliveryAddress.lng],
        {
          icon: createCustomIcon('/img/icons/delivery-marker.png'),
          title: 'Delivery Location'
        }
      )
        .addTo(map.value)
        .bindPopup('Delivery Location')

      if (props.driverLocation) {
        markers.value.driver = L.marker(
          [props.driverLocation.lat, props.driverLocation.lng],
          {
            icon: createCustomIcon('/img/icons/driver-marker.png'),
            title: 'Driver'
          }
        )
          .addTo(map.value)
          .bindPopup(`ETA: ${props.eta || 'Calculating...'} mins`)
      }

      // Fit bounds to show all markers
      const bounds = L.latLngBounds([
        [props.restaurantLocation.lat, props.restaurantLocation.lng],
        [props.deliveryAddress.lat, props.deliveryAddress.lng]
      ])
      if (props.driverLocation) {
        bounds.extend([props.driverLocation.lat, props.driverLocation.lng])
      }
      map.value.fitBounds(bounds, { padding: [50, 50] })

      // Draw route if points available
      if (props.routePoints.length > 0) {
        drawRoute()
      }

      loading.value = false
      emit('map-ready')
    }

    const drawRoute = () => {
      if (routeLine.value) {
        routeLine.value.remove()
      }

      routeLine.value = L.polyline(
        props.routePoints.map(point => [point.lat, point.lng]),
        {
          color: '#2196F3',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }
      ).addTo(map.value)
    }

    const updateDriverMarker = () => {
      if (!props.driverLocation || !markers.value.driver) return

      markers.value.driver.setLatLng([
        props.driverLocation.lat,
        props.driverLocation.lng
      ])

      if (props.eta) {
        markers.value.driver.setPopupContent(`ETA: ${props.eta} mins`)
      }
    }

    // Watch for prop changes
    watch(() => props.driverLocation, () => {
      if (map.value && props.driverLocation) {
        if (!markers.value.driver) {
          markers.value.driver = L.marker(
            [props.driverLocation.lat, props.driverLocation.lng],
            {
              icon: L.icon({
                iconUrl: '/img/icons/driver-marker.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
              }),
              title: 'Driver'
            }
          )
            .addTo(map.value)
            .bindPopup(`ETA: ${props.eta || 'Calculating...'} mins`)
        } else {
          updateDriverMarker()
        }
      }
    }, { deep: true })

    watch(() => props.routePoints, () => {
      if (map.value && props.routePoints.length > 0) {
        drawRoute()
      }
    }, { deep: true })

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
      loading
    }
  }
}
</script>

<style scoped>
.live-map {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>