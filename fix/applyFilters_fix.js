// Recommended fix for SearchPage.vue

// Apply filters
const applyFilters = () => {
  loading.value = true;
  
  // Enhanced defensive check for restaurants.value
  if (!restaurants.value || !Array.isArray(restaurants.value)) {
    console.warn('Restaurants data is not an array:', restaurants.value);
    restaurants.value = [];
  }
  
  // Use a try-catch block to handle any potential issues with the spread operator
  let results = [];
  try {
    results = [...restaurants.value];
  } catch (error) {
    console.error('Error spreading restaurants array:', error);
    results = [];
  }
  
  // Continue with filtering safely
  if (searchQuery.value && results.length > 0) {
    const query = searchQuery.value.toLowerCase();
    results = results.filter(restaurant => 
      restaurant && restaurant.name && restaurant.name.toLowerCase().includes(query) || 
      (restaurant && restaurant.cuisineType && restaurant.cuisineType.toLowerCase().includes(query))
    );
  }
  
  // Filter by cuisines with null checks
  if (searchFilters.value.cuisines.length > 0 && results.length > 0) {
    results = results.filter(restaurant => 
      restaurant && restaurant.cuisineType && searchFilters.value.cuisines.includes(restaurant.cuisineType)
    );
  }
  
  // Add null checks to all other filters
  if (results.length > 0) {
    // Filter by price range
    results = results.filter(restaurant => 
      restaurant && restaurant.priceRange && 
      restaurant.priceRange >= searchFilters.value.price[0] && 
      restaurant.priceRange <= searchFilters.value.price[1]
    );
    
    // Filter by rating
    if (searchFilters.value.rating > 0) {
      results = results.filter(restaurant => 
        restaurant && restaurant.rating && restaurant.rating >= searchFilters.value.rating
      );
    }
    
    // Filter by distance
    results = results.filter(restaurant => 
      restaurant && restaurant.distance !== undefined && restaurant.distance <= searchFilters.value.distance
    );
    
    // Filter by delivery time
    if (searchFilters.value.deliveryTime) {
      results = results.filter(restaurant => 
        restaurant && restaurant.deliveryTime && restaurant.deliveryTime <= searchFilters.value.deliveryTime
      );
    }
    
    // Filter by special offers
    if (searchFilters.value.specialOffers) {
      results = results.filter(restaurant => 
        restaurant && restaurant.specialOffer !== null && restaurant.specialOffer !== undefined
      );
    }
  }
  
  // Apply sorting safely
  if (results.length > 0) {
    applySorting(results);
  }
  
  // Update total results
  totalResults.value = results.length;
  
  // Set filtered results
  filteredRestaurants.value = results;
  
  loading.value = false;
};
