<template>
  <div class="map-container">
    <div ref="mapRef" class="map"></div>
    <v-slider
      v-model="searchRadius"
      :min="1"
      :max="10"
      :step="0.5"
      label="Search Radius (km)"
      class="search-radius-slider"
      @update:modelValue="updateSearchRadius"
    ></v-slider>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import mapService from '@/services/map-service';

export default {
  name: 'MapView',
  props: {
    restaurants: {
      type: Array,
      default: () => []
    },
    userLocation: {
      type: Object,
      default: () => ({
        lat: 10.7769, // Default to Ho Chi Minh City center
        lng: 106.7009
      })
    }
  },
  setup(props, { emit }) {
    const mapRef = ref(null);
    const map = ref(null);
    const markers = ref([]);
    const searchRadius = ref(5); // Default 5km radius
    const searchCircle = ref(null);

    const initMap = async () => {
      try {
        await mapService.loadGoogleMapsScript();
        map.value = new window.google.maps.Map(mapRef.value, {
          center: props.userLocation,
          zoom: 13,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Create search radius circle
        searchCircle.value = mapService.createSearchRadiusCircle(
          map.value,
          props.userLocation,
          searchRadius.value
        );

        // Add user location marker
        new window.google.maps.Marker({
          position: props.userLocation,
          map: map.value,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          },
          title: 'Your Location'
        });

        updateMarkers();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const updateMarkers = async () => {
      // Clear existing markers
      markers.value.forEach(marker => marker.setMap(null));
      markers.value = [];

      // Add restaurant markers
      for (const restaurant of props.restaurants) {
        const position = {
          lat: restaurant.latitude,
          lng: restaurant.longitude
        };

        // Calculate distance from user location
        try {
          const distanceInfo = await mapService.calculateDistance(
            props.userLocation,
            position
          );

          const marker = new window.google.maps.Marker({
            position,
            map: map.value,
            title: restaurant.name
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="info-window">
                <h3>${restaurant.name}</h3>
                <p>Distance: ${distanceInfo.distance.text}</p>
                <p>Estimated delivery time: ${distanceInfo.duration.text}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map.value, marker);
          });

          markers.value.push(marker);
        } catch (error) {
          console.error('Error calculating distance for restaurant:', error);
        }
      }
    };

    const updateSearchRadius = () => {
      if (searchCircle.value) {
        searchCircle.value.setRadius(searchRadius.value * 1000);
        emit('radius-changed', searchRadius.value);
      }
    };

    watch(
      () => props.restaurants,
      () => {
        if (map.value) {
          updateMarkers();
        }
      }
    );

    onMounted(() => {
      initMap();
    });

    return {
      mapRef,
      searchRadius,
      updateSearchRadius
    };
  }
};
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 500px;
}

.map {
  width: 100%;
  height: 100%;
}

.search-radius-slider {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.info-window {
  padding: 10px;
}

.info-window h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.info-window p {
  margin: 4px 0;
  font-size: 14px;
}
</style>