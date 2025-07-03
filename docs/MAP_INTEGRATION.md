# Map Integration Documentation

## Overview

This documentation covers the comprehensive map integration features implemented for the food delivery application, including restaurant location display, real-time delivery tracking, route optimization, and turn-by-turn navigation.

## Features Implemented

### 1. Restaurant Location Display (Hiển thị nhà hàng gần vị trí người dùng)

#### RestaurantMapView Component
- **Location**: `frontend/src/components/RestaurantMapView.vue`
- **Features**:
  - Interactive map showing nearby restaurants
  - User location marker with radius circle
  - Restaurant markers with detailed popup information
  - Distance and delivery time calculations
  - Radius filtering (1km, 3km, 5km, 10km, 15km)
  - Toggle between map and list view
  - Real-time distance calculations using Haversine formula

#### Integration in Restaurant Listing
- **Location**: `frontend/src/views/Restaurants.vue`
- **Features**:
  - Map/Grid view toggle
  - Real-time restaurant filtering by distance
  - Automatic delivery time estimation
  - Delivery fee calculation based on distance

### 2. Distance and Delivery Time Calculation (Tính toán khoảng cách và thời gian giao hàng)

#### Backend API Endpoints
- **Location**: `backend/routes/map.routes.js` & `backend/controllers/map.controller.js`
- **Endpoints**:
  - `GET /api/map/restaurants/nearby` - Find restaurants within radius
  - `POST /api/map/route` - Calculate route between two points
  - `POST /api/map/distance-matrix` - Calculate distances for multiple points
  - `POST /api/map/estimate-delivery-time` - Estimate delivery time

#### Calculation Features
- **Distance Calculation**:
  - Haversine formula for straight-line distance
  - Google Maps/Mapbox routing for accurate travel distance
  - Support for multiple map providers (Google Maps, Mapbox)

- **Delivery Time Estimation**:
  - Preparation time: 15 minutes (configurable)
  - Travel time based on real-time traffic data
  - Buffer time: 5 minutes (configurable)
  - Dynamic updates based on current conditions

### 3. Real-time Shipper Tracking (Theo dõi vị trí shipper theo thời gian thực)

#### EnhancedDeliveryTracking Component
- **Location**: `frontend/src/components/EnhancedDeliveryTracking.vue`
- **Features**:
  - Real-time driver location updates via WebSocket
  - Order status timeline with progress indicators
  - Live ETA calculations and countdown
  - Driver information and contact options
  - Map view modes: Overview and Follow driver
  - Turn-by-turn directions for drivers

#### Backend Real-time Features
- **Socket.IO Integration**: Real-time location broadcasting
- **Driver Location Updates**: `POST /api/map/drivers/:id/location`
- **Order Tracking**: `GET /api/orders/:id/tracking`
- **ETA Updates**: Continuous recalculation based on location changes

### 4. Navigation and Directions (Chỉ đường từ/đến điểm giao hàng)

#### Turn-by-turn Navigation
- **Features**:
  - Current step highlighting with icons
  - Distance and time for each step
  - Upcoming turns preview
  - Voice navigation ready structure
  - Direction icons for all maneuver types

#### Route Optimization
- **Location**: `frontend/src/services/routeOptimizer.js`
- **Features**:
  - Multi-stop route optimization
  - Batch delivery calculations
  - Earnings estimation
  - Restaurant pickup coordination
  - Distance and time optimization

## Technical Implementation

### Map Service Architecture

#### Frontend Map Service
```javascript
// frontend/src/services/map.service.js
class MapService {
  - Multiple provider support (Google Maps, Mapbox)
  - Caching for performance
  - Route calculation and optimization
  - Geocoding and reverse geocoding
  - Distance matrix calculations
}
```

#### Backend Map Controller
```javascript
// backend/controllers/map.controller.js
class MapController {
  - API integration with map providers
  - Database location queries
  - Real-time calculations
  - Route optimization algorithms
  - Distance and ETA calculations
}
```

### Real-time Tracking Service

#### Frontend Tracking Service
```javascript
// frontend/src/services/tracking.service.js
class TrackingService {
  - WebSocket connection management
  - Real-time location updates
  - Order status synchronization
  - ETA continuous updates
  - Connection resilience and reconnection
}
```

#### Backend WebSocket Integration
- Socket.IO for real-time communication
- Order room management
- Driver location broadcasting
- Status update notifications

## Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_MAP_PROVIDER=google
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_MAPBOX_API_KEY=your_mapbox_api_key
VITE_DEFAULT_MAP_CENTER_LAT=21.0285
VITE_DEFAULT_MAP_CENTER_LNG=105.8542
VITE_MAX_DELIVERY_RADIUS=15
```

#### Backend (.env)
```env
MAP_PROVIDER=google
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
MAPBOX_API_KEY=your_mapbox_api_key
MAX_DELIVERY_RADIUS=15
DEFAULT_PREPARATION_TIME=15
DEFAULT_DELIVERY_FEE=2.99
DELIVERY_FEE_PER_KM=0.5
```

## Database Schema Requirements

### Required Tables/Columns

#### Restaurants Table
```sql
ALTER TABLE restaurants ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE restaurants ADD COLUMN longitude DECIMAL(11, 8);
ALTER TABLE restaurants ADD COLUMN active BOOLEAN DEFAULT 1;
```

#### Drivers Table
```sql
ALTER TABLE drivers ADD COLUMN current_latitude DECIMAL(10, 8);
ALTER TABLE drivers ADD COLUMN current_longitude DECIMAL(11, 8);
ALTER TABLE drivers ADD COLUMN heading DECIMAL(5, 2);
ALTER TABLE drivers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

#### Orders Table
```sql
ALTER TABLE orders ADD COLUMN delivery_latitude DECIMAL(10, 8);
ALTER TABLE orders ADD COLUMN delivery_longitude DECIMAL(11, 8);
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
```

## API Documentation

### Map Routes

#### Calculate Route
```http
POST /api/map/route
Content-Type: application/json

{
  "origin": { "lat": 21.0285, "lng": 105.8542 },
  "destination": { "lat": 21.0245, "lng": 105.8412 },
  "mode": "driving"
}
```

#### Get Nearby Restaurants
```http
GET /api/map/restaurants/nearby?lat=21.0285&lng=105.8542&radius=5
```

#### Update Driver Location
```http
POST /api/map/drivers/:id/location
Content-Type: application/json

{
  "lat": 21.0285,
  "lng": 105.8542,
  "heading": 45
}
```

## Usage Examples

### Restaurant Map Integration
```vue
<template>
  <RestaurantMapView
    :user-location="userLocation"
    :restaurants="restaurants"
    @restaurant-selected="handleSelection"
  />
</template>
```

### Enhanced Delivery Tracking
```vue
<template>
  <EnhancedDeliveryTracking
    :order-id="orderId"
    :user-role="'customer'"
    @status-updated="handleStatusUpdate"
    @location-updated="handleLocationUpdate"
  />
</template>
```

### Map Service Usage
```javascript
import mapService from '@/services/map.service'

// Calculate route
const route = await mapService.getRoute(origin, destination)

// Get nearby restaurants  
const restaurants = await mapService.getNearbyRestaurants(userLocation, radius)

// Geocode address
const location = await mapService.geocode(address)
```

## Performance Considerations

### Optimization Strategies
1. **Caching**: Route and location data caching
2. **Debouncing**: Location update throttling
3. **Lazy Loading**: Map components loaded on demand
4. **Connection Management**: Efficient WebSocket handling
5. **Distance Calculations**: Haversine for approximate, API for precise

### Best Practices
1. **Error Handling**: Graceful fallbacks for API failures
2. **Rate Limiting**: API call optimization
3. **Memory Management**: Proper cleanup of map instances
4. **User Experience**: Loading states and error messages
5. **Battery Optimization**: Efficient location tracking

## Future Enhancements

### Planned Features
1. **Offline Maps**: Local map data for connectivity issues
2. **Advanced Routing**: Traffic-aware route optimization
3. **Geofencing**: Automatic status updates based on location
4. **Machine Learning**: Predictive delivery time algorithms
5. **AR Navigation**: Augmented reality directions
6. **Multi-language**: Localized direction instructions

### Scalability Improvements
1. **Microservices**: Separate map service architecture
2. **CDN Integration**: Map tiles and assets optimization
3. **Database Optimization**: Spatial indexing for location queries
4. **Load Balancing**: Distributed real-time connections
5. **Monitoring**: Performance and usage analytics

## Troubleshooting

### Common Issues

#### Map Not Loading
- Check API key configuration
- Verify network connectivity
- Check browser console for errors
- Ensure HTTPS for production

#### Location Not Updating
- Verify WebSocket connection
- Check driver location permissions
- Validate database connections
- Review rate limiting settings

#### Inaccurate Distances
- Validate coordinate formats
- Check map provider API status
- Verify calculation algorithms
- Review caching mechanisms

### Debug Tools
1. **Browser DevTools**: Network and console monitoring
2. **Socket.IO Inspector**: Real-time connection debugging
3. **Map Provider Debug**: API usage and error tracking
4. **Database Logs**: Location query performance
5. **Performance Profiler**: Component rendering optimization

## Security Considerations

### API Key Security
- Environment variable usage
- Domain restrictions
- Rate limiting implementation
- Regular key rotation

### Location Privacy
- User consent management
- Data anonymization
- Secure transmission
- GDPR compliance

### Real-time Security
- WebSocket authentication
- Message validation
- Connection rate limiting
- DDoS protection

This comprehensive map integration provides a robust foundation for location-based features in the food delivery application, with room for future enhancements and scalability improvements.