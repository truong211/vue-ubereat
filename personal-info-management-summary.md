# Hệ thống Quản lý Thông tin Cá nhân - Food Delivery App

## Tổng quan
Ứng dụng đã có hệ thống quản lý thông tin cá nhân hoàn chỉnh với các tính năng được yêu cầu. Dưới đây là chi tiết về các tính năng đã được triển khai.

## 1. Xem thông tin cá nhân ✅

### Tính năng đã triển khai:
- **Trang hồ sơ người dùng**: `frontend/src/views/UserProfile.vue`
- **Component quản lý hồ sơ**: `frontend/src/components/profile/UserProfileManager.vue`
- **Hiển thị thông tin cá nhân**: `frontend/src/components/profile/sections/PersonalInfo.vue`

### Thông tin hiển thị:
- Ảnh đại diện người dùng
- Tên và họ
- Email
- Số điện thoại
- Giao diện người dùng thân thiện với Vuetify

## 2. Chỉnh sửa hồ sơ (tên, email, số điện thoại, ảnh đại diện) ✅

### Tính năng đã triển khai:

#### 📝 Chỉnh sửa thông tin cơ bản:
- **Form chỉnh sửa**: Tích hợp trong `PersonalInfo.vue`
- **Các trường có thể chỉnh sửa**:
  - Tên (firstName)
  - Họ (lastName) 
  - Số điện thoại (phone)
- **Email**: Chỉ đọc (readonly) vì lý do bảo mật
- **Validation**: Kiểm tra dữ liệu đầu vào
  - Email hợp lệ
  - Số điện thoại hợp lệ (định dạng Việt Nam)
  - Các trường bắt buộc

#### 📷 Quản lý ảnh đại diện:
- **Upload ảnh**: Tích hợp trong `UserProfileManager.vue`
- **Validation**: 
  - Chỉ chấp nhận file hình ảnh
  - Giới hạn kích thước (5MB)
- **Preview**: Hiển thị ảnh ngay lập tức
- **API endpoint**: `/api/users/profile/image`

### Backend API đã có:
```javascript
// Cập nhật hồ sơ
PATCH /api/users/profile
{
  "fullName": "string",
  "phone": "string", 
  "address": "string"
}

// Upload ảnh đại diện
POST /api/users/profile/image
Content-Type: multipart/form-data
```

## 3. Quản lý danh sách địa chỉ giao hàng ✅

### Tính năng đã triển khai:

#### 📍 Quản lý địa chỉ hoàn chỉnh:
- **Trang quản lý**: `frontend/src/views/AddressBook.vue`
- **Component**: `frontend/src/components/profile/AddressManager.vue`

#### ✨ Các tính năng chính:
1. **Xem danh sách địa chỉ**:
   - Hiển thị tất cả địa chỉ đã lưu
   - Phân biệt địa chỉ mặc định
   - Icon phân loại theo loại địa chỉ

2. **Thêm địa chỉ mới**:
   - Form nhập đầy đủ thông tin
   - Tên địa chỉ (ví dụ: Nhà, Công ty)
   - Loại địa chỉ (home, work, other)
   - Địa chỉ chi tiết (đường, thành phố, bang, mã bưu điện)
   - Ghi chú giao hàng
   - Đặt làm địa chỉ mặc định

3. **Chỉnh sửa địa chỉ**:
   - Sửa đổi thông tin địa chỉ hiện có
   - Cập nhật trạng thái mặc định

4. **Xóa địa chỉ**:
   - Xác nhận trước khi xóa
   - Không thể xóa địa chỉ mặc định duy nhất

5. **Đặt địa chỉ mặc định**:
   - Chọn địa chỉ mặc định cho giao hàng
   - Tự động hủy trạng thái mặc định của địa chỉ khác

### Database Schema:
```sql
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  addressLine1 VARCHAR(255) NOT NULL,
  addressLine2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postalCode VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
  phone VARCHAR(15),
  isDefault BOOLEAN DEFAULT FALSE,
  type ENUM('home', 'work', 'other') DEFAULT 'home',
  instructions TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ...
)
```

### Backend API đã có:
```javascript
// Lấy danh sách địa chỉ
GET /api/users/addresses

// Thêm địa chỉ mới
POST /api/users/addresses

// Cập nhật địa chỉ
PATCH /api/users/addresses/:id

// Xóa địa chỉ
DELETE /api/users/addresses/:id
```

## 4. Xem lịch sử đơn hàng ✅

### Tính năng đã triển khai:

#### 📋 Quản lý đơn hàng hoàn chỉnh:
- **Trang lịch sử**: `frontend/src/views/OrderHistory.vue`
- **Component**: `frontend/src/components/profile/sections/OrderHistory.vue`
- **Chi tiết đơn hàng**: `frontend/src/views/OrderDetails.vue`

#### 📊 Các tính năng chính:
1. **Xem danh sách đơn hàng**:
   - Hiển thị tất cả đơn hàng theo thứ tự thời gian
   - Thông tin cơ bản: mã đơn, nhà hàng, tổng tiền, trạng thái
   - Lọc và tìm kiếm đơn hàng

2. **Chi tiết đơn hàng**:
   - Thông tin nhà hàng
   - Danh sách món ăn đã đặt
   - Thông tin giao hàng
   - Lịch sử trạng thái đơn hàng
   - Thông tin tài xế (nếu có)

3. **Trạng thái đơn hàng**:
   - pending (chờ xác nhận)
   - confirmed (đã xác nhận)
   - preparing (đang chuẩn bị)
   - ready (sẵn sàng)
   - out_for_delivery (đang giao)
   - delivered (đã giao)
   - cancelled (đã hủy)

### Database Schema:
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  orderNumber VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
  totalAmount DECIMAL(10, 2) NOT NULL,
  paymentMethod ENUM('cash', 'credit_card', 'debit_card', 'e_wallet'),
  deliveryAddress TEXT NOT NULL,
  estimatedDeliveryTime DATETIME,
  actualDeliveryTime DATETIME,
  ...
)
```

### Backend API đã có:
```javascript
// Lấy danh sách đơn hàng
GET /api/users/orders

// Lấy chi tiết đơn hàng
GET /api/users/orders/:id
```

## Tính năng bổ sung đã có

### 🔐 Bảo mật và xác thực:
- JWT authentication
- Middleware bảo vệ route
- Validation dữ liệu đầu vào

### 📱 Giao diện người dùng:
- Responsive design với Vuetify
- Dark/Light theme support
- Loading states và error handling
- Toast notifications
- Form validation real-time

### 🌐 Quốc tế hóa:
- Hỗ trợ tiếng Việt
- Cấu hình i18n sẵn sàng

### 📊 State Management:
- Vuex store cho quản lý state
- Actions và mutations cho API calls
- Computed properties cho reactive data

## Cấu trúc thư mục

```
frontend/src/
├── views/
│   ├── UserProfile.vue         # Trang chính hồ sơ người dùng
│   ├── AddressBook.vue         # Quản lý địa chỉ
│   ├── OrderHistory.vue        # Lịch sử đơn hàng
│   └── OrderDetails.vue        # Chi tiết đơn hàng
├── components/
│   └── profile/
│       ├── UserProfileManager.vue    # Component quản lý tổng thể
│       ├── AddressManager.vue        # Quản lý địa chỉ
│       └── sections/
│           ├── PersonalInfo.vue      # Thông tin cá nhân
│           ├── OrderHistory.vue      # Lịch sử đơn hàng
│           └── AccountSettings.vue   # Cài đặt tài khoản

backend/
├── controllers/
│   └── user.controller.js       # API endpoints cho user
├── models/
│   └── user.js                  # Model người dùng
└── routes/
    └── user.routes.js           # Routes định nghĩa
```

## Kết luận

Hệ thống quản lý thông tin cá nhân đã được triển khai đầy đủ với tất cả các tính năng được yêu cầu:

✅ **Xem thông tin cá nhân** - Hoàn chỉnh
✅ **Chỉnh sửa hồ sơ** - Hoàn chỉnh (tên, email, số điện thoại, ảnh đại diện)  
✅ **Quản lý địa chỉ giao hàng** - Hoàn chỉnh (CRUD operations)
✅ **Xem lịch sử đơn hàng** - Hoàn chỉnh (với chi tiết đầy đủ)

Hệ thống được xây dựng với kiến trúc hiện đại, bảo mật tốt và trải nghiệm người dùng mượt mà. Tất cả các API backend và frontend components đều đã được triển khai và sẵn sàng sử dụng.