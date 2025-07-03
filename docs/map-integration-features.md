# Tích Hợp Bản Đồ - Food Delivery App

## Tổng Quan

Dự án đã tích hợp một hệ thống bản đồ hoàn chỉnh cho ứng dụng giao đồ ăn với các tính năng:

1. **Hiển thị nhà hàng gần vị trí người dùng**
2. **Tính toán khoảng cách và thời gian giao hàng**
3. **Theo dõi vị trí shipper theo thời gian thực**
4. **Chỉ đường từ/đến điểm giao hàng**

## Cấu Trúc Dự Án

### Frontend Components

#### 1. RestaurantDiscoveryMap.vue
**Vị trí**: `frontend/src/components/map/RestaurantDiscoveryMap.vue`

**Tính năng**:
- Tìm kiếm nhà hàng gần vị trí người dùng
- Bộ lọc theo loại ẩm thực, đánh giá, khoảng cách
- Hiển thị thông tin chi tiết nhà hàng (khoảng cách, thời gian giao hàng)
- Chỉ đường đến nhà hàng
- Auto-detect vị trí người dùng

**Cách sử dụng**:
```vue
<template>
  <RestaurantDiscoveryMap
    :map-height="'600px'"
    :show-search-bar="true"
    :auto-detect-location="true"
    @restaurant-selected="onRestaurantSelected"
    @location-changed="onLocationChanged"
  />
</template>
```

#### 2. DeliveryTrackingMap.vue
**Vị trí**: `frontend/src/components/map/DeliveryTrackingMap.vue`

**Tính năng**:
- Theo dõi đơn hàng real-time
- Hiển thị vị trí shipper với animation
- Timeline trạng thái giao hàng
- Thông tin ETA động
- Liên hệ shipper
- Thông báo các milestone giao hàng

**Cách sử dụng**:
```vue
<template>
  <DeliveryTrackingMap
    :order-id="orderId"
    :map-height="'500px'"
    :auto-center="true"
    @status-changed="onStatusChanged"
    @eta-updated="onEtaUpdated"
    @driver-arrived="onDriverArrived"
    @delivery-completed="onDeliveryCompleted"
  />
</template>
```

### Services

#### 1. Restaurant Discovery Service
**Vị trí**: `frontend/src/services/restaurant-discovery.service.js`

**Chức năng**:
- Tìm nhà hàng gần vị trí người dùng
- Tính toán khoảng cách và thời gian giao hàng
- Tìm kiếm nhà hàng theo từ khóa
- Lấy nhà hàng theo danh mục
- Cache kết quả để tối ưu hiệu năng

**API Methods**:
```javascript
// Tìm nhà hàng gần đây
await restaurantDiscoveryService.findNearbyRestaurants(userLocation, {
  radius: 5,
  cuisineType: 'vietnamese',
  sortBy: 'distance'
});

// Tìm kiếm nhà hàng
await restaurantDiscoveryService.searchRestaurants(query, userLocation);

// Nhà hàng được khuyến nghị
await restaurantDiscoveryService.getRecommendedRestaurants(userLocation, preferences);
```

#### 2. Enhanced Tracking Service
**Vị trí**: `frontend/src/services/enhanced-tracking.service.js`

**Chức năng**:
- Kết nối Socket.IO cho real-time updates
- Theo dõi vị trí shipper
- Tính toán ETA động
- Xử lý các milestone giao hàng
- Auto-reconnect khi mất kết nối

**API Methods**:
```javascript
// Bắt đầu tracking
await enhancedTrackingService.startOrderTracking(orderId, {
  userId: 'user_id',
  userType: 'customer'
});

// Đăng ký callbacks
enhancedTrackingService.registerCallbacks({
  onDriverLocationUpdate: (data) => console.log('Driver moved:', data),
  onEtaUpdated: (data) => console.log('ETA updated:', data),
  onDelivered: (data) => console.log('Order delivered:', data)
});
```

### Backend APIs

#### 1. Map Routes
**Vị trí**: `backend/routes/map.routes.js`

**Endpoints**:

##### Restaurant Discovery
- `GET /api/map/restaurants/nearby` - Tìm nhà hàng gần đây
- `GET /api/map/restaurants/search` - Tìm kiếm nhà hàng
- `POST /api/map/restaurants/recommendations` - Nhà hàng được khuyến nghị

##### Route Calculation
- `POST /api/map/route` - Tính toán route
- `POST /api/map/route/optimize` - Tối ưu hóa route nhiều điểm
- `POST /api/map/distance-matrix` - Tính distance matrix

##### Real-time Tracking
- `GET /api/map/orders/:orderId/tracking` - Thông tin tracking đơn hàng
- `GET /api/map/orders/:orderId/eta` - Tính ETA đơn hàng
- `PUT /api/map/drivers/:driverId/location` - Cập nhật vị trí driver

#### 2. Map Controller
**Vị trí**: `backend/controllers/map.controller.js`

**Chức năng**:
- Xử lý logic business cho map APIs
- Tích hợp với Google Maps APIs
- Tính toán delivery estimates
- Cache optimization
- Real-time data processing

## Tính Năng Chi Tiết

### 1. Hiển thị Nhà Hàng Gần Vị Trí Người Dùng

**Frontend Implementation**:
- Component `RestaurantDiscoveryMap` sử dụng `restaurantDiscoveryService`
- Auto-detect location qua Geolocation API
- Hiển thị markers cho nhà hàng với custom icons
- Info cards với thông tin chi tiết

**Backend Implementation**:
- SQL query với Haversine formula để tính khoảng cách
- Filters: cuisine type, rating, price range, availability
- Sorting: distance, rating, delivery time, delivery fee
- Pagination và caching

**Database Schema**:
```sql
-- Bảng restaurants cần có:
- latitude (DECIMAL)
- longitude (DECIMAL) 
- cuisine_type (VARCHAR)
- avg_delivery_time (INT)
- max_delivery_radius (DECIMAL)
- is_open (BOOLEAN)
```

### 2. Tính Toán Khoảng Cách và Thời Gian Giao Hàng

**Phương Pháp Tính Toán**:
1. **Route Calculation**: Sử dụng Google Maps Directions API
2. **Fallback**: Haversine formula cho khoảng cách thẳng
3. **ETA Calculation**: 
   - Preparation time + Travel time + Buffer time
   - Traffic conditions adjustment
   - Rush hour multiplier

**Công Thức**:
```javascript
const estimatedDeliveryTime = preparationTime + drivingMinutes + bufferTime;
const deliveryTimeRange = {
  min: Math.max(estimatedTime - 5, 15),
  max: estimatedTime + 10
};
```

### 3. Theo Dõi Vị Trí Shipper Theo Thời Gian Thực

**Real-time Architecture**:
- Socket.IO server cho real-time communication
- Driver app gửi location updates mỗi 5-10 giây
- Customer app nhận updates qua WebSocket
- Automatic reconnection handling

**Location Update Flow**:
1. Driver app → Backend API → Database
2. Backend → Socket.IO broadcast
3. Customer apps receive updates
4. Map markers update with animation

**Database Schema**:
```sql
CREATE TABLE driver_locations (
  driver_id VARCHAR(36) PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  accuracy DECIMAL(6, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Chỉ Đường Từ/Đến Điểm Giao Hàng

**Route Visualization**:
- Google Maps Polylines cho route display
- Turn-by-turn directions trong sidebar
- Dynamic route recalculation
- Traffic-aware routing

**Features**:
- **Route Modes**: driving, walking, bicycling
- **Waypoints**: Hỗ trợ multiple stops
- **Alternatives**: Multiple route options
- **Real-time Updates**: Route thay đổi theo traffic

## Socket.IO Events

### Client → Server
```javascript
// Join tracking room
socket.emit('track_order', { orderId, userId, userType });

// Leave tracking room  
socket.emit('untrack_order', { orderId });

// Driver location update
socket.emit('driver_location_update', { 
  driverId, location, heading, speed 
});
```

### Server → Client
```javascript
// Driver location updates
socket.on('driver_location_update', (data) => {
  // Update driver marker position
});

// Order status changes
socket.on('order_status_changed', (data) => {
  // Update UI status
});

// ETA updates
socket.on('eta_updated', (data) => {
  // Update estimated time
});

// Delivery milestones
socket.on('delivery_milestone', (data) => {
  // Show milestone notification
});
```

## Cấu Hình và Setup

### Environment Variables
```bash
# Google Maps API Key
VITE_MAP_API_KEY=your_google_maps_api_key

# Map Provider (google, mapbox)
VITE_MAP_PROVIDER=google

# API URL
VITE_API_URL=http://localhost:3000

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/food_delivery
```

### Dependencies

#### Frontend
```json
{
  "leaflet": "^1.9.4",
  "socket.io-client": "^4.8.1", 
  "axios": "^1.6.0",
  "vue-toastification": "^2.0.0-rc.4"
}
```

#### Backend
```json
{
  "socket.io": "^4.7.2",
  "mysql2": "^3.9.1",
  "express": "^4.18.2",
  "express-validator": "^7.0.1"
}
```

## Tối Ưu Hóa Hiệu Năng

### Caching Strategy
- **Restaurant Data**: Cache 5 phút
- **Route Data**: Cache 10 phút  
- **Driver Locations**: Real-time, no cache
- **Geocoding Results**: Cache 1 giờ

### Database Optimization
```sql
-- Indexes cho performance
CREATE INDEX idx_restaurants_location ON restaurants (latitude, longitude);
CREATE INDEX idx_driver_locations_driver ON driver_locations (driver_id);
CREATE INDEX idx_orders_tracking ON orders (id, user_id, driver_id);
```

### Rate Limiting
- Google Maps API: 40,000 requests/month free tier
- Location Updates: Max 1 request/5 seconds per driver
- Search API: Max 10 requests/minute per user

## Error Handling

### Common Issues
1. **Geolocation Permission Denied**: Fallback to default location
2. **Google Maps API Quota**: Fallback to Haversine calculation
3. **Socket Disconnection**: Auto-reconnect with exponential backoff
4. **Driver Offline**: Show last known location with timestamp

### Error Responses
```javascript
{
  "success": false,
  "message": "Service unavailable",
  "error": "External map service unavailable",
  "code": "MAP_SERVICE_ERROR"
}
```

## Testing

### Unit Tests
- Service methods cho distance calculation
- Route optimization algorithms
- ETA calculation với different scenarios

### Integration Tests  
- API endpoints với mock data
- Socket.IO event flows
- Database queries performance

### E2E Tests
- Complete user journey: search → select → track
- Real-time updates simulation
- Cross-device synchronization

## Deployment Notes

### Production Considerations
1. **API Keys**: Store securely trong environment variables
2. **Database**: Index optimization cho location queries
3. **CDN**: Cache static map tiles và icons
4. **Monitoring**: Track API usage và performance metrics
5. **Backup**: Regular backup cho location data

### Scaling
- **Database Sharding**: Theo geographic regions
- **Load Balancing**: Multiple Socket.IO servers
- **Caching**: Redis cho session data
- **CDN**: Geographic distribution cho map tiles

## Roadmap Tương Lai

### Phase 2 Features
1. **Offline Maps**: Cache map tiles cho offline usage
2. **Route Optimization**: AI-based delivery batching
3. **Predictive ETA**: Machine learning cho accurate estimates
4. **Heat Maps**: Popular delivery locations visualization
5. **Driver Analytics**: Performance metrics và insights

### Technology Upgrades
1. **WebRTC**: Direct P2P communication
2. **Service Workers**: Background location updates  
3. **GraphQL**: Optimized data fetching
4. **Microservices**: Separate map service architecture

---

## Kết Luận

Hệ thống tích hợp bản đồ đã được implement đầy đủ với các tính năng:

✅ **Hiển thị nhà hàng gần vị trí người dùng** - Với search, filters và sorting
✅ **Tính toán khoảng cách và thời gian giao hàng** - Real-time với traffic consideration  
✅ **Theo dõi vị trí shipper theo thời gian thực** - Socket.IO với animation
✅ **Chỉ đường từ/đến điểm giao hàng** - Turn-by-turn directions

Hệ thống đã sẵn sàng để deploy và có thể scale cho production environment.