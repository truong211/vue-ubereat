import axios from 'axios';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api';

export default {
  async loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `${GOOGLE_MAPS_API_URL}/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve(window.google);
      script.onerror = (error) => reject(error);

      document.head.appendChild(script);
    });
  },

  async calculateDistance(origin, destination) {
    try {
      const response = await axios.get(`${GOOGLE_MAPS_API_URL}/distancematrix/json`, {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: GOOGLE_MAPS_API_KEY,
          mode: 'driving'
        }
      });

      if (response.data.status === 'OK') {
        const element = response.data.rows[0].elements[0];
        return {
          distance: element.distance,
          duration: element.duration
        };
      }
      throw new Error('Unable to calculate distance');
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  },

  createSearchRadiusCircle(map, center, radius) {
    return new window.google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.1,
      map,
      center,
      radius: radius * 1000 // Convert km to meters
    });
  }
};