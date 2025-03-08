import { ref, computed, watch } from 'vue'
import { useMapService } from './useMapService'
import debounce from 'lodash/debounce'

export interface SearchFilters {
  query: string
  location: string
  category: string | null
  priceRange: string | null
  deliveryTime: number | null
  minRating: number | null
  freeDelivery: boolean
  openNow: boolean
  deals: boolean
  maxDistance: number | null
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  priceRange: string
  deliveryTime: number
  distance: number
  image: string
  location: {
    lat: number
    lng: number
  }
}

export function useRestaurantSearch() {
  const mapService = useMapService()
  const searchQuery = ref('')
  const locationQuery = ref('')
  const suggestions = ref<string[]>([])
  const locationSuggestions = ref<string[]>([])
  const restaurants = ref<Restaurant[]>([])
  const loading = ref(false)
  const userLocation = ref<{ lat: number; lng: number } | null>(null)

  const filters = ref<SearchFilters>({
    query: '',
    location: '',
    category: null,
    priceRange: null,
    deliveryTime: null,
    minRating: null,
    freeDelivery: false,
    openNow: false,
    deals: false,
    maxDistance: null
  })

  // Debounced function for search suggestions
  const fetchSuggestions = debounce(async (query: string) => {
    if (query.length < 2) {
      suggestions.value = []
      return
    }

    try {
      // TODO: Implement API call to get restaurant and cuisine suggestions
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      suggestions.value = data.suggestions
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      suggestions.value = []
    }
  }, 300)

  // Debounced function for location suggestions
  const fetchLocationSuggestions = debounce(async (query: string) => {
    if (query.length < 3) {
      locationSuggestions.value = []
      return
    }

    try {
      const predictions = await mapService.getPlacePredictions(query)
      locationSuggestions.value = predictions.map(p => p.description)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      locationSuggestions.value = []
    }
  }, 300)

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      userLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      // Reverse geocode to get address
      const address = await mapService.reverseGeocode(userLocation.value)
      locationQuery.value = address
      filters.value.location = address
      
      return userLocation.value
    } catch (error) {
      console.error('Error getting current location:', error)
      return null
    }
  }

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return mapService.calculateDistance(lat1, lon1, lat2, lon2)
  }

  // Filter restaurants based on current filters
  const filteredRestaurants = computed(() => {
    return restaurants.value.filter(restaurant => {
      // Apply all filters
      if (filters.value.category && restaurant.cuisine !== filters.value.category) return false
      if (filters.value.priceRange && restaurant.priceRange !== filters.value.priceRange) return false
      if (filters.value.deliveryTime && restaurant.deliveryTime > filters.value.deliveryTime) return false
      if (filters.value.minRating && restaurant.rating < filters.value.minRating) return false
      if (filters.value.maxDistance && restaurant.distance > filters.value.maxDistance) return false
      
      // Text search
      if (filters.value.query) {
        const searchLower = filters.value.query.toLowerCase()
        const nameMatch = restaurant.name.toLowerCase().includes(searchLower)
        const cuisineMatch = restaurant.cuisine.toLowerCase().includes(searchLower)
        if (!nameMatch && !cuisineMatch) return false
      }

      return true
    })
  })

  // Watch for changes in search query
  watch(() => searchQuery.value, (newQuery) => {
    filters.value.query = newQuery
    fetchSuggestions(newQuery)
  })

  // Watch for changes in location query
  watch(() => locationQuery.value, (newLocation) => {
    filters.value.location = newLocation
    fetchLocationSuggestions(newLocation)
  })

  return {
    searchQuery,
    locationQuery,
    suggestions,
    locationSuggestions,
    restaurants,
    loading,
    filters,
    filteredRestaurants,
    getCurrentLocation,
    calculateDistance
  }
}