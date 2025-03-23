/**
 * Utility functions for geographical calculations
 */

/**
 * Calculate distance between two coordinates in kilometers
 * Uses the Haversine formula to calculate great-circle distance between two points
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
exports.getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Calculate estimated time of arrival (ETA) in minutes
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Speed in kilometers per hour
 * @param {number} trafficFactor - Traffic factor (1.0 = normal, >1 = slower due to traffic)
 * @returns {number} ETA in minutes
 */
exports.calculateETA = (distanceKm, speedKmh = 20, trafficFactor = 1.0) => {
  // If distance or speed is zero, return null
  if (distanceKm <= 0 || speedKmh <= 0) {
    return null;
  }
  
  // Calculate ETA in hours: distance / speed, apply traffic factor
  const etaHours = (distanceKm / speedKmh) * trafficFactor;
  
  // Convert to minutes
  const etaMinutes = Math.round(etaHours * 60);
  
  return etaMinutes;
};

/**
 * Estimate traffic factor based on time of day
 * 
 * @param {Date|null} date - The date to estimate traffic for, or current date if null
 * @returns {number} Traffic factor
 */
exports.estimateTrafficFactor = (date = null) => {
  // Use provided date or current date
  const currentDate = date || new Date();
  const hours = currentDate.getHours();
  const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if weekend
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Define peak hours
  let trafficFactor = 1.0; // Default: normal traffic
  
  if (isWeekend) {
    // Weekend traffic patterns
    if (hours >= 11 && hours <= 14) {
      // Lunch time
      trafficFactor = 1.2;
    } else if (hours >= 17 && hours <= 20) {
      // Dinner time
      trafficFactor = 1.3;
    }
  } else {
    // Weekday traffic patterns
    if (hours >= 7 && hours <= 9) {
      // Morning rush hour
      trafficFactor = 1.5;
    } else if (hours >= 11 && hours <= 13) {
      // Lunch time
      trafficFactor = 1.2;
    } else if (hours >= 16 && hours <= 19) {
      // Evening rush hour
      trafficFactor = 1.4;
    }
  }
  
  return trafficFactor;
};

/**
 * Calculate route duration based on Google Maps API response
 * 
 * @param {Object} routeResponse - Google Maps API route response
 * @returns {number} Duration in minutes
 */
exports.calculateRouteDuration = (routeResponse) => {
  if (!routeResponse || !routeResponse.routes || routeResponse.routes.length === 0) {
    return null;
  }
  
  const route = routeResponse.routes[0];
  
  if (!route.legs || route.legs.length === 0) {
    return null;
  }
  
  // Sum up durations of all legs
  let totalDurationSeconds = 0;
  
  for (const leg of route.legs) {
    if (leg.duration && leg.duration.value) {
      totalDurationSeconds += leg.duration.value;
    }
  }
  
  // Convert to minutes
  const durationMinutes = Math.round(totalDurationSeconds / 60);
  
  return durationMinutes;
};

/**
 * Extract route points from Google Maps API response
 * 
 * @param {Object} routeResponse - Google Maps API route response
 * @returns {Array} Array of {lat, lng} points
 */
exports.extractRoutePoints = (routeResponse) => {
  if (!routeResponse || !routeResponse.routes || routeResponse.routes.length === 0) {
    return [];
  }
  
  const route = routeResponse.routes[0];
  
  if (!route.overview_path && (!route.legs || route.legs.length === 0)) {
    return [];
  }
  
  // If overview_path exists, use it
  if (route.overview_path) {
    return route.overview_path.map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }));
  }
  
  // Otherwise, extract from legs
  const points = [];
  
  for (const leg of route.legs) {
    if (leg.steps && leg.steps.length > 0) {
      for (const step of leg.steps) {
        if (step.path && step.path.length > 0) {
          for (const point of step.path) {
            points.push({
              lat: point.lat(),
              lng: point.lng()
            });
          }
        }
      }
    }
  }
  
  return points;
};

/**
 * Decode a polyline encoded path to an array of coordinates
 * 
 * @param {string} encoded - Google Maps encoded polyline
 * @returns {Array} Array of {lat, lng} points
 */
exports.decodePolyline = (encoded) => {
  if (!encoded) {
    return [];
  }
  
  const poly = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    poly.push({
      lat: lat * 1e-5,
      lng: lng * 1e-5
    });
  }
  
  return poly;
};