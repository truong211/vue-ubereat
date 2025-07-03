import axios from 'axios';

class MapService {
  constructor() {
    this.apiKey = process.env.VUE_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    this.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Get nearby restaurants based on user location
   * @param {Object} userLocation - {lat, lng}
   * @param {number} radius - Search radius in km
   * @returns {Promise<Array>} Array of nearby restaurants
   */
  async getNearbyRestaurants(userLocation, radius = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/restaurants/nearby`, {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  /**
   * Convert degrees to radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Calculate estimated delivery time
   * @param {number} distance - Distance in km
   * @param {string} orderStatus - Current order status
   * @returns {number} Estimated time in minutes
   */
  calculateEstimatedDeliveryTime(distance, orderStatus = 'preparing') {
    let baseTime = 0;
    
    // Base preparation time based on order status
    switch (orderStatus) {
      case 'preparing':
        baseTime = 20; // 20 minutes preparation
        break;
      case 'ready_for_pickup':
        baseTime = 5; // 5 minutes for pickup
        break;
      case 'out_for_delivery':
        baseTime = 0; // Already on the way
        break;
      default:
        baseTime = 25; // Default preparation time
    }
    
    // Add travel time (assuming average speed of 25 km/h in city)
    const travelTime = (distance / 25) * 60; // Convert to minutes
    
    return Math.ceil(baseTime + travelTime);
  }

  /**
   * Get directions between two points
   * @param {Object} origin - {lat, lng}
   * @param {Object} destination - {lat, lng}
   * @param {string} travelMode - DRIVING, WALKING, BICYCLING
   * @returns {Promise<Object>} Directions response
   */
  async getDirections(origin, destination, travelMode = 'DRIVING') {
    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      const directionsService = new google.maps.DirectionsService();
      
      return new Promise((resolve, reject) => {
        directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode[travelMode]
        }, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} {lat, lng}
   */
  async geocodeAddress(address) {
    try {
      if (!window.google || !window.google.maps) {
        // Fallback to backend geocoding
        const response = await axios.post(`${this.baseURL}/map/geocode`, { address });
        return response.data.data;
      }

      const geocoder = new google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Get user's current location
   * @returns {Promise<Object>} {lat, lng}
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
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
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Watch user's location changes
   * @param {Function} callback - Callback function to receive location updates
   * @returns {number} Watch ID for stopping the watch
   */
  watchLocation(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000 // 30 seconds
      }
    );
  }

  /**
   * Stop watching location
   * @param {number} watchId - Watch ID returned by watchLocation
   */
  stopWatchingLocation(watchId) {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Calculate delivery fee based on distance
   * @param {number} distance - Distance in km
   * @param {number} restaurantId - Restaurant ID (optional)
   * @param {number} orderAmount - Order amount for minimum check
   * @returns {Promise<Object>} Delivery fee calculation result
   */
  async calculateDeliveryFee(distance, restaurantId = null, orderAmount = 0) {
    try {
      const response = await axios.post(`${this.baseURL}/delivery-configs/calculate-fee`, {
        distance,
        restaurantId,
        orderAmount
      });
      return response.data.data;
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error;
    }
  }

  /**
   * Update driver location (for drivers)
   * @param {Object} location - {lat, lng, heading?, speed?, accuracy?}
   * @returns {Promise<Object>} Update result
   */
  async updateDriverLocation(location) {
    try {
      const response = await axios.post(`${this.baseURL}/tracking/location`, {
        latitude: location.lat,
        longitude: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  /**
   * Get driver location for order tracking
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Driver location
   */
  async getDriverLocation(driverId) {
    try {
      const response = await axios.get(`${this.baseURL}/tracking/driver/${driverId}`);
      return response.data.data.location;
    } catch (error) {
      console.error('Error getting driver location:', error);
      throw error;
    }
  }

  /**
   * Get order tracking information
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order tracking data
   */
  async getOrderTracking(orderId) {
    try {
      const response = await axios.get(`${this.baseURL}/tracking/order/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting order tracking:', error);
      throw error;
    }
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in km
   * @returns {string} Formatted distance
   */
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  /**
   * Format estimated time for display
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time
   */
  formatEstimatedTime(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours} giờ ${remainingMinutes} phút`;
  }

  /**
   * Check if location is within delivery area
   * @param {Object} userLocation - {lat, lng}
   * @param {Object} restaurantLocation - {lat, lng}
   * @param {number} maxDistance - Maximum delivery distance in km
   * @returns {boolean} Whether location is within delivery area
   */
  isWithinDeliveryArea(userLocation, restaurantLocation, maxDistance) {
    const distance = this.calculateDistance(userLocation, restaurantLocation);
    return distance <= maxDistance;
  }
}

export default new MapService();