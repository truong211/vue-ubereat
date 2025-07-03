import axios from 'axios'

/**
 * Fetch nearby restaurants from backend.
 * The backend should expose GET /api/restaurants/nearby?lat=..&lng=..&radius=..
 * and return an array of restaurants containing: id, name, lat, lng, thumbnail, rating, reviewCount, cuisineType, deliveryRadius, popularity …
 *
 * Until the backend is ready, this function falls back to a mock dataset so the
 * map can render immediately during local development.
 */
export async function fetchNearbyRestaurants({ lat, lng, radiusKm = 5 }) {
  try {
    const { data } = await axios.get('/api/restaurants/nearby', {
      params: { lat, lng, radius: radiusKm }
    })
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[restaurantService] Falling back to mocked data because request failed:', err?.message)

    // Simple mock: generate 10 restaurants in a circle around the user.
    const mocks = Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * Math.PI * 2
      const distanceKm = Math.random() * radiusKm * 0.8 // within 80 % of radius
      const dLat = (distanceKm / 111) * Math.cos(angle) // 1° lat ~= 111 km
      const dLng = (distanceKm / (111 * Math.cos(lat * (Math.PI / 180)))) * Math.sin(angle)
      return {
        id: `mock-${i}`,
        name: `Mock Restaurant ${i + 1}`,
        lat: lat + dLat,
        lng: lng + dLng,
        thumbnail: 'https://picsum.photos/64/64',
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviewCount: Math.floor(Math.random() * 500),
        cuisineType: 'Việt',
        deliveryRadius: 3,
        popularity: Math.random() * 10
      }
    })
    return mocks
  }
}