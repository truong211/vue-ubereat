import { ref, onUnmounted } from 'vue'
import trackingService from '@/services/tracking.service'
import mapService from '@/services/map.service'

/**
 * useDriverTracking – subscribe to live driver location for a given order and
 * provide reactive driverLocation & eta values.
 *
 * @param {String} orderId        – ID của đơn hàng cần theo dõi
 * @param {{lat:number,lng:number}} destination – Điểm giao hàng cuối (để tính ETA)
 */
export function useDriverTracking(orderId, destination) {
  const driverLocation = ref(null)
  const eta = ref(null) // { duration, durationText, distance, distanceText }

  if (!orderId) {
    console.warn('[useDriverTracking] orderId is required')
  }

  // Internal helper to recalc ETA
  async function recalcEta() {
    if (!driverLocation.value || !destination) return
    try {
      await mapService.initialize()
      const route = await mapService.getRoute(driverLocation.value, destination)
      eta.value = {
        duration: route.duration,
        durationText: route.durationText,
        distance: route.distance,
        distanceText: route.distanceText
      }
    } catch (err) {
      console.error('[useDriverTracking] failed to recalc ETA', err)
    }
  }

  // Register socket callbacks only once
  trackingService.registerCallbacks({
    onDriverLocationUpdate: (data) => {
      if (!data?.location) return
      driverLocation.value = {
        lat: data.location.lat,
        lng: data.location.lng
      }
      recalcEta()
    }
  })

  // Start tracking immediately
  if (orderId) {
    trackingService.startTracking(orderId).catch(console.error)
  }

  // Cleanup when component using this composable is unmounted
  onUnmounted(() => {
    if (orderId) {
      trackingService.stopTracking(orderId)
    }
  })

  return {
    driverLocation,
    eta
  }
}