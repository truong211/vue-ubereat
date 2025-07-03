const axios = require('axios');
const db = require('../config/database');

class MapController {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.MAPBOX_API_KEY;
    this.defaultProvider = process.env.MAP_PROVIDER || 'google';
  }

  // Calculate route between two points
  async calculateRoute(req, res) {
    try {
      const { origin, destination, mode = 'driving', alternatives = false } = req.body;
      
      if (!origin || !destination) {
        return res.status(400).json({ 
          error: 'Origin and destination coordinates are required' 
        });
      }

      let route;
      if (this.defaultProvider === 'google') {
        route = await this.getGoogleRoute(origin, destination, mode, alternatives);
      } else if (this.defaultProvider === 'mapbox') {
        route = await this.getMapboxRoute(origin, destination, mode);
      }

      res.json(route);
    } catch (error) {
      console.error('Route calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate route' });
    }
  }

  // Get distance matrix
  async getDistanceMatrix(req, res) {
    try {
      const { origins, destinations, mode = 'driving', units = 'metric' } = req.body;
      
      if (!origins || !destinations || !origins.length || !destinations.length) {
        return res.status(400).json({ 
          error: 'Origins and destinations are required' 
        });
      }

      let matrix;
      if (this.defaultProvider === 'google') {
        matrix = await this.getGoogleDistanceMatrix(origins, destinations, mode, units);
      }

      res.json(matrix);
    } catch (error) {
      console.error('Distance matrix error:', error);
      res.status(500).json({ error: 'Failed to get distance matrix' });
    }
  }

  // Geocode address
  async geocodeAddress(req, res) {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      let result;
      if (this.defaultProvider === 'google') {
        result = await this.googleGeocode(address);
      } else if (this.defaultProvider === 'mapbox') {
        result = await this.mapboxGeocode(address);
      }

      res.json(result);
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({ error: 'Failed to geocode address' });
    }
  }

  // Reverse geocode coordinates
  async reverseGeocode(req, res) {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      let result;
      if (this.defaultProvider === 'google') {
        result = await this.googleReverseGeocode({ lat: parseFloat(lat), lng: parseFloat(lng) });
      } else if (this.defaultProvider === 'mapbox') {
        result = await this.mapboxReverseGeocode({ lat: parseFloat(lat), lng: parseFloat(lng) });
      }

      res.json(result);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.status(500).json({ error: 'Failed to reverse geocode coordinates' });
    }
  }

  // Get nearby restaurants
  async getNearbyRestaurants(req, res) {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);

      // Query restaurants from database within radius
      const query = `
        SELECT 
          r.*,
          (6371 * acos(cos(radians(?)) * cos(radians(r.latitude)) * 
          cos(radians(r.longitude) - radians(?)) + sin(radians(?)) * 
          sin(radians(r.latitude)))) AS distance
        FROM restaurants r
        WHERE r.active = 1
        HAVING distance <= ?
        ORDER BY distance
        LIMIT 50
      `;

      const [restaurants] = await db.execute(query, [userLat, userLng, userLat, searchRadius]);

      // Calculate delivery time for each restaurant
      const restaurantsWithETA = await Promise.all(
        restaurants.map(async (restaurant) => {
          const deliveryTime = await this.estimateDeliveryTimeForRestaurant(
            { lat: userLat, lng: userLng },
            { lat: restaurant.latitude, lng: restaurant.longitude }
          );

          return {
            ...restaurant,
            location: {
              lat: restaurant.latitude,
              lng: restaurant.longitude
            },
            distance: Math.round(restaurant.distance * 10) / 10,
            estimatedDeliveryTime: deliveryTime,
            deliveryFee: this.calculateDeliveryFee(restaurant.distance)
          };
        })
      );

      res.json(restaurantsWithETA);
    } catch (error) {
      console.error('Error getting nearby restaurants:', error);
      res.status(500).json({ error: 'Failed to get nearby restaurants' });
    }
  }

  // Get restaurant location
  async getRestaurantLocation(req, res) {
    try {
      const { id } = req.params;

      const [restaurants] = await db.execute(
        'SELECT id, name, latitude, longitude, address FROM restaurants WHERE id = ?',
        [id]
      );

      if (restaurants.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const restaurant = restaurants[0];
      res.json({
        id: restaurant.id,
        name: restaurant.name,
        location: {
          lat: restaurant.latitude,
          lng: restaurant.longitude
        },
        address: restaurant.address
      });
    } catch (error) {
      console.error('Error getting restaurant location:', error);
      res.status(500).json({ error: 'Failed to get restaurant location' });
    }
  }

  // Get driver location
  async getDriverLocation(req, res) {
    try {
      const { id } = req.params;

      const [drivers] = await db.execute(
        'SELECT id, name, current_latitude, current_longitude, updated_at FROM drivers WHERE id = ?',
        [id]
      );

      if (drivers.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = drivers[0];
      res.json({
        id: driver.id,
        name: driver.name,
        location: {
          lat: driver.current_latitude,
          lng: driver.current_longitude
        },
        lastUpdated: driver.updated_at
      });
    } catch (error) {
      console.error('Error getting driver location:', error);
      res.status(500).json({ error: 'Failed to get driver location' });
    }
  }

  // Update driver location
  async updateDriverLocation(req, res) {
    try {
      const { id } = req.params;
      const { lat, lng, heading } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      await db.execute(
        'UPDATE drivers SET current_latitude = ?, current_longitude = ?, heading = ?, updated_at = NOW() WHERE id = ?',
        [lat, lng, heading || null, id]
      );

      // Emit location update via socket.io if available
      if (req.app.get('io')) {
        req.app.get('io').emit('driver_location_update', {
          driverId: id,
          location: { lat, lng },
          heading,
          timestamp: new Date()
        });
      }

      res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ error: 'Failed to update driver location' });
    }
  }

  // Get order delivery location
  async getOrderDeliveryLocation(req, res) {
    try {
      const { id } = req.params;

      const [orders] = await db.execute(
        'SELECT delivery_latitude, delivery_longitude, delivery_address FROM orders WHERE id = ?',
        [id]
      );

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orders[0];
      res.json({
        location: {
          lat: order.delivery_latitude,
          lng: order.delivery_longitude
        },
        address: order.delivery_address
      });
    } catch (error) {
      console.error('Error getting order delivery location:', error);
      res.status(500).json({ error: 'Failed to get delivery location' });
    }
  }

  // Get order route
  async getOrderRoute(req, res) {
    try {
      const { id } = req.params;

      // Get order details including driver and delivery location
      const [orders] = await db.execute(`
        SELECT 
          o.id,
          o.delivery_latitude,
          o.delivery_longitude,
          o.driver_id,
          d.current_latitude,
          d.current_longitude,
          r.latitude as restaurant_lat,
          r.longitude as restaurant_lng
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.id = ?
      `, [id]);

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orders[0];

      // Determine route based on order status
      let route;
      if (order.current_latitude && order.current_longitude) {
        // Driver to delivery location
        route = await this.getGoogleRoute(
          { lat: order.current_latitude, lng: order.current_longitude },
          { lat: order.delivery_latitude, lng: order.delivery_longitude }
        );
      } else if (order.restaurant_lat && order.restaurant_lng) {
        // Restaurant to delivery location (estimated route)
        route = await this.getGoogleRoute(
          { lat: order.restaurant_lat, lng: order.restaurant_lng },
          { lat: order.delivery_latitude, lng: order.delivery_longitude }
        );
      }

      res.json(route);
    } catch (error) {
      console.error('Error getting order route:', error);
      res.status(500).json({ error: 'Failed to get order route' });
    }
  }

  // Get order ETA
  async getOrderETA(req, res) {
    try {
      const { id } = req.params;

      const eta = await this.calculateOrderETA(id);
      res.json(eta);
    } catch (error) {
      console.error('Error calculating order ETA:', error);
      res.status(500).json({ error: 'Failed to calculate ETA' });
    }
  }

  // Optimize delivery route for multiple orders
  async optimizeDeliveryRoute(req, res) {
    try {
      const { driverLocation, orders } = req.body;

      if (!driverLocation || !orders || orders.length === 0) {
        return res.status(400).json({ error: 'Driver location and orders are required' });
      }

      const optimizedRoute = await this.optimizeMultipleDeliveries(driverLocation, orders);
      res.json(optimizedRoute);
    } catch (error) {
      console.error('Error optimizing route:', error);
      res.status(500).json({ error: 'Failed to optimize route' });
    }
  }

  // Estimate delivery time
  async estimateDeliveryTime(req, res) {
    try {
      const { restaurantLocation, deliveryLocation } = req.body;

      if (!restaurantLocation || !deliveryLocation) {
        return res.status(400).json({ 
          error: 'Restaurant and delivery locations are required' 
        });
      }

      const deliveryTime = await this.estimateDeliveryTimeForRestaurant(
        deliveryLocation,
        restaurantLocation
      );

      res.json({
        estimatedDeliveryTime: deliveryTime,
        estimatedArrival: new Date(Date.now() + deliveryTime * 60000)
      });
    } catch (error) {
      console.error('Error estimating delivery time:', error);
      res.status(500).json({ error: 'Failed to estimate delivery time' });
    }
  }

  // Google Maps API helpers
  async getGoogleRoute(origin, destination, mode = 'driving', alternatives = false) {
    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode,
      alternatives,
      key: this.googleMapsApiKey
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value,
      distanceText: leg.distance.text,
      duration: leg.duration.value,
      durationText: leg.duration.text,
      startLocation: {
        lat: leg.start_location.lat,
        lng: leg.start_location.lng
      },
      endLocation: {
        lat: leg.end_location.lat,
        lng: leg.end_location.lng
      },
      steps: leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instructions: step.html_instructions.replace(/<[^>]*>/g, ''),
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng
        },
        maneuver: step.maneuver
      })),
      points: this.decodePolyline(route.overview_polyline.points),
      raw: data
    };
  }

  async getMapboxRoute(origin, destination, mode = 'driving') {
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const params = {
      access_token: this.mapboxApiKey,
      geometries: 'geojson',
      steps: true,
      overview: 'full'
    };

    const response = await axios.get(url, { params });
    const route = response.data.routes[0];

    return {
      distance: route.distance,
      distanceText: `${(route.distance / 1000).toFixed(1)} km`,
      duration: route.duration,
      durationText: `${Math.round(route.duration / 60)} mins`,
      startLocation: {
        lat: route.legs[0].steps[0].geometry.coordinates[0][1],
        lng: route.legs[0].steps[0].geometry.coordinates[0][0]
      },
      endLocation: {
        lat: route.legs[0].steps[route.legs[0].steps.length - 1].geometry.coordinates[0][1],
        lng: route.legs[0].steps[route.legs[0].steps.length - 1].geometry.coordinates[0][0]
      },
      points: route.geometry.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      })),
      raw: response.data
    };
  }

  async getGoogleDistanceMatrix(origins, destinations, mode, units) {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const params = {
      origins: origins.map(o => `${o.lat},${o.lng}`).join('|'),
      destinations: destinations.map(d => `${d.lat},${d.lng}`).join('|'),
      mode,
      units,
      key: this.googleMapsApiKey
    };

    const response = await axios.get(url, { params });
    return response.data;
  }

  async googleGeocode(address) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      address,
      key: this.googleMapsApiKey
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.status !== 'OK' || data.results.length === 0) {
      throw new Error('Geocoding failed');
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id
    };
  }

  async googleReverseGeocode(location) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      latlng: `${location.lat},${location.lng}`,
      key: this.googleMapsApiKey
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.status !== 'OK' || data.results.length === 0) {
      throw new Error('Reverse geocoding failed');
    }

    const result = data.results[0];
    return {
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components,
      placeId: result.place_id
    };
  }

  // Helper methods
  async estimateDeliveryTimeForRestaurant(userLocation, restaurantLocation) {
    try {
      const route = await this.getGoogleRoute(restaurantLocation, userLocation);
      
      // Base time calculations
      const preparationTime = 15; // minutes
      const travelTime = Math.ceil(route.duration / 60); // minutes
      const buffer = 5; // minutes

      return preparationTime + travelTime + buffer;
    } catch (error) {
      // Fallback calculation using straight-line distance
      const distance = this.calculateStraightLineDistance(userLocation, restaurantLocation);
      const averageSpeed = 25; // km/h
      const travelTime = (distance / averageSpeed) * 60; // minutes
      
      return Math.round(15 + travelTime + 5); // prep + travel + buffer
    }
  }

  calculateStraightLineDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateDeliveryFee(distance) {
    // Basic delivery fee calculation
    const baseFee = 2.99;
    const perKmFee = 0.5;
    return Math.round((baseFee + (distance * perKmFee)) * 100) / 100;
  }

  async calculateOrderETA(orderId) {
    const [orders] = await db.execute(`
      SELECT 
        o.*,
        d.current_latitude,
        d.current_longitude,
        r.latitude as restaurant_lat,
        r.longitude as restaurant_lng
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];
    let estimatedTime;

    if (order.status === 'preparing') {
      // Restaurant preparation time + travel time
      const preparationTime = 10; // minutes
      const travelTime = await this.estimateDeliveryTimeForRestaurant(
        { lat: order.delivery_latitude, lng: order.delivery_longitude },
        { lat: order.restaurant_lat, lng: order.restaurant_lng }
      );
      estimatedTime = preparationTime + travelTime;
    } else if (order.current_latitude && order.current_longitude) {
      // Driver en route - calculate remaining travel time
      const route = await this.getGoogleRoute(
        { lat: order.current_latitude, lng: order.current_longitude },
        { lat: order.delivery_latitude, lng: order.delivery_longitude }
      );
      estimatedTime = Math.ceil(route.duration / 60); // minutes
    } else {
      estimatedTime = 30; // Default fallback
    }

    const estimatedArrival = new Date(Date.now() + estimatedTime * 60000);

    return {
      orderId,
      estimatedTime,
      estimatedArrival,
      status: order.status
    };
  }

  async optimizeMultipleDeliveries(driverLocation, orders) {
    // This is a simplified optimization algorithm
    // In production, you might want to use more sophisticated algorithms
    
    const optimizedOrders = [...orders];
    
    // Sort by distance from driver location
    optimizedOrders.sort((a, b) => {
      const distanceA = this.calculateStraightLineDistance(driverLocation, a.deliveryLocation);
      const distanceB = this.calculateStraightLineDistance(driverLocation, b.deliveryLocation);
      return distanceA - distanceB;
    });

    // Calculate total route
    let totalDistance = 0;
    let totalDuration = 0;
    let currentLocation = driverLocation;

    for (const order of optimizedOrders) {
      try {
        const route = await this.getGoogleRoute(currentLocation, order.deliveryLocation);
        totalDistance += route.distance;
        totalDuration += route.duration;
        currentLocation = order.deliveryLocation;
      } catch (error) {
        // Fallback to straight-line calculation
        const distance = this.calculateStraightLineDistance(currentLocation, order.deliveryLocation);
        totalDistance += distance * 1000; // convert to meters
        totalDuration += (distance / 25) * 3600; // assume 25 km/h, convert to seconds
      }
    }

    return {
      optimizedRoute: optimizedOrders,
      totalDistance: Math.round(totalDistance / 1000 * 10) / 10, // km
      totalDuration: Math.round(totalDuration / 60), // minutes
      estimatedEarnings: this.calculateRouteEarnings(optimizedOrders, totalDistance / 1000)
    };
  }

  calculateRouteEarnings(orders, totalDistance) {
    const basePayPerDelivery = 5;
    const distanceRate = 0.5; // per km
    
    return {
      base: basePayPerDelivery * orders.length,
      distance: totalDistance * distanceRate,
      total: (basePayPerDelivery * orders.length) + (totalDistance * distanceRate)
    };
  }

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

module.exports = new MapController();