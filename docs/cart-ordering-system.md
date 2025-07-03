# Hệ Thống Giỏ Hàng và Đặt Hàng (Cart & Ordering System)

## Tổng Quan
Hệ thống giỏ hàng và đặt hàng đã được triển khai đầy đủ với tất cả các tính năng được yêu cầu:

## ✅ Các Tính Năng Đã Triển Khai

### 1. Thêm/Sửa/Xóa Món Trong Giỏ Hàng
**Frontend:** `frontend/src/store/modules/cart.js`
**Backend:** `backend/src/controllers/cart.controller.js`

**Chức năng:**
- ✅ Thêm món ăn vào giỏ hàng với validation
- ✅ Cập nhật số lượng món (tăng/giảm)
- ✅ Xóa món khỏi giỏ hàng
- ✅ Xóa toàn bộ giỏ hàng
- ✅ Kiểm tra xung đột nhà hàng (chỉ cho phép món từ 1 nhà hàng)

**API Endpoints:**
```javascript
POST   /api/cart              // Thêm món vào giỏ hàng
PATCH  /api/cart/:id          // Cập nhật số lượng món
DELETE /api/cart/:id          // Xóa món khỏi giỏ hàng
DELETE /api/cart              // Xóa toàn bộ giỏ hàng
GET    /api/cart              // Lấy thông tin giỏ hàng
```

### 2. Chọn Tùy Chọn Cho Món Ăn (Kích Cỡ, Topping)
**Model:** `backend/src/models/cart.model.js`

**Chức năng:**
- ✅ Hỗ trợ options phức tạp (JSON format)
- ✅ Validation tùy chọn với product options
- ✅ Tính giá tự động cho các tùy chọn
- ✅ Hỗ trợ single-choice và multiple-choice options

**Cấu trúc Options:**
```json
{
  "size": {
    "id": 1,
    "name": "Large",
    "price": 2.50
  },
  "toppings": [
    {"id": 3, "name": "Extra Cheese", "price": 1.00},
    {"id": 5, "name": "Mushrooms", "price": 0.75}
  ]
}
```

### 3. Đặt Ghi Chú Đặc Biệt
**API:** `POST /api/cart/instructions`

**Chức năng:**
- ✅ Ghi chú cấp món ăn (item-level notes)
- ✅ Ghi chú cấp đơn hàng (order-level special instructions)
- ✅ Lưu trữ trong session và database

**Frontend Implementation:**
```vue
<!-- Special Instructions Component -->
<v-textarea
  v-model="specialInstructions"
  placeholder="Add special instructions for the restaurant"
  @change="updateSpecialInstructions"
></v-textarea>
```

### 4. Xem Tổng Giỏ Hàng
**Frontend:** `frontend/src/views/Cart.vue`

**Hiển thị:**
- ✅ Danh sách món ăn với hình ảnh
- ✅ Số lượng và giá từng món
- ✅ Tùy chọn và ghi chú của từng món
- ✅ Subtotal, delivery fee, tax, discounts
- ✅ Tổng tiền cuối cùng

**Cấu trúc Cart Response:**
```json
{
  "status": "success",
  "data": {
    "restaurant": {...},
    "items": [...],
    "subtotal": 25.50,
    "deliveryFee": 2.99,
    "taxAmount": 2.04,
    "discountAmount": 3.00,
    "total": 27.53,
    "appliedPromotion": {...}
  }
}
```

### 5. Chọn Địa Chỉ Giao Hàng
**API:** `POST /api/cart/address`

**Chức năng:**
- ✅ Chọn từ địa chỉ đã lưu
- ✅ Thêm địa chỉ mới
- ✅ Validation địa chỉ thuộc về user
- ✅ Lưu trữ trong session

**Frontend Component:**
```vue
<v-radio-group v-model="selectedAddressId" @change="updateDeliveryAddress">
  <v-list-item v-for="address in addresses" :key="address.id">
    <template v-slot:prepend>
      <v-radio :value="address.id"></v-radio>
    </template>
    <!-- Address details -->
  </v-list-item>
</v-radio-group>
```

### 6. Chọn Thời Gian Giao Hàng
**API:** 
- `POST /api/cart/schedule` - Đặt lịch giao hàng
- `DELETE /api/cart/schedule` - Hủy lịch, chuyển về giao ngay

**Chức năng:**
- ✅ Giao hàng ngay lập tức (ASAP)
- ✅ Đặt lịch giao hàng (tối đa 7 ngày)
- ✅ Date/time picker với validation
- ✅ Hiển thị estimated delivery time

**Frontend Implementation:**
```vue
<v-radio-group v-model="deliveryTimeOption">
  <v-radio label="Deliver ASAP" value="asap"></v-radio>
  <v-radio label="Schedule for Later" value="scheduled"></v-radio>
</v-radio-group>

<!-- Date/Time pickers for scheduled delivery -->
<v-date-picker v-model="scheduledDate" :min="currentDate"></v-date-picker>
<v-time-picker v-model="scheduledTime" format="24hr"></v-time-picker>
```

### 7. Áp Dụng Mã Giảm Giá
**API:** 
- `POST /api/cart/promotion` - Áp dụng mã giảm giá
- `DELETE /api/cart/promotion` - Xóa mã giảm giá

**Loại Giảm Giá Hỗ Trợ:**
- ✅ Giảm theo phần trăm (percentage)
- ✅ Giảm số tiền cố định (fixed_amount)
- ✅ Miễn phí giao hàng (free_delivery)
- ✅ Giới hạn số tiền giảm tối đa
- ✅ Validation thời gian hiệu lực

**Promotion Logic:**
```javascript
if (promotion.type === 'percentage') {
  discountAmount = (subtotal * promotion.value / 100);
  if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
    discountAmount = parseFloat(promotion.maxDiscountAmount);
  }
} else if (promotion.type === 'fixed_amount') {
  discountAmount = parseFloat(promotion.value);
} else if (promotion.type === 'free_delivery') {
  discountAmount = deliveryFee;
}
```

## 🏗️ Kiến Trúc Hệ Thống

### Frontend (Vue.js 3 + Vuetify)
- **State Management:** Vuex store (`frontend/src/store/modules/cart.js`)
- **Main Cart View:** `frontend/src/views/Cart.vue`
- **Cart Components:** `frontend/src/components/cart/`
- **Cart Service:** `frontend/src/services/cart.service.js`

### Backend (Node.js + Express)
- **Model:** `backend/src/models/cart.model.js`
- **Controller:** `backend/src/controllers/cart.controller.js`
- **Routes:** `backend/src/routes/cart.routes.js`
- **Database:** MySQL với các bảng: `cart`, `products`, `restaurants`, `promotions`

### Database Schema
```sql
-- Cart table
CREATE TABLE cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  options JSON,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product options
CREATE TABLE product_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('single', 'multiple') DEFAULT 'single',
  required BOOLEAN DEFAULT FALSE
);

-- Product option choices
CREATE TABLE product_option_choices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  option_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00
);
```

## 🚀 Cách Sử Dụng

### 1. Thêm Món Vào Giỏ Hàng
```javascript
// Frontend - Vuex action
await this.$store.dispatch('cart/addToCart', {
  productId: 123,
  quantity: 2,
  options: {
    size: { id: 1, name: "Large", price: 2.50 },
    toppings: [
      { id: 3, name: "Extra Cheese", price: 1.00 }
    ]
  }
});
```

### 2. Cập Nhật Số Lượng
```javascript
await this.$store.dispatch('cart/updateCartItem', {
  itemId: 456,
  quantity: 3
});
```

### 3. Áp Dụng Mã Giảm Giá
```javascript
await this.$store.dispatch('cart/applyPromotion', 'SAVE20');
```

### 4. Đặt Địa Chỉ Giao Hàng
```javascript
await this.$store.dispatch('cart/setDeliveryAddress', addressId);
```

### 5. Đặt Lịch Giao Hàng
```javascript
await this.$store.dispatch('cart/scheduleDelivery', '2024-01-20T15:30:00');
```

## 📱 Giao Diện Người Dùng

### Cart View Features:
- ✅ Responsive design với Vuetify
- ✅ Real-time price calculations
- ✅ Interactive quantity controls
- ✅ Option chips display
- ✅ Notes editing dialogs
- ✅ Address selection
- ✅ Date/time pickers
- ✅ Promotion code input
- ✅ Order summary sidebar

### Mobile Optimization:
- ✅ Responsive layout
- ✅ Touch-friendly controls
- ✅ Optimized for small screens

## 🔒 Bảo Mật & Validation

### Backend Validation:
- ✅ Authentication middleware
- ✅ Input validation với express-validator
- ✅ Product availability checking
- ✅ Restaurant status validation
- ✅ Option choice validation
- ✅ Address ownership verification
- ✅ Promotion code validation

### Frontend Validation:
- ✅ Real-time form validation
- ✅ Client-side price calculations
- ✅ Date/time validation
- ✅ Error handling & user feedback

## 📊 Performance & Optimization

- ✅ Database joins optimized
- ✅ Session-based promotion storage
- ✅ Frontend state management
- ✅ Lazy loading for cart components
- ✅ Error boundaries and fallbacks

## 🛠️ Setup & Migration

### Chạy Migration Cho Database

1. **Cập nhật database schema:**
```bash
cd backend
node run-cart-migration.js
```

2. **Hoặc chạy migration SQL trực tiếp:**
```bash
mysql -u username -p food_delivery < backend/scripts/cart-migration.sql
```

### Khởi Động Hệ Thống

1. **Backend:**
```bash
cd backend
npm install
npm start
```

2. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing

### Existing test files:
- `backend/test-db-connection.js`
- `backend/test-api-connection.js`

### Test Cart Functionality:

1. **Test Promotion Codes:**
   - `WELCOME10` - 10% discount for new customers
   - `SAVE20K` - 20,000 VND off orders over 100K
   - `FREEDEL` - Free delivery

2. **Test Product Options:**
   - Size options (Small, Medium, Large)
   - Toppings (Extra Cheese, Mushrooms, Pepperoni, Olives)
   - Spice levels (Mild, Medium, Hot, Extra Hot)

### Cart API Testing:
```bash
# Add item with options
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 1,
    "quantity": 2,
    "options": {
      "1": {"id": 2, "name": "Medium", "price": 2.50},
      "2": [
        {"id": 3, "name": "Extra Cheese", "price": 1.50},
        {"id": 4, "name": "Mushrooms", "price": 1.00}
      ]
    },
    "notes": "No onions please"
  }'

# Apply promotion
curl -X POST http://localhost:3000/api/cart/promotion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code": "WELCOME10"}'

# Schedule delivery
curl -X POST http://localhost:3000/api/cart/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"scheduledTime": "2024-01-20T15:30:00"}'
```

## 📈 Có Thể Mở Rộng

### Future Enhancements:
1. Real-time inventory checking
2. Multiple payment methods
3. Order tracking
4. Push notifications
5. Analytics integration
6. A/B testing for promotions

---

**Kết luận:** Hệ thống giỏ hàng và đặt hàng đã được triển khai đầy đủ với tất cả các tính năng được yêu cầu. Code được tổ chức tốt, có validation đầy đủ và giao diện người dùng thân thiện.