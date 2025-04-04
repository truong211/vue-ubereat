import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { restaurantAPI } from '@/services/api.service';
import RestaurantCard from '@/components/restaurant/RestaurantCard.vue';
import FilterSidebar from '@/components/search/FilterSidebar.vue';
import SortDropdown from '@/components/common/SortDropdown.vue';
import LocationPicker from '@/components/common/LocationPicker.vue';

export default {
  components: {
    RestaurantCard,
    FilterSidebar,
    SortDropdown,
    LocationPicker
  },
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    
    // Define reactive state with proper initialization
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const locationQuery = ref('');
    const restaurants = ref([]); // Initialize as empty array
    const filteredRestaurants = ref([]); // Initialize as empty array
    const currentPage = ref(1);
    const totalResults = ref(0);
    const sortBy = ref('rating');
    const userLocation = ref(null);
    
    // Define search filters with safe defaults
    const searchFilters = reactive({
      cuisines: [],
      price: [1, 5],
      rating: 0,
      distance: 50,
      deliveryTime: null,
      specialOffers: false
    });
    
    // Safely initialize the cuisines list
    const availableCuisines = ref([]);
    
    // Watch for changes in restaurants array to ensure it's always an array
    watch(restaurants, (newValue) => {
      if (!Array.isArray(newValue)) {
        console.warn('restaurants.value is not an array, resetting to empty array');
        restaurants.value = [];
      }
    });
    
    // Safe initialization on mount
    onMounted(async () => {
      // Ensure restaurants is an array before any operations
      if (!Array.isArray(restaurants.value)) {
        restaurants.value = [];
      }
      
      try {
        // Get initial params from URL if available
        if (route.query.q) {
          searchQuery.value = route.query.q;
        }
        
        if (route.query.location) {
          locationQuery.value = route.query.location;
        }
        
        // Fetch initial data
        await fetchRestaurants();
        
        // Log initialization state for debugging
        console.log('Initial restaurants state:', {
          type: typeof restaurants.value,
          isArray: Array.isArray(restaurants.value),
          length: restaurants.value ? restaurants.value.length : 0,
          value: restaurants.value
        });
      } catch (err) {
        console.error('Error during initialization:', err);
        error.value = 'Failed to initialize search. Please refresh the page.';
        // Ensure arrays are properly initialized even on error
        restaurants.value = [];
        filteredRestaurants.value = [];
      }
    });
    
    // Rest of your component code...
  }
}; 