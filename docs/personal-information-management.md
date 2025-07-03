# Quản lý thông tin cá nhân (Personal Information Management)

## Tổng quan (Overview)

Hệ thống quản lý thông tin cá nhân của ứng dụng food delivery đã được triển khai đầy đủ với tất cả các tính năng theo yêu cầu:

✅ **Xem thông tin cá nhân**  
✅ **Chỉnh sửa hồ sơ (tên, email, số điện thoại, ảnh đại diện)**  
✅ **Quản lý danh sách địa chỉ giao hàng**  
✅ **Xem lịch sử đơn hàng**

## 1. Xem thông tin cá nhân (View Personal Information)

### Vị trí: `/frontend/src/views/user/Profile.vue`
- **Component chính**: Profile.vue (459 dòng code)
- **Route**: `/profile`
- **Tính năng**:
  - Hiển thị avatar người dùng
  - Thông tin cơ bản: tên, email, số điện thoại
  - Liên kết nhanh đến các tính năng quản lý khác
  - Thiết lập thông báo và bảo mật

### Các thành phần UI:
```vue
<!-- Profile Header với Avatar -->
<avatar-upload v-model="profile.avatar" :current-avatar="profile.avatar" />

<!-- Thông tin cá nhân -->
<v-text-field v-model="profile.name" label="Họ tên" />
<v-text-field v-model="profile.email" label="Email" readonly />
<v-text-field v-model="profile.phone" label="Số điện thoại" />

<!-- Quick Links -->
<v-card variant="outlined" height="100%">
  <router-link :to="{ name: 'Addresses' }">
    <v-icon>mdi-map-marker</v-icon>
    <span>Địa chỉ giao hàng</span>
  </router-link>
</v-card>
```

## 2. Chỉnh sửa hồ sơ (Edit Profile)

### Tính năng đã triển khai:

#### a) Chỉnh sửa tên (Name Editing)
- **Component**: Profile.vue
- **Validation**: Required field validation
- **API**: `PATCH /api/users/profile`

#### b) Hiển thị Email 
- **Trạng thái**: Read-only (bảo mật)
- **Lý do**: Email là định danh duy nhất, không cho phép thay đổi

#### c) Chỉnh sửa số điện thoại (Phone Editing)
- **Validation**: Phone number format validation
- **Component**: Profile.vue với validatePhone function

#### d) Upload ảnh đại diện (Avatar Upload)
- **Component**: `/frontend/src/components/user/AvatarUpload.vue`
- **Tính năng**: 
  - Drag & drop upload
  - Image preview
  - File size validation
  - Format validation (jpg, png, etc.)

#### e) Đổi mật khẩu (Change Password)
- **Form validation**: Current password, new password, confirm password
- **Security**: Bcrypt hashing
- **API**: Password change endpoint trong auth controller

### Code Example:
```javascript
// Profile update action
async handleSubmit() {
  const userData = {
    fullName: profile.name,
    phone: profile.phone || '',
    address: profile.address || ''
  }
  
  await store.dispatch('user/updateProfile', userData)
  showSuccessMessage('Cập nhật thông tin thành công')
}
```

## 3. Quản lý danh sách địa chỉ giao hàng (Manage Delivery Addresses)

### Component chính: `/frontend/src/components/user/DeliveryAddresses.vue`
- **Dung lượng**: 311 dòng code với TypeScript
- **Tính năng đầy đủ**:

#### a) Thêm địa chỉ mới
```vue
<v-dialog v-model="showAddDialog" max-width="600">
  <v-form ref="form" v-model="isValid">
    <v-text-field v-model="addressForm.name" label="Tên địa chỉ" />
    <v-text-field v-model="addressForm.address" label="Địa chỉ" />
    <v-text-field v-model="addressForm.city" label="Thành phố" />
    <v-text-field v-model="addressForm.state" label="Tỉnh" />
  </v-form>
</v-dialog>
```

#### b) Chỉnh sửa địa chỉ
- **Edit in place**: Click vào icon chỉnh sửa
- **Form validation**: Required fields
- **API Integration**: `PUT /api/users/addresses/:id`

#### c) Xóa địa chỉ
- **Confirmation dialog**: Xác nhận trước khi xóa
- **API**: `DELETE /api/users/addresses/:id`

#### d) Đặt địa chỉ mặc định
- **One-click default**: Click vào icon ngôi sao
- **Auto-update UI**: Cập nhật giao diện ngay lập tức
- **API**: `PUT /api/users/addresses/:id/default`

### Vuex Store Integration:
```javascript
// Address management actions
async addAddress({ commit }, addressData) {
  const response = await axios.post('/api/user/addresses', addressData)
  commit('ADD_ADDRESS', response.data)
}

async setDefaultAddress({ commit }, addressId) {
  await axios.put(`/api/user/addresses/${addressId}/default`)
  commit('SET_DEFAULT_ADDRESS', addressId)
}
```

### Giao diện người dùng:
- **Địa chỉ mặc định**: Hiển thị riêng biệt với icon home
- **Địa chỉ khác**: Danh sách với các action buttons
- **Empty state**: Thông báo khi chưa có địa chỉ nào

## 4. Xem lịch sử đơn hàng (View Order History)

### Component chính: `/frontend/src/views/Orders.vue`
- **Dung lượng**: 496 dòng code
- **Route**: `/orders`

### Tính năng đầy đủ:

#### a) Danh sách đơn hàng với bộ lọc
```vue
<v-tabs v-model="activeTab" bg-color="primary">
  <v-tab value="all">All Orders</v-tab>
  <v-tab value="active">Active</v-tab>
  <v-tab value="completed">Completed</v-tab>
  <v-tab value="cancelled">Cancelled</v-tab>
</v-tabs>
```

#### b) Thông tin chi tiết đơn hàng
- **Restaurant info**: Logo, tên nhà hàng, số lượng món
- **Order details**: Số đơn hàng, ngày giờ, tổng tiền
- **Payment method**: Phương thức thanh toán
- **Status tracking**: Trạng thái đơn hàng với timeline

#### c) Theo dõi đơn hàng real-time
```vue
<v-timeline align="start" direction="horizontal">
  <v-timeline-item
    v-for="status in orderStatusFlow"
    :dot-color="getTimelineColor(status.value, order.status)"
    :icon="status.icon"
  >
    {{ status.label }}
  </v-timeline-item>
</v-timeline>
```

#### d) Chức năng tương tác
- **View details**: Xem chi tiết đơn hàng
- **Rate order**: Đánh giá đơn hàng đã giao
- **Cancel order**: Hủy đơn hàng (với lý do)
- **Reorder**: Đặt lại đơn hàng

### Order Status Flow:
```javascript
orderStatusFlow: [
  { value: 'pending', label: 'Pending', icon: 'mdi-clock-outline' },
  { value: 'confirmed', label: 'Confirmed', icon: 'mdi-check-circle-outline' },
  { value: 'preparing', label: 'Preparing', icon: 'mdi-food-outline' },
  { value: 'ready_for_pickup', label: 'Ready', icon: 'mdi-package-variant-closed' },
  { value: 'out_for_delivery', label: 'On the Way', icon: 'mdi-truck-delivery-outline' },
  { value: 'delivered', label: 'Delivered', icon: 'mdi-check-circle' }
]
```

## Kiến trúc hệ thống (System Architecture)

### Frontend Stack:
- **Vue.js 3**: Composition API
- **Vuetify 3**: Material Design components
- **TypeScript**: Type safety
- **Vuex**: State management
- **Vue Router**: Routing

### Backend Stack:
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MySQL**: Database
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload

### Database Schema:
```sql
-- Users table với đầy đủ thông tin profile
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255),
  fullName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  profileImage VARCHAR(255),
  -- ... other fields
);

-- Addresses table cho địa chỉ giao hàng
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  addressLine1 VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  -- ... other fields
);

-- Orders table cho lịch sử đơn hàng
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  orderNumber VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
  totalAmount DECIMAL(10, 2) NOT NULL,
  -- ... other fields
);
```

## State Management (Vuex Store)

### Store Modules:
1. **`/frontend/src/store/modules/user.js`** (582 dòng)
   - Profile management
   - Address CRUD operations
   - Payment methods
   - Vouchers management

2. **`/frontend/src/store/modules/order.js`** (182 dòng)
   - Order history
   - Order tracking
   - Order actions (cancel, rate)

3. **`/frontend/src/store/profile.js`** (169 dòng)
   - Profile state management
   - Address management
   - Order history integration

### Store Actions:
```javascript
// User profile actions
async updateProfile({ commit }, profileData)
async fetchAddresses({ commit })
async addAddress({ commit }, addressData)
async updateAddress({ commit }, { id, addressData })
async deleteAddress({ commit }, addressId)
async setDefaultAddress({ commit }, addressId)

// Order actions  
async fetchOrders({ commit }, params)
async fetchOrderById({ commit }, id)
async cancelOrder({ commit }, { id, cancellationReason })
async rateOrder({ commit }, { id, rating, review })
```

## API Endpoints

### User Management:
- `GET /api/users/profile` - Lấy thông tin profile
- `PATCH /api/users/profile` - Cập nhật profile
- `POST /api/users/avatar` - Upload avatar

### Address Management:
- `GET /api/users/addresses` - Lấy danh sách địa chỉ
- `POST /api/users/addresses` - Thêm địa chỉ mới
- `PUT /api/users/addresses/:id` - Cập nhật địa chỉ
- `DELETE /api/users/addresses/:id` - Xóa địa chỉ
- `PUT /api/users/addresses/:id/default` - Đặt địa chỉ mặc định

### Order Management:
- `GET /api/orders` - Lấy lịch sử đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:id/cancel` - Hủy đơn hàng
- `POST /api/orders/:id/review` - Đánh giá đơn hàng

## Responsive Design

### Mobile Optimization:
- **Responsive grid**: v-col với breakpoints
- **Touch-friendly**: Larger tap targets
- **Swipe gestures**: Cho order timeline
- **Mobile navigation**: Collapsed sidebar

### Desktop Features:
- **Multi-column layout**: Tối ưu hóa không gian
- **Hover effects**: Interactive elements
- **Keyboard shortcuts**: Navigation support

## Security Features

### Frontend Security:
- **Form validation**: Client-side validation
- **XSS protection**: Sanitized inputs
- **Route guards**: Authentication required
- **CSRF tokens**: Cross-site request forgery protection

### Backend Security:
- **JWT Authentication**: Secure token-based auth
- **Password hashing**: Bcrypt với salt
- **Input validation**: Server-side validation
- **SQL injection protection**: Parameterized queries

## Performance Optimization

### Frontend:
- **Lazy loading**: Components loaded on demand
- **Code splitting**: Route-based splitting
- **Image optimization**: Compressed avatars
- **Caching**: Vuex state persistence

### Backend:
- **Database indexing**: Optimized queries
- **Pagination**: Large dataset handling
- **Connection pooling**: Database connections
- **Response compression**: Gzip compression

## Testing & Quality

### Code Quality:
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vue DevTools**: Development debugging

### Error Handling:
- **Try-catch blocks**: Comprehensive error handling
- **User feedback**: Toast notifications
- **Loading states**: User experience indicators
- **Fallback UI**: Empty states và error states

## Tóm tắt (Summary)

Hệ thống **Quản lý thông tin cá nhân** đã được triển khai hoàn chỉnh với:

✅ **Chức năng đầy đủ**: Tất cả yêu cầu đã được hiện thực hóa  
✅ **Giao diện hiện đại**: Vuetify Material Design  
✅ **Responsive**: Tối ưu cho mọi thiết bị  
✅ **Bảo mật**: JWT authentication và validation  
✅ **Performance**: Lazy loading và optimization  
✅ **UX/UI**: Loading states và error handling  
✅ **TypeScript**: Type safety và better development experience  

Hệ thống sẵn sàng để sử dụng trong production với đầy đủ tính năng quản lý thông tin cá nhân theo yêu cầu.

## Hướng dẫn sử dụng (Usage Guide)

### Cho người dùng cuối:
1. **Truy cập Profile**: Từ menu chính → Profile
2. **Chỉnh sửa thông tin**: Click "Chỉnh sửa" → Cập nhật → Lưu
3. **Quản lý địa chỉ**: Profile → Địa chỉ giao hàng → Thêm/Sửa/Xóa
4. **Xem đơn hàng**: Menu → Orders → Chọn filter theo trạng thái

### Cho developer:
1. **Profile component**: `/frontend/src/views/user/Profile.vue`
2. **Address component**: `/frontend/src/components/user/DeliveryAddresses.vue`
3. **Orders component**: `/frontend/src/views/Orders.vue`
4. **Store modules**: `/frontend/src/store/modules/user.js`
5. **API routes**: `/server/controllers/auth.controller.js`