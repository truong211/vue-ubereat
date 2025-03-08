import api from './api.service'

class OrderOptimizer {
  constructor() {
    this.googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    this.directionsService = null
    this.isInitialized = false
  }

  /**
   * Initialize the optimizer with Google Maps services
   */
  async init() {
    if (this.isInitialized) return

    try {
      await this.loadGoogleMaps()
      this.directionsService = new google.maps.DirectionsService()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize order optimizer:', error)
      throw error
    }
  }

  /**
   * Load Google Maps API
   */
  loadGoogleMaps() {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=geometry,places`
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load Google Maps'))
      document.head.appendChild(script)
    })
  }

  /**
   * Calculate optimal route for a set of orders
   * @param {Object[]} orders List of orders to optimize
   * @param {Object} driverLocation Current driver location
   * @returns {Promise<Object>} Optimized route details
   */
  async calculateOptimalRoute(orders, driverLocation) {
    if (!this.isInitialized) {
      await this.init()
    }

    try {
      // Sort orders by priority and time constraints
      const prioritizedOrders = this.prioritizeOrders(orders)
      
      // Calculate travel times between all points
      const distanceMatrix = await this.calculateDistanceMatrix(
        [driverLocation, ...orders.map(o => o.restaurant.location)],
        orders.map(o => o.deliveryLocation)
      )
      
      // Generate optimal sequence
      const sequence = this.calculateOptimalSequence(
        prioritizedOrders,
        distanceMatrix
      )
      
      // Calculate route details
      const route = await this.calculateRouteDetails(sequence, driverLocation)
      
      return {
        sequence,
        route,
        estimatedDuration: route.duration,
        estimatedDistance: route.distance
      }
    } catch (error) {
      console.error('Failed to calculate optimal route:', error)
      throw error
    }
  }

  /**
   * Prioritize orders based on various factors
   * @param {Object[]} orders List of orders
   * @returns {Object[]} Prioritized orders
   */
  prioritizeOrders(orders) {
    return orders.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0
      
      // Factor 1: Order age
      scoreA += this.calculateOrderAgeScore(a)
      scoreB += this.calculateOrderAgeScore(b)
      
      // Factor 2: Premium customer
      scoreA += a.customer.isPremium ? 2 : 0
      scoreB += b.customer.isPremium ? 2 : 0
      
      // Factor 3: Order value
      scoreA += this.calculateOrderValueScore(a)
      scoreB += this.calculateOrderValueScore(b)
      
      // Factor 4: Restaurant priority
      scoreA += a.restaurant.priorityLevel || 0
      scoreB += b.restaurant.priorityLevel || 0
      
      // Factor 5: Special instructions
      scoreA -= a.specialInstructions ? 1 : 0
      scoreB -= b.specialInstructions ? 1 : 0
      
      return scoreB - scoreA
    })
  }

  /**
   * Calculate score based on order age
   * @param {Object} order Order object
   * @returns {number} Age score
   */
  calculateOrderAgeScore(order) {
    const ageInMinutes = (Date.now() - new Date(order.createdAt)) / 60000
    if (ageInMinutes > 45) return 5 // High priority for old orders
    if (ageInMinutes > 30) return 3
    if (ageInMinutes > 15) return 2
    return 1
  }

  /**
   * Calculate score based on order value
   * @param {Object} order Order object
   * @returns {number} Value score
   */
  calculateOrderValueScore(order) {
    if (order.total >= 100) return 3
    if (order.total >= 50) return 2
    if (order.total >= 25) return 1
    return 0
  }

  /**
   * Calculate distance matrix between points
   * @param {Object[]} origins Origin points
   * @param {Object[]} destinations Destination points
   * @returns {Promise<Object>} Distance matrix
   */
  async calculateDistanceMatrix(origins, destinations) {
    return new Promise((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService()
      
      service.getDistanceMatrix(
        {
          origins: origins.map(p => new google.maps.LatLng(p.lat, p.lng)),
          destinations: destinations.map(p => new google.maps.LatLng(p.lat, p.lng)),
          travelMode: google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          }
        },
        (response, status) => {
          if (status === 'OK') {
            resolve(response)
          } else {
            reject(new Error(`Distance Matrix failed: ${status}`))
          }
        }
      )
    })
  }

  /**
   * Calculate optimal sequence using genetic algorithm
   * @param {Object[]} orders Prioritized orders
   * @param {Object} distanceMatrix Distance matrix
   * @returns {Object[]} Optimal sequence
   */
  calculateOptimalSequence(orders, distanceMatrix) {
    // Implementation of genetic algorithm for TSP
    const population = this.initializePopulation(orders.length, 50)
    let bestSequence = null
    let bestFitness = Infinity
    
    for (let generation = 0; generation < 100; generation++) {
      population.forEach(sequence => {
        const fitness = this.calculateSequenceFitness(
          sequence,
          orders,
          distanceMatrix
        )
        
        if (fitness < bestFitness) {
          bestFitness = fitness
          bestSequence = sequence
        }
      })
      
      this.evolvePopulation(population, orders, distanceMatrix)
    }
    
    return bestSequence.map(index => orders[index])
  }

  /**
   * Initialize population for genetic algorithm
   * @param {number} size Sequence size
   * @param {number} populationSize Population size
   * @returns {number[][]} Initial population
   */
  initializePopulation(size, populationSize) {
    const population = []
    
    for (let i = 0; i < populationSize; i++) {
      const sequence = Array.from({ length: size }, (_, i) => i)
      for (let j = sequence.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[sequence[j], sequence[k]] = [sequence[k], sequence[j]]
      }
      population.push(sequence)
    }
    
    return population
  }

  /**
   * Calculate fitness of a sequence
   * @param {number[]} sequence Order sequence
   * @param {Object[]} orders Order list
   * @param {Object} distanceMatrix Distance matrix
   * @returns {number} Fitness score
   */
  calculateSequenceFitness(sequence, orders, distanceMatrix) {
    let fitness = 0
    
    // Calculate total travel time
    for (let i = 0; i < sequence.length - 1; i++) {
      fitness += distanceMatrix.rows[sequence[i]].elements[sequence[i + 1]].duration.value
    }
    
    // Penalize for priority violations
    for (let i = 0; i < sequence.length; i++) {
      const order = orders[sequence[i]]
      const positionPenalty = i * order.priority * 300 // 5 minutes per priority level per position
      fitness += positionPenalty
    }
    
    return fitness
  }

  /**
   * Evolve population using genetic algorithm
   * @param {number[][]} population Current population
   * @param {Object[]} orders Order list
   * @param {Object} distanceMatrix Distance matrix
   */
  evolvePopulation(population, orders, distanceMatrix) {
    // Sort by fitness
    population.sort((a, b) => 
      this.calculateSequenceFitness(a, orders, distanceMatrix) -
      this.calculateSequenceFitness(b, orders, distanceMatrix)
    )
    
    // Keep top 50%
    population.splice(Math.floor(population.length / 2))
    
    // Create children
    while (population.length < 50) {
      const parent1 = population[Math.floor(Math.random() * population.length)]
      const parent2 = population[Math.floor(Math.random() * population.length)]
      const child = this.crossover(parent1, parent2)
      this.mutate(child)
      population.push(child)
    }
  }

  /**
   * Perform crossover between two parents
   * @param {number[]} parent1 First parent
   * @param {number[]} parent2 Second parent
   * @returns {number[]} Child sequence
   */
  crossover(parent1, parent2) {
    const size = parent1.length
    const start = Math.floor(Math.random() * size)
    const end = Math.floor(Math.random() * (size - start)) + start
    
    const slice = parent1.slice(start, end)
    const remaining = parent2.filter(x => !slice.includes(x))
    
    return [...remaining.slice(0, start), ...slice, ...remaining.slice(start)]
  }

  /**
   * Mutate sequence
   * @param {number[]} sequence Sequence to mutate
   */
  mutate(sequence) {
    if (Math.random() < 0.1) { // 10% mutation rate
      const i = Math.floor(Math.random() * sequence.length)
      const j = Math.floor(Math.random() * sequence.length)
      ;[sequence[i], sequence[j]] = [sequence[j], sequence[i]]
    }
  }

  /**
   * Calculate route details
   * @param {Object[]} sequence Order sequence
   * @param {Object} driverLocation Driver location
   * @returns {Promise<Object>} Route details
   */
  async calculateRouteDetails(sequence, driverLocation) {
    const waypoints = []
    let duration = 0
    let distance = 0
    
    // Add restaurant pickup points
    sequence.forEach(order => {
      waypoints.push({
        location: new google.maps.LatLng(
          order.restaurant.location.lat,
          order.restaurant.location.lng
        ),
        stopover: true
      })
    })
    
    // Add delivery points
    sequence.forEach(order => {
      waypoints.push({
        location: new google.maps.LatLng(
          order.deliveryLocation.lat,
          order.deliveryLocation.lng
        ),
        stopover: true
      })
    })
    
    // Calculate route
    const route = await this.getDirections(
      new google.maps.LatLng(driverLocation.lat, driverLocation.lng),
      waypoints[waypoints.length - 1].location,
      waypoints.slice(0, -1)
    )
    
    // Sum up duration and distance
    route.routes[0].legs.forEach(leg => {
      duration += leg.duration.value
      distance += leg.distance.value
    })
    
    return {
      route,
      duration,
      distance,
      waypoints
    }
  }

  /**
   * Get directions from Google Maps
   * @param {Object} origin Origin point
   * @param {Object} destination Destination point
   * @param {Object[]} waypoints Waypoints
   * @returns {Promise<Object>} Route details
   */
  getDirections(origin, destination, waypoints) {
    return new Promise((resolve, reject) => {
      this.directionsService.route(
        {
          origin,
          destination,
          waypoints,
          optimizeWaypoints: false, // We've already optimized the sequence
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === 'OK') {
            resolve(result)
          } else {
            reject(new Error(`Directions request failed: ${status}`))
          }
        }
      )
    })
  }

  /**
   * Estimate delivery time for a new order
   * @param {Object} order New order
   * @param {Object[]} existingOrders Existing orders in queue
   * @param {Object} driverLocation Current driver location
   * @returns {Promise<Object>} Estimated delivery time
   */
  async estimateDeliveryTime(order, existingOrders, driverLocation) {
    try {
      // Calculate base delivery time without other orders
      const baseRoute = await this.calculateOptimalRoute([order], driverLocation)
      const baseTime = baseRoute.estimatedDuration
      
      // Calculate time with order inserted into existing queue
      const allOrders = [...existingOrders, order]
      const optimizedRoute = await this.calculateOptimalRoute(
        allOrders,
        driverLocation
      )
      
      // Find position in optimized sequence
      const orderIndex = optimizedRoute.sequence.findIndex(o => o.id === order.id)
      const queueTime = orderIndex * 10 * 60 // 10 minutes per order in queue
      
      // Add preparation time
      const prepTime = order.restaurant.averagePreparationTime || 20 * 60
      
      // Calculate total estimated time
      const totalTime = baseTime + queueTime + prepTime
      
      // Add buffer for traffic and other delays (20%)
      const estimatedTime = totalTime * 1.2
      
      return {
        estimatedDeliveryTime: new Date(Date.now() + estimatedTime * 1000),
        baseDeliveryTime: baseTime,
        queueDelay: queueTime,
        preparationTime: prepTime,
        confidence: this.calculateConfidence(order, existingOrders)
      }
    } catch (error) {
      console.error('Failed to estimate delivery time:', error)
      throw error
    }
  }

  /**
   * Calculate confidence level for delivery estimate
   * @param {Object} order Order to estimate
   * @param {Object[]} existingOrders Existing orders
   * @returns {number} Confidence level (0-1)
   */
  calculateConfidence(order, existingOrders) {
    let confidence = 1
    
    // Factor 1: Number of orders in queue
    confidence *= Math.max(0.5, 1 - (existingOrders.length * 0.1))
    
    // Factor 2: Time of day (rush hour)
    const hour = new Date().getHours()
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      confidence *= 0.8
    }
    
    // Factor 3: Weather conditions (if available)
    if (order.weather && order.weather.conditions === 'rain') {
      confidence *= 0.7
    }
    
    // Factor 4: Restaurant reliability
    confidence *= order.restaurant.reliabilityScore || 0.9
    
    return Math.max(0.3, confidence)
  }

  /**
   * Find optimal batch size for orders
   * @param {Object[]} orders Available orders
   * @param {Object} constraints Batching constraints
   * @returns {Object[]} Batched orders
   */
  batchOrders(orders, constraints) {
    const batches = []
    let currentBatch = []
    let currentWeight = 0
    let currentValue = 0
    
    // Sort orders by value density (value/weight)
    const sortedOrders = [...orders].sort((a, b) => 
      (b.total / b.items.length) - (a.total / a.items.length)
    )
    
    // Pack orders into batches using modified bin packing
    for (const order of sortedOrders) {
      const weight = order.items.length
      const value = order.total
      
      if (currentWeight + weight <= constraints.maxItems &&
          currentValue + value <= constraints.maxValue &&
          currentBatch.length < constraints.maxOrders) {
        currentBatch.push(order)
        currentWeight += weight
        currentValue += value
      } else {
        if (currentBatch.length > 0) {
          batches.push([...currentBatch])
        }
        currentBatch = [order]
        currentWeight = weight
        currentValue = value
      }
    }
    
    if (currentBatch.length > 0) {
      batches.push(currentBatch)
    }
    
    return batches
  }
}

export default new OrderOptimizer()