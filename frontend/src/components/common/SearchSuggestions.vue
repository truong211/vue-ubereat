&lt;template>
  <div class="search-suggestions">
    <v-menu
      v-model="showSuggestions"
      :close-on-content-click="false"
      location="bottom"
      offset="5"
      max-height="400"
      width="100%"
      eager
    >
      <template v-slot:activator="{ props }">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search restaurants, cuisines, or dishes..."
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          :loading="loading"
          v-bind="props"
          @focus="handleFocus"
          @update:model-value="handleSearch"
          @clear="handleClear"
        >
          <template v-slot:prepend-inner>
            <v-icon>mdi-magnify</v-icon>
          </template>
        </v-text-field>
      </template>

      <v-card v-if="searchQuery || recentSearches.length > 0">
        <!-- Recent Searches -->
        <div v-if="!searchQuery && recentSearches.length > 0">
          <v-list-subheader>Recent Searches</v-list-subheader>
          <v-list density="compact">
            <v-list-item
              v-for="(search, index) in recentSearches"
              :key="index"
              :value="search"
              @click="selectRecentSearch(search)"
            >
              <template v-slot:prepend>
                <v-icon color="grey">mdi-history</v-icon>
              </template>
              <v-list-item-title>{{ search }}</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="clearRecentSearches">
              <v-list-item-title class="text-caption">Clear History</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <!-- Search Results -->
        <div v-else-if="suggestions.length > 0">
          <v-list-subheader v-if="suggestions.restaurants.length > 0">Restaurants</v-list-subheader>
          <v-list density="compact">
            <v-list-item
              v-for="restaurant in suggestions.restaurants"
              :key="'r' + restaurant.id"
              @click="selectSuggestion('restaurant', restaurant)"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-store</v-icon>
              </template>
              <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider v-if="suggestions.cuisines.length > 0"></v-divider>
          <v-list-subheader v-if="suggestions.cuisines.length > 0">Cuisines</v-list-subheader>
          <v-list density="compact">
            <v-list-item
              v-for="cuisine in suggestions.cuisines"
              :key="'c' + cuisine.id"
              @click="selectSuggestion('cuisine', cuisine)"
            >
              <template v-slot:prepend>
                <v-icon color="success">mdi-food-variant</v-icon>
              </template>
              <v-list-item-title>{{ cuisine.name }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider v-if="suggestions.dishes.length > 0"></v-divider>
          <v-list-subheader v-if="suggestions.dishes.length > 0">Dishes</v-list-subheader>
          <v-list density="compact">
            <v-list-item
              v-for="dish in suggestions.dishes"
              :key="'d' + dish.id"
              @click="selectSuggestion('dish', dish)"
            >
              <template v-slot:prepend>
                <v-icon color="warning">mdi-food</v-icon>
              </template>
              <v-list-item-title>{{ dish.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ dish.restaurantName }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- No Results -->
        <v-card-text v-else-if="searchQuery && !loading" class="text-center py-4">
          <v-icon size="40" color="grey-lighten-1">mdi-magnify-remove</v-icon>
          <div class="text-body-1 mt-2">No matching results found</div>
          <div class="text-caption text-medium-emphasis">Try different keywords</div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import { useDebounce } from '@/composables/useDebounce';
import { restaurantService } from '@/services/restaurant.service';

export default {
  name: 'SearchSuggestions',

  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },

  emits: ['update:model-value', 'select'],

  setup(props, { emit }) {
    const searchQuery = ref(props.modelValue);
    const showSuggestions = ref(false);
    const loading = ref(false);
    const suggestions = ref({
      restaurants: [],
      cuisines: [],
      dishes: []
    });
    const recentSearches = ref(
      JSON.parse(localStorage.getItem('recentSearches') || '[]')
    );

    // Update local searchQuery when prop changes
    watch(() => props.modelValue, (newValue) => {
      searchQuery.value = newValue;
    });

    // Update parent when local value changes
    watch(searchQuery, (newValue) => {
      emit('update:model-value', newValue);
    });

    const handleSearch = useDebounce(async (query) => {
      if (!query || query.length < 2) {
        suggestions.value = { restaurants: [], cuisines: [], dishes: [] };
        return;
      }

      loading.value = true;
      try {
        suggestions.value = await restaurantService.getSearchSuggestions(query);
      } catch (error) {
        console.error('Search suggestions error:', error);
      } finally {
        loading.value = false;
      }
    }, 300);

    const selectSuggestion = (type, item) => {
      showSuggestions.value = false;
      searchQuery.value = item.name;

      // Add to recent searches
      const search = item.name;
      if (!recentSearches.value.includes(search)) {
        recentSearches.value.unshift(search);
        if (recentSearches.value.length > 5) {
          recentSearches.value.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value));
      }

      emit('select', { type, item });
    };

    const selectRecentSearch = (search) => {
      showSuggestions.value = false;
      searchQuery.value = search;
      emit('select', { type: 'text', item: { name: search } });
    };

    const clearRecentSearches = () => {
      recentSearches.value = [];
      localStorage.removeItem('recentSearches');
      showSuggestions.value = false;
    };

    const handleFocus = () => {
      showSuggestions.value = true;
    };

    const handleClear = () => {
      searchQuery.value = '';
      suggestions.value = { restaurants: [], cuisines: [], dishes: [] };
      showSuggestions.value = false;
      emit('select', null);
    };

    return {
      searchQuery,
      showSuggestions,
      loading,
      suggestions,
      recentSearches,
      handleSearch,
      selectSuggestion,
      selectRecentSearch,
      clearRecentSearches,
      handleFocus,
      handleClear
    };
  }
};
</script>

<style scoped>
.search-suggestions {
  position: relative;
  width: 100%;
}
</style>