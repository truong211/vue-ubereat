import { ref, computed, watch } from 'vue';
import { useMapService } from './useMapService';

export function useRestaurantSearch() {
  const { calculateDistance, formatDistance } = useMapService();
  
  // State
  const restaurants = ref([]);
  const filteredRestaurants = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const userLocation = ref(null);
  const pagination = ref({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalItems: 0
  });

  // Filters
  const defaultFilters = {
    search: '',
    cuisine: null,
    sortBy: 'rating',
    rating: null,
    deliveryTime: null,
    distance: null,
    priceRange: null,
  };
  
  const filters = ref({...defaultFilters});
  
  // Filter options
  const cuisineOptions = [
    { title: 'All Cuisines', value: null },
    { title: 'Italian', value: 'Italian' },
    { title: 'Chinese', value: 'Chinese' },
    { title: 'Japanese', value: 'Japanese' },
    { title: 'Mexican', value: 'Mexican' },
    { title: 'Indian', value: 'Indian' },
    { title: 'Thai', value: 'Thai' },
    { title: 'American', value: 'American' },
    { title: 'Fast Food', value: 'Fast Food' }
  ];
  
  const sortOptions = [
    { title: 'Rating (High to Low)', value: 'rating' },
    { title: 'Name (A-Z)', value: 'name_asc' },
    { title: 'Name (Z-A)', value: 'name_desc' },
    { title: 'Distance (Near to Far)', value: 'distance' },
    { title: 'Delivery Time (Fast to Slow)', value: 'delivery_time' }
  ];
  
  const ratingOptions = [
    { title: 'Any Rating', value: null },
    { title: '4.5+', value: 4.5 },
    { title: '4.0+', value: 4.0 },
    { title: '3.5+', value: 3.5 },
    { title: '3.0+', value: 3.0 }
  ];
  
  const deliveryTimeOptions = [
    { title: 'Any Time', value: null },
    { title: 'Under 30 min', value: 30 },
    { title: 'Under 45 min', value: 45 },
    { title: 'Under 60 min', value: 60 }
  ];
  
  const distanceOptions = [
    { title: 'Any Distance', value: null },
    { title: 'Under 1 km', value: 1 },
    { title: 'Under 3 km', value: 3 },
    { title: 'Under 5 km', value: 5 },
    { title: 'Under 10 km', value: 10 }
  ];
  
  const priceRangeOptions = [
    { title: 'Any Price', value: null },
    { title: '$', value: 'low' },
    { title: '$$', value: 'medium' },
    { title: '$$$', value: 'high' }
  ];
  
  /**
   * Search for restaurants based on current filters
   * This would typically make an API call to the backend
   * @param {Object} params - Optional filter parameters to override current filters
   * @returns {Promise} Promise resolving to filtered restaurant list
   */
  const searchRestaurants = async (params) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Apply any new params to filters
      if (params) {
        filters.value = {
          ...filters.value,
          ...params
        };
      }
      
      // In a real app, you would call your API here
      // const response = await axios.get('/api/restaurants', { params: filters.value });
      // restaurants.value = response.data.restaurants;
      
      // For now, let's simulate API filtering and sorting
      const results = simulateApiFiltering(restaurants.value, filters.value);
      
      // Update filtered results
      filteredRestaurants.value = results;
      
      // Simulate pagination
      pagination.value.totalItems = results.length;
      pagination.value.totalPages = Math.ceil(results.length / pagination.value.limit);
      
      return results;
    } catch (err) {
      error.value = 'Failed to search restaurants';
      console.error('Restaurant search error:', err);
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Simulate API filtering and sorting (for demo purposes)
   * In a real app, this would be done by your backend API
   * @param {Array} data - Restaurant data to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered restaurant data
   */
  const simulateApiFiltering = (data, filters) => {
    let results = [...data];
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) || 
        (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by cuisine
    if (filters.cuisine) {
      results = results.filter(restaurant => 
        restaurant.cuisine === filters.cuisine
      );
    }
    
    // Filter by category
    if (filters.category_id) {
      results = results.filter(restaurant => 
        restaurant.category_ids?.includes(filters.category_id)
      );
    }
    
    // Filter by minimum rating
    if (filters.rating) {
      results = results.filter(restaurant => 
        (restaurant.rating || 0) >= filters.rating
      );
    }
    
    // Filter by maximum delivery time
    if (filters.deliveryTime) {
      results = results.filter(restaurant => {
        const deliveryTime = typeof restaurant.delivery_time === 'string' 
          ? parseInt(restaurant.delivery_time.split('-')[1] || restaurant.delivery_time, 10) 
          : restaurant.delivery_time;
        return (deliveryTime || 60) <= filters.deliveryTime;
      });
    }
    
    // Filter by maximum distance
    if (filters.distance && userLocation.value) {
      results = results.filter(restaurant => 
        (restaurant.distance || 999) <= filters.distance
      );
    }
    
    // Filter by price range
    if (filters.priceRange) {
      results = results.filter(restaurant => 
        restaurant.price_range === filters.priceRange
      );
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'rating':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'name_asc':
          results.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          results.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'distance':
          if (userLocation.value) {
            results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
          }
          break;
        case 'delivery_time':
          results.sort((a, b) => {
            const aTime = typeof a.delivery_time === 'string' 
              ? parseInt(a.delivery_time.split('-')[0] || a.delivery_time, 10) 
              : a.delivery_time || 60;
            const bTime = typeof b.delivery_time === 'string' 
              ? parseInt(b.delivery_time.split('-')[0] || b.delivery_time, 10) 
              : b.delivery_time || 60;
            return aTime - bTime;
          });
          break;
      }
    }
    
    return results;
  };
  
  /**
   * Update user's location and recalculate distances
   * @param {Object} location - User location with lat and lng properties
   */
  const setUserLocation = (location) => {
    userLocation.value = location;
    
    // Update restaurant distances
    if (restaurants.value.length > 0) {
      calculateRestaurantDistances();
    }
  };
  
  /**
   * Calculate distances between user and all restaurants
   */
  const calculateRestaurantDistances = () => {
    if (!userLocation.value) return;
    
    restaurants.value = restaurants.value.map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const distance = calculateDistance(
          userLocation.value,
          {
            lat: parseFloat(restaurant.latitude),
            lng: parseFloat(restaurant.longitude)
          }
        );
        return { ...restaurant, distance };
      }
      return restaurant;
    });
    
    filteredRestaurants.value = filteredRestaurants.value.map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const distance = calculateDistance(
          userLocation.value,
          {
            lat: parseFloat(restaurant.latitude),
            lng: parseFloat(restaurant.longitude)
          }
        );
        return { ...restaurant, distance };
      }
      return restaurant;
    });
  };
  
  /**
   * Reset filters to default values
   */
  const resetFilters = () => {
    filters.value = { ...defaultFilters };
    searchRestaurants();
  };
  
  /**
   * Load more restaurants (pagination)
   */
  const loadMore = async () => {
    pagination.value.page += 1;
    return searchRestaurants({
      ...filters.value,
      page: pagination.value.page
    });
  };
  
  /**
   * Change to a specific page
   * @param {number} page - Page number to load
   */
  const changePage = (page) => {
    pagination.value.page = page;
    return searchRestaurants({
      ...filters.value,
      page
    });
  };
  
  // Initialize when user location changes
  watch(userLocation, () => {
    if (userLocation.value) {
      // Add coordinates to filters
      filters.value.latitude = userLocation.value.lat;
      filters.value.longitude = userLocation.value.lng;
      
      // Recalculate distances
      calculateRestaurantDistances();
      
      // Reapply filters with the new location
      searchRestaurants();
    }
  });
  
  // Export composable functions and state
  return {
    // State
    restaurants,
    filteredRestaurants,
    loading,
    error,
    userLocation,
    pagination,
    filters,
    
    // Options
    cuisineOptions,
    sortOptions,
    ratingOptions,
    deliveryTimeOptions,
    distanceOptions,
    priceRangeOptions,
    
    // Methods
    searchRestaurants,
    setUserLocation,
    calculateRestaurantDistances,
    resetFilters,
    loadMore,
    changePage,
    
    // Utilities
    formatDistance
  };
}