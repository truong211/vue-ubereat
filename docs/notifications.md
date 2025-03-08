# UberEat Notification System

## Overview
The notification system provides multi-channel notifications via:
- Web Push Notifications
- Email Notifications
- SMS/OTP Notifications
- In-app Notifications
- Real-time Chat

## Features

### 1. Web Push Notifications
- Service worker based push notifications
- Permission management
- Subscription handling
- Custom notification actions
- Background message handling

### 2. Email Notifications
Các template email được hỗ trợ:
- Chào mừng đăng ký
- Xác nhận đơn hàng
- Cập nhật trạng thái
- Đặt lại mật khẩu
- Thông báo tài xế nhận đơn

### 3. SMS/OTP Authentication
- Xác thực số điện thoại
- Mã OTP qua SMS
- Tích hợp Firebase Phone Auth
- Thông báo trạng thái đơn hàng qua SMS

### 4. Chat System
- Chat trực tiếp với tài xế
- Hỗ trợ khách hàng trực tuyến
- Trạng thái typing
- Read receipts
- Lịch sử chat

### 5. Notification Center
Các loại thông báo:
- Cập nhật đơn hàng
- Tin nhắn
- Khuyến mãi
- Thông báo hệ thống
- Hoạt động tài khoản

## Configuration

### 1. Environment Variables
```env
# Push Notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_SECURE=true

# SMS (Firebase)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_PROJECT_ID=your_project_id
```

### 2. Notification Settings
Người dùng có thể tùy chỉnh:
- Bật/tắt từng kênh thông báo
- Chọn loại thông báo muốn nhận
- Tùy chỉnh âm thanh thông báo
- Quản lý thiết bị đăng ký

## API Endpoints

### Notifications
```
POST /api/notifications/subscribe
POST /api/notifications/unsubscribe
GET  /api/notifications
PUT  /api/notifications/read/:id
PUT  /api/notifications/read-all
GET  /api/notifications/settings
PUT  /api/notifications/settings
```

### SMS/OTP
```
POST /api/auth/phone/send-otp
POST /api/auth/phone/verify-otp
PUT  /api/users/phone
```

## Usage Examples

### 1. Đăng ký Web Push
```javascript
// Frontend
const subscription = await pushNotificationService.subscribeUser();

// Backend
const notification = {
  title: 'Đơn hàng mới',
  body: 'Đơn hàng #123 đã được xác nhận',
  icon: '/icons/order.png',
  data: {
    orderId: 123,
    type: 'order_status'
  }
};
webpush.sendNotification(subscription, JSON.stringify(notification));
```

### 2. Gửi Email
```javascript
// Gửi email xác nhận đơn hàng
await emailService.sendOrderConfirmation(order, user);

// Gửi email đặt lại mật khẩu
await emailService.sendPasswordResetEmail(user, resetToken);
```

### 3. Gửi SMS
```javascript
// Gửi mã OTP
const verificationId = await otpService.sendPhoneOTP(phoneNumber);

// Xác thực mã OTP
const result = await otpService.verifyPhoneOTP(verificationId, code);
```

## Error Handling

### Push Notifications
- Kiểm tra hỗ trợ: `'serviceWorker' in navigator && 'PushManager' in window`
- Xử lý quyền truy cập: `Notification.permission`
- Xử lý đăng ký thất bại
- Xử lý subscription hết hạn

### SMS/OTP
- Giới hạn số lần gửi OTP
- Thời gian chờ giữa các lần gửi
- Số lần thử xác thực tối đa
- Xử lý số điện thoại không hợp lệ

## Security

### 1. Push Notifications
- VAPID authentication
- Mã hóa payload
- Xác thực subscription

### 2. SMS/OTP
- Rate limiting
- Mã OTP một lần
- Thời gian hiệu lực
- Xác thực Firebase

### 3. Email
- SPF/DKIM setup
- Template sanitization
- Rate limiting
- Unsubscribe support

## Performance Optimization

### 1. Push Notifications
- Payload tối ưu
- Batch notifications
- Compression

### 2. Email
- Template caching
- Queue system
- Batch processing

### 3. In-app Notifications
- Pagination
- Lazy loading
- Real-time sync

## Monitoring

### Metrics to Track
- Tỷ lệ delivered/open
- Thời gian phản hồi
- Số lượng đăng ký
- Tỷ lệ opt-out
- Lỗi gửi notification

## Testing

### Unit Tests
- Template rendering
- Notification handling
- Permission management
- Error handling

### Integration Tests
- Multi-channel delivery
- Real-time updates
- Queue processing
- Error scenarios

### E2E Tests
- Subscription flow
- Settings management
- Notification interactions
- Multi-device sync