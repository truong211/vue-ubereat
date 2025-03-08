import { Loader } from '@googlemaps/js-api-loader'

class MapService {
  constructor() {
    this.googleMaps = null
    this.maps = new Map() // Store map instances
    this.markers = new Map() // Store markers
    this.routes = new Map() // Store route polylines
    this.directionsService = null
    this.directionsRenderer = null
    this.geocoder = null
    this.bounds = null
  }

  async init() {
    if (this.googleMaps) return this.googleMaps

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    })

    try {
      this.googleMaps = await loader.load()
      this.directionsService = new this.googleMaps.DirectionsService()
      this.directionsRenderer = new this.googleMaps.DirectionsRenderer()
      this.geocoder = new this.googleMaps.Geocoder()
      this.bounds = new this.googleMaps.LatLngBounds()
      return this.googleMaps
    } catch (error) {
      console.error('Failed to load Google Maps:', error)
      throw error
    }
  }

  async createMap(elementId, options = {}) {
    await this.init()

    const defaultOptions = {
      zoom: 15,
      center: { lat: 0, lng: 0 },
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: this.googleMaps.MapTypeId.ROADMAP
    }

    const map = new this.googleMaps.Map(
      document.getElementById(elementId),
      { ...defaultOptions, ...options }
    )

    this.maps.set(elementId, map)
    return map
  }

  async addMarker(mapId, position, options = {}) {
    const map = this.maps.get(mapId)
    if (!map) throw new Error('Map not found')

    const marker = new this.googleMaps.Marker({
      position,
      map,
      ...options
    })

    const markerId = options.id || Date.now().toString()
    this.markers.set(markerId, marker)

    if (options.fitBounds) {
      this.bounds.extend(position)
      map.fitBounds(this.bounds)
    }

    return marker
  }

  updateMarkerPosition(markerId, position) {
    const marker = this.markers.get(markerId)
    if (marker) {
      marker.setPosition(position)
    }
  }

  async calculateAndDisplayRoute(mapId, origin, destination, waypoints = []) {
    const map = this.maps.get(mapId)
    if (!map) throw new Error('Map not found')

    this.directionsRenderer.setMap(map)

    try {
      const response = await this.directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: this.googleMaps.TravelMode.DRIVING
      })

      this.directionsRenderer.setDirections(response)
      return response.routes[0]
    } catch (error) {
      console.error('Failed to calculate route:', error)
      throw error
    }
  }

  async geocodeAddress(address) {
    try {
      const response = await this.geocoder.geocode({ address })
      if (response.results.length > 0) {
        return response.results[0].geometry.location.toJSON()
      }
      throw new Error('No results found')
    } catch (error) {
      console.error('Geocoding failed:', error)
      throw error
    }
  }

  clearRoute() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null)
    }
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null))
    this.markers.clear()
    this.bounds = new this.googleMaps.LatLngBounds()
  }

  // Calculate distance between two points in kilometers
  calculateDistance(point1, point2) {
    const p1 = new this.googleMaps.LatLng(point1.lat, point1.lng)
    const p2 = new this.googleMaps.LatLng(point2.lat, point2.lng)
    const distance = this.googleMaps.geometry.spherical.computeDistanceBetween(p1, p2)
    return distance / 1000 // Convert to kilometers
  }

  // Calculate estimated time of arrival (ETA) in minutes
  calculateETA(route) {
    if (!route || !route.legs) return null
    let duration = 0
    route.legs.forEach(leg => {
      duration += leg.duration.value
    })
    return Math.round(duration / 60) // Convert to minutes
  }

  // Get static map URL for sharing
  getStaticMapUrl(markers, size = '600x300') {
    const base = `https://maps.googleapis.com/maps/api/staticmap?size=${size}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    const markerParams = markers.map(m => 
      `markers=color:${m.color || 'red'}|label:${m.label || ''}|${m.lat},${m.lng}`
    ).join('&')
    return `${base}&${markerParams}`
  }

  // Create a heatmap layer for order density
  async createHeatmap(mapId, points) {
    await this.init()
    const map = this.maps.get(mapId)
    if (!map) throw new Error('Map not found')

    const heatmapData = points.map(point => 
      new this.googleMaps.LatLng(point.lat, point.lng)
    )

    const heatmap = new this.googleMaps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map
    })

    return heatmap
  }

  // Watch user's location
  watchLocation(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation not supported'))
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      position => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      error => {
        errorCallback(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )

    return watchId
  }

  // Stop watching location
  stopWatchingLocation(watchId) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  // Get navigation URL for external apps
  getNavigationUrl(destination) {
    if (typeof destination === 'string') {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`
  }
}

export default new MapService()
