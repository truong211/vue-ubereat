const db = require('../config/database');
const mapService = require('../services/map.service');
const geoUtils = require('../utils/geo.utils');
const cacheService = require('../services/cache.service');
const { AppError } = require('../utils/errors');

class MapController {
  /**
   * Tìm nhà hàng gần vị trí người dùng
   */
  async findNearbyRestaurants(req, res, next) {
    try {
      const { 
        lat, 
        lng, 
        radius = 5, 
        cuisineType, 
        rating, 
        priceRange, 
        sortBy = 'distance', 
        limit = 50,
        includeUnavailable = false
      } = req.query;

      // Cache key
      const cacheKey = `nearby_restaurants:${lat}:${lng}:${radius}:${cuisineType || 'all'}:${sortBy}:${limit}`;
      
      // Try to get from cache first
      let restaurants = await cacheService.get(cacheKey);
      
      if (!restaurants) {
        // Build query conditions
        let query = `
          SELECT r.*, 
            ROUND(6371 * 2 * ASIN(SQRT(
              POW(SIN((RADIANS(?) - RADIANS(r.latitude)) / 2), 2) +
              COS(RADIANS(?)) * COS(RADIANS(r.latitude)) * 
              POW(SIN((RADIANS(?) - RADIANS(r.longitude)) / 2), 2)
            )), 2) AS distance,
            (SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id) as rating,
            (SELECT COUNT(*) FROM reviews WHERE restaurant_id = r.id) as review_count,
            CASE 
              WHEN r.is_open = 1 AND CURTIME() BETWEEN r.opening_time AND r.closing_time THEN 1
              ELSE 0
            END as is_currently_open
          FROM restaurants r
          WHERE r.is_active = 1
        `;
        
        const queryParams = [lat, lat, lng];
        
        // Filter by availability
        if (!includeUnavailable) {
          query += ` AND r.is_open = 1`;
        }
        
        // Filter by cuisine type
        if (cuisineType) {
          query += ` AND r.cuisine_type = ?`;
          queryParams.push(cuisineType);
        }
        
        // Filter by rating
        if (rating) {
          query += ` HAVING rating >= ?`;
          queryParams.push(rating);
        }
        
        // Distance filter
        query += ` HAVING distance <= ?`;
        queryParams.push(radius);
        
        // Sorting
        switch (sortBy) {
          case 'rating':
            query += ` ORDER BY rating DESC, distance ASC`;
            break;
          case 'deliveryTime':
            query += ` ORDER BY r.avg_delivery_time ASC, distance ASC`;
            break;
          case 'deliveryFee':
            query += ` ORDER BY r.delivery_fee ASC, distance ASC`;
            break;
          default:
            query += ` ORDER BY distance ASC`;
        }
        
        query += ` LIMIT ?`;
        queryParams.push(parseInt(limit));

        const [rows] = await db.execute(query, queryParams);
        restaurants = rows;

        // Calculate delivery estimates for each restaurant
        restaurants = await Promise.all(restaurants.map(async (restaurant) => {
          try {
            const deliveryEstimate = await this.calculateDeliveryEstimate(
              { lat: parseFloat(lat), lng: parseFloat(lng) },
              { lat: restaurant.latitude, lng: restaurant.longitude },
              restaurant.avg_preparation_time || 20
            );
            
            return {
              ...restaurant,
              delivery_estimate: deliveryEstimate,
              is_deliverable: restaurant.distance <= (restaurant.max_delivery_radius || 10),
              delivery_time_range: this.formatDeliveryTimeRange(deliveryEstimate.total_time)
            };
          } catch (error) {
            console.warn(`Failed to calculate delivery estimate for restaurant ${restaurant.id}`);
            return {
              ...restaurant,
              delivery_estimate: null,
              is_deliverable: restaurant.distance <= (restaurant.max_delivery_radius || 10),
              delivery_time_range: 'Không xác định'
            };
          }
        }));

        // Cache for 5 minutes
        await cacheService.set(cacheKey, restaurants, 300);
      }

      res.json({
        success: true,
        data: {
          restaurants,
          total: restaurants.length,
          center: { lat: parseFloat(lat), lng: parseFloat(lng) },
          radius: parseFloat(radius)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tìm kiếm nhà hàng theo từ khóa
   */
  async searchRestaurants(req, res, next) {
    try {
      const { q, lat, lng, radius = 10, limit = 20 } = req.query;

      const query = `
        SELECT r.*, 
          ROUND(6371 * 2 * ASIN(SQRT(
            POW(SIN((RADIANS(?) - RADIANS(r.latitude)) / 2), 2) +
            COS(RADIANS(?)) * COS(RADIANS(r.latitude)) * 
            POW(SIN((RADIANS(?) - RADIANS(r.longitude)) / 2), 2)
          )), 2) AS distance,
          (SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id) as rating,
          (SELECT COUNT(*) FROM reviews WHERE restaurant_id = r.id) as review_count,
          MATCH(r.name, r.description, r.cuisine_type) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score
        FROM restaurants r
        WHERE r.is_active = 1 
          AND (
            MATCH(r.name, r.description, r.cuisine_type) AGAINST(? IN NATURAL LANGUAGE MODE)
            OR r.name LIKE ?
            OR r.cuisine_type LIKE ?
          )
        HAVING distance <= ?
        ORDER BY relevance_score DESC, distance ASC
        LIMIT ?
      `;

      const searchTerm = `%${q}%`;
      const [rows] = await db.execute(query, [
        lat, lat, lng, q, q, searchTerm, searchTerm, radius, parseInt(limit)
      ]);

      res.json({
        success: true,
        data: {
          restaurants: rows,
          total: rows.length,
          query: q
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy nhà hàng được khuyến nghị
   */
  async getRecommendedRestaurants(req, res, next) {
    try {
      const { location, preferences = {} } = req.body;
      const userId = req.user?.id;

      let query = `
        SELECT r.*, 
          ROUND(6371 * 2 * ASIN(SQRT(
            POW(SIN((RADIANS(?) - RADIANS(r.latitude)) / 2), 2) +
            COS(RADIANS(?)) * COS(RADIANS(r.latitude)) * 
            POW(SIN((RADIANS(?) - RADIANS(r.longitude)) / 2), 2)
          )), 2) AS distance,
          (SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id) as rating,
          (SELECT COUNT(*) FROM reviews WHERE restaurant_id = r.id) as review_count
      `;

      const queryParams = [location.lat, location.lat, location.lng];

      // Add user preference scoring if user is logged in
      if (userId) {
        query += `,
          (
            SELECT COUNT(*) 
            FROM orders o 
            WHERE o.user_id = ? AND o.restaurant_id = r.id
          ) as order_history_score,
          (
            SELECT AVG(rating) 
            FROM reviews rv 
            WHERE rv.user_id = ? AND rv.restaurant_id = r.id
          ) as user_rating
        `;
        queryParams.push(userId, userId);
      } else {
        query += `, 0 as order_history_score, 0 as user_rating`;
      }

      query += `
        FROM restaurants r
        WHERE r.is_active = 1 AND r.is_open = 1
        HAVING distance <= 10
        ORDER BY 
          (rating * 0.3) + 
          (order_history_score * 0.2) + 
          (CASE WHEN distance <= 3 THEN 0.3 ELSE 0.1 END) +
          (CASE WHEN r.is_featured = 1 THEN 0.2 ELSE 0 END)
        DESC
        LIMIT 20
      `;

      const [rows] = await db.execute(query, queryParams);

      res.json({
        success: true,
        data: {
          restaurants: rows,
          total: rows.length,
          preferences_applied: Object.keys(preferences).length > 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tính toán route
   */
  async calculateRoute(req, res, next) {
    try {
      const { origin, destination, mode = 'driving', alternatives = false, waypoints = [] } = req.body;

      const route = await mapService.calculateRoute(origin, destination, {
        mode,
        alternatives,
        waypoints
      });

      res.json({
        success: true,
        data: route
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tối ưu hóa route cho nhiều điểm đến
   */
  async optimizeRoute(req, res, next) {
    try {
      const { origin, destinations } = req.body;

      const optimizedRoute = await mapService.optimizeMultipleDestinations(origin, destinations);

      res.json({
        success: true,
        data: optimizedRoute
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tính distance matrix
   */
  async calculateDistanceMatrix(req, res, next) {
    try {
      const { origins, destinations, mode = 'driving' } = req.body;

      const matrix = await mapService.calculateDistanceMatrix(origins, destinations, { mode });

      res.json({
        success: true,
        data: matrix
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Geocode địa chỉ
   */
  async geocodeAddress(req, res, next) {
    try {
      const { address } = req.query;

      const result = await mapService.geocode(address);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reverse geocode tọa độ
   */
  async reverseGeocode(req, res, next) {
    try {
      const { lat, lng } = req.query;

      const result = await mapService.reverseGeocode({ lat: parseFloat(lat), lng: parseFloat(lng) });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin tracking đơn hàng
   */
  async getOrderTracking(req, res, next) {
    try {
      const { orderId } = req.params;

      const query = `
        SELECT 
          o.*,
          r.name as restaurant_name,
          r.latitude as restaurant_latitude,
          r.longitude as restaurant_longitude,
          r.phone as restaurant_phone,
          r.address as restaurant_address,
          d.name as driver_name,
          d.phone as driver_phone,
          d.avatar as driver_avatar,
          d.rating as driver_rating,
          dl.latitude as driver_latitude,
          dl.longitude as driver_longitude,
          dl.heading as driver_heading,
          dl.speed as driver_speed,
          dl.updated_at as driver_location_updated
        FROM orders o
        LEFT JOIN restaurants r ON o.restaurant_id = r.id
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN driver_locations dl ON d.id = dl.driver_id
        WHERE o.id = ? AND (o.user_id = ? OR o.driver_id = ?)
      `;

      const [rows] = await db.execute(query, [orderId, req.user.id, req.user.id]);

      if (rows.length === 0) {
        throw new AppError('Order not found or access denied', 404);
      }

      const order = rows[0];

      // Format tracking data
      const trackingData = {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        estimatedDeliveryTime: order.estimated_delivery_time,
        deliveryAddress: {
          address: order.delivery_address,
          latitude: order.delivery_latitude,
          longitude: order.delivery_longitude,
          notes: order.delivery_notes
        },
        restaurant: {
          id: order.restaurant_id,
          name: order.restaurant_name,
          latitude: order.restaurant_latitude,
          longitude: order.restaurant_longitude,
          phone: order.restaurant_phone,
          address: order.restaurant_address
        },
        driver: order.driver_id ? {
          id: order.driver_id,
          name: order.driver_name,
          phone: order.driver_phone,
          avatar: order.driver_avatar,
          rating: order.driver_rating
        } : null,
        driverLocation: order.driver_latitude ? {
          lat: order.driver_latitude,
          lng: order.driver_longitude,
          heading: order.driver_heading,
          speed: order.driver_speed,
          updatedAt: order.driver_location_updated
        } : null
      };

      res.json({
        success: true,
        data: trackingData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tính toán ETA của đơn hàng
   */
  async calculateOrderEta(req, res, next) {
    try {
      const { orderId } = req.params;

      // Get order details
      const [orderRows] = await db.execute(`
        SELECT o.*, dl.latitude as driver_lat, dl.longitude as driver_lng
        FROM orders o
        LEFT JOIN driver_locations dl ON o.driver_id = dl.driver_id
        WHERE o.id = ? AND (o.user_id = ? OR o.driver_id = ?)
      `, [orderId, req.user.id, req.user.id]);

      if (orderRows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      const order = orderRows[0];

      if (!order.driver_lat || !order.driver_lng) {
        throw new AppError('Driver location not available', 400);
      }

      const driverLocation = { lat: order.driver_lat, lng: order.driver_lng };
      const destination = { lat: order.delivery_latitude, lng: order.delivery_longitude };

      // Calculate route
      const route = await mapService.calculateRoute(driverLocation, destination);

      // Calculate ETA considering traffic and preparation time
      const currentTime = new Date();
      const estimatedTime = new Date(currentTime.getTime() + route.duration * 1000);

      // Add buffer time for traffic
      const bufferMinutes = this.calculateTrafficBuffer(route.duration);
      estimatedTime.setMinutes(estimatedTime.getMinutes() + bufferMinutes);

      res.json({
        success: true,
        data: {
          estimatedTime: estimatedTime.toISOString(),
          route: route,
          trafficBuffer: bufferMinutes,
          lastCalculated: currentTime.toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy địa chỉ giao hàng của đơn hàng
   */
  async getDeliveryLocation(req, res, next) {
    try {
      const { orderId } = req.params;

      const [rows] = await db.execute(`
        SELECT delivery_address, delivery_latitude, delivery_longitude, delivery_notes
        FROM orders 
        WHERE id = ? AND (user_id = ? OR driver_id = ?)
      `, [orderId, req.user.id, req.user.id]);

      if (rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      res.json({
        success: true,
        data: {
          address: rows[0].delivery_address,
          latitude: rows[0].delivery_latitude,
          longitude: rows[0].delivery_longitude,
          notes: rows[0].delivery_notes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy vị trí driver
   */
  async getDriverLocation(req, res, next) {
    try {
      const { driverId } = req.params;

      const [rows] = await db.execute(`
        SELECT latitude, longitude, heading, speed, accuracy, updated_at
        FROM driver_locations 
        WHERE driver_id = ?
        ORDER BY updated_at DESC 
        LIMIT 1
      `, [driverId]);

      if (rows.length === 0) {
        throw new AppError('Driver location not found', 404);
      }

      res.json({
        success: true,
        data: {
          lat: rows[0].latitude,
          lng: rows[0].longitude,
          heading: rows[0].heading,
          speed: rows[0].speed,
          accuracy: rows[0].accuracy,
          updatedAt: rows[0].updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật vị trí driver
   */
  async updateDriverLocation(req, res, next) {
    try {
      const { driverId } = req.params;
      const { lat, lng, heading, speed, accuracy } = req.body;

      // Verify driver ownership
      if (req.user.id !== driverId && req.user.role !== 'admin') {
        throw new AppError('Access denied', 403);
      }

      await db.execute(`
        INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed, accuracy, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          heading = VALUES(heading),
          speed = VALUES(speed),
          accuracy = VALUES(accuracy),
          updated_at = VALUES(updated_at)
      `, [driverId, lat, lng, heading || null, speed || null, accuracy || null]);

      // Emit real-time update via socket
      req.io?.emit('driver_location_update', {
        driverId,
        location: { lat, lng },
        heading,
        speed,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Driver location updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy vị trí nhà hàng
   */
  async getRestaurantLocation(req, res, next) {
    try {
      const { restaurantId } = req.params;

      const [rows] = await db.execute(`
        SELECT name, address, latitude, longitude, phone
        FROM restaurants 
        WHERE id = ? AND is_active = 1
      `, [restaurantId]);

      if (rows.length === 0) {
        throw new AppError('Restaurant not found', 404);
      }

      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin traffic
   */
  async getTrafficConditions(req, res, next) {
    try {
      const { lat, lng, radius = 5 } = req.query;

      // This would integrate with traffic APIs
      const trafficData = await mapService.getTrafficConditions({ lat, lng }, radius);

      res.json({
        success: true,
        data: trafficData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy delivery zones
   */
  async getDeliveryZones(req, res, next) {
    try {
      const { lat, lng } = req.query;

      const [rows] = await db.execute(`
        SELECT id, name, boundary_coordinates, delivery_fee, min_order_amount
        FROM delivery_zones 
        WHERE ST_Contains(
          ST_GeomFromText(boundary_coordinates), 
          POINT(?, ?)
        )
      `, [lng, lat]);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy delivery heatmap
   */
  async getDeliveryHeatmap(req, res, next) {
    try {
      const { timeRange = 'week' } = req.query;

      let dateFilter = '';
      switch (timeRange) {
        case 'today':
          dateFilter = 'DATE(created_at) = CURDATE()';
          break;
        case 'week':
          dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'month':
          dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
      }

      const [rows] = await db.execute(`
        SELECT 
          delivery_latitude as lat,
          delivery_longitude as lng,
          COUNT(*) as delivery_count,
          AVG(delivery_time_minutes) as avg_delivery_time
        FROM orders 
        WHERE status = 'delivered' AND ${dateFilter}
          AND delivery_latitude IS NOT NULL 
          AND delivery_longitude IS NOT NULL
        GROUP BY 
          ROUND(delivery_latitude, 3),
          ROUND(delivery_longitude, 3)
        ORDER BY delivery_count DESC
        LIMIT 1000
      `);

      res.json({
        success: true,
        data: {
          heatmapData: rows,
          timeRange
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy popular routes
   */
  async getPopularRoutes(req, res, next) {
    try {
      const { restaurantId, timeRange = 'week', limit = 20 } = req.query;

      let query = `
        SELECT 
          r.name as restaurant_name,
          r.latitude as restaurant_lat,
          r.longitude as restaurant_lng,
          o.delivery_latitude as delivery_lat,
          o.delivery_longitude as delivery_lng,
          COUNT(*) as route_count,
          AVG(o.delivery_time_minutes) as avg_delivery_time
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.status = 'delivered'
      `;

      const queryParams = [];

      if (restaurantId) {
        query += ` AND o.restaurant_id = ?`;
        queryParams.push(restaurantId);
      }

      switch (timeRange) {
        case 'today':
          query += ` AND DATE(o.created_at) = CURDATE()`;
          break;
        case 'week':
          query += ` AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)`;
          break;
        case 'month':
          query += ` AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
          break;
      }

      query += `
        GROUP BY o.restaurant_id, 
          ROUND(o.delivery_latitude, 3),
          ROUND(o.delivery_longitude, 3)
        ORDER BY route_count DESC
        LIMIT ?
      `;

      queryParams.push(parseInt(limit));

      const [rows] = await db.execute(query, queryParams);

      res.json({
        success: true,
        data: {
          routes: rows,
          timeRange
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy cấu hình map
   */
  async getMapConfig(req, res, next) {
    try {
      const config = {
        defaultCenter: { lat: 10.8231, lng: 106.6297 }, // Ho Chi Minh City
        defaultZoom: 13,
        maxZoom: 18,
        minZoom: 10,
        mapStyles: [],
        supportedRegions: ['vietnam'],
        features: {
          traffic: true,
          realTimeTracking: true,
          routeOptimization: true,
          heatmaps: true
        }
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy supported regions
   */
  async getSupportedRegions(req, res, next) {
    try {
      const regions = [
        {
          id: 'hcm',
          name: 'Thành phố Hồ Chí Minh',
          center: { lat: 10.8231, lng: 106.6297 },
          bounds: {
            north: 11.1617,
            south: 10.3541,
            east: 107.0639,
            west: 106.3619
          }
        },
        {
          id: 'hanoi',
          name: 'Hà Nội',
          center: { lat: 21.0285, lng: 105.8542 },
          bounds: {
            north: 21.3952,
            south: 20.7228,
            east: 106.0219,
            west: 105.6144
          }
        }
      ];

      res.json({
        success: true,
        data: regions
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async calculateDeliveryEstimate(userLocation, restaurantLocation, preparationTime) {
    try {
      const route = await mapService.calculateRoute(restaurantLocation, userLocation);
      const travelTime = Math.ceil(route.duration / 60); // Convert to minutes
      const totalTime = preparationTime + travelTime + 5; // 5 minutes buffer

      return {
        preparation_time: preparationTime,
        travel_time: travelTime,
        buffer_time: 5,
        total_time: totalTime,
        distance: route.distance
      };
    } catch (error) {
      // Fallback calculation based on straight-line distance
      const distance = geoUtils.calculateDistance(restaurantLocation, userLocation);
      const estimatedTravelTime = Math.ceil(distance * 3); // 3 minutes per km
      
      return {
        preparation_time: preparationTime,
        travel_time: estimatedTravelTime,
        buffer_time: 5,
        total_time: preparationTime + estimatedTravelTime + 5,
        distance: distance * 1000 // Convert to meters
      };
    }
  }

  formatDeliveryTimeRange(totalMinutes) {
    const minTime = Math.max(totalMinutes - 5, 15);
    const maxTime = totalMinutes + 10;
    return `${minTime}-${maxTime} phút`;
  }

  calculateTrafficBuffer(baseDuration) {
    const currentHour = new Date().getHours();
    
    // Rush hour adjustments
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      return Math.ceil(baseDuration * 0.3 / 60); // 30% extra time in minutes
    }
    
    // Regular traffic
    return Math.ceil(baseDuration * 0.1 / 60); // 10% extra time in minutes
  }
}

module.exports = new MapController();