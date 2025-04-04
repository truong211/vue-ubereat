// Recommended fix for fetchRestaurants function in SearchPage.vue

// Fetch restaurants
const fetchRestaurants = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = {
      q: searchQuery.value,
      cuisine: searchFilters.value.cuisines.join(','),
      priceRange: searchFilters.value.price.join(','),
      minRating: searchFilters.value.rating,
      sort: sortBy.value,
      page: currentPage.value,
      limit: 10 // Assuming a default limit
    };
    
    // Include location coordinates if available
    if (userLocation.value) {
      params.lat = userLocation.value.lat;
      params.lng = userLocation.value.lng;
    }
    
    console.log('Fetching restaurants with params:', params);
    const response = await restaurantAPI.getAllRestaurants(params);
    console.log('API Response:', response);
    
    // Initialize restaurants as empty array by default
    restaurants.value = [];
    
    // Check if response.data exists and handle different response formats
    if (response && response.data) {
      console.log('Response data type:', typeof response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        console.log('Response.data is an array with length:', response.data.length);
        restaurants.value = response.data;
        totalResults.value = response.data.length;
      } else if (response.data.restaurants && Array.isArray(response.data.restaurants)) {
        console.log('Response has restaurants array with length:', response.data.restaurants.length);
        restaurants.value = response.data.restaurants;
        totalResults.value = response.data.total || response.data.restaurants.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Response has data array with length:', response.data.data.length);
        restaurants.value = response.data.data;
        totalResults.value = response.data.total || response.data.data.length;
      } else if (response.data.status === 'success' && response.data.data) {
        // Additional check for status-based response format
        if (Array.isArray(response.data.data)) {
          console.log('Response has success status with data array:', response.data.data.length);
          restaurants.value = response.data.data;
          totalResults.value = response.data.total || response.data.data.length;
        } else if (response.data.data.restaurants && Array.isArray(response.data.data.restaurants)) {
          console.log('Response has nested restaurants array:', response.data.data.restaurants.length);
          restaurants.value = response.data.data.restaurants;
          totalResults.value = response.data.total || response.data.data.restaurants.length;
        } else {
          console.warn('Unexpected success response format:', response.data);
        }
      } else {
        // Fallback to empty array if no valid format is found
        console.warn('Unexpected API response format:', response.data);
      }
    } else {
      // Handle case where response or response.data is undefined
      console.warn('No data returned from API');
    }
    
    // Ensure restaurants.value is an array (defensive programming)
    if (!Array.isArray(restaurants.value)) {
      console.warn('Restaurants value is not an array after processing, resetting to empty array');
      restaurants.value = [];
    }
    
    console.log('Final restaurants array:', restaurants.value);
    totalResults.value = restaurants.value.length;
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    error.value = 'Could not load restaurants. Please try again later.';
    // Ensure restaurants.value is always an array even on error
    restaurants.value = [];
    totalResults.value = 0;
  } finally {
    loading.value = false;
  }
}; 