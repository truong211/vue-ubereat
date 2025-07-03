# Map Integration - Food Delivery System

## Tổng quan

Hệ thống tích hợp bản đồ toàn diện cho ứng dụng giao đồ ăn với các tính năng chính:

1. **Hiển thị nhà hàng gần vị trí người dùng**
2. **Tính toán khoảng cách và thời gian giao hàng**
3. **Theo dõi vị trí shipper theo thời gian thực**
4. **Chỉ đường từ/đến điểm giao hàng**

## Kiến trúc hệ thống

### Frontend Components

#### 1. MapService (`frontend/src/services/mapService.js`)
- Service chính để xử lý tất cả operations liên quan đến bản đồ
- Tích hợp Google Maps API
- Các method chính:
  - `getNearbyRestaurants()` - Lấy danh sách nhà hàng gần đây
  - `calculateDistance()` - Tính khoảng cách Haversine
  - `getDirections()` - Lấy chỉ đường từ Google Maps
  - `getCurrentLocation()` - Lấy vị trí hiện tại của user
  - `updateDriverLocation()` - Cập nhật vị trí tài xế
  - `calculateDeliveryFee()` - Tính phí giao hàng theo khoảng cách

#### 2. RealTimeTracking (`frontend/src/components/delivery/RealTimeTracking.vue`)
- Component theo dõi đơn hàng real-time
- Tính năng:
  - Hiển thị vị trí tài xế trên bản đồ
  - Cập nhật ETA động theo traffic
  - Timeline tiến trình đơn hàng
  - Chat với tài xế
  - Smooth animation cho marker movement

#### 3. EnhancedRestaurantMap (`frontend/src/components/restaurant/EnhancedRestaurantMap.vue`)
- Bản đồ khám phá nhà hàng với filter nâng cao
- Tính năng:
  - Search và filter nhà hàng
  - Hiển thị delivery zones
  - Tính ETA và phí giao hàng
  - Toggle giữa map view và list view
  - Integration với navigation

#### 4. Existing Components (Enhanced)
- `LiveMap.vue` - Real-time delivery tracking map
- `MapView.vue` - General purpose map with directions
- `RestaurantMap.vue` - Restaurant location visualization

### Backend APIs

#### 1. Map Controller (`backend/src/controllers/map.controller.js`)
Xử lý các operations bản đồ:

**Geocoding:**
- `POST /api/map/geocode` - Geocode địa chỉ thành coordinates
- `POST /api/map/reverse-geocode` - Reverse geocode coordinates thành địa chỉ

**Distance & Directions:**
- `POST /api/map/distance` - Tính khoảng cách giữa 2 điểm
- `POST /api/map/directions` - Lấy chỉ đường chi tiết

**Restaurant Location:**
- `GET /api/map/restaurants/nearby` - Lấy nhà hàng gần đây
- `GET /api/map/restaurants/locations` - Lấy vị trí nhà hàng trong bounds

**Delivery Zones:**
- `POST /api/map/delivery-zone/check` - Kiểm tra vùng giao hàng
- `GET /api/map/delivery-zones/:restaurantId` - Lấy vùng giao hàng

**ETA Calculation:**
- `POST /api/map/eta/calculate` - Tính ETA cơ bản
- `POST /api/map/eta/update` - Cập nhật ETA với traffic

#### 2. Tracking Controller (Enhanced)
- Real-time driver location updates
- Order tracking với Socket.IO
- ETA calculation với traffic data

#### 3. Delivery Config Controller (Enhanced)
- Delivery fee calculation based on distance
- Delivery zone management
- Fee tier configuration

## Tính năng chi tiết

### 1. Hiển thị nhà hàng gần vị trí người dùng

**Cách hoạt động:**
- Auto-detect vị trí user bằng Geolocation API
- Query nhà hàng trong radius configurable (2-20km)
- Hiển thị trên map với markers khác nhau cho available/unavailable
- Filter theo cuisine, price range, rating, delivery time
- Sort theo distance, rating, popularity

**API sử dụng:**
```javascript
// Frontend
const restaurants = await mapService.getNearbyRestaurants(userLocation, radius);

// Backend
GET /api/map/restaurants/nearby?lat=10.8231&lng=106.6297&radius=10
```

### 2. Tính toán khoảng cách và thời gian giao hàng

**Phương pháp tính:**
- **Straight-line distance**: Haversine formula
- **Driving distance**: Google Maps Distance Matrix API
- **ETA calculation**: 
  - Preparation time (20-25 phút)
  - Travel time (average 25 km/h trong thành phố)
  - Traffic adjustment với Google Maps

**Delivery fee calculation:**
- Base fee + distance-based fee
- Fee tiers: 0-2km, 2-5km, 5km+
- Minimum order amount check
- Free delivery threshold

```javascript
// Tính ETA
const eta = mapService.calculateEstimatedDeliveryTime(distance, orderStatus);

// Tính phí giao hàng
const feeData = await mapService.calculateDeliveryFee(distance, restaurantId, orderAmount);
```

### 3. Theo dõi vị trí shipper theo thời gian thực

**Real-time tracking:**
- Socket.IO connection cho real-time updates
- Driver location updates mỗi 10-30 giây
- Smooth marker animation trên map
- Auto-update ETA với traffic data

**Socket events:**
- `driver_location_updated` - Cập nhật vị trí tài xế
- `eta_updated` - Cập nhật ETA
- `order_status_updated` - Cập nhật trạng thái đơn hàng

```javascript
// Driver update location
await mapService.updateDriverLocation({
  lat: position.latitude,
  lng: position.longitude,
  heading: position.heading,
  speed: position.speed
});

// Listen for updates
socket.on('driver_location_updated', (data) => {
  updateDriverMarker(data.location);
  calculateRoute();
});
```

### 4. Chỉ đường từ/đến điểm giao hàng

**Navigation features:**
- Google Maps Directions API
- Real-time traffic consideration
- Multiple travel modes (driving, walking, bicycling)
- Turn-by-turn directions
- External navigation app integration

```javascript
// Lấy directions
const directions = await mapService.getDirections(origin, destination, 'DRIVING');

// Open trong Google Maps app
const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}`;
window.open(url, '_blank');
```

## Configuration

### Environment Variables

```bash
# Google Maps API Key
VUE_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_server_side_api_key

# API URL
VUE_APP_API_URL=http://localhost:3001
```

### Google Maps API Requirements

Cần enable các APIs sau trong Google Cloud Console:
- Maps JavaScript API
- Geocoding API
- Directions API
- Distance Matrix API
- Places API (optional)

### Database Schema Updates

Delivery configuration tables:
- `delivery_configs` - Cấu hình giao hàng cho từng nhà hàng
- `delivery_fee_tiers` - Bậc phí giao hàng theo khoảng cách
- `driver_locations` - Vị trí real-time của tài xế

## Usage Examples

### 1. Tích hợp Real-time Tracking

```vue
<template>
  <RealTimeTracking 
    :order-id="orderId"
    :map-height="'500px'"
  />
</template>

<script setup>
import RealTimeTracking from '@/components/delivery/RealTimeTracking.vue';
const orderId = ref(123);
</script>
```

### 2. Restaurant Map với Filters

```vue
<template>
  <EnhancedRestaurantMap 
    :initial-location="userLocation"
    :content-height="'600px'"
  />
</template>

<script setup>
import EnhancedRestaurantMap from '@/components/restaurant/EnhancedRestaurantMap.vue';
const userLocation = ref({ lat: 10.8231, lng: 106.6297 });
</script>
```

### 3. Custom Map Integration

```javascript
import mapService from '@/services/mapService';

// Get user location
const location = await mapService.getCurrentLocation();

// Find nearby restaurants
const restaurants = await mapService.getNearbyRestaurants(location, 10);

// Calculate delivery info
for (const restaurant of restaurants) {
  const distance = mapService.calculateDistance(location, restaurant);
  const eta = mapService.calculateEstimatedDeliveryTime(distance);
  const fee = await mapService.calculateDeliveryFee(distance, restaurant.id);
}
```

## Performance Optimization

### 1. Map Loading
- Lazy load Google Maps API
- Cache geocoding results
- Debounce search và filter operations
- Efficient marker clustering

### 2. Real-time Updates
- Throttle location updates (30 seconds max)
- Use WebSocket connection pooling
- Batch update multiple orders
- Graceful fallback khi mất connection

### 3. API Usage
- Cache Google Maps API responses
- Use appropriate request limits
- Implement retry logic
- Monitor API quotas

## Testing

### Unit Tests
```bash
# Test map service
npm run test:unit -- mapService.spec.js

# Test components
npm run test:unit -- RealTimeTracking.spec.js
```

### Integration Tests
```bash
# Test API endpoints
npm run test:integration -- map.controller.spec.js
```

### E2E Tests
```bash
# Test full map workflow
npm run test:e2e -- map-integration.spec.js
```

## Deployment Notes

### Production Setup
1. Sử dụng production Google Maps API key
2. Configure CORS properly cho maps domain
3. Set up SSL certificates cho geolocation
4. Monitor API usage và costs
5. Implement rate limiting

### Security
- Restrict API keys theo domain/IP
- Validate coordinates ranges
- Sanitize address inputs
- Implement proper authentication cho driver updates

## Troubleshooting

### Common Issues

1. **Map không load:**
   - Kiểm tra Google Maps API key
   - Verify domain restrictions
   - Check console errors

2. **Geolocation không hoạt động:**
   - Cần HTTPS cho production
   - User permissions
   - Browser compatibility

3. **Real-time tracking lag:**
   - Check Socket.IO connection
   - Network connectivity
   - Driver location update frequency

4. **ETA không chính xác:**
   - Traffic data availability
   - Route calculation errors
   - Time zone issues

### Debug Tools
```javascript
// Enable debug logging
localStorage.setItem('mapDebug', 'true');

// Check connection status
console.log('Socket connected:', socket.connected);

// Monitor API calls
console.log('API calls:', mapService.getApiCallCount());
```

## Future Enhancements

### Planned Features
1. **Offline map support** - Cache essential map data
2. **Advanced traffic prediction** - Machine learning ETA
3. **Multi-language directions** - Localized navigation
4. **AR navigation** - Augmented reality directions
5. **Driver optimization** - Route optimization algorithms
6. **Heatmaps** - Popular restaurant areas
7. **Geofencing** - Automated zone detection

### API Integrations
- Alternative map providers (Mapbox, OpenStreetMap)
- Local traffic APIs
- Weather integration for delivery estimation
- Public transport directions

---

## Support

Để được hỗ trợ hoặc báo cáo bugs:
1. Check existing issues trong project repository
2. Provide detailed reproduction steps
3. Include browser/device information
4. Add relevant console logs

## License

Tính năng map integration tuân theo license của main project.