import axios from 'axios';
import mapService from './map.service';
import { API_URL } from '@/config';

class RestaurantDiscoveryService {
  constructor() {
    this.apiUrl = API_URL;
    this.cache = new Map();
    this.maxDistance = 10; // km
    this.defaultRadius = 5; // km
  }

  /**
   * Tìm nhà hàng gần vị trí người dùng
   * @param {Object} userLocation - {lat, lng} vị trí người dùng
   * @param {Object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Array>} Danh sách nhà hàng
   */
  async findNearbyRestaurants(userLocation, options = {}) {
    const {
      radius = this.defaultRadius,
      cuisineType = null,
      rating = null,
      priceRange = null,
      deliveryFee = null,
      includeUnavailable = false,
      sortBy = 'distance', // distance, rating, deliveryTime, deliveryFee
      limit = 50
    } = options;

    try {
      // Kiểm tra cache
      const cacheKey = this.generateCacheKey(userLocation, options);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Gọi API backend để lấy nhà hàng
      const response = await axios.get(`${this.apiUrl}/api/restaurants/nearby`, {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius,
          cuisineType,
          rating,
          priceRange,
          deliveryFee,
          includeUnavailable,
          sortBy,
          limit
        }
      });

      const restaurants = response.data.restaurants;

      // Tính toán khoảng cách và thời gian giao hàng cho từng nhà hàng
      const enrichedRestaurants = await this.calculateDeliveryMetrics(
        userLocation, 
        restaurants
      );

      // Cache kết quả
      this.cache.set(cacheKey, enrichedRestaurants);

      return enrichedRestaurants;
    } catch (error) {
      console.error('Error finding nearby restaurants:', error);
      throw error;
    }
  }

  /**
   * Tính toán khoảng cách và thời gian giao hàng
   * @param {Object} userLocation - Vị trí người dùng
   * @param {Array} restaurants - Danh sách nhà hàng
   * @returns {Promise<Array>} Nhà hàng với thông tin giao hàng
   */
  async calculateDeliveryMetrics(userLocation, restaurants) {
    const enrichedRestaurants = [];

    // Sử dụng batch processing để tối ưu API calls
    const batchSize = 10;
    for (let i = 0; i < restaurants.length; i += batchSize) {
      const batch = restaurants.slice(i, i + batchSize);
      const batchPromises = batch.map(async (restaurant) => {
        try {
          // Tính khoảng cách đường chim bay
          const straightLineDistance = this.calculateStraightLineDistance(
            userLocation,
            { lat: restaurant.latitude, lng: restaurant.longitude }
          );

          // Lấy thông tin route từ map service
          const routeInfo = await mapService.getRoute(
            userLocation,
            { lat: restaurant.latitude, lng: restaurant.longitude },
            { mode: 'driving' }
          );

          // Tính thời gian giao hàng ước tính
          const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
            routeInfo.duration,
            restaurant.averagePreparationTime || 20
          );

          return {
            ...restaurant,
            distance: routeInfo.distance / 1000, // Convert to km
            distanceText: routeInfo.distanceText,
            straightLineDistance,
            drivingDuration: routeInfo.duration / 60, // Convert to minutes
            drivingDurationText: routeInfo.durationText,
            estimatedDeliveryTime,
            deliveryTimeRange: this.calculateDeliveryTimeRange(estimatedDeliveryTime),
            routePolyline: routeInfo.points,
            isDeliverable: this.checkDeliverability(restaurant, routeInfo.distance / 1000)
          };
        } catch (error) {
          console.warn(`Could not calculate metrics for restaurant ${restaurant.id}:`, error);
          
          // Fallback to straight line distance if routing fails
          const straightLineDistance = this.calculateStraightLineDistance(
            userLocation,
            { lat: restaurant.latitude, lng: restaurant.longitude }
          );

          return {
            ...restaurant,
            distance: straightLineDistance,
            distanceText: `${straightLineDistance.toFixed(1)} km`,
            straightLineDistance,
            drivingDuration: straightLineDistance * 4, // Rough estimate: 4 min per km
            drivingDurationText: `${Math.round(straightLineDistance * 4)} phút`,
            estimatedDeliveryTime: Math.round(straightLineDistance * 4) + (restaurant.averagePreparationTime || 20),
            deliveryTimeRange: this.calculateDeliveryTimeRange(Math.round(straightLineDistance * 4) + 20),
            routePolyline: null,
            isDeliverable: this.checkDeliverability(restaurant, straightLineDistance)
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      enrichedRestaurants.push(...batchResults);
    }

    return enrichedRestaurants;
  }

  /**
   * Tính khoảng cách đường chim bay
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {Number} Khoảng cách (km)
   */
  calculateStraightLineDistance(point1, point2) {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * 
              Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Chuyển đổi độ sang radian
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Tính thời gian giao hàng ước tính
   * @param {Number} drivingTime - Thời gian lái xe (giây)
   * @param {Number} preparationTime - Thời gian chuẩn bị (phút)
   * @returns {Number} Thời gian giao hàng (phút)
   */
  calculateEstimatedDeliveryTime(drivingTime, preparationTime) {
    const drivingMinutes = drivingTime / 60;
    const bufferTime = 5; // Thời gian buffer
    return Math.round(preparationTime + drivingMinutes + bufferTime);
  }

  /**
   * Tính khoảng thời gian giao hàng
   * @param {Number} estimatedTime - Thời gian ước tính (phút)
   * @returns {Object} Khoảng thời gian
   */
  calculateDeliveryTimeRange(estimatedTime) {
    const minTime = Math.max(estimatedTime - 5, 15); // Tối thiểu 15 phút
    const maxTime = estimatedTime + 10;
    
    return {
      min: minTime,
      max: maxTime,
      text: `${minTime}-${maxTime} phút`
    };
  }

  /**
   * Kiểm tra khả năng giao hàng
   * @param {Object} restaurant - Thông tin nhà hàng
   * @param {Number} distance - Khoảng cách (km)
   * @returns {Boolean} Có thể giao hàng
   */
  checkDeliverability(restaurant, distance) {
    if (!restaurant.isOpen) return false;
    if (distance > restaurant.maxDeliveryRadius) return false;
    if (distance > this.maxDistance) return false;
    return true;
  }

  /**
   * Tạo cache key
   */
  generateCacheKey(userLocation, options) {
    const locationKey = `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
    const optionsKey = JSON.stringify(options);
    return `${locationKey}-${optionsKey}`;
  }

  /**
   * Tìm kiếm nhà hàng theo từ khóa
   * @param {String} query - Từ khóa tìm kiếm
   * @param {Object} userLocation - Vị trí người dùng
   * @param {Object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Array>} Kết quả tìm kiếm
   */
  async searchRestaurants(query, userLocation, options = {}) {
    try {
      const response = await axios.get(`${this.apiUrl}/api/restaurants/search`, {
        params: {
          q: query,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: options.radius || this.defaultRadius,
          ...options
        }
      });

      const restaurants = response.data.restaurants;
      return await this.calculateDeliveryMetrics(userLocation, restaurants);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }
  }

  /**
   * Lấy nhà hàng theo danh mục
   * @param {String} category - Danh mục ẩm thực
   * @param {Object} userLocation - Vị trí người dùng
   * @param {Object} options - Tùy chọn
   * @returns {Promise<Array>} Nhà hàng theo danh mục
   */
  async getRestaurantsByCategory(category, userLocation, options = {}) {
    return await this.findNearbyRestaurants(userLocation, {
      ...options,
      cuisineType: category
    });
  }

  /**
   * Lấy nhà hàng được khuyến nghị
   * @param {Object} userLocation - Vị trí người dùng
   * @param {Object} userPreferences - Sở thích người dùng
   * @returns {Promise<Array>} Nhà hàng được khuyến nghị
   */
  async getRecommendedRestaurants(userLocation, userPreferences = {}) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/restaurants/recommendations`, {
        location: userLocation,
        preferences: userPreferences
      });

      const restaurants = response.data.restaurants;
      return await this.calculateDeliveryMetrics(userLocation, restaurants);
    } catch (error) {
      console.error('Error getting recommended restaurants:', error);
      throw error;
    }
  }

  /**
   * Xóa cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const restaurantDiscoveryService = new RestaurantDiscoveryService();
export default restaurantDiscoveryService;