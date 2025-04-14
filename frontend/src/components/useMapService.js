import { ref } from 'vue';

export function useMapService() {
  const isMapLoaded = ref(false);
  const isMapApiLoaded = ref(false);
  const error = ref(null);
  
  const loadMapApi = async () => {
    // Skip if already loaded
    if (isMapApiLoaded.value) return;
    
    return new Promise((resolve, reject) => {
      // Check if the Google Maps API is already loaded
      if (window.google && window.google.maps) {
        isMapApiLoaded.value = true;
        resolve();
        return;
      }
      
      // Create callback for Google Maps API
      const callbackName = 'gmapsCallback';
      window[callbackName] = () => {
        isMapApiLoaded.value = true;
        resolve();
        delete window[callbackName];
      };
      
      // Get API key from environment or config
      const apiKey = process.env.VUE_APP_GOOGLE_MAPS_API_KEY || '';
      
      // Load the Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = (err) => {
        reject(new Error(`Failed to load Google Maps API: ${err}`));
      };
      
      document.head.appendChild(script);
    });
  };
  
  const initMap = async (container, options = {}) => {
    if (!isMapApiLoaded.value) {
      await loadMapApi();
    }
    
    const mapOptions = {
      zoom: options.zoom || 14,
      center: options.center || { lat: 10.8231, lng: 106.6297 }, // Default center (HCMC)
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };
    
    const map = new google.maps.Map(container, mapOptions);
    isMapLoaded.value = true;
    
    return map;
  };
  
  const addMarker = (map, position, options = {}) => {
    // Create marker options
    const markerOptions = {
      position,
      map,
      title: options.title || '',
      draggable: options.draggable || false,
    };
    
    // Add custom icon if specified
    if (options.icon) {
      switch (options.icon) {
        case 'restaurant':
          markerOptions.icon = {
            url: '/img/icons/restaurant-marker.png',
            scaledSize: new google.maps.Size(32, 32)
          };
          break;
        case 'destination':
          markerOptions.icon = {
            url: '/img/icons/destination-marker.png',
            scaledSize: new google.maps.Size(32, 32)
          };
          break;
        case 'driver':
          markerOptions.icon = {
            url: '/img/icons/driver-marker.png',
            scaledSize: new google.maps.Size(32, 32)
          };
          break;
        default:
          // Use the icon as URL if it doesn't match predefined types
          if (options.icon.startsWith('http') || options.icon.startsWith('/')) {
            markerOptions.icon = {
              url: options.icon,
              scaledSize: new google.maps.Size(32, 32)
            };
          }
      }
    }
    
    const marker = new google.maps.Marker(markerOptions);
    return marker;
  };
  
  const addRoute = (map, origin, destination) => {
    return new Promise((resolve, reject) => {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // Don't show default markers
        polylineOptions: {
          strokeColor: '#FF5252', // Primary color
          strokeWeight: 4,
          strokeOpacity: 0.7
        }
      });
      
      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            directionsRenderer.setDirections(response);
            resolve(directionsRenderer);
          } else {
            console.error('Directions request failed:', status);
            // Fallback to simple polyline if directions fail
            const path = new google.maps.Polyline({
              path: [origin, destination],
              strokeColor: '#FF5252',
              strokeWeight: 3,
              strokeOpacity: 0.7,
              map
            });
            
            reject(new Error(`Failed to get directions: ${status}`));
          }
        }
      );
    });
  };
  
  const updateMarkerPosition = (marker, position) => {
    marker.setPosition(new google.maps.LatLng(position.lat, position.lng));
  };
  
  const fitMapBounds = (map, markers) => {
    if (!markers.length) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    markers.forEach(marker => {
      const position = marker.getPosition();
      if (position) {
        bounds.extend(position);
      }
    });
    
    map.fitBounds(bounds);
    
    // If zoom is too high (e.g., when markers are close to each other)
    // limit it to a reasonable level
    const listener = google.maps.event.addListener(map, 'idle', () => {
      if (map.getZoom() && map.getZoom() > 16) {
        map.setZoom(16);
      }
      google.maps.event.removeListener(listener);
    });
  };
  
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };
  
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(point2.lat - point1.lat);
    const dLng = deg2rad(point2.lng - point1.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (distance) => {
    if (distance < 0.1) {
      return `${Math.round(distance * 1000)} m`;
    } else if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };
  
  const estimateTravelTime = (distance, mode = 'driving') => {
    // Average speeds (km/h)
    const speeds = {
      driving: 30, // Urban driving
      walking: 5,  // Walking
      cycling: 15   // Cycling
    };
    
    // Calculate time in hours, then convert to minutes
    const timeHours = distance / speeds[mode];
    return Math.ceil(timeHours * 60);
  };
  
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation is not supported by your browser';
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          error.value = `Error getting location: ${err.message}`;
          reject(err);
        }
      );
    });
  };
  
  return {
    isMapLoaded,
    isMapApiLoaded,
    loadMapApi,
    initMap,
    addMarker,
    addRoute,
    updateMarkerPosition,
    fitMapBounds,
    getCurrentPosition,
    calculateDistance,
    formatDistance,
    estimateTravelTime,
    getUserLocation,
    error
  };
}