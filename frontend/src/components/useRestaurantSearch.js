import { computed } from 'vue';
import { useStore } from 'vuex';
import { useMapService } from './useMapService';

export function useRestaurantSearch() {
  const store = useStore();
  const { calculateDistance, formatDistance } = useMapService();

  // Filter options (static data)
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
    { title: '$', value: '$' },
    { title: '$$', value: '$$' },
    { title: '$$$', value: '$$$' },
    { title: '$$$$', value: '$$$$' }
  ];

  // Computed properties mapped to Vuex state
  const restaurants = computed(() => {
    console.log('[Search Debug] Accessing restaurants from store:',
                store.state.restaurants.restaurants.length);
    return store.state.restaurants.restaurants;
  });
  const filteredRestaurants = computed(() => {
    const results = store.getters['restaurants/getFilteredRestaurants'];
    console.log('[Search Debug] Getting filtered restaurants:', results.length);
    return results;
  });
  const loading = computed(() => store.state.restaurants.loading);
  const error = computed(() => store.state.restaurants.error);
  const userLocation = computed(() => store.state.restaurants.userLocation);

  // Methods mapped to Vuex actions
  const searchRestaurants = async (params) => {
    console.log('[Search Debug] Searching restaurants with params:', params);
    try {
      await store.dispatch('restaurants/fetchRestaurants', params);
      const results = store.state.restaurants.restaurants;
      console.log('[Search Debug] Search complete, found restaurants:', results.length);
      return results;
    } catch (err) {
      console.error('Restaurant search error:', err);
      return [];
    }
  };

  const setUserLocation = (location) => {
    store.dispatch('restaurants/setUserLocation', location);
  };

  const calculateRestaurantDistances = () => {
    if (!userLocation.value) return;

    const updatedRestaurants = restaurants.value.map(restaurant => {
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

    store.commit('restaurants/SET_RESTAURANTS', updatedRestaurants);
  };

  const resetFilters = () => {
    store.dispatch('restaurants/resetFilters');
  };

  const loadMore = async () => {
    return store.dispatch('restaurants/loadMoreRestaurants');
  };

  const changePage = (page) => {
    return store.dispatch('restaurants/changePage', page);
  };

  // Export composable functions and state
  return {
    // State (now computed from Vuex)
    restaurants,
    filteredRestaurants,
    loading,
    error,
    userLocation,

    // Options (static)
    cuisineOptions,
    sortOptions,
    ratingOptions,
    deliveryTimeOptions,
    distanceOptions,
    priceRangeOptions,

    // Methods (now mapped to Vuex actions)
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