# Hệ thống Quản lý Thông tin Cá nhân (Personal Information Management System)

## Tổng quan

Tôi đã triển khai một hệ thống quản lý thông tin cá nhân hoàn chỉnh cho ứng dụng food delivery với các tính năng sau:

### 🎯 Các tính năng chính

1. **Xem thông tin cá nhân** - View personal information
2. **Chỉnh sửa hồ sơ** - Edit profile (tên, email, số điện thoại, ảnh đại diện)
3. **Quản lý danh sách địa chỉ giao hàng** - Manage delivery addresses
4. **Xem lịch sử đơn hàng** - View order history

## 🏗️ Kiến trúc hệ thống

### Backend API

#### 1. Routes (`backend/routes/user.routes.js`)
```javascript
// User Profile Routes
GET    /api/user/profile              - Lấy thông tin cá nhân
PUT    /api/user/profile              - Cập nhật thông tin cá nhân
POST   /api/user/profile/avatar       - Tải lên ảnh đại diện
DELETE /api/user/profile/avatar       - Xóa ảnh đại diện

// Address Management Routes
GET    /api/user/addresses            - Lấy danh sách địa chỉ
POST   /api/user/addresses            - Tạo địa chỉ mới
GET    /api/user/addresses/:id        - Lấy chi tiết địa chỉ
PUT    /api/user/addresses/:id        - Cập nhật địa chỉ
DELETE /api/user/addresses/:id        - Xóa địa chỉ
PATCH  /api/user/addresses/:id/default - Đặt địa chỉ mặc định

// Order History Routes
GET    /api/user/orders               - Lấy lịch sử đơn hàng
GET    /api/user/orders/:id           - Lấy chi tiết đơn hàng
GET    /api/user/orders/statistics/summary - Lấy thống kê đơn hàng
```

#### 2. Controllers

**User Controller** (`backend/controllers/user.controller.js`)
- `getProfile()` - Lấy thông tin người dùng
- `updateProfile()` - Cập nhật thông tin cá nhân
- `uploadAvatar()` - Tải lên ảnh đại diện với validation
- `removeAvatar()` - Xóa ảnh đại diện

**Address Controller** (`backend/controllers/address.controller.js`)
- `getUserAddresses()` - Lấy tất cả địa chỉ
- `createAddress()` - Tạo địa chỉ mới
- `updateAddress()` - Cập nhật địa chỉ
- `deleteAddress()` - Xóa địa chỉ
- `setDefaultAddress()` - Đặt địa chỉ mặc định

**Order Controller** (`backend/controllers/order.controller.js`)
- `getUserOrders()` - Lấy lịch sử đơn hàng với phân trang
- `getOrder()` - Lấy chi tiết đơn hàng
- `getOrderStatistics()` - Thống kê đơn hàng

#### 3. Middleware & Configuration

**Auth Middleware** (`backend/middleware/auth.middleware.js`)
- `protect` - Xác thực JWT token
- `isAdmin`, `isRestaurantOwner`, `isDriver` - Phân quyền

**Database Config** (`backend/config/database.js`)
- Connection pool MySQL
- Query wrapper functions
- Error handling

### Frontend Components

#### 1. Main Component
**PersonalInformationManager** (`frontend/src/components/profile/PersonalInformationManager.vue`)
- Tab navigation (Profile, Addresses, Orders)
- Loading states và error handling
- Notification system

#### 2. Profile Management
**UserProfileForm** (`frontend/src/components/profile/UserProfileForm.vue`)
- Form validation với Vuetify rules
- Avatar upload với preview
- Notification preferences
- Real-time validation

#### 3. Address Management
**AddressManagement** (`frontend/src/components/profile/AddressManagement.vue`)
- CRUD operations cho địa chỉ
- Set default address
- Address type icons
- Responsive card layout

#### 4. Order History
**OrderHistoryView** (`frontend/src/components/profile/OrderHistoryView.vue`)
- Pagination và filtering
- Order statistics dashboard
- Search functionality
- Order actions (view details, rate, reorder)

### Frontend Services

#### 1. API Services
**User Profile Service** (`frontend/src/services/userProfile.service.js`)
```javascript
// Available methods
userProfileService.getProfile()
userProfileService.updateProfile(data)
userProfileService.uploadAvatar(file)
userProfileService.removeAvatar()
```

**Address Service** (`frontend/src/services/address.service.js`)
```javascript
// Available methods
addressService.getUserAddresses()
addressService.createAddress(data)
addressService.updateAddress(id, data)
addressService.deleteAddress(id)
addressService.setDefaultAddress(id)
```

**Order Service** (`frontend/src/services/order.service.js`)
```javascript
// Available methods
orderService.getUserOrders(params)
orderService.getOrder(id)
orderService.getOrderStatistics()
```

#### 2. Vuex Store Module
**User Module** (`frontend/src/store/modules/user.js`)

**State:**
```javascript
{
  profile: null,
  addresses: [],
  recentOrders: [],
  orderStatistics: null,
  isLoading: false,
  error: null
}
```

**Getters:**
- Profile info: `fullName`, `email`, `phone`, `profileImage`
- Address info: `defaultAddress`, `addressCount`, `homeAddresses`
- Order info: `totalOrdersCount`, `totalSpent`, `favoriteRestaurants`

**Actions:**
- Profile: `fetchProfile`, `updateProfile`, `uploadAvatar`, `removeAvatar`
- Address: `fetchAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`
- Orders: `fetchRecentOrders`, `fetchOrderStatistics`

## 📝 Tính năng chi tiết

### 1. Quản lý Profile

#### Thông tin có thể chỉnh sửa:
- **Họ và tên** (fullName) - Required
- **Email** - Required, unique validation
- **Số điện thoại** (phone) - Optional, format validation
- **Địa chỉ** (address) - Textarea
- **Ngôn ngữ ưa thích** (preferredLanguage) - vi/en
- **Ảnh đại diện** (profileImage) - Upload/remove với validation

#### Notification Preferences:
- Email notifications
- SMS notifications  
- Order updates
- Promotions

#### Validation:
- File size limit: 5MB
- File type: images only
- Email format validation
- Phone number format validation

### 2. Quản lý Địa chỉ

#### Thông tin địa chỉ:
- **Tên địa chỉ** (name) - Required
- **Loại địa chỉ** (type) - home/work/other
- **Địa chỉ chi tiết** (addressLine1) - Required
- **Địa chỉ bổ sung** (addressLine2) - Optional
- **Phường/Xã** (ward) - Required
- **Quận/Huyện** (district) - Required
- **Tỉnh/Thành phố** (city) - Required
- **Mã bưu điện** (postalCode) - Required, format validation
- **Số điện thoại** (phone) - Optional
- **Tên người nhận** (contactName) - Optional
- **SĐT người nhận** (contactPhone) - Optional
- **Tầng** (floor) - Optional
- **Số căn hộ** (apartmentNumber) - Optional
- **Ghi chú giao hàng** (instructions) - Optional
- **Có thang máy** (hasElevator) - Boolean
- **Địa chỉ mặc định** (isDefault) - Boolean

#### Tính năng:
- Set default address (chỉ có 1 default)
- Delete address (không thể xóa nếu là default và chỉ có 1 địa chỉ)
- Address type icons
- Responsive card layout

### 3. Lịch sử đơn hàng

#### Thông tin đơn hàng:
- Order number, restaurant info
- Order items với quantity
- Order status với color coding
- Total amount
- Created date
- Order actions

#### Tính năng filter:
- **Search** - Tìm theo order number, restaurant name, item name
- **Status filter** - Tất cả trạng thái đơn hàng
- **Time filter** - 7 ngày, 30 ngày, 3 tháng, 6 tháng, 1 năm

#### Order Statistics:
- **Tổng đơn hàng** - Total orders count
- **Tổng chi tiêu** - Total amount spent
- **Đã hoàn thành** - Completed orders count
- **Đang xử lý** - Pending orders count

#### Order Actions:
- **Xem chi tiết** - View order details
- **Đánh giá** - Rate order (for delivered orders)
- **Đặt lại** - Reorder items

## 🚀 Hướng dẫn Integration

### 1. Backend Setup

#### Cài đặt dependencies:
```bash
npm install multer jsonwebtoken bcryptjs mysql2
```

#### Environment variables (.env):
```
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_delivery
DB_PORT=3306
```

#### Register routes trong app.js:
```javascript
const userRoutes = require('./routes/user.routes');
app.use('/api/user', userRoutes);
```

#### Tạo uploads directory:
```bash
mkdir -p backend/uploads/avatars
```

### 2. Frontend Setup

#### Register components:
```javascript
// main.js hoặc router
import PersonalInformationManager from '@/components/profile/PersonalInformationManager.vue';
```

#### Add to Vuex store:
```javascript
// store/index.js
import user from './modules/user';

export default new Vuex.Store({
  modules: {
    user
  }
});
```

#### Add route:
```javascript
// router/index.js
{
  path: '/profile',
  name: 'Profile',
  component: () => import('@/views/UserProfile.vue'),
  meta: { requiresAuth: true }
}
```

### 3. Usage Example

#### Trong Vue component:
```vue
<template>
  <PersonalInformationManager />
</template>

<script>
import PersonalInformationManager from '@/components/profile/PersonalInformationManager.vue';

export default {
  components: {
    PersonalInformationManager
  }
};
</script>
```

#### Trong UserProfile.vue:
```vue
<template>
  <v-container class="profile-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Thông tin cá nhân</h1>
    <PersonalInformationManager />
  </v-container>
</template>
```

## 🔐 Security Features

### Backend Security:
- JWT token authentication
- User authorization middleware
- File upload validation (size, type)
- SQL injection protection với parameterized queries
- Input validation với express-validator

### Frontend Security:
- Token storage trong localStorage
- Automatic token refresh
- Route guards cho protected pages
- File upload validation
- XSS protection với Vuetify

## 📱 Responsive Design

### Mobile First:
- Responsive grid layout
- Touch-friendly buttons
- Swipe gestures
- Mobile navigation
- Optimized forms

### Desktop Features:
- Multi-column layout
- Hover effects
- Keyboard shortcuts
- Advanced filtering

## 🎨 UI/UX Features

### Design System:
- Vuetify Material Design 3
- Consistent color scheme
- Loading states
- Error handling
- Success notifications

### Accessibility:
- Screen reader support
- Keyboard navigation
- High contrast support
- Focus indicators

## 📊 Performance Optimizations

### Backend:
- Database indexing
- Connection pooling
- Query optimization
- File upload optimization

### Frontend:
- Lazy loading components
- Vuex state caching
- Debounced search
- Pagination
- Image optimization

## 🧪 Testing Recommendations

### Backend Testing:
```javascript
// Example test file
describe('User Profile API', () => {
  it('should get user profile', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### Frontend Testing:
```javascript
// Example component test
describe('UserProfileForm', () => {
  it('should update profile successfully', async () => {
    // Test implementation
  });
});
```

## 🔄 Future Enhancements

### Planned Features:
1. **Real-time notifications** - WebSocket integration
2. **Social login** - Google, Facebook integration
3. **Two-factor authentication** - SMS/Email OTP
4. **Address autocomplete** - Google Maps API
5. **Order tracking** - Real-time order status
6. **Export data** - PDF/Excel export
7. **Profile sharing** - QR code generation

### Performance Improvements:
1. **Redis caching** - Cache frequently accessed data
2. **CDN integration** - Static file delivery
3. **Image compression** - Optimize uploaded images
4. **API rate limiting** - Prevent abuse

## 📞 Support & Maintenance

### Error Monitoring:
- Comprehensive error logging
- User activity tracking
- Performance monitoring
- Security audit logs

### Backup & Recovery:
- Database backup strategy
- User data recovery
- File backup system
- Disaster recovery plan

---

## 📋 Checklist hoàn thành

✅ **Backend API** - Hoàn thành 100%
- [x] User profile CRUD
- [x] Address management 
- [x] Order history
- [x] File upload handling
- [x] Authentication & authorization

✅ **Frontend Components** - Hoàn thành 100%
- [x] Personal info form
- [x] Address management
- [x] Order history view
- [x] Navigation tabs
- [x] Responsive design

✅ **Services & Store** - Hoàn thành 100%
- [x] API services
- [x] Vuex store module
- [x] State management
- [x] Error handling

✅ **Security & Validation** - Hoàn thành 100%
- [x] Input validation
- [x] File upload security
- [x] Authentication
- [x] Error handling

Hệ thống quản lý thông tin cá nhân đã được triển khai hoàn chỉnh và sẵn sàng sử dụng! 🎉