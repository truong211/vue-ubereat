import axios from 'axios';
import { config } from '@/config';

class MapService {
  constructor() {
    this.apiKey = config.mapApiKey;
    this.mapProvider = config.mapProvider || 'google'; // 'google', 'mapbox', etc.
    this.geocodingCache = new Map();
    this.routeCache = new Map();
    this.distanceMatrixCache = new Map();
    this.mapInstance = null;
    this.directionsService = null;
    this.geocoder = null;
  }

  /**
   * Initialize map services
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.mapProvider === 'google') {
      await this.loadGoogleMapsApi();
      this.initializeGoogleServices();
    } else if (this.mapProvider === 'mapbox') {
      await this.loadMapboxApi();
    }
  }

  /**
   * Load Google Maps API
   * @returns {Promise<void>}
   */
  loadGoogleMapsApi() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Create callback function
      const callbackName = `gmapsCallback${Math.round(Math.random() * 1000000)}`;
      window[callbackName] = () => {
        resolve();
        delete window[callbackName];
      };

      // Load Google Maps API script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Load Mapbox API
   * @returns {Promise<void>}
   */
  loadMapboxApi() {
    return new Promise((resolve, reject) => {
      if (window.mapboxgl) {
        resolve();
        return;
      }

      // Load Mapbox CSS
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load Mapbox script
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.js';
      script.onload = () => {
        window.mapboxgl.accessToken = this.apiKey;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google services
   */
  initializeGoogleServices() {
    if (!window.google || !window.google.maps) return;

    this.directionsService = new window.google.maps.DirectionsService();
    this.geocoder = new window.google.maps.Geocoder();
  }

  /**
   * Get route between two locations
   * @param {Object} origin - Origin location {lat, lng}
   * @param {Object} destination - Destination location {lat, lng}
   * @param {Object} options - Routing options
   * @returns {Promise<Object>} - Route information
   */
  async getRoute(origin, destination, options = {}) {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    // Check cache first
    const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey);
    }

    // Use appropriate provider
    let route;
    if (this.mapProvider === 'google') {
      route = await this.getGoogleRoute(origin, destination, options);
    } else if (this.mapProvider === 'mapbox') {
      route = await this.getMapboxRoute(origin, destination, options);
    } else {
      // Fallback to backend routing service
      route = await this.getBackendRoute(origin, destination, options);
    }

    // Cache the result
    this.routeCache.set(cacheKey, route);
    return route;
  }

  /**
   * Get route using Google Maps API
   * @param {Object} origin - Origin location {lat, lng}
   * @param {Object} destination - Destination location {lat, lng}
   * @param {Object} options - Routing options
   * @returns {Promise<Object>} - Route information
   */
  getGoogleRoute(origin, destination, options = {}) {
    if (!this.directionsService) {
      this.initializeGoogleServices();
    }

    return new Promise((resolve, reject) => {
      const request = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: options.mode || window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: options.alternatives || false
      };

      this.directionsService.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = this.formatGoogleRoute(result);
          resolve(route);
        } else {
          reject(new Error(`Failed to get route: ${status}`));
        }
      });
    });
  }

  /**
   * Format Google route response
   * @param {Object} result - Google DirectionsResult
   * @returns {Object} - Formatted route
   */
  formatGoogleRoute(result) {
    const route = result.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value,
      distanceText: leg.distance.text,
      duration: leg.duration.value,
      durationText: leg.duration.text,
      startLocation: {
        lat: leg.start_location.lat(),
        lng: leg.start_location.lng()
      },
      endLocation: {
        lat: leg.end_location.lat(),
        lng: leg.end_location.lng()
      },
      steps: leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instructions: step.instructions,
        startLocation: {
          lat: step.start_location.lat(),
          lng: step.start_location.lng()
        },
        endLocation: {
          lat: step.end_location.lat(),
          lng: step.end_location.lng()
        }
      })),
      points: this.decodePolyline(route.overview_polyline.points),
      raw: result
    };
  }

  /**
   * Get route using Mapbox API
   * @param {Object} origin - Origin location {lat, lng}
   * @param {Object} destination - Destination location {lat, lng}
   * @param {Object} options - Routing options
   * @returns {Promise<Object>} - Route information
   */
  async getMapboxRoute(origin, destination, options = {}) {
    const mode = options.mode || 'driving';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    
    const params = {
      access_token: this.apiKey,
      geometries: 'geojson',
      steps: true,
      overview: 'full'
    };

    try {
      const response = await axios.get(url, { params });
      return this.formatMapboxRoute(response.data);
    } catch (error) {
      console.error('Error fetching Mapbox route:', error);
      throw error;
    }
  }

  /**
   * Format Mapbox route response
   * @param {Object} result - Mapbox response data
   * @returns {Object} - Formatted route
   */
  formatMapboxRoute(result) {
    const route = result.routes[0];
    const leg = route.legs[0];

    return {
      distance: route.distance,
      distanceText: `${(route.distance / 1000).toFixed(1)} km`,
      duration: route.duration,
      durationText: `${Math.round(route.duration / 60)} mins`,
      startLocation: {
        lat: leg.steps[0].geometry.coordinates[0][1],
        lng: leg.steps[0].geometry.coordinates[0][0]
      },
      endLocation: {
        lat: leg.steps[leg.steps.length - 1].geometry.coordinates[0][1],
        lng: leg.steps[leg.steps.length - 1].geometry.coordinates[0][0]
      },
      steps: leg.steps.map(step => ({
        distance: step.distance,
        duration: step.duration,
        instructions: step.maneuver.instruction,
        startLocation: {
          lat: step.geometry.coordinates[0][1],
          lng: step.geometry.coordinates[0][0]
        },
        endLocation: {
          lat: step.geometry.coordinates[step.geometry.coordinates.length - 1][1],
          lng: step.geometry.coordinates[step.geometry.coordinates.length - 1][0]
        }
      })),
      points: route.geometry.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      })),
      raw: result
    };
  }

  /**
   * Get route using backend service
   * @param {Object} origin - Origin location {lat, lng}
   * @param {Object} destination - Destination location {lat, lng}
   * @param {Object} options - Routing options
   * @returns {Promise<Object>} - Route information
   */
  async getBackendRoute(origin, destination, options = {}) {
    try {
      const response = await axios.post('/api/map/route', {
        origin,
        destination,
        mode: options.mode || 'driving',
        alternatives: options.alternatives || false
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching route from backend:', error);
      throw error;
    }
  }

  /**
   * Geocode an address or place
   * @param {String} address - Address to geocode
   * @returns {Promise<Object>} - Geocoded location
   */
  async geocode(address) {
    if (!address) {
      throw new Error('Address is required');
    }

    // Check cache first
    if (this.geocodingCache.has(address)) {
      return this.geocodingCache.get(address);
    }

    let result;
    if (this.mapProvider === 'google') {
      result = await this.googleGeocode(address);
    } else if (this.mapProvider === 'mapbox') {
      result = await this.mapboxGeocode(address);
    } else {
      result = await this.backendGeocode(address);
    }

    // Cache result
    this.geocodingCache.set(address, result);
    return result;
  }

  /**
   * Geocode using Google Maps API
   * @param {String} address - Address to geocode
   * @returns {Promise<Object>} - Geocoded location
   */
  googleGeocode(address) {
    if (!this.geocoder) {
      this.initializeGoogleServices();
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address,
            placeId: results[0].place_id
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Geocode using Mapbox API
   * @param {String} address - Address to geocode
   * @returns {Promise<Object>} - Geocoded location
   */
  async mapboxGeocode(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json`;
    
    const params = {
      access_token: this.apiKey,
      limit: 1
    };

    try {
      const response = await axios.get(url, { params });
      const feature = response.data.features[0];
      
      return {
        lat: feature.center[1],
        lng: feature.center[0],
        formattedAddress: feature.place_name,
        placeId: feature.id
      };
    } catch (error) {
      console.error('Error geocoding with Mapbox:', error);
      throw error;
    }
  }

  /**
   * Geocode using backend service
   * @param {String} address - Address to geocode
   * @returns {Promise<Object>} - Geocoded location
   */
  async backendGeocode(address) {
    try {
      const response = await axios.get('/api/map/geocode', {
        params: { address }
      });
      return response.data;
    } catch (error) {
      console.error('Error geocoding with backend service:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates
   * @param {Object} location - Location {lat, lng}
   * @returns {Promise<Object>} - Address information
   */
  async reverseGeocode(location) {
    if (!location || !location.lat || !location.lng) {
      throw new Error('Valid location is required');
    }

    const cacheKey = `${location.lat},${location.lng}`;
    if (this.geocodingCache.has(cacheKey)) {
      return this.geocodingCache.get(cacheKey);
    }

    let result;
    if (this.mapProvider === 'google') {
      result = await this.googleReverseGeocode(location);
    } else if (this.mapProvider === 'mapbox') {
      result = await this.mapboxReverseGeocode(location);
    } else {
      result = await this.backendReverseGeocode(location);
    }

    // Cache result
    this.geocodingCache.set(cacheKey, result);
    return result;
  }

  /**
   * Reverse geocode using Google Maps API
   * @param {Object} location - Location {lat, lng}
   * @returns {Promise<Object>} - Address information
   */
  googleReverseGeocode(location) {
    if (!this.geocoder) {
      this.initializeGoogleServices();
    }

    return new Promise((resolve, reject) => {
      const latlng = new window.google.maps.LatLng(location.lat, location.lng);
      this.geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
          resolve({
            formattedAddress: results[0].formatted_address,
            addressComponents: results[0].address_components,
            placeId: results[0].place_id
          });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Reverse geocode using Mapbox API
   * @param {Object} location - Location {lat, lng}
   * @returns {Promise<Object>} - Address information
   */
  async mapboxReverseGeocode(location) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json`;
    
    const params = {
      access_token: this.apiKey,
      limit: 1
    };

    try {
      const response = await axios.get(url, { params });
      const feature = response.data.features[0];
      
      return {
        formattedAddress: feature.place_name,
        addressComponents: feature.context,
        placeId: feature.id
      };
    } catch (error) {
      console.error('Error reverse geocoding with Mapbox:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode using backend service
   * @param {Object} location - Location {lat, lng}
   * @returns {Promise<Object>} - Address information
   */
  async backendReverseGeocode(location) {
    try {
      const response = await axios.get('/api/map/reverse-geocode', {
        params: location
      });
      return response.data;
    } catch (error) {
      console.error('Error reverse geocoding with backend service:', error);
      throw error;
    }
  }

  /**
   * Get distance matrix between multiple origins and destinations
   * @param {Array} origins - Array of origin locations [{lat, lng}]
   * @param {Array} destinations - Array of destination locations [{lat, lng}]
   * @param {Object} options - Options for distance matrix
   * @returns {Promise<Object>} - Distance matrix
   */
  async getDistanceMatrix(origins, destinations, options = {}) {
    if (!origins || !origins.length || !destinations || !destinations.length) {
      throw new Error('Origins and destinations are required');
    }

    // Check cache (simplified - in real implementation, would need more complex caching)
    const cacheKey = `${JSON.stringify(origins)}-${JSON.stringify(destinations)}`;
    if (this.distanceMatrixCache.has(cacheKey)) {
      return this.distanceMatrixCache.get(cacheKey);
    }

    let matrix;
    if (this.mapProvider === 'google') {
      matrix = await this.googleDistanceMatrix(origins, destinations, options);
    } else {
      matrix = await this.backendDistanceMatrix(origins, destinations, options);
    }

    // Cache result
    this.distanceMatrixCache.set(cacheKey, matrix);
    return matrix;
  }

  /**
   * Get distance matrix using Google Maps API
   * @param {Array} origins - Array of origin locations [{lat, lng}]
   * @param {Array} destinations - Array of destination locations [{lat, lng}]
   * @param {Object} options - Options for distance matrix
   * @returns {Promise<Object>} - Distance matrix
   */
  googleDistanceMatrix(origins, destinations, options = {}) {
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();

      const originLocations = origins.map(loc => 
        new window.google.maps.LatLng(loc.lat, loc.lng)
      );
      
      const destinationLocations = destinations.map(loc => 
        new window.google.maps.LatLng(loc.lat, loc.lng)
      );

      service.getDistanceMatrix({
        origins: originLocations,
        destinations: destinationLocations,
        travelMode: options.mode || window.google.maps.TravelMode.DRIVING,
        unitSystem: options.units === 'imperial' ? 
          window.google.maps.UnitSystem.IMPERIAL : 
          window.google.maps.UnitSystem.METRIC
      }, (response, status) => {
        if (status === window.google.maps.DistanceMatrixStatus.OK) {
          resolve(this.formatGoogleDistanceMatrix(response));
        } else {
          reject(new Error(`Distance matrix request failed: ${status}`));
        }
      });
    });
  }

  /**
   * Format Google distance matrix response
   * @param {Object} result - Google distance matrix result
   * @returns {Object} - Formatted distance matrix
   */
  formatGoogleDistanceMatrix(result) {
    return {
      origins: result.originAddresses,
      destinations: result.destinationAddresses,
      rows: result.rows.map(row => ({
        elements: row.elements.map(element => ({
          distance: element.distance ? element.distance.value : null,
          distanceText: element.distance ? element.distance.text : null,
          duration: element.duration ? element.duration.value : null,
          durationText: element.duration ? element.duration.text : null,
          status: element.status
        }))
      })),
      raw: result
    };
  }

  /**
   * Get distance matrix using backend service
   * @param {Array} origins - Array of origin locations [{lat, lng}]
   * @param {Array} destinations - Array of destination locations [{lat, lng}]
   * @param {Object} options - Options for distance matrix
   * @returns {Promise<Object>} - Distance matrix
   */
  async backendDistanceMatrix(origins, destinations, options = {}) {
    try {
      const response = await axios.post('/api/map/distance-matrix', {
        origins,
        destinations,
        mode: options.mode || 'driving',
        units: options.units || 'metric'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting distance matrix from backend:', error);
      throw error;
    }
  }

  /**
   * Decode Google encoded polyline
   * @param {String} encoded - Encoded polyline
   * @returns {Array} - Array of lat/lng points
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        lat: lat * 1e-5,
        lng: lng * 1e-5
      });
    }

    return points;
  }
}

export const mapService = new MapService();
export default mapService;