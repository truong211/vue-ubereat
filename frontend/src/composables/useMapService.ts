import { ref } from 'vue';

interface MapOptions {
  zoom?: number;
  center?: {
    lat: number;
    lng: number;
  };
}

interface MarkerOptions {
  title?: string;
  icon?: string;
  draggable?: boolean;
}

export function useMapService() {
  const isMapLoaded = ref(false);
  const isMapApiLoaded = ref(false);
  
  /**
   * Initialize the map service
   */
  const loadMapApi = async (): Promise<void> => {
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
      (window as any)[callbackName] = () => {
        isMapApiLoaded.value = true;
        resolve();
        delete (window as any)[callbackName];
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
  
  /**
   * Initialize a map in the specified container
   */
  const initMap = async (
    container: HTMLElement,
    options: MapOptions = {}
  ): Promise<google.maps.Map> => {
    if (!isMapApiLoaded.value) {
      await loadMapApi();
    }
    
    const mapOptions: google.maps.MapOptions = {
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
  
  /**
   * Add a marker to the map
   */
  const addMarker = (
    map: google.maps.Map,
    position: { lat: number; lng: number },
    options: MarkerOptions = {}
  ): google.maps.Marker => {
    // Create marker options
    const markerOptions: google.maps.MarkerOptions = {
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
  
  /**
   * Add a polyline route between two points
   */
  const addRoute = (
    map: google.maps.Map,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<google.maps.DirectionsRenderer> => {
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
  
  /**
   * Update a marker's position
   */
  const updateMarkerPosition = (
    marker: google.maps.Marker,
    position: { lat: number; lng: number }
  ): void => {
    marker.setPosition(new google.maps.LatLng(position.lat, position.lng));
  };
  
  /**
   * Adjust map bounds to fit all markers
   */
  const fitMapBounds = (
    map: google.maps.Map,
    markers: google.maps.Marker[]
  ): void => {
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
  
  /**
   * Get current user geolocation
   */
  const getCurrentPosition = (): Promise<{ lat: number; lng: number }> => {
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
  
  /**
   * Calculate distance between two points in kilometers
   */
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
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
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
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
    calculateDistance
  };
}