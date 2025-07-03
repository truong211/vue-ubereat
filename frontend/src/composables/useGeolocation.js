import { ref } from 'vue'

/**
 * useGeolocation – reactive wrapper around the browser Geolocation API.
 *
 * Example:
 * ```js
 * const { location, error, getCurrentPosition } = useGeolocation();
 * await getCurrentPosition();
 * console.log(location.value);
 * ```
 */
export function useGeolocation(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  const location = ref(null) // { lat, lng }
  const error = ref(null)

  /**
   * Request the device's current position.
   * @returns {Promise<{lat:number,lng:number}>}
   */
  function getCurrentPosition() {
    if (!('geolocation' in navigator)) {
      error.value = new Error('Geolocation is not supported by this browser')
      return Promise.reject(error.value)
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          location.value = { lat: latitude, lng: longitude }
          resolve(location.value)
        },
        (err) => {
          error.value = err
          reject(err)
        },
        options
      )
    })
  }

  return {
    location,
    error,
    getCurrentPosition
  }
}