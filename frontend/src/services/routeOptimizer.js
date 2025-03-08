import mapService from './map'

class RouteOptimizer {
  constructor() {
    this.maxBatchSize = 3 // Maximum number of orders a driver can handle simultaneously
    this.maxDistance = 10 // Maximum distance in km for batch orders
    this.maxDuration = 45 // Maximum duration in minutes for entire batch delivery
  }

  /**
   * Calculate optimal route for multiple delivery points
   */
  async optimizeRoute(currentLocation, deliveryPoints) {
    try {
      // Get all possible combinations
      const combinations = this.generateCombinations(deliveryPoints)
      let bestRoute = null
      let shortestDuration = Infinity

      for (const combination of combinations) {
        const route = await this.calculateRouteForCombination(currentLocation, combination)
        if (route.duration < shortestDuration) {
          shortestDuration = route.duration
          bestRoute = route
        }
      }

      return bestRoute
    } catch (error) {
      console.error('Route optimization failed:', error)
      throw error
    }
  }

  /**
   * Check if an order can be added to current batch
   */
  async canAddToBatch(currentBatch, newOrder) {
    if (currentBatch.length >= this.maxBatchSize) {
      return false
    }

    // Check if new point is within acceptable distance
    const lastPoint = currentBatch[currentBatch.length - 1].location
    const distance = mapService.calculateDistance(lastPoint, newOrder.location)
    if (distance > this.maxDistance) {
      return false
    }

    // Check if adding this order keeps total duration within limits
    const newBatch = [...currentBatch, newOrder]
    const route = await this.calculateRouteMetrics(newBatch)
    return route.duration <= this.maxDuration
  }

  /**
   * Generate all possible delivery combinations
   */
  generateCombinations(points) {
    const result = []
    const generate = (current, remaining) => {
      if (current.length > this.maxBatchSize) return
      if (current.length > 0) result.push([...current])
      
      for (let i = 0; i < remaining.length; i++) {
        generate(
          [...current, remaining[i]], 
          remaining.slice(i + 1)
        )
      }
    }

    generate([], points)
    return result
  }

  /**
   * Calculate metrics for a specific route combination
   */
  async calculateRouteMetrics(points) {
    const waypoints = points.map(point => ({
      location: point.location,
      stopover: true
    }))

    const route = await mapService.calculateAndDisplayRoute(
      'optimization',
      points[0].location,
      points[points.length - 1].location,
      waypoints.slice(1, -1)
    )

    return {
      duration: this.calculateTotalDuration(route),
      distance: this.calculateTotalDistance(route),
      order: this.extractWaypointOrder(route),
      bounds: route.bounds
    }
  }

  /**
   * Calculate route for specific combination including pickup points
   */
  async calculateRouteForCombination(start, deliveryPoints) {
    const restaurantPickups = this.groupByRestaurant(deliveryPoints)
    const allPoints = []

    // Add restaurant pickups in optimal order
    for (const [restaurantId, orders] of restaurantPickups) {
      const restaurant = orders[0].restaurant
      allPoints.push({
        type: 'pickup',
        location: restaurant.location,
        restaurantId,
        orders: orders
      })
    }

    // Add delivery points
    deliveryPoints.forEach(point => {
      allPoints.push({
        type: 'delivery',
        location: point.location,
        orderId: point.orderId
      })
    })

    const route = await this.calculateRouteMetrics([{ location: start }, ...allPoints])
    return {
      ...route,
      points: allPoints,
      pickups: restaurantPickups.size,
      deliveries: deliveryPoints.length
    }
  }

  /**
   * Group orders by restaurant for efficient pickup
   */
  groupByRestaurant(orders) {
    const groups = new Map()
    orders.forEach(order => {
      const restaurantId = order.restaurant.id
      if (!groups.has(restaurantId)) {
        groups.set(restaurantId, [])
      }
      groups.get(restaurantId).push(order)
    })
    return groups
  }

  /**
   * Calculate total duration including pickup and delivery times
   */
  calculateTotalDuration(route) {
    let duration = 0
    
    // Add driving duration
    route.legs.forEach(leg => {
      duration += leg.duration.value / 60 // Convert to minutes
    })

    // Add estimated pickup and delivery times
    route.waypoints.forEach(waypoint => {
      if (waypoint.type === 'pickup') {
        duration += 5 // Average pickup time per restaurant
      } else {
        duration += 3 // Average delivery time per customer
      }
    })

    return Math.round(duration)
  }

  /**
   * Calculate total distance for route
   */
  calculateTotalDistance(route) {
    let distance = 0
    route.legs.forEach(leg => {
      distance += leg.distance.value / 1000 // Convert to kilometers
    })
    return Math.round(distance * 10) / 10
  }

  /**
   * Extract waypoint order from route response
   */
  extractWaypointOrder(route) {
    return route.waypoint_order || route.waypointOrder || []
  }

  /**
   * Estimate earnings for a batch of orders
   */
  estimateEarnings(route) {
    const baseRate = 5 // Base rate per delivery
    const distanceRate = 0.5 // Rate per kilometer
    const timeRate = 0.2 // Rate per minute

    return {
      base: baseRate * route.deliveries,
      distance: route.distance * distanceRate,
      time: route.duration * timeRate,
      total: Math.round((
        baseRate * route.deliveries +
        route.distance * distanceRate +
        route.duration * timeRate
      ) * 100) / 100
    }
  }

  /**
   * Get ETA for each delivery point
   */
  calculateDeliveryETAs(route) {
    let currentTime = Date.now()
    const etas = new Map()

    route.legs.forEach((leg, index) => {
      const point = route.points[index]
      currentTime += leg.duration.value * 1000 // Convert to milliseconds
      
      if (point.type === 'pickup') {
        currentTime += 5 * 60 * 1000 // 5 minutes for pickup
      } else {
        currentTime += 3 * 60 * 1000 // 3 minutes for delivery
        etas.set(point.orderId, new Date(currentTime))
      }
    })

    return etas
  }

  /**
   * Get textual instructions for the route
   */
  generateRouteInstructions(route) {
    const instructions = []
    let currentStep = 1

    route.points.forEach((point, index) => {
      if (point.type === 'pickup') {
        instructions.push({
          step: currentStep++,
          type: 'pickup',
          location: point.location,
          text: `Pick up ${point.orders.length} order${point.orders.length > 1 ? 's' : ''} from ${point.orders[0].restaurant.name}`,
          orders: point.orders.map(o => o.orderId)
        })
      } else {
        instructions.push({
          step: currentStep++,
          type: 'delivery',
          location: point.location,
          text: `Deliver order #${point.orderId} to ${point.customerName}`,
          orderId: point.orderId
        })
      }

      if (index < route.legs.length) {
        instructions.push({
          step: currentStep++,
          type: 'navigation',
          text: `Drive ${route.legs[index].distance.text} (${route.legs[index].duration.text})`,
          distance: route.legs[index].distance.value,
          duration: route.legs[index].duration.value
        })
      }
    })

    return instructions
  }
}

export default new RouteOptimizer()
